"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import dynamic from 'next/dynamic';
import loadingAnimation from "@/../public/loading.json";
import { ref, onValue } from 'firebase/database';
import { database } from '@/lib/firebase';

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [minLoadingTime, setMinLoadingTime] = useState(true);
  const [version, setVersion] = useState('');
  const [subVersion, setSubVersion] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinLoadingTime(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Fetch version from Firebase RTDB
  useEffect(() => {
    const versionRef = ref(database, 'appVersion/version');
    const subVersionRef = ref(database, 'appVersion/subVersion');

    const unsubscribeVersion = onValue(versionRef, (snapshot) => {
      if (snapshot.exists()) {
        console.log('Version data:', snapshot.val());
        setVersion(snapshot.val());
      } else {
        console.warn('Version data does not exist in RTDB at path: appVersion/version');
      }
    }, (error) => {
      console.error('Error fetching version:', error);
    });

    const unsubscribeSubVersion = onValue(subVersionRef, (snapshot) => {
      if (snapshot.exists()) {
        console.log('SubVersion data:', snapshot.val());
        setSubVersion(snapshot.val());
      } else {
        console.warn('SubVersion data does not exist in RTDB at path: appVersion/subVersion');
      }
    }, (error) => {
      console.error('Error fetching subVersion:', error);
    });

    return () => {
      unsubscribeVersion();
      unsubscribeSubVersion();
    };
  }, []);

  useEffect(() => {
    if (!loading && !user && !minLoadingTime) {
      router.push('/landing');
    }
  }, [user, loading, minLoadingTime, router]);

  if (loading || minLoadingTime) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-transparent relative">
        <div className="w-full h-screen flex items-center justify-center">
          <Lottie 
            animationData={loadingAnimation} 
            loop={true}
            style={{ width: '100%', height: '100%', maxWidth: '100vw', maxHeight: '100vh' }}
          />
        </div>
        {/* Version Display - Bottom Right (Loading Screen Only) */}
        <div className="fixed bottom-4 right-4 z-50 pointer-events-none">
          <p className="text-md text-foreground/40 dark:text-foreground/40 font-mono">
            v{version}.{subVersion}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
};