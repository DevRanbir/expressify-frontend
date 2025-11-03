"use client";

import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function StoryTimeCreatorPage() {
  return (
    <ProtectedRoute>
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Story Time Creator - Coming Soon</p>
      </div>
    </ProtectedRoute>
  );
}
