import { Metadata } from 'next';
import { getDoctorById } from '@/actions/doctors';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Award, Star, Clock, HeartPulse } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Props {
  params: { id: string };
}

// 1. DYNAMIC META TAGS & AUTO-GENERATED TAGS (SEO)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const doctor = await getDoctorById(params.id);
  
  if (!doctor) {
    return {
      title: 'Doctor Not Found | Doctivo',
      description: 'The requested doctor profile could not be found.',
    };
  }

  // Auto-generate tags based on doctor's profile data
  const generatedTags = [
    doctor.specialty,
    doctor.location,
    doctor.name.replace('Dr. ', ''),
    'Best Doctor in ' + doctor.location,
    'Doctivo',
    ...(doctor.reasonsForVisit || [])
  ];

  // Remove duplicates and join for keywords
  const uniqueTags = Array.from(new Set(generatedTags)).join(', ');

  return {
    title: `${doctor.name} - Best ${doctor.specialty} in ${doctor.location} | Doctivo`,
    description: `Book an appointment with ${doctor.name}, a highly rated ${doctor.specialty} in ${doctor.location}. Experience: ${doctor.experience || '10+ Years'}. Fees: ₹${doctor.fees}.`,
    keywords: uniqueTags,
    openGraph: {
      title: `${doctor.name} - ${doctor.specialty} | Doctivo`,
      description: `Book an appointment with ${doctor.name} today.`,
      images: [doctor.imageUrl || '/default-doctor.png'],
    },
  };
}

export default async function DoctorProfilePage({ params }: Props) {
  const doctor = await getDoctorById(params.id);

  if (!doctor) {
    notFound();
  }

  // 2. GOOGLE SCHEMA MARKUP (JSON-LD)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Physician',
    name: doctor.name,
    medicalSpecialty: doctor.specialty,
    image: doctor.imageUrl || 'https://doctivo.in/logo.png',
    address: {
      '@type': 'PostalAddress',
      addressLocality: doctor.location,
      streetAddress: doctor.address,
      addressCountry: 'IN'
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: doctor.rating || 5,
      reviewCount: 120
    },
    url: `https://doctivo.in/doctor/${doctor.id}`,
    priceRange: `₹${doctor.fees}`
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Inject JSON-LD into the page */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Public Profile Header */}
      <div className="bg-gradient-to-tr from-blue-600 to-indigo-800 pt-12 pb-24 px-6 relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="relative w-40 h-40 md:w-48 md:h-48 rounded-[2rem] overflow-hidden border-4 border-white/20 shadow-2xl">
            <Image 
              src={doctor.imageUrl || '/default-doctor.png'} 
              alt={doctor.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="text-center md:text-left text-white space-y-3 flex-1">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">{doctor.name}</h1>
            <p className="text-xl text-blue-100 font-medium flex items-center justify-center md:justify-start gap-2">
              <HeartPulse className="w-5 h-5 text-pink-400" />
              {doctor.specialty}
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm font-semibold text-blue-50 mt-4">
              <span className="flex items-center gap-1.5"><Award className="w-4 h-4 text-yellow-400"/> {doctor.qualification || 'MBBS, MD'}</span>
              <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-yellow-400"/> {doctor.rating || '5.0'} / 5</span>
              <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-emerald-400"/> {doctor.location}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Details & Actions */}
      <div className="max-w-4xl mx-auto px-6 -mt-10 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="md:col-span-2 space-y-6">
            <Card className="rounded-3xl border-none shadow-xl shadow-slate-200/50">
              <CardContent className="p-8">
                <h2 className="text-xl font-bold text-slate-800 mb-4">About Doctor</h2>
                <p className="text-slate-600 leading-relaxed">
                  {doctor.name} is a renowned {doctor.specialty} practicing in {doctor.location}. 
                  With over {doctor.experience || '10 years'} of experience, they provide comprehensive medical care.
                  Consultation fees are ₹{doctor.fees}.
                </p>
                
                {doctor.reasonsForVisit && doctor.reasonsForVisit.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Expertise & Services</h3>
                    <div className="flex flex-wrap gap-2">
                      {doctor.reasonsForVisit.map((reason: string) => (
                        <span key={reason} className="px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-bold">
                          {reason}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-1 space-y-6">
            <Card className="rounded-3xl border-none shadow-xl shadow-slate-200/50 bg-gradient-to-b from-white to-slate-50">
              <CardContent className="p-8 flex flex-col items-center text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <Clock className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg mb-1">Book a Consultation</h3>
                  <p className="text-sm text-slate-500 font-medium">Available for In-Clinic & Video Consults</p>
                </div>
                <div className="text-3xl font-black text-slate-800">
                  ₹{doctor.fees}
                </div>
                <Link href={`/book/${doctor.id}`} className="w-full">
                  <Button className="w-full h-14 rounded-full font-black text-lg shadow-xl shadow-primary/20">
                    Book Appointment
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}
