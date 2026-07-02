'use client';

import { use } from 'react';
import { OPDQueueDashboard } from '@/components/OPDQueueDashboard';

export default function AttendantDashboardRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return <OPDQueueDashboard mode="Attendant" targetId={id} />;
}
