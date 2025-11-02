"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { ExpressifySidebar } from "@/components/ui/expressify-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { ref, set, get } from "firebase/database";
import { database } from "@/lib/firebase";
import CongustedPricing from "@/components/mvpblocks/congusted-pricing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, Zap } from "lucide-react";

export default function PricingPage() {
  const { user } = useAuth();
  const [currentPlan, setCurrentPlan] = useState<string>("freemium");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeUserPlan = async () => {
      if (!user) return;

      try {
        const userRef = ref(database, `users/${user.uid}/subscription`);
        const snapshot = await get(userRef);

        if (!snapshot.exists()) {
          // Initialize with freemium plan
          await set(userRef, {
            plan: "freemium",
            startDate: Date.now(),
            status: "active"
          });
          setCurrentPlan("freemium");
        } else {
          setCurrentPlan(snapshot.val().plan);
        }
      } catch (error) {
        console.error("Error initializing user plan:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeUserPlan();
  }, [user]);

  const handleUpgrade = async (planType: string) => {
    if (!user) return;

    try {
      const userRef = ref(database, `users/${user.uid}/subscription`);
      await set(userRef, {
        plan: planType,
        startDate: Date.now(),
        status: "active"
      });
      setCurrentPlan(planType);
    } catch (error) {
      console.error("Error upgrading plan:", error);
    }
  };

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <ExpressifySidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/me/home">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Pricing</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>

          <div className="flex-1 overflow-auto">
            {/* Pricing Component */}
            <div className="max-w-7xl mx-auto">
              
              <CongustedPricing />

            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
