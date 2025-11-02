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
import { Eye, Camera, Hand, Users, Presentation, Target } from 'lucide-react';

const visualTrainingCards = [
  {
    id: 'body-language-lab',
    title: 'Body Language Lab',
    description: 'Master non-verbal communication through body language analysis and practice.',
    label: 'Body Language',
    href: '/learning/visual/body-language-lab',
    icon: Users,
    difficulty: 'Intermediate' as const,
    estimatedTime: '25-30 min',
    trainingType: 'visual' as const,
  },
  {
    id: 'gesture-guide',
    title: 'Gesture Guide',
    description: 'Learn effective hand gestures and movements to enhance your communication.',
    label: 'Gestures',
    href: '/learning/visual/gesture-guide',
    icon: Hand,
    difficulty: 'Beginner' as const,
    estimatedTime: '20-25 min',
    trainingType: 'visual' as const,
  },
  {
    id: 'presentation-posture',
    title: 'Presentation Posture',
    description: 'Develop confident posture and presence for effective presentations.',
    label: 'Posture',
    href: '/learning/visual/presentation-posture',
    icon: Presentation,
    difficulty: 'Intermediate' as const,
    estimatedTime: '20-25 min',
    trainingType: 'visual' as const,
  },
];

export default function VisualTrainingPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  return (
    <ProtectedRoute>
      <FeatureGate feature="visual-practice">
        <SidebarProvider>
          <ExpressifySidebar />
          <SidebarInset>
          <LearningHeader
            trainingType="visual"
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
                        Visual Practice Training
                      </h1>
                      <p className="text-muted-foreground text-sm sm:text-base mt-1">
                        Enhance your non-verbal communication through visual training exercises
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-4 md:mt-0">
                      <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                        3 Training Modules
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Training Modules */}
                <div className="space-y-4">
                  
                  <TrainingBento trainingType="visual" cards={visualTrainingCards} />
                </div>

                {/* Additional Info */}
                <div className="bg-muted/50 rounded-lg p-6 mt-8">
                  <div className="flex items-start gap-4">
                    <Eye className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Visual Communication Focus</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Visual training modules focus on non-verbal communication skills including body language, 
                        gestures, and posture. These skills are crucial for effective face-to-face communication 
                        and presentation delivery.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge variant="secondary" className="text-xs">Body Language</Badge>
                        <Badge variant="secondary" className="text-xs">Gestures</Badge>
                        <Badge variant="secondary" className="text-xs">Posture</Badge>
                        <Badge variant="secondary" className="text-xs">Presence</Badge>
                      </div>
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