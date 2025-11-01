"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StartPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to landing page
    router.replace('/landing');
  }, [router]);

  return null;
}