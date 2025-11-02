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
import { Phone, MessageSquare, Swords, Users } from 'lucide-react';

const aiCallingCards = [
  {
    id: 'general-call',
    title: 'General Call',
    description: 'Practice everyday phone conversations with our AI assistant. Perfect for building confidence in casual and professional calls.',
    label: 'Conversation',
    href: '/training/ai-calling/general',
    icon: Phone,
    difficulty: 'Beginner' as const,
    estimatedTime: '10-15 min',
    trainingType: 'ai-calling' as const,
  },
  {
    id: 'debate-call',
    title: 'Debate Call',
    description: 'Engage in structured debates over the phone. Develop argumentation skills and learn to present your viewpoints clearly.',
    label: 'Argumentation',
    href: '/training/ai-calling/general',
    icon: Swords,
    difficulty: 'Advanced' as const,
    estimatedTime: '20-30 min',
    trainingType: 'ai-calling' as const,
  },
  {
    id: 'roleplay-call',
    title: 'Role Play Call',
    description: 'Practice specific scenarios like job interviews, customer service, or business meetings with AI role-playing.',
    label: 'Scenarios',
    href: '/training/ai-calling/general',
    icon: Users,
    difficulty: 'Intermediate' as const,
    estimatedTime: '15-25 min',
    trainingType: 'ai-calling' as const,
  },
];

export default function AICallingPage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <ProtectedRoute>
      <FeatureGate feature="ai-calling">
        <SidebarProvider>
          <ExpressifySidebar />
          <SidebarInset>
            <LearningHeader trainingType="ai-calling" />
          
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="min-h-[100vh] flex-1 rounded-xl p-4 md:p-6">
              <div className="mx-auto max-w-6xl space-y-6">
                {/* Header Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-500/10 p-2">
                      <Phone className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold tracking-tight">AI Calling</h1>
                      <p className="text-muted-foreground">
                        Practice phone conversations with our intelligent AI system
                      </p>
                    </div>
                  </div>
                </div>


                {/* Training Cards */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Choose Your Call Type</h2>
                    <Badge variant="secondary" className="text-xs">
                      {aiCallingCards.length} options available
                    </Badge>
                  </div>
                  
                  <TrainingBento trainingType="ai-calling" cards={aiCallingCards} />
                </div>

                {/* How It Works Section */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">How It Works</h2>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-lg border border-border/50 p-6 text-center">
                      <div className="mb-4">
                        <div className="rounded-full bg-blue-500/10 p-3 w-12 h-12 mx-auto flex items-center justify-center">
                          <span className="text-blue-500 font-bold">1</span>
                        </div>
                      </div>
                      <h3 className="font-medium mb-2">Choose Scenario</h3>
                      <p className="text-sm text-muted-foreground">
                        Select from general calls, debates, or role-playing scenarios
                      </p>
                    </div>
                    
                    <div className="rounded-lg border border-border/50 p-6 text-center">
                      <div className="mb-4">
                        <div className="rounded-full bg-green-500/10 p-3 w-12 h-12 mx-auto flex items-center justify-center">
                          <span className="text-green-500 font-bold">2</span>
                        </div>
                      </div>
                      <h3 className="font-medium mb-2">Start Calling</h3>
                      <p className="text-sm text-muted-foreground">
                        Our AI will call you or you can call our system directly
                      </p>
                    </div>
                    
                    <div className="rounded-lg border border-border/50 p-6 text-center">
                      <div className="mb-4">
                        <div className="rounded-full bg-purple-500/10 p-3 w-12 h-12 mx-auto flex items-center justify-center">
                          <span className="text-purple-500 font-bold">3</span>
                        </div>
                      </div>
                      <h3 className="font-medium mb-2">Get Feedback</h3>
                      <p className="text-sm text-muted-foreground">
                        Receive detailed analysis and tips for improvement
                      </p>
                    </div>
                  </div>
                </div>

                {/* Features Section */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Why AI Calling?</h2>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-lg border border-border/50 p-4">
                      <div className="mb-2">
                        <div className="rounded-md bg-green-500/10 p-2 w-fit">
                          <Phone className="h-4 w-4 text-green-500" />
                        </div>
                      </div>
                      <h3 className="font-medium">Real Voice Practice</h3>
                      <p className="text-sm text-muted-foreground">
                        Practice with actual voice calls, not just text
                      </p>
                    </div>
                    
                    <div className="rounded-lg border border-border/50 p-4">
                      <div className="mb-2">
                        <div className="rounded-md bg-blue-500/10 p-2 w-fit">
                          <MessageSquare className="h-4 w-4 text-blue-500" />
                        </div>
                      </div>
                      <h3 className="font-medium">Instant Feedback</h3>
                      <p className="text-sm text-muted-foreground">
                        Get immediate AI feedback on your performance
                      </p>
                    </div>
                    
                    <div className="rounded-lg border border-border/50 p-4">
                      <div className="mb-2">
                        <div className="rounded-md bg-purple-500/10 p-2 w-fit">
                          <Swords className="h-4 w-4 text-purple-500" />
                        </div>
                      </div>
                      <h3 className="font-medium">Challenging Scenarios</h3>
                      <p className="text-sm text-muted-foreground">
                        From casual chats to intense debates
                      </p>
                    </div>
                    
                    <div className="rounded-lg border border-border/50 p-4">
                      <div className="mb-2">
                        <div className="rounded-md bg-orange-500/10 p-2 w-fit">
                          <Users className="h-4 w-4 text-orange-500" />
                        </div>
                      </div>
                      <h3 className="font-medium">Role Playing</h3>
                      <p className="text-sm text-muted-foreground">
                        Practice specific professional scenarios
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
      </FeatureGate>
    </ProtectedRoute>
  );
}