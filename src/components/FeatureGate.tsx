"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { hasFeatureAccess, RESTRICTED_FEATURES } from "@/lib/accessControl";

interface FeatureGateProps {
  children: React.ReactNode;
  feature: keyof typeof RESTRICTED_FEATURES;
  redirectTo?: string;
}

export function FeatureGate({ children, feature, redirectTo = "/pricing" }: FeatureGateProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        setHasAccess(false);
        return;
      }

      const access = await hasFeatureAccess(user, feature);
      setHasAccess(access);

      if (!access) {
        router.push(redirectTo);
      }
    };

    if (!loading) {
      checkAccess();
    }
  }, [user, loading, feature, redirectTo, router]);

  if (loading || hasAccess === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return <>{children}</>;
}
