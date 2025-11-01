"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import dynamic from 'next/dynamic';
import loadingAnimation from "@/../public/loading.json";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [minLoadingTime, setMinLoadingTime] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinLoadingTime(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loading && !user && !minLoadingTime) {
      router.push('/landing');
    }
  }, [user, loading, minLoadingTime, router]);

  if (loading || minLoadingTime) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-transparent">
        <div className="w-full h-screen flex items-center justify-center">
          <Lottie 
            animationData={loadingAnimation} 
            loop={true}
            style={{ width: '100%', height: '100%', maxWidth: '100vw', maxHeight: '100vh' }}
          />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
};