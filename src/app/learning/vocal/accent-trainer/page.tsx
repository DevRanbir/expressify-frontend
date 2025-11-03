"use client";

import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function AccentTrainerPage() {
  return (
    <ProtectedRoute>
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Accent Trainer - Coming Soon</p>
      </div>
    </ProtectedRoute>
  );
}
