import { Doctor } from '@/types';
import { DoctorRepository } from '@/server/repositories/doctor.repository';
import { query } from '@/lib/db';

export interface RecommendationFeedItem {
  id: string;
  name: string;
  specialty: string;
  qualification: string;
  clinicName: string;
  locality: string;
  distanceKm: number;
  distanceBadge: string;
  rating: number;
  feeText: string;
  fee: number;
  tokenStatus: string;
  isGuaranteedToken: boolean;
  isOfficiallyPartnered: boolean;
  allowsSameDay: boolean;
  recommendationReason: string;
  matchScore: number;
  imageUrl: string;
}

export interface RecommendationFeedResponse {
  status: 'success' | 'error';
  generatedAt: string;
  cached: boolean;
  meta: {
    userLocality: string;
    totalCandidates: number;
    matchedSymptom?: string;
  };
  sections: {
    sectionType: 'FOLLOW_UP_BANNER' | 'TOP_RECOMMENDED_CAROUSEL' | 'NEAREST_SPECIALISTS_GRID';
    title: string;
    subtitle?: string;
    visible: boolean;
    data?: any;
    items?: RecommendationFeedItem[];
  }[];
}

// Symptom-to-Specialty Keyword Ontology (Hindi, Hinglish, & English)
const SYMPTOM_MAP: Record<string, string[]> = {
  // Orthopedic & Physio
  'kamar dard': ['Orthopedic', 'Physiotherapy'],
  'back pain': ['Orthopedic', 'Physiotherapy'],
  'slip disc': ['Orthopedic', 'Physiotherapy', 'Neurologist'],
  'ghutna dard': ['Orthopedic', 'Physiotherapy'],
  'knee pain': ['Orthopedic', 'Physiotherapy'],
  'cervical': ['Physiotherapy', 'Orthopedic'],
  'neck pain': ['Physiotherapy', 'Orthopedic'],
  'joint pain': ['Orthopedic', 'Physiotherapy'],
  'fracture': ['Orthopedic'],
  'haddi': ['Orthopedic'],
  // Cardiac
  'chest pain': ['Cardiologist', 'General Physician'],
  'seene me dard': ['Cardiologist', 'General Physician'],
  'heart': ['Cardiologist'],
  'dil': ['Cardiologist'],
  'high bp': ['Cardiologist', 'General Physician'],
  'blood pressure': ['Cardiologist', 'General Physician'],
  // Diabetology & Endocrine
  'sugar': ['Diabetologist', 'General Physician'],
  'diabetes': ['Diabetologist', 'General Physician'],
  'thyroid': ['Endocrinologist', 'General Physician'],
  // Dermatology
  'khujli': ['Dermatologist'],
  'skin': ['Dermatologist'],
  'allergy': ['Dermatologist', 'General Physician'],
  'hair fall': ['Dermatologist'],
  'bal jhadna': ['Dermatologist'],
  'acne': ['Dermatologist'],
  'pimples': ['Dermatologist'],
  // Pediatrics
  'bachha': ['Pediatrician'],
  'child': ['Pediatrician'],
  'child fever': ['Pediatrician'],
  'shishu': ['Pediatrician'],
  // Gastro
  'pet dard': ['Gastroenterologist', 'General Physician'],
  'stomach pain': ['Gastroenterologist', 'General Physician'],
  'gas': ['Gastroenterologist', 'General Physician'],
  'acidity': ['Gastroenterologist', 'General Physician'],
  'kabz': ['Gastroenterologist', 'General Physician'],
  'vomiting': ['General Physician', 'Gastroenterologist'],
  // Neuro / Psychiatry
  'sir dard': ['Neurologist', 'General Physician'],
  'headache': ['Neurologist', 'General Physician'],
  'migraine': ['Neurologist'],
  'tension': ['Psychiatrist', 'Neurologist'],
  'depression': ['Psychiatrist'],
  'anxiety': ['Psychiatrist'],
  // Ophthalmology
  'aankh': ['Ophthalmologist'],
  'eye': ['Ophthalmologist'],
  'chashma': ['Ophthalmologist'],
  // Dental
  'daant': ['Dentist'],
  'tooth': ['Dentist'],
  'teeth': ['Dentist'],
  'dental': ['Dentist'],
  // General
  'bukhar': ['General Physician'],
  'fever': ['General Physician'],
  'cold': ['General Physician'],
  'cough': ['General Physician'],
  'sardi': ['General Physician'],
  'khasi': ['General Physician'],
  'kamzori': ['General Physician'],
  'weakness': ['General Physician'],
  // Gynecologist
  'pregnancy': ['Gynecologist'],
  'mahila': ['Gynecologist'],
  'period': ['Gynecologist'],
};

// In-Memory Fast Cache with TTL (60 seconds)
interface CacheEntry {
  expiresAt: number;
  data: RecommendationFeedResponse;
}
const FEED_CACHE = new Map<string, CacheEntry>();

/**
 * Haversine formula to compute distance in km between two geo coordinates
 */
export function calculateHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Resolves search terms or symptoms into matching specialties
 */
export function mapQueryToSpecialties(queryText: string): string[] {
  if (!queryText) return [];
  const normalized = queryText.toLowerCase().trim();
  const matched = new Set<string>();

  for (const [symptom, specialties] of Object.entries(SYMPTOM_MAP)) {
    if (normalized.includes(symptom) || symptom.includes(normalized)) {
      specialties.forEach((s) => matched.add(s));
    }
  }

  return Array.from(matched);
}

/**
 * Core Scoring Formula:
 * S(D, U) = 0.25*P + 0.30*M + 0.20*A + 0.10*Q + 0.10*S_live + 0.05*D_affinity
 */
export function scoreDoctor(params: {
  doctor: Doctor;
  userLat: number;
  userLng: number;
  targetSpecialties: string[];
  pastDoctorIds: Set<string>;
  patientAge?: number;
  patientGender?: string;
}): { score: number; distanceKm: number; reason: string } {
  const { doctor, userLat, userLng, targetSpecialties, pastDoctorIds, patientAge, patientGender } = params;

  // 1. Proximity Score (P) - Weight 0.25
  const docLat = doctor.latitude || 26.7606;
  const docLng = doctor.longitude || 83.3731;
  const distanceKm = calculateHaversineKm(userLat, userLng, docLat, docLng);

  let pScore = 0.2;
  if (distanceKm <= 3.0) pScore = 1.0;
  else if (distanceKm <= 7.0) pScore = 0.75;
  else if (distanceKm <= 15.0) pScore = 0.45;

  // 2. Symptom / Specialty Match Score (M) - Weight 0.30
  let mScore = 0.15;
  const docSpecialty = doctor.specialty || '';
  if (targetSpecialties.length > 0) {
    const isExact = targetSpecialties.some((s) => docSpecialty.toLowerCase().includes(s.toLowerCase()));
    if (isExact) {
      mScore = 1.0;
    } else {
      mScore = 0.25;
    }
  } else {
    // Neutral when no symptom is filtered
    mScore = 0.7;
  }

  // 3. Patient Affinity (A) - Weight 0.20
  const aScore = pastDoctorIds.has(doctor.id) ? 1.0 : 0.2;

  // 4. Rating & Quality Score (Q) - Weight 0.10
  const rating = doctor.rating || 4.5;
  const qScore = Math.min(1.0, Math.max(0.5, rating / 5.0));

  // 5. Live Slot / Same-day Availability (S_live) - Weight 0.10
  const sLive = (doctor.availableSlots && doctor.availableSlots.length > 0) || !doctor.stops_booking_at_midnight ? 1.0 : 0.4;

  // 6. Demographic suitability (D_affinity) - Weight 0.05
  let dScore = 0.5;
  if (patientAge !== undefined && patientAge <= 14 && docSpecialty.toLowerCase().includes('pediatric')) {
    dScore = 1.0;
  } else if (patientGender === 'Female' && docSpecialty.toLowerCase().includes('gynecolog')) {
    dScore = 1.0;
  }

  // Combined Match Score
  const totalScore =
    0.25 * pScore +
    0.3 * mScore +
    0.2 * aScore +
    0.1 * qScore +
    0.1 * sLive +
    0.05 * dScore;

  // Dynamic Reason Formulation
  let reason = `${Math.round(totalScore * 100)}% Match`;
  if (aScore === 1.0) {
    reason += ' • Previously Consulted Doctor';
  } else if (mScore === 1.0 && pScore >= 0.75) {
    reason += ' • Nearest Specialist for your symptom';
  } else if (qScore >= 0.95) {
    reason += ' • Highly Rated Specialist';
  } else {
    reason += ' • Verified OPD Slot Open';
  }

  return { score: totalScore, distanceKm, reason };
}

/**
 * Builds the Zero-Client-Overhead Personalized Recommendation Feed
 */
export async function buildRecommendationFeed(params: {
  userId?: string;
  lat?: number;
  lng?: number;
  symptomQuery?: string;
  locality?: string;
}): Promise<RecommendationFeedResponse> {
  const userLat = params.lat || 26.7606; // Default to Gorakhpur Center
  const userLng = params.lng || 83.3731;
  const userLocality = params.locality || 'Gorakhpur Locality';
  const queryText = params.symptomQuery || '';

  // Cache Check
  const cacheKey = `feed_${params.userId || 'guest'}_${Math.round(userLat * 100)}_${Math.round(userLng * 100)}_${queryText.toLowerCase().trim()}`;
  const now = Date.now();
  const cached = FEED_CACHE.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return { ...cached.data, cached: true };
  }

  // 1. Fetch Candidates (Approved Doctors)
  let doctors: Doctor[] = [];
  try {
    doctors = await DoctorRepository.findDoctors();
  } catch (err) {
    console.warn('RecommendationEngine: DB fetch fallback to empty list', err);
    doctors = [];
  }

  // 2. Fetch User History / Past Doctor IDs if userId is provided
  const pastDoctorIds = new Set<string>();
  let followUpData: any = null;

  if (params.userId) {
    try {
      const pastApps = await query(
        `SELECT doctor_id, doctor_name, appointment_date, current_symptoms 
         FROM appointments 
         WHERE booked_by_user_id = $1 
         ORDER BY appointment_date DESC 
         LIMIT 5`,
        [params.userId]
      );

      pastApps.rows.forEach((r: any) => {
        if (r.doctor_id) pastDoctorIds.add(r.doctor_id);
      });

      // Check for follow-up reminder (~7 days ago)
      if (pastApps.rows.length > 0) {
        const lastApp = pastApps.rows[0];
        const appDate = new Date(lastApp.appointment_date);
        const diffDays = Math.floor((now - appDate.getTime()) / (1000 * 3600 * 24));
        if (diffDays >= 5 && diffDays <= 14) {
          followUpData = {
            doctorId: lastApp.doctor_id,
            doctorName: lastApp.doctor_name,
            lastVisited: `${diffDays} days ago`,
            symptoms: lastApp.current_symptoms || 'General Checkup',
            actionText: 'Book Follow-Up Review',
          };
        }
      }
    } catch (e) {
      // Non-blocking fallback
    }
  }

  // 3. Resolve Target Specialties from Symptom Query
  const targetSpecialties = mapQueryToSpecialties(queryText);

  // 4. Score all candidates
  const scoredItems: (RecommendationFeedItem & { rawScore: number })[] = [];

  for (const doc of doctors) {
    const { score, distanceKm, reason } = scoreDoctor({
      doctor: doc,
      userLat,
      userLng,
      targetSpecialties,
      pastDoctorIds,
    });

    const isPartnered = !doc.stops_booking_at_midnight; // Default partnered unless flagged
    const allowsSameDay = !doc.stops_booking_at_midnight;

    scoredItems.push({
      id: doc.id,
      name: doc.name.startsWith('Dr.') ? doc.name : `Dr. ${doc.name}`,
      specialty: doc.specialty || 'General Physician',
      qualification: doc.qualification || 'MBBS',
      clinicName: doc.address || 'OPD Medical Clinic',
      locality: doc.location || 'Gorakhpur',
      distanceKm,
      distanceBadge: `${distanceKm} km away`,
      rating: doc.rating || 4.8,
      feeText: `₹${doc.fees || 500}`,
      fee: doc.fees || 500,
      tokenStatus: allowsSameDay ? 'Instant OPD Tokens' : 'Advance Booking',
      isGuaranteedToken: isPartnered,
      isOfficiallyPartnered: isPartnered,
      allowsSameDay,
      recommendationReason: reason,
      matchScore: Math.round(score * 100),
      imageUrl: doc.imageUrl || '',
      rawScore: score,
    });
  }

  // Sort by rawScore DESC
  scoredItems.sort((a, b) => b.rawScore - a.rawScore);

  // 5. Build Final Responsive Sections (Zero Client Overhead)
  const topCarousel = scoredItems.slice(0, 5);
  const nearestGrid = scoredItems.slice(0, 15);

  const response: RecommendationFeedResponse = {
    status: 'success',
    generatedAt: new Date().toISOString(),
    cached: false,
    meta: {
      userLocality,
      totalCandidates: scoredItems.length,
      matchedSymptom: targetSpecialties.length > 0 ? targetSpecialties.join(', ') : undefined,
    },
    sections: [
      {
        sectionType: 'FOLLOW_UP_BANNER',
        title: 'Follow-up Consultation Due',
        visible: !!followUpData,
        data: followUpData,
      },
      {
        sectionType: 'TOP_RECOMMENDED_CAROUSEL',
        title: targetSpecialties.length > 0 ? `Recommended for ${targetSpecialties[0]}` : 'Recommended For You',
        subtitle: 'Personalized based on nearest verified clinics and top patient ratings',
        visible: topCarousel.length > 0,
        items: topCarousel,
      },
      {
        sectionType: 'NEAREST_SPECIALISTS_GRID',
        title: `Top Doctors Near ${userLocality}`,
        subtitle: 'Skip clinic waiting line with guaranteed digital OPD tokens',
        visible: nearestGrid.length > 0,
        items: nearestGrid,
      },
    ],
  };

  // Cache response for 60 seconds
  FEED_CACHE.set(cacheKey, {
    expiresAt: now + 60 * 1000,
    data: response,
  });

  return response;
}
