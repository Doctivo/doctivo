import { NextResponse } from 'next/server';
import { AdminService } from '@/server/services/admin.service';

export async function GET() {
  try {
    let platformFee = { enabled: true, amount: 49 };
    const feeRes = await AdminService.getAppSetting('platform_fee');
    if (feeRes && feeRes.value) {
      const val = typeof feeRes.value === 'string' ? JSON.parse(feeRes.value) : feeRes.value;
      platformFee = {
        enabled: val.enabled !== false,
        amount: typeof val.amount === 'number' ? val.amount : 49
      };
    }

    return NextResponse.json({
      success: true,
      platformFee
    });
  } catch (error: any) {
    return NextResponse.json({
      success: true,
      platformFee: { enabled: true, amount: 49 }
    });
  }
}
