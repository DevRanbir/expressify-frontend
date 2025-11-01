"use client";

import { useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { ExpressifySidebar } from '@/components/ui/expressify-sidebar';
import { LearningHeader } from '@/components/ui/learning-header';
import { TrainingBento } from '@/components/ui/training-bento';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users2, Gamepad2, Swords, Trophy } from 'lucide-react';

const socialTrainingCards = [
  {
    id: 'collaborate',
    title: 'Collaborate',
    description: 'Team up with friends to build sentences, stories, and improve communication together. Work as a team to achieve shared goals.',
    label: 'Teamwork',
    href: '/training/social/collaborate',
    icon: Users2,
    difficulty: 'Beginner' as const,
    estimatedTime: '15-20 min',
    trainingType: 'social' as const,
  },
  {
    id: 'challenge',
    title: 'Challenge',
    description: 'Compete with friends in communication challenges. Test your vocabulary, quick thinking, and expressive skills head-to-head.',
    label: 'Competition',
    href: '/training/social/challenge',
    icon: Swords,
    difficulty: 'Intermediate' as const,
    estimatedTime: '10-15 min',
    trainingType: 'social' as const,
  },
];

export default function SocialTrainingPage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <ExpressifySidebar />
        <SidebarInset>
          <LearningHeader trainingType="social" />
          
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="min-h-[100vh] flex-1 rounded-xl p-4 md:p-6">
              <div className="mx-auto max-w-6xl space-y-6">
                {/* Header Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-green-500/10 p-2">
                      <Users2 className="h-6 w-6 text-green-500" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold tracking-tight">Social Training</h1>
                      <p className="text-muted-foreground">
                        Practice communication with friends through collaborative games and challenges
                      </p>
                    </div>
                  </div>
                </div>


                {/* Training Cards */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Choose Your Mode</h2>
                    <Badge variant="secondary" className="text-xs">
                      {socialTrainingCards.length} modes available
                    </Badge>
                  </div>
                  
                  <TrainingBento trainingType="social" cards={socialTrainingCards} />
                </div>

                {/* How It Works Section */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">How It Works</h2>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-lg border border-border/50 p-6 text-center">
                      <div className="mb-4">
                        <div className="rounded-full bg-green-500/10 p-3 w-12 h-12 mx-auto flex items-center justify-center">
                          <span className="text-green-500 font-bold">1</span>
                        </div>
                      </div>
                      <h3 className="font-medium mb-2">Invite Friends</h3>
                      <p className="text-sm text-muted-foreground">
                        Share a game code with friends or join an existing session
                      </p>
                    </div>
                    
                    <div className="rounded-lg border border-border/50 p-6 text-center">
                      <div className="mb-4">
                        <div className="rounded-full bg-blue-500/10 p-3 w-12 h-12 mx-auto flex items-center justify-center">
                          <span className="text-blue-500 font-bold">2</span>
                        </div>
                      </div>
                      <h3 className="font-medium mb-2">Play Together</h3>
                      <p className="text-sm text-muted-foreground">
                        Collaborate or compete in real-time communication games
                      </p>
                    </div>
                    
                    <div className="rounded-lg border border-border/50 p-6 text-center">
                      <div className="mb-4">
                        <div className="rounded-full bg-purple-500/10 p-3 w-12 h-12 mx-auto flex items-center justify-center">
                          <span className="text-purple-500 font-bold">3</span>
                        </div>
                      </div>
                      <h3 className="font-medium mb-2">Track Progress</h3>
                      <p className="text-sm text-muted-foreground">
                        See your scores, achievements, and improvement over time
                      </p>
                    </div>
                  </div>
                </div>

                {/* Features Section */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Why Social Training?</h2>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-lg border border-border/50 p-4">
                      <div className="mb-2">
                        <div className="rounded-md bg-green-500/10 p-2 w-fit">
                          <Users2 className="h-4 w-4 text-green-500" />
                        </div>
                      </div>
                      <h3 className="font-medium">Learn Together</h3>
                      <p className="text-sm text-muted-foreground">
                        Practice with friends in a supportive environment
                      </p>
                    </div>
                    
                    <div className="rounded-lg border border-border/50 p-4">
                      <div className="mb-2">
                        <div className="rounded-md bg-blue-500/10 p-2 w-fit">
                          <Gamepad2 className="h-4 w-4 text-blue-500" />
                        </div>
                      </div>
                      <h3 className="font-medium">Real-Time Interaction</h3>
                      <p className="text-sm text-muted-foreground">
                        Experience live multiplayer gameplay with instant sync
                      </p>
                    </div>
                    
                    <div className="rounded-lg border border-border/50 p-4">
                      <div className="mb-2">
                        <div className="rounded-md bg-purple-500/10 p-2 w-fit">
                          <Swords className="h-4 w-4 text-purple-500" />
                        </div>
                      </div>
                      <h3 className="font-medium">Friendly Competition</h3>
                      <p className="text-sm text-muted-foreground">
                        Challenge friends to improve faster together
                      </p>
                    </div>
                    
                    <div className="rounded-lg border border-border/50 p-4">
                      <div className="mb-2">
                        <div className="rounded-md bg-orange-500/10 p-2 w-fit">
                          <Trophy className="h-4 w-4 text-orange-500" />
                        </div>
                      </div>
                      <h3 className="font-medium">Earn Rewards</h3>
                      <p className="text-sm text-muted-foreground">
                        Unlock achievements and climb the leaderboards
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
