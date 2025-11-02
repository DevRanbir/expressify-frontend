"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { FeatureGate } from "@/components/FeatureGate";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { ExpressifySidebar } from "@/components/ui/expressify-sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Target, 
  CheckCircle2, 
  Circle, 
  Lock, 
  TrendingUp,
  BookOpen,
  Award,
  ArrowRight,
  Flame
} from "lucide-react";
import Link from "next/link";

interface LearningPathStep {
  id: string;
  title: string;
  description: string;
  status: "completed" | "current" | "locked";
  progress: number;
  modules: number;
  estimatedTime: string;
  href: string;
}

const learningPaths: LearningPathStep[] = [
  {
    id: "beginner",
    title: "Foundation Builder",
    description: "Master the basics of communication - perfect for introverts starting their journey",
    status: "completed",
    progress: 100,
    modules: 5,
    estimatedTime: "2 weeks",
    href: "/learning/textual"
  },
  {
    id: "intermediate",
    title: "Confidence Developer",
    description: "Build vocal confidence and learn natural conversation flow",
    status: "current",
    progress: 45,
    modules: 8,
    estimatedTime: "3 weeks",
    href: "/learning/vocal"
  },
  {
    id: "advanced",
    title: "Presence Master",
    description: "Master body language, presentation skills, and visual communication",
    status: "locked",
    progress: 0,
    modules: 10,
    estimatedTime: "4 weeks",
    href: "/learning/visual"
  },
  {
    id: "expert",
    title: "Social Strategist",
    description: "Advanced networking, public speaking, and leadership communication",
    status: "locked",
    progress: 0,
    modules: 12,
    estimatedTime: "5 weeks",
    href: "/training/social"
  }
];

const milestones = [
  { id: 1, title: "First Conversation", completed: true },
  { id: 2, title: "10 Training Sessions", completed: true },
  { id: 3, title: "First AI Call", completed: true },
  { id: 4, title: "Complete Beginner Path", completed: true },
  { id: 5, title: "50% Intermediate Progress", completed: false },
  { id: 6, title: "Join Collaborative Game", completed: false },
];

export default function LearningPathPage() {
  const currentStreak = 7;
  const totalXP = 2450;

  return (
    <ProtectedRoute>
      <FeatureGate feature="learning-path">
        <SidebarProvider>
          <div className="flex h-screen w-full overflow-hidden">
            <ExpressifySidebar />
          <SidebarInset className="flex-1 overflow-auto">
            <div className="min-h-screen bg-background">
              {/* Header */}
              <div className="sticky top-0 z-10 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex flex-1 flex-col gap-2 p-4 sm:gap-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                        Your Learning Path
                      </h1>
                      <p className="text-sm text-muted-foreground sm:text-base">
                        Track your progress and unlock new skills
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
                        <Flame className="h-5 w-5 text-orange-500" />
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">Streak</span>
                          <span className="text-sm font-bold">{currentStreak} days</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/20">
                        <Award className="h-5 w-5 text-primary" />
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">Total XP</span>
                          <span className="text-sm font-bold">{totalXP}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6">
                <div className="mx-auto w-full max-w-6xl space-y-6">
                  
                  {/* Current Progress Card */}
                  <Card className="border-primary/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        Current Progress
                      </CardTitle>
                      <CardDescription>
                        You're on the Confidence Developer path
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Overall Completion</span>
                            <span className="text-sm text-muted-foreground">36%</span>
                          </div>
                          <Progress value={36} className="h-2" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-8 w-8 text-green-500" />
                            <div>
                              <p className="text-sm font-medium">1 Path Completed</p>
                              <p className="text-xs text-muted-foreground">Foundation Builder</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Target className="h-8 w-8 text-primary" />
                            <div>
                              <p className="text-sm font-medium">1 Path Active</p>
                              <p className="text-xs text-muted-foreground">45% complete</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Lock className="h-8 w-8 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">2 Paths Locked</p>
                              <p className="text-xs text-muted-foreground">Unlock next</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Learning Paths */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold">Learning Paths</h2>
                      <Badge variant="outline">4 Paths</Badge>
                    </div>
                    
                    <div className="space-y-4">
                      {learningPaths.map((path, index) => (
                        <Card 
                          key={path.id}
                          className={`transition-all hover:shadow-lg ${
                            path.status === "current" ? "border-primary/50 bg-primary/5" : ""
                          } ${
                            path.status === "locked" ? "opacity-60" : ""
                          }`}
                        >
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex gap-4 flex-1">
                                <div className="flex flex-col items-center gap-2">
                                  <div className={`flex items-center justify-center h-12 w-12 rounded-full ${
                                    path.status === "completed" ? "bg-green-500/20 text-green-500" :
                                    path.status === "current" ? "bg-primary/20 text-primary" :
                                    "bg-muted text-muted-foreground"
                                  }`}>
                                    {path.status === "completed" ? (
                                      <CheckCircle2 className="h-6 w-6" />
                                    ) : path.status === "current" ? (
                                      <Target className="h-6 w-6" />
                                    ) : (
                                      <Lock className="h-6 w-6" />
                                    )}
                                  </div>
                                  {index < learningPaths.length - 1 && (
                                    <div className={`w-0.5 h-16 ${
                                      path.status === "completed" ? "bg-green-500/30" : "bg-border"
                                    }`} />
                                  )}
                                </div>
                                
                                <div className="flex-1 space-y-3">
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <h3 className="text-lg font-semibold">{path.title}</h3>
                                      {path.status === "current" && (
                                        <Badge variant="default" className="text-xs">
                                          Active
                                        </Badge>
                                      )}
                                      {path.status === "completed" && (
                                        <Badge variant="outline" className="text-xs border-green-500 text-green-500">
                                          Completed
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      {path.description}
                                    </p>
                                  </div>
                                  
                                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                      <BookOpen className="h-3 w-3" />
                                      <span>{path.modules} modules</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Target className="h-3 w-3" />
                                      <span>{path.estimatedTime}</span>
                                    </div>
                                  </div>

                                  {path.status !== "locked" && (
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between text-xs">
                                        <span className="text-muted-foreground">Progress</span>
                                        <span className="font-medium">{path.progress}%</span>
                                      </div>
                                      <Progress value={path.progress} className="h-1.5" />
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-col gap-2">
                                {path.status === "locked" ? (
                                  <Button disabled variant="outline" size="sm">
                                    <Lock className="h-4 w-4 mr-2" />
                                    Locked
                                  </Button>
                                ) : path.status === "current" ? (
                                  <Button asChild size="sm">
                                    <Link href={path.href}>
                                      Continue
                                      <ArrowRight className="h-4 w-4 ml-2" />
                                    </Link>
                                  </Button>
                                ) : (
                                  <Button asChild variant="outline" size="sm">
                                    <Link href={path.href}>
                                      Review
                                    </Link>
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Milestones */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-yellow-500" />
                        Milestones
                      </CardTitle>
                      <CardDescription>
                        Track your achievements along the way
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {milestones.map((milestone) => (
                          <div
                            key={milestone.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border ${
                              milestone.completed
                                ? "bg-green-500/10 border-green-500/20"
                                : "bg-muted/50 border-border"
                            }`}
                          >
                            {milestone.completed ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                            ) : (
                              <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                            )}
                            <span className={`text-sm ${
                              milestone.completed ? "text-foreground font-medium" : "text-muted-foreground"
                            }`}>
                              {milestone.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                </div>
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
      </FeatureGate>
    </ProtectedRoute>
  );
}
