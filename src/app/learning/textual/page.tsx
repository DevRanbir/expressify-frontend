"use client";

import { useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { ExpressifySidebar } from '@/components/ui/expressify-sidebar';
import { LearningHeader } from '@/components/ui/learning-header';
import { TrainingBento } from '@/components/ui/training-bento';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, MessageSquare, Brain, BookOpen, Zap, Target } from 'lucide-react';

const textualTrainingCards = [
  {
    id: 'word-puzzles',
    title: 'Crossword Puzzle',
    description: 'Solve themed crossword grids by filling in words based on given clues. Strengthens vocabulary, spelling, and logical thinking.',
    label: 'Vocabulary',
    href: '/learning/textual/start?game=crossword-puzzle',
    icon: FileText,
    difficulty: 'Beginner' as const,
    estimatedTime: '15-20 min',
    trainingType: 'textual' as const,
  },
  {
    id: 'story-builder',
    title: 'Word Bucket',
    description: 'Letters fall simultaneously. Quickly form the longest possible word from available letters. Longer words earn higher points.',
    label: 'Speed',
    href: '/learning/textual/start?game=word-bucket',
    icon: BookOpen,
    difficulty: 'Beginner' as const,
    estimatedTime: '15-20 min',
    trainingType: 'textual' as const,
  },
  {
    id: 'chat-simulator',
    title: 'Chat Simulator',
    description: 'Immersive role-play chat with three modes: Formal (interviews), Informal (social situations), and Chaotic (surreal scenarios).',
    label: 'Conversation',
    href: '/learning/textual/start?game=chat-simulator',
    icon: MessageSquare,
    difficulty: 'Intermediate' as const,
    estimatedTime: '20-25 min',
    trainingType: 'textual' as const,
  },
  {
    id: 'debate-master',
    title: 'Debate Master',
    description: 'Select a stance on a topic and debate against an AI opponent. Points awarded for clarity, relevance, creativity, and rebuttal strength.',
    label: 'Reasoning',
    href: '/learning/textual/start?game=debate-master',
    icon: Brain,
    difficulty: 'Intermediate' as const,
    estimatedTime: '30-40 min',
    trainingType: 'textual' as const,
  },
  {
    id: 'vocabulary-quest',
    title: 'Vocabulary Quest',
    description: 'A drag-and-drop vocabulary game. Match synonyms and antonyms from ten word options into the correct category slots.',
    label: 'Learning',
    href: '/learning/textual/start?game=vocabulary-quest',
    icon: Zap,
    difficulty: 'Beginner' as const,
    estimatedTime: '15-20 min',
    trainingType: 'textual' as const,
  },
  {
    id: 'grammar-goblin',
    title: 'Grammar Goblin',
    description: 'Identify the incorrect word in each sentence and provide the correct version to earn points and progress.',
    label: 'Structure',
    href: '/learning/textual/start?game=grammar-goblin',
    icon: Target,
    difficulty: 'Intermediate' as const,
    estimatedTime: '20-25 min',
    trainingType: 'textual' as const,
  },
];

export default function TextualTrainingPage() {
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
            trainingType="textual"
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
                        Textual Practice Training
                      </h1>
                      <p className="text-muted-foreground text-sm sm:text-base mt-1">
                        Enhance your written communication skills through interactive exercises
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-4 md:mt-0">
                      <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                        6 Training Modules
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Training Modules */}
                <div className="space-y-4">
                  
                  <TrainingBento trainingType="textual" cards={textualTrainingCards} />
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}