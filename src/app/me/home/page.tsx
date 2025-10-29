'use client';

import ExpressifyDashboard from '@/components/mvpblocks';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function HomePage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <ExpressifyDashboard />
      </div>
    </ProtectedRoute>
  );
}