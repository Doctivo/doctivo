'use client';

import { use } from 'react';
import { OPDQueueDashboard } from '@/components/doctor/OPDQueueDashboard';

export default function AttendantDashboardRoute() {
  return <OPDQueueDashboard mode="Attendant" />;
}
