"use client";

import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function TopicSimulatorPage() {
  return (
    <ProtectedRoute>
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Topic Simulator - Coming Soon</p>
      </div>
    </ProtectedRoute>
  );
}
