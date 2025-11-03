"use client";

import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function VoiceDebateDuelPage() {
  return (
    <ProtectedRoute>
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Voice Debate Duel - Coming Soon</p>
      </div>
    </ProtectedRoute>
  );
}
