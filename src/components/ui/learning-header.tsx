'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Bell, HomeIcon, BookOpen, FileText, VolumeX, Eye, Phone, Users2 } from 'lucide-react';

interface LearningHeaderProps {
  trainingType: 'textual' | 'vocal' | 'visual' | 'ai-calling' | 'social';
  currentGame?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const getTrainingIcon = (type: string) => {
  switch (type) {
    case 'textual': return FileText;
    case 'vocal': return VolumeX;
    case 'visual': return Eye;
    case 'ai-calling': return Phone;
    case 'social': return Users2;
    default: return BookOpen;
  }
};

const getTrainingLabel = (type: string) => {
  switch (type) {
    case 'textual': return 'Textual Practice';
    case 'vocal': return 'Vocal Practice';
    case 'visual': return 'Visual Practice';
    case 'ai-calling': return 'AI Calling';
    case 'social': return 'Social Training';
    default: return 'Learning';
  }
};

const getGameDisplayName = (gameId: string) => {
  const gameNames: Record<string, string> = {
    'word-puzzles': 'Word Puzzles',
    'story-builder': 'Story Builder',
    'chat-simulator': 'Chat Simulator',
    'debate-master': 'Debate Master',
    'vocabulary-quest': 'Vocabulary Quest',
    'grammar-goblin': 'Grammar Goblin',
    'pronunciation-pro': 'Pronunciation Pro',
    'accent-trainer': 'Accent Trainer',
    'voice-modulation': 'Voice Modulation',
    'speaking-rhythm': 'Speaking Rhythm',
    'vocal-warm-ups': 'Vocal Warm-ups',
    'clarity-coach': 'Clarity Coach',
    'body-language-lab': 'Body Language Lab',
    'gesture-guide': 'Gesture Guide',
    'presentation-posture': 'Presentation Posture',
    'general-call': 'General Call',
    'debate-call': 'Debate Call',
    'roleplay-call': 'Role Play Call',
  };
  return gameNames[gameId] || gameId;
};

export const LearningHeader = memo(
  ({ trainingType, currentGame, onRefresh, isRefreshing }: LearningHeaderProps) => {
    const TrainingIcon = getTrainingIcon(trainingType);
    const trainingLabel = getTrainingLabel(trainingType);

    return (
      <header className="bg-background/95 sticky top-0 z-50 flex h-16 w-full shrink-0 items-center gap-2 border-b backdrop-blur transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList className="flex items-center">
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/me/home" className="flex items-center gap-1.5 h-6">
                  <HomeIcon size={16} aria-hidden="true" />
                  <span>Home</span>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink 
                  href={(trainingType === 'ai-calling' || trainingType === 'social') ? `/training/${trainingType}` : `/learning/${trainingType}`} 
                  className="flex items-center gap-1.5 h-6"
                >
                  <TrainingIcon size={16} aria-hidden="true" />
                  <span>{trainingLabel}</span>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {currentGame && (
                <>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="flex items-center gap-1.5 h-6">
                      <span>{getGameDisplayName(currentGame)}</span>
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="ml-auto flex items-center gap-2 px-4">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <Button variant="outline" size="sm">
              <Bell className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </header>
    );
  },
);

LearningHeader.displayName = 'LearningHeader';