import { NextRequest, NextResponse } from 'next/server';
import { AppointmentService } from '@/server/services/appointment.service';
import { DoctorService } from '@/server/services/doctor.service';

const generateTimeSlots = (start: string, end: string) => {
  const slots = [];
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
      hours = hours % 12; hours = hours ? hours : 12;
      const minStr = minutes < 10 ? '0' + minutes : minutes;
      slots.push(`${hours}:${minStr} ${ampm}`);
      current.setMinutes(current.getMinutes() + 15); // Default 15 min duration
    }
  } catch (e) {}
  return slots;
};

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

    // Get doctor details to know their start/end working hours
    const doctor = await DoctorService.getDoctorById(doctorId);
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    // Fetch already booked slots from the database
    const bookedSlots = await AppointmentService.getBookedSlots(doctorId, date);

    // Generate all possible slots based on doctor's shift
    const allSlots = generateTimeSlots(
      doctor.startTime || '09:00',
      doctor.endTime || '17:00'
    );

    // Return the slots and mark which ones are booked
    const slots = allSlots.map(time => ({
      time,
      isBooked: bookedSlots.includes(time)
    }));

    return NextResponse.json({ success: true, slots });
  } catch (error: any) {
    console.error('API /v1/doctors/[id]/slots Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
