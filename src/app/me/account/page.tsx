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
import { ref, get } from "firebase/database";
import { database } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserAvatar } from "@/components/UserAvatar";
import { 
  Crown, 
  Zap, 
  Mail, 
  Calendar, 
  Shield, 
  CreditCard,
  User as UserIcon,
  Phone,
  MapPin,
  Building,
  Award,
  TrendingUp,
  LogOut
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AccountPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [currentPlan, setCurrentPlan] = useState<string>("freemium");
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;

      try {
        const userRef = ref(database, `users/${user.uid}/subscription`);
        const snapshot = await get(userRef);

        if (snapshot.exists()) {
          setSubscriptionData(snapshot.val());
          setCurrentPlan(snapshot.val().plan);
        } else {
          setCurrentPlan("freemium");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  const getPlanDisplay = (plan: string) => {
    switch (plan) {
      case 'freemium':
        return { name: 'Free', icon: Zap, color: 'text-blue-500' };
      case 'student':
        return { name: 'Student', icon: Award, color: 'text-green-500' };
      case 'premium':
        return { name: 'Premium', icon: Crown, color: 'text-yellow-500' };
      default:
        return { name: 'Free', icon: Zap, color: 'text-blue-500' };
    }
  };

  const planInfo = getPlanDisplay(currentPlan);
  const PlanIcon = planInfo.icon;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
                  <BreadcrumbPage>Account</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>

          <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Profile Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Your account details and personal information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-6">
                    <UserAvatar user={user} size="lg" />
                    <div className="flex-1">
                      <h3 className="text-2xl font-semibold">{user?.displayName || "User"}</h3>
                      <p className="text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Display Name</Label>
                      <Input 
                        id="displayName" 
                        defaultValue={user?.displayName || ""} 
                        disabled
                        className="bg-muted"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <div className="flex items-center gap-2">
                        <Input 
                          id="email" 
                          defaultValue={user?.email || ""} 
                          disabled
                          className="bg-muted"
                        />
                        {user?.emailVerified && (
                          <Badge variant="default" className="whitespace-nowrap">
                            <Shield className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="userId">User ID</Label>
                      <Input 
                        id="userId" 
                        defaultValue={user?.uid || ""} 
                        disabled
                        className="bg-muted font-mono text-xs"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="createdAt">Account Created</Label>
                      <Input 
                        id="createdAt" 
                        defaultValue={user?.metadata?.creationTime || ""} 
                        disabled
                        className="bg-muted"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Subscription Section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Subscription Plan
                      </CardTitle>
                      <CardDescription>Manage your subscription and billing</CardDescription>
                    </div>
                    <Badge variant="outline" className="text-lg px-4 py-2">
                      <PlanIcon className={`h-5 w-5 mr-2 ${planInfo.color}`} />
                      {planInfo.name}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Current Plan</Label>
                      <div className="flex items-center gap-2">
                        <PlanIcon className={`h-4 w-4 ${planInfo.color}`} />
                        <span className="font-semibold">{planInfo.name} Plan</span>
                      </div>
                    </div>

                    {subscriptionData?.startDate && (
                      <div className="space-y-2">
                        <Label className="text-muted-foreground">Plan Started</Label>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{formatDate(subscriptionData.startDate)}</span>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Status</Label>
                      <Badge variant={subscriptionData?.status === 'active' ? 'default' : 'secondary'}>
                        {subscriptionData?.status || 'Active'}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Billing</Label>
                      <span className="text-sm">
                        {currentPlan === 'freemium' ? 'Free Forever' : 'Monthly'}
                      </span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <h4 className="font-semibold">Want to upgrade?</h4>
                      <p className="text-sm text-muted-foreground">
                        Get access to more features and unlimited training
                      </p>
                    </div>
                    <Button asChild>
                      <Link href="/pricing">View Plans</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Account Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Account Statistics
                  </CardTitle>
                  <CardDescription>Your activity and progress overview</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2 text-center p-4 border rounded-lg">
                      <div className="text-3xl font-bold">0</div>
                      <div className="text-sm text-muted-foreground">Training Sessions</div>
                    </div>

                    <div className="space-y-2 text-center p-4 border rounded-lg">
                      <div className="text-3xl font-bold">0</div>
                      <div className="text-sm text-muted-foreground">AI Calls Made</div>
                    </div>

                    <div className="space-y-2 text-center p-4 border rounded-lg">
                      <div className="text-3xl font-bold">0</div>
                      <div className="text-sm text-muted-foreground">Games Played</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Account Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Account Actions</CardTitle>
                  <CardDescription>Manage your account settings and preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/me/home">
                      <UserIcon className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Link>
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/pricing">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Manage Subscription
                    </Link>
                  </Button>

                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/me/history">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      View Training History
                    </Link>
                  </Button>

                  <Separator />

                  <Button 
                    variant="outline" 
                    className="w-full justify-start" 
                    onClick={async () => {
                      await logout();
                      router.push('/start');
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Switch Using Google
                  </Button>

                  <Button variant="destructive" className="w-full justify-start" disabled>
                    <Shield className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
