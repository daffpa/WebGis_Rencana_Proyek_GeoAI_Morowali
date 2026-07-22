'use client';

import dynamic from 'next/dynamic';

const MapDashboard = dynamic(
  () => import('@/components/DashboardClient'),
  { ssr: false }
);

export default function HomePage() {
  return <MapDashboard />;
}
