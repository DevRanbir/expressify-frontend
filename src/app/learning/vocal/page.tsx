"use client";

import { useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { ExpressifySidebar } from '@/components/ui/expressify-sidebar';
import { LearningHeader } from '@/components/ui/learning-header';
import { TrainingBento } from '@/components/ui/training-bento';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { VolumeX, Mic, AudioLines, Zap, MessageSquare, BookOpen } from 'lucide-react';

const vocalTrainingCards = [
  {
    id: 'text-filler-rush',
    title: 'Text Filler Rush',
    description: 'See text on screen and speak it aloud. Faster and more accurate speech fills the text, earning higher scores.',
    label: 'Fluency',
    href: '/learning/vocal/start?game=text-filler-rush',
    icon: Zap,
    difficulty: 'Beginner' as const,
    estimatedTime: '15-20 min',
    trainingType: 'vocal' as const,
  },
  {
    id: 'voice-debate-duel',
    title: 'Voice Debate Duel',
    description: 'Face off against an AI opponent in a timed voice debate. The AI challenges your arguments and evaluates tone, logic, and clarity.',
    label: 'Logic',
    href: '/learning/vocal/start?game=voice-debate-duel',
    icon: MessageSquare,
    difficulty: 'Advanced' as const,
    estimatedTime: '25-30 min',
    trainingType: 'vocal' as const,
  },
  {
    id: 'story-time-creator',
    title: 'Story Time Creator',
    description: 'Listen to or read a story prompt and continue it using your voice. AI scores creativity, coherence, and emotion.',
    label: 'Creativity',
    href: '/learning/vocal/start?game=story-time-creator',
    icon: BookOpen,
    difficulty: 'Intermediate' as const,
    estimatedTime: '20-25 min',
    trainingType: 'vocal' as const,
  },
  {
    id: 'accent-trainer',
    title: 'Accent Trainer',
    description: 'Repeat words or phrases in different English accents. AI provides real-time pronunciation feedback and accuracy scores.',
    label: 'Accent',
    href: '/learning/vocal/start?game=accent-trainer',
    icon: AudioLines,
    difficulty: 'Intermediate' as const,
    estimatedTime: '20-25 min',
    trainingType: 'vocal' as const,
  },
  {
    id: 'tongue-twister-challenge',
    title: 'Tongue Twister Challenge',
    description: 'Race against time to correctly pronounce complex tongue twisters. AI detects slurring and rewards clear articulation.',
    label: 'Clarity',
    href: '/learning/vocal/start?game=tongue-twister-challenge',
    icon: VolumeX,
    difficulty: 'Intermediate' as const,
    estimatedTime: '15-20 min',
    trainingType: 'vocal' as const,
  },
  {
    id: 'topic-simulator',
    title: 'Topic Simulator',
    description: 'Receive a random topic and speak confidently about it for 60 seconds. AI rates fluency, vocabulary variety, and engagement.',
    label: 'Confidence',
    href: '/learning/vocal/start?game=topic-simulator',
    icon: Mic,
    difficulty: 'Beginner' as const,
    estimatedTime: '15-20 min',
    trainingType: 'vocal' as const,
  },
];

export default function VocalTrainingPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <ExpressifySidebar />
        <SidebarInset>
          <LearningHeader
            trainingType="vocal"
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
          />

          <div className="flex flex-1 flex-col gap-2 p-2 pt-0 sm:gap-4 sm:p-4">
            <div className="min-h-[calc(100vh-4rem)] flex-1 rounded-lg p-3 sm:rounded-xl sm:p-4 md:p-6">
              <div className="mx-auto max-w-6xl space-y-4 sm:space-y-6">
                {/* Header */}
                <div className="px-2 sm:px-0">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
                        Vocal Practice Training
                      </h1>
                      <p className="text-muted-foreground text-sm sm:text-base mt-1">
                        Develop your voice and speaking skills with guided vocal exercises
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-4 md:mt-0">
                      <Badge variant="outline" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                        6 Training Modules
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Training Modules */}
                <div className="space-y-4">
                  
                  <TrainingBento trainingType="vocal" cards={vocalTrainingCards} />
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}