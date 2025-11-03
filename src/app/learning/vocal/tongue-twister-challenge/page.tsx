"use client";

import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function TongueTwisterChallengePage() {
  return (
    <ProtectedRoute>
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Tongue Twister Challenge - Coming Soon</p>
      </div>
    </ProtectedRoute>
  );
}
