"use client";

import Link from "next/link";
import React, { useEffect } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ExpressifySidebar } from "@/components/ui/expressify-sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList } from "@/components/ui/breadcrumb";
import Threads from "@/components/ui/threads-background";
import { Users, BookOpen, Play, Target, Brain, Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function LandingPage() {
  const { user, loading } = useAuth();

  return (
    <SidebarProvider>
      <ExpressifySidebar hideDarkModeToggle />
      <SidebarInset>
        {/* Simple header for non-authenticated landing page */}
        <header className="bg-background/95 sticky top-0 z-50 flex h-16 w-full shrink-0 items-center gap-2 border-b backdrop-blur transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">Landing</BreadcrumbLink>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="ml-auto flex items-center gap-2 px-4">
            <Button variant="outline" size="sm">
              <Bell className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Threads background section - 90vh full viewport width */}
        <div className="relative h-[90vh] overflow-hidden -mt-50">
          <div className="fixed left-0 right-0 h-[90vh] overflow-hidden">
            <Threads 
              className="absolute inset-0 w-full h-full"
              color={[0.545, 0.361, 0.965]}
              amplitude={1}
              distance={0.3}
              enableMouseInteraction={true}
            />
          </div>
        </div>

        {/* Content section - moved up by 10% to overlap */}
        <div className="flex flex-1 flex-col gap-2 p-2 sm:gap-4 sm:p-4 -mt-135 relative z-20">
          <div className="min-h-[calc(100vh-4rem)] flex-1 rounded-lg p-3 sm:rounded-xl sm:p-4 md:p-6">
            <div className="mx-auto max-w-6xl space-y-4 sm:space-y-6">

              {/* Hero */}
                <section className="grid gap-6 rounded-xl bg-card/5 p-8 mt-90">
                <div className="max-w-3xl">
                  <h2 className="bg-gradient-to-r from-purple-600 to-indigo-500 bg-clip-text text-4xl font-bold text-transparent sm:text-5xl">
                  Expressify
                  </h2>
                  <p className="mt-3 text-lg text-muted-foreground">
                    Where emotions meet expressions
                  </p>
                  <h1 className="text-3xl font-bold">Practice real conversations with AI and humans</h1>
                  <p className="mt-3 text-muted-foreground">
                  Expressify helps introverts and anyone who wants to improve communication skills through guided training, AI-powered calls, and collaborative games.
                  </p>

                  <div className="mt-6 flex items-center gap-3">
                  {!loading && (
                    user ? (
                      <Button size="lg" asChild>
                        <Link href="/me/home">Go to Dashboard</Link>
                      </Button>
                    ) : (
                      <>
                        <Button size="lg" asChild>
                          <Link href="/start/signin">Sign In</Link>
                        </Button>
                        <Button variant="outline" size="lg" asChild>
                          <Link href="/start/signup">Sign Up</Link>
                        </Button>
                      </>
                    )
                  )}
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                  {user ? "Welcome back! Continue your training journey" : "Sign in to access all training modules and interactive features"}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mt-25 ">
                  <Card className="p-4">
                  <CardHeader>
                    <CardTitle>AI Calling</CardTitle>
                    <CardDescription>Phone-based AI practice with role-play and feedback.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">Practice under pressure with different personalities and real-time feedback.</div>
                  </CardContent>
                  </Card>

                  <Card className="p-4">
                  <CardHeader>
                    <CardTitle>Collaborative Games</CardTitle>
                    <CardDescription>Play sentence-building games with friends.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">Compete or collaborate to level up your fluency and confidence.</div>
                  </CardContent>
                  </Card>

                  <Card className="p-4">
                  <CardHeader>
                    <CardTitle>Skill Tracks</CardTitle>
                    <CardDescription>Textual, vocal, and visual training tracks.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">Short modules designed for daily practice and measurable improvement.</div>
                  </CardContent>
                  </Card>
                </div>
                </section>

              {/* Bento Showcase */}
              <section className="mt-8">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Large card - spans 2 columns */}
              <Card className="group relative overflow-hidden border-purple-500/20 p-6 transition-all hover:scale-[1.02] hover:border-purple-500/40 sm:col-span-2">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative">
                  <div className="mb-4 inline-flex rounded-lg border border-purple-500/20 bg-purple-500/10 p-3">
                    <BookOpen className="h-6 w-6 text-purple-500" />
                  </div>
                  <CardHeader className="p-0">
                    <CardTitle className="text-xl">Three Learning Tracks</CardTitle>
                    <CardDescription>Master textual, vocal, and visual communication</CardDescription>
                  </CardHeader>
                  <CardContent className="mt-4 p-0">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs text-foreground">Textual</span>
                      <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs text-foreground">Vocal</span>
                      <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs text-foreground">Visual</span>
                    </div>
                  </CardContent>
                </div>
              </Card>

              {/* Tall card */}
              <Card className="group relative overflow-hidden border-indigo-500/20 p-6 transition-all hover:scale-[1.02] hover:border-indigo-500/40 sm:row-span-2">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative flex h-full flex-col">
                  <div className="mb-4 inline-flex rounded-lg border border-indigo-500/20 bg-indigo-500/10 p-3">
                    <Users className="h-6 w-6 text-indigo-500" />
                  </div>
                  <CardHeader className="p-0">
                    <CardTitle>Multiplayer Games</CardTitle>
                    <CardDescription>Practice with friends in real-time</CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto p-0 pt-4">
                    <div className="text-sm text-muted-foreground">
                      Sentence building, storytelling challenges, and more collaborative exercises
                    </div>
                  </CardContent>
                </div>
              </Card>

              {/* Square card */}
              <Card className="group relative overflow-hidden border-purple-500/20 p-6 transition-all hover:scale-[1.02] hover:border-purple-500/40">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative">
                  <div className="mb-4 inline-flex rounded-lg border border-purple-500/20 bg-purple-500/10 p-3">
                    <Target className="h-6 w-6 text-purple-500" />
                  </div>
                  <CardHeader className="p-0">
                    <CardTitle>Daily Practice</CardTitle>
                    <CardDescription>5-15 min sessions</CardDescription>
                  </CardHeader>
                </div>
              </Card>

              {/* Wide card */}
              <Card className="group relative overflow-hidden border-indigo-500/20 p-6 transition-all hover:scale-[1.02] hover:border-indigo-500/40 sm:col-span-2">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative">
                  <div className="mb-4 inline-flex rounded-lg border border-indigo-500/20 bg-indigo-500/10 p-3">
                    <Brain className="h-6 w-6 text-indigo-500" />
                  </div>
                  <CardHeader className="p-0">
                    <CardTitle>AI-Powered Feedback</CardTitle>
                    <CardDescription>Get instant analysis and personalized improvement tips</CardDescription>
                  </CardHeader>
                </div>
              </Card>

              {/* Square card */}
              <Card className="group relative overflow-hidden border-purple-500/20 p-6 transition-all hover:scale-[1.02] hover:border-purple-500/40">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative">
                  <div className="mb-4 inline-flex rounded-lg border border-purple-500/20 bg-purple-500/10 p-3">
                    <Play className="h-6 w-6 text-purple-500" />
                  </div>
                  <CardHeader className="p-0">
                    <CardTitle>Progress Tracking</CardTitle>
                    <CardDescription>Watch yourself improve</CardDescription>
                  </CardHeader>
                </div>
              </Card>
            </div>
          </section>

              {/* Small features / CTA */}
              <section className="grid gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Why Expressify</h3>
                  <Button variant="ghost" disabled>Learn more</Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <Card className="p-4">
                    <CardHeader>
                      <CardTitle>Structured practice</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground">Short lessons and games to build daily habit.</div>
                    </CardContent>
                  </Card>

                  <Card className="p-4">
                    <CardHeader>
                      <CardTitle>Real feedback</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground">AI and peer feedback that helps you iterate quickly.</div>
                    </CardContent>
                  </Card>

                  <Card className="p-4">
                    <CardHeader>
                      <CardTitle>Safe environment</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground">Practice without judgement and track your progress.</div>
                    </CardContent>
                  </Card>
                </div>
              </section>

              {/* Footer */}
              <footer className="mt-8 border-t pt-6 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <div>© {new Date().getFullYear()} Expressify</div>
                  <div className="flex items-center gap-4">
                    <Link href="/">Privacy</Link>
                    <Link href="/">Terms</Link>
                  </div>
                </div>
              </footer>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
