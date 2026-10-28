import { NextRequest, NextResponse } from 'next/server';
import { AppointmentService } from '@/server/services/appointment.service';
import { DoctorService } from '@/server/services/doctor.service';
import { getISTDateInfo, isSlotInPast } from '@/lib/date-utils';

const generateTimeSlots = (start: string, end: string) => {
  const slots: string[] = [];
  try {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    let current = new Date();
    current.setHours(startH, startM, 0, 0);
    const endTime = new Date();
    endTime.setHours(endH, endM, 0, 0);

    while (current < endTime) {
      let hours = current.getHours();
      let minutes = current.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12; 
      hours = hours ? hours : 12;
      const minStr = minutes < 10 ? '0' + minutes : minutes;
      slots.push(`${hours}:${minStr} ${ampm}`);
      current.setMinutes(current.getMinutes() + 15); // Default 15 min duration
    }
  } catch (e) {}
  return slots;
};

// In-memory cache for doctor shift times (5 min TTL)
const doctorScheduleCache = new Map<string, { data: any; expiry: number }>();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const doctorId = (await params).id;
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    const cleanDate = date.split('T')[0].trim();
    const { istTodayStr } = getISTDateInfo();

    // Check if queried date is strictly in the past
    const isPastDate = cleanDate < istTodayStr;
    const isToday = cleanDate === istTodayStr;

    const doctorPromise = (async () => {
      const cached = doctorScheduleCache.get(doctorId);
      if (cached && cached.expiry > Date.now()) {
        return cached.data;
      }
      const doc = await DoctorService.getDoctorById(doctorId);
      if (doc) {
        doctorScheduleCache.set(doctorId, { data: doc, expiry: Date.now() + 5 * 60 * 1000 });
      }
      return doc;
    })();

    // Run doctor lookup & booked slots query in PARALLEL
    const [doctor, bookedSlots] = await Promise.all([
      doctorPromise,
      isPastDate ? Promise.resolve([]) : AppointmentService.getBookedSlots(doctorId, cleanDate),
    ]);

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    // Generate all possible slots based on doctor's shift
    const allSlots = generateTimeSlots(
      doctor.startTime || '09:00',
      doctor.endTime || '17:00'
    );

    // CRITICAL: A slot is unbookable if:
    // 1. It is already booked in the DB, OR
    // 2. The entire date is in the past, OR
    // 3. The date is today and slot time <= current IST time (e.g. 09:00 AM at 10:40 AM)
    const slots = allSlots.map(time => {
      const isPast = isPastDate || (isToday && isSlotInPast(cleanDate, time));
      const isAlreadyBooked = bookedSlots.includes(time);
      return {
        time,
        isBooked: isAlreadyBooked || isPast,
        isPast,
      };
    });

    return NextResponse.json(
      { success: true, slots },
      {
        headers: {
          // Never cache today's slots at CDN to ensure live real-time ticking
          'Cache-Control': isToday 
            ? 'no-store, no-cache, must-revalidate' 
            : 'public, max-age=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (error: any) {
    console.error('API /v1/doctors/[id]/slots Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
