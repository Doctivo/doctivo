import { NextRequest, NextResponse } from 'next/server';
import { DoctorRepository } from '@/server/repositories/doctor.repository';
import { calculateHaversineKm, mapQueryToSpecialties } from '@/lib/recommendations/engine';
import { Doctor } from '@/types';

// Curated Popular Specialties & Medical Icons for Quick YouTube-Style Chips
const POPULAR_SPECIALTIES = [
  { name: 'General Physician', icon: '🩺', description: 'Fever, Cold, Cough & Routine Checkup' },
  { name: 'Cardiologist', icon: '❤️', description: 'Heart, Chest Pain, BP' },
  { name: 'Orthopedic', icon: '🦴', description: 'Bone, Joint, Knee & Fracture' },
  { name: 'Physiotherapist', icon: '🏃', description: 'Back Pain, Cervical, Rehab' },
  { name: 'Dermatologist', icon: '✨', description: 'Skin, Hair Fall, Acne & Allergies' },
  { name: 'Pediatrician', icon: '👶', description: 'Child Care, Vaccination & Fever' },
  { name: 'Gastroenterologist', icon: '🥗', description: 'Stomach, Gas, Acidity & Liver' },
  { name: 'Neurologist', icon: '🧠', description: 'Headache, Migraine & Brain' },
  { name: 'Dentist', icon: '🦷', description: 'Teeth, Gums, Toothache' },
  { name: 'Gynecologist', icon: '🌸', description: 'Women Health, Pregnancy' },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const queryText = (searchParams.get('q') || '').trim();
    const lat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : 26.7606;
    const lng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : 83.3731;

    // 1. Fetch Approved Doctors
    const allDoctors: Doctor[] = await DoctorRepository.findDoctors();

    // 2. Map query symptoms to medical specialties
    const matchedSpecialties = mapQueryToSpecialties(queryText);

    // 3. YouTube-style instant suggestion tags
    const suggestions: { type: 'specialty' | 'symptom' | 'doctor' | 'locality'; label: string; icon: string; value: string }[] = [];

    const lowerQuery = queryText.toLowerCase();

    // Matching popular specialties
    POPULAR_SPECIALTIES.forEach((spec) => {
      if (
        lowerQuery === '' ||
        spec.name.toLowerCase().includes(lowerQuery) ||
        spec.description.toLowerCase().includes(lowerQuery) ||
        matchedSpecialties.some((m) => spec.name.toLowerCase().includes(m.toLowerCase()))
      ) {
        suggestions.push({
          type: 'specialty',
          label: spec.name,
          icon: spec.icon,
          value: spec.name,
        });
      }
    });

    // Matching doctor names
    if (lowerQuery.length >= 2) {
      allDoctors.forEach((doc) => {
        if (doc.name.toLowerCase().includes(lowerQuery)) {
          suggestions.push({
            type: 'doctor',
            label: doc.name.startsWith('Dr.') ? doc.name : `Dr. ${doc.name}`,
            icon: '👨‍⚕️',
            value: doc.name,
          });
        }
      });
    }

    // 4. Rank Matching Doctors (YouTube Multi-Factor Search Rank)
    // SearchRank = (0.35 * TextMatch) + (0.25 * Proximity) + (0.20 * Rating) + (0.20 * LiveSlotOpen)
    const rankedDoctors = allDoctors
      .map((doc) => {
        const docLat = doc.latitude || 26.7606;
        const docLng = doc.longitude || 83.3731;
        const distanceKm = calculateHaversineKm(lat, lng, docLat, docLng);

        // Proximity (0 to 1)
        let proxScore = 0.3;
        if (distanceKm <= 3) proxScore = 1.0;
        else if (distanceKm <= 8) proxScore = 0.7;

        // Text Match (0 to 1)
        let textScore = 0.0;
        const nameMatch = doc.name.toLowerCase().includes(lowerQuery);
        const specMatch = doc.specialty?.toLowerCase().includes(lowerQuery);
        const symptomMatch = matchedSpecialties.some((s) => doc.specialty?.toLowerCase().includes(s.toLowerCase()));

        if (nameMatch) textScore = 1.0;
        else if (specMatch) textScore = 0.9;
        else if (symptomMatch) textScore = 0.8;
        else if (lowerQuery === '') textScore = 0.5;

        // Rating (0 to 1)
        const ratingScore = Math.min(1.0, (doc.rating || 4.5) / 5.0);

        // Live Slot Open (0 to 1)
        const slotScore = !doc.stops_booking_at_midnight ? 1.0 : 0.4;

        const totalSearchRank =
          0.35 * textScore +
          0.25 * proxScore +
          0.20 * ratingScore +
          0.20 * slotScore;

        const isPartnered = !doc.stops_booking_at_midnight;

        return {
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
          tokenStatus: isPartnered ? 'Instant OPD Tokens' : 'Advance Booking',
          isGuaranteedToken: isPartnered,
          isOfficiallyPartnered: isPartnered,
          allowsSameDay: isPartnered,
          searchRank: Math.round(totalSearchRank * 100),
          imageUrl: doc.imageUrl || '',
          isSymptomMatch: symptomMatch,
        };
      })
      .filter((d) => lowerQuery === '' || d.searchRank >= 35)
      .sort((a, b) => b.searchRank - a.searchRank);

    return NextResponse.json({
      status: 'success',
      query: queryText,
      totalResults: rankedDoctors.length,
      matchedSpecialties,
      suggestions: suggestions.slice(0, 8),
      doctors: rankedDoctors.slice(0, 20),
    });
  } catch (error: any) {
    console.error('API /v1/recommendations/search error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to search recommendations', error: error.message },
      { status: 500 }
    );
  }
}
