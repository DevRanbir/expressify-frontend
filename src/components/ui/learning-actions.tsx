'use client';

import { memo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  FileText, VolumeX, Eye, Users, Phone, Target, 
  BarChart3, Trophy, Settings, HelpCircle, 
  MessageSquare, Calendar, BookOpen, Star,
  Headphones, Video, Gamepad2, Brain
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { database } from '@/lib/firebase';
import { ref, onValue, off, set, get } from 'firebase/database';

interface QuickLink {
  icon: any;
  label: string;
  description: string;
  route: string;
  usageCount?: number;
}

const defaultQuickLinks: QuickLink[] = [
  {
    icon: FileText,
    label: 'Textual Training',
    description: 'Word puzzles & writing',
    route: '/learning/textual',
  },
  {
    icon: VolumeX,
    label: 'Vocal Training',
    description: 'Speech & pronunciation',
    route: '/learning/vocal',
  },
  {
    icon: Eye,
    label: 'Visual Training',
    description: 'Body language & gestures',
    route: '/learning/visual',
  },
  {
    icon: Users,
    label: 'Play with Friends',
    description: 'Multiplayer games',
    route: '/training/social/collaborate',
  },
  {
    icon: Phone,
    label: 'AI Phone Call',
    description: 'Practice conversations',
    route: '/training/vc-person',
  },
  {
    icon: BarChart3,
    label: 'View Progress',
    description: 'Track achievements',
    route: '/progress/dashboard',
  },
  {
    icon: Trophy,
    label: 'Achievements',
    description: 'View your badges',
    route: '/progress/achievements',
  },
  {
    icon: Brain,
    label: 'AI Feedback',
    description: 'Get personalized tips',
    route: '/progress/feedback',
  },
  {
    icon: Headphones,
    label: 'Live Practice',
    description: 'Real-time sessions',
    route: '/practice',
  },
  {
    icon: MessageSquare,
    label: 'Community Chat',
    description: 'Connect with others',
    route: '/community/chat',
  },
  {
    icon: BookOpen,
    label: 'Learning Resources',
    description: 'Guides & tutorials',
    route: '/resources',
  },
  {
    icon: Settings,
    label: 'Settings',
    description: 'Customize experience',
    route: '/settings',
  },
  {
    icon: HelpCircle,
    label: 'Help & Support',
    description: 'Get assistance',
    route: '/help',
  },
];

export const LearningActions = memo(() => {
  const router = useRouter();
  const { user } = useAuth();
  const [quickLinks, setQuickLinks] = useState<QuickLink[]>(defaultQuickLinks);

  // Fetch usage data from Firebase and sort links
  useEffect(() => {
    if (!user) return;

    const usageRef = ref(database, `users/${user.uid}/quickLinkUsage`);
    
    const unsubscribe = onValue(usageRef, (snapshot) => {
      if (snapshot.exists()) {
        const usageData = snapshot.val();
        
        // Merge usage data with default links
        const linksWithUsage = defaultQuickLinks.map(link => ({
          ...link,
          usageCount: usageData[link.route] || 0,
        }));

        // Sort by usage count (descending)
        const sortedLinks = linksWithUsage.sort((a, b) => 
          (b.usageCount || 0) - (a.usageCount || 0)
        );

        setQuickLinks(sortedLinks);
      }
    });

    return () => off(usageRef);
  }, [user]);

  const handleAction = async (route: string) => {
    // Track usage in Firebase
    if (user) {
      const usageRef = ref(database, `users/${user.uid}/quickLinkUsage/${route.replace(/\//g, '_')}`);
      
      try {
        const snapshot = await get(usageRef);
        const currentCount = snapshot.exists() ? snapshot.val() : 0;
        await set(usageRef, currentCount + 1);
      } catch (error) {
        console.error('Error tracking usage:', error);
      }
    }

    router.push(route);
  };

  return (
    <div className="border-border bg-card/40 rounded-xl border p-6 flex flex-col h-full">
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Quick Links</h3>
        <p className="text-muted-foreground text-sm">
          Access all Expressify features quickly
        </p>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto">
        {quickLinks.map((action, index) => (
          <motion.button
            key={action.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            onClick={() => handleAction(action.route)}
            className="w-full rounded-lg p-3 transition-all duration-200 hover:bg-accent group"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-lg p-2 bg-muted flex-shrink-0">
                <action.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="font-medium text-sm truncate">{action.label}</div>
                <div className="text-xs text-muted-foreground truncate">{action.description}</div>
              </div>
              <div className="opacity-0 transition-opacity group-hover:opacity-100 flex-shrink-0">
                →
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      <div className="border-border/50 mt-4 border-t pt-4">
        <Button variant="outline" className="w-full" onClick={() => router.push('/learning/textual')}>
          Start Learning Session
        </Button>
      </div>
    </div>
  );
});

LearningActions.displayName = 'LearningActions';