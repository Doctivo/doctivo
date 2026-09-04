import { Metadata } from 'next';
import { getDoctorById } from '@/actions/doctors';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const doctor = await getDoctorById(id);
  
  if (!doctor) {
    return {
      title: 'Doctor Not Found | Doctivo',
    };
  }

  const doctorName = doctor.name.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`;
  
  return {
    title: `Book ${doctorName} - ${doctor.specialty} in Gorakhpur | Doctivo`,
    description: `Book an appointment with ${doctorName}, an expert ${doctor.specialty}. View schedule, fees, and book online easily.`,
    openGraph: {
      title: `Book ${doctorName} - ${doctor.specialty} | Doctivo`,
      description: `Book an appointment with ${doctorName}, an expert ${doctor.specialty}.`,
      images: doctor.imageUrl ? [doctor.imageUrl] : [],
    },
  };
}

export default async function DoctorBookLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const doctor = await getDoctorById(id);
  
  let jsonLd = null;
  if (doctor) {
    const doctorName = doctor.name.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`;
    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Physician',
      name: doctorName,
      medicalSpecialty: doctor.specialty,
      image: doctor.imageUrl,
      address: {
        '@type': 'PostalAddress',
        streetAddress: doctor.address,
        addressLocality: 'Gorakhpur',
        addressRegion: 'UP',
        addressCountry: 'IN'
      },
      nameOfClinic: 'Doctivo Partner Clinic', // Or fetch clinic name if available
      url: `https://doctivo.in/book/${id}`
    };
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}
