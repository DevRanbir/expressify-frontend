"use client";

import { useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { FeatureGate } from '@/components/FeatureGate';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { ExpressifySidebar } from '@/components/ui/expressify-sidebar';
import { LearningHeader } from '@/components/ui/learning-header';
import { TrainingBento } from '@/components/ui/training-bento';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, Users, Briefcase, Coffee, Presentation, MessageCircle } from 'lucide-react';

const vcPersonCards = [
  {
    id: 'casual-vc',
    title: 'Casual Video Chat',
    description: 'Practice informal video conversations to build confidence in virtual face-to-face interactions.',
    label: 'Casual',
    href: '/training/vc-person/casual',
    icon: Coffee,
    difficulty: 'Beginner' as const,
    estimatedTime: '15-20 min',
    trainingType: 'vc-person' as const,
  },
  {
    id: 'professional-vc',
    title: 'Professional Meeting',
    description: 'Master professional video conferencing etiquette and communication for business meetings.',
    label: 'Professional',
    href: '/training/vc-person/professional',
    icon: Briefcase,
    difficulty: 'Intermediate' as const,
    estimatedTime: '20-30 min',
    trainingType: 'vc-person' as const,
  },
  {
    id: 'presentation-vc',
    title: 'Virtual Presentation',
    description: 'Practice delivering presentations over video calls with confidence and clarity.',
    label: 'Presentation',
    href: '/training/vc-person/presentation',
    icon: Presentation,
    difficulty: 'Advanced' as const,
    estimatedTime: '25-35 min',
    trainingType: 'vc-person' as const,
  },
];

export default function VCPersonPage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <ProtectedRoute>
      <FeatureGate feature="vc-person">
        <SidebarProvider>
          <ExpressifySidebar />
          <SidebarInset>
            <LearningHeader trainingType="vc-person" />
          
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="min-h-[100vh] flex-1 rounded-xl p-4 md:p-6">
              <div className="mx-auto max-w-6xl space-y-6">
                {/* Header Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-purple-500/10 p-2">
                      <Video className="h-6 w-6 text-purple-500" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold tracking-tight">VC a Person</h1>
                      <p className="text-muted-foreground">
                        Master video call communication and virtual presence
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                      3 Training Modules
                    </Badge>
                    <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      Video Communication
                    </Badge>
                  </div>
                </div>


                {/* Training Cards */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Available Training</h2>
                  </div>
                  <TrainingBento trainingType="vc-person" cards={vcPersonCards} />
                </div>

                {/* Info Card */}
                <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-background">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageCircle className="h-5 w-5 text-purple-500" />
                      About Video Communication Training
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 text-sm text-muted-foreground">
                      <p>
                        Video communication has become essential in today's remote work environment. 
                        Our VC training modules help you develop the unique skills needed for effective 
                        virtual face-to-face interactions.
                      </p>
                      
                      <div className="grid md:grid-cols-3 gap-4 mt-4">
                        <div className="space-y-2">
                          <h4 className="font-semibold text-foreground flex items-center gap-2">
                            <Coffee className="h-4 w-4 text-purple-500" />
                            Casual Conversations
                          </h4>
                          <p className="text-xs">
                            Build confidence in informal video chats with friends, family, or casual colleagues.
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-semibold text-foreground flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-purple-500" />
                            Professional Meetings
                          </h4>
                          <p className="text-xs">
                            Master video conferencing etiquette, body language, and professional communication.
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-semibold text-foreground flex items-center gap-2">
                            <Presentation className="h-4 w-4 text-purple-500" />
                            Virtual Presentations
                          </h4>
                          <p className="text-xs">
                            Learn to deliver engaging presentations over video with clarity and impact.
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 p-4 bg-purple-100/50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                        <h4 className="font-semibold text-foreground mb-2">Key Skills You'll Develop:</h4>
                        <ul className="space-y-1 text-xs">
                          <li className="flex items-center gap-2">
                            <div className="h-1 w-1 rounded-full bg-purple-500"></div>
                            Camera presence and eye contact management
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="h-1 w-1 rounded-full bg-purple-500"></div>
                            Virtual body language and facial expressions
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="h-1 w-1 rounded-full bg-purple-500"></div>
                            Effective screen sharing and visual aids
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="h-1 w-1 rounded-full bg-purple-500"></div>
                            Managing technical issues gracefully
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="h-1 w-1 rounded-full bg-purple-500"></div>
                            Engaging remote audiences effectively
                          </li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Getting Started Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Getting Started</CardTitle>
                    <CardDescription>
                      Follow these steps to begin your video communication training
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500 text-white text-xs font-bold">
                          1
                        </div>
                        <div>
                          <p className="font-medium">Choose Your Training Module</p>
                          <p className="text-muted-foreground text-xs">
                            Select a module based on your current skill level and goals
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500 text-white text-xs font-bold">
                          2
                        </div>
                        <div>
                          <p className="font-medium">Set Up Your Environment</p>
                          <p className="text-muted-foreground text-xs">
                            Ensure good lighting, quiet space, and working camera/microphone
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500 text-white text-xs font-bold">
                          3
                        </div>
                        <div>
                          <p className="font-medium">Practice & Review</p>
                          <p className="text-muted-foreground text-xs">
                            Complete the exercises and review your performance feedback
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
          </SidebarInset>
        </SidebarProvider>
      </FeatureGate>
    </ProtectedRoute>
  );
}
