import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { PatientService } from '@/server/services/patient.service';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const members = await PatientService.getFamilyMembers(decoded.userId);
    return NextResponse.json({ success: true, members });
  } catch (error: any) {
    console.error('Fetch family members error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const body = await req.json();
    const { name, relation, age, gender, bloodGroup, phone, medicalHistory, allergies } = body;

    if (!name) {
      return NextResponse.json({ error: 'Family member name is required' }, { status: 400 });
    }

    const newMember = await PatientService.addFamilyMember(
      {
        id: `MEM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name,
        relation: relation || 'Other',
        age: age ? String(age) : '25',
        gender: gender || 'Male',
        blood_group: bloodGroup || 'O+',
        phone: phone || '',
        medicalHistory: medicalHistory || '',
        allergies: allergies || '',
      } as any,
      decoded.userId
    );

    return NextResponse.json({ success: true, member: newMember });
  } catch (error: any) {
    console.error('Add family member error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get('memberId');

    if (!memberId) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
    }

    await PatientService.removeFamilyMember(memberId);
    return NextResponse.json({ success: true, message: 'Member removed successfully' });
  } catch (error: any) {
    console.error('Remove family member error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
