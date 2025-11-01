'use client';

import React, { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  FileText, VolumeX, Eye, BookOpen, MessageSquare, Brain, Target, 
  Zap, Users, Mic, Video, Puzzle, Trophy, Star, Activity,
  Globe, Heart, Music, Camera, Gamepad2, Lightbulb, Users2, Swords, MessageCircle
} from 'lucide-react';

interface TrainingCardProps {
  id: string;
  title: string;
  description: string;
  label: string;
  href: string;
  icon: React.ComponentType<any>;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedTime: string;
  trainingType: 'textual' | 'vocal' | 'visual' | 'social' | 'other';
}

// Navigation structure from ExpressifySidebar - dynamically extracted
const navigationStructure = {
  'textual-practice': {
    name: 'Textual Practice',
    href: '/learning/textual',
    children: ['word-puzzles', 'story-builder', 'chat-simulator', 'debate-master', 'vocabulary-quest', 'grammar-goblin'],
    icon: FileText,
  },
  'vocal-practice': {
    name: 'Vocal Practice',
    href: '/learning/vocal',
    children: ['pronunciation-pro', 'accent-trainer', 'voice-modulation', 'speaking-rhythm', 'vocal-warm-ups', 'clarity-coach'],
    icon: VolumeX,
  },
  'visual-practice': {
    name: 'Visual Practice',
    href: '/learning/visual',
    children: ['body-language-lab', 'gesture-guide', 'presentation-posture'],
    icon: Eye,
  },
  'play-with-friend': {
    name: 'Play with Friend',
    children: ['collaborate', 'challenge'],
    icon: Users2,
  },
  'vc-person': {
    name: 'VC a Person',
    href: '/training/vc-person',
    icon: MessageCircle,
  },
};

// Generate training cards dynamically from navigation structure
const generateTrainingCardsFromNav = (): TrainingCardProps[] => {
  const cards: TrainingCardProps[] = [];
  
  // Textual Practice modules
  const textualModules = [
    { id: 'word-puzzles', title: 'Word Puzzles', description: 'Enhance vocabulary and word recognition through engaging puzzles and word games.', label: 'Vocabulary', icon: Puzzle, difficulty: 'Beginner', time: '15-20 min' },
    { id: 'story-builder', title: 'Story Builder', description: 'Develop narrative skills by creating compelling stories with guided prompts.', label: 'Creativity', icon: BookOpen, difficulty: 'Intermediate', time: '25-30 min' },
    { id: 'chat-simulator', title: 'Chat Simulator', description: 'Practice real-time conversation skills in simulated chat environments.', label: 'Conversation', icon: MessageSquare, difficulty: 'Intermediate', time: '20-25 min' },
    { id: 'debate-master', title: 'Debate Master', description: 'Master the art of argumentation and critical thinking through structured debates.', label: 'Reasoning', icon: Brain, difficulty: 'Advanced', time: '30-40 min' },
    { id: 'vocabulary-quest', title: 'Vocabulary Quest', description: 'Embark on an adventure to expand your vocabulary with interactive challenges.', label: 'Learning', icon: Zap, difficulty: 'Beginner', time: '15-20 min' },
    { id: 'grammar-goblin', title: 'Grammar Goblin', description: 'Perfect your grammar skills through progressive exercises and challenges.', label: 'Structure', icon: Target, difficulty: 'Intermediate', time: '20-25 min' },
  ];

  // Vocal Practice modules
  const vocalModules = [
    { id: 'pronunciation-pro', title: 'Pronunciation Pro', description: 'Perfect your pronunciation with AI-powered feedback and voice analysis.', label: 'Speech', icon: Mic, difficulty: 'Beginner', time: '20-25 min' },
    { id: 'accent-trainer', title: 'Accent Trainer', description: 'Develop neutral pronunciation and reduce regional accent influence.', label: 'Accent', icon: Globe, difficulty: 'Advanced', time: '30-40 min' },
    { id: 'voice-modulation', title: 'Voice Modulation', description: 'Learn to control pitch, pace, and volume for effective communication.', label: 'Control', icon: Activity, difficulty: 'Advanced', time: '25-35 min' },
    { id: 'speaking-rhythm', title: 'Speaking Rhythm', description: 'Master the natural flow and rhythm of spoken communication.', label: 'Rhythm', icon: Music, difficulty: 'Intermediate', time: '20-30 min' },
    { id: 'vocal-warm-ups', title: 'Vocal Warm-ups', description: 'Prepare your voice with effective warm-up exercises and techniques.', label: 'Preparation', icon: Heart, difficulty: 'Beginner', time: '10-15 min' },
    { id: 'clarity-coach', title: 'Clarity Coach', description: 'Improve articulation and clarity for confident public speaking.', label: 'Clarity', icon: Star, difficulty: 'Intermediate', time: '20-30 min' },
  ];

  // Visual Practice modules
  const visualModules = [
    { id: 'body-language-lab', title: 'Body Language Lab', description: 'Learn to read and use body language effectively in conversations.', label: 'Gestures', icon: Eye, difficulty: 'Beginner', time: '20-25 min' },
    { id: 'gesture-guide', title: 'Gesture Guide', description: 'Master appropriate gestures for different social and professional contexts.', label: 'Social', icon: Users, difficulty: 'Advanced', time: '25-35 min' },
    { id: 'presentation-posture', title: 'Presentation Posture', description: 'Build confidence through powerful posture and presence techniques.', label: 'Posture', icon: Trophy, difficulty: 'Beginner', time: '15-20 min' },
  ];

  // Social modules
  const socialModules = [
    { id: 'collaborate', title: 'Collaborate', description: 'Work together with friends on communication challenges and games.', label: 'Teamwork', icon: Users2, difficulty: 'Intermediate', time: '30-45 min' },
    { id: 'challenge', title: 'Challenge Friends', description: 'Compete with friends in communication skills challenges.', label: 'Competition', icon: Swords, difficulty: 'Advanced', time: '20-30 min' },
  ];

  // Other modules
  const otherModules = [
    { id: 'vc-person', title: 'VC a Person', description: 'Practice video calls and virtual communication skills.', label: 'Virtual', icon: MessageCircle, difficulty: 'Intermediate', time: '25-35 min' },
  ];

  // Convert to TrainingCardProps format
  [...textualModules, ...vocalModules, ...visualModules, ...socialModules, ...otherModules].forEach(module => {
    const baseHref = getModuleBaseHref(module.id);
    const trainingType = getTrainingType(module.id);
    
    cards.push({
      id: module.id,
      title: module.title,
      description: module.description,
      label: module.label,
      href: baseHref,
      icon: module.icon,
      difficulty: module.difficulty as 'Beginner' | 'Intermediate' | 'Advanced',
      estimatedTime: module.time,
      trainingType: trainingType,
    });
  });

  return cards;
};

const getModuleBaseHref = (moduleId: string): string => {
  if (['word-puzzles', 'story-builder', 'chat-simulator', 'debate-master', 'vocabulary-quest', 'grammar-goblin'].includes(moduleId)) {
    return `/learning/textual/${moduleId}`;
  }
  if (['pronunciation-pro', 'accent-trainer', 'voice-modulation', 'speaking-rhythm', 'vocal-warm-ups', 'clarity-coach'].includes(moduleId)) {
    return `/learning/vocal/${moduleId}`;
  }
  if (['body-language-lab', 'gesture-guide', 'presentation-posture'].includes(moduleId)) {
    return `/learning/visual/${moduleId}`;
  }
  if (['collaborate', 'challenge'].includes(moduleId)) {
    return `/training/social/${moduleId}`;
  }
  return `/training/${moduleId}`;
};

const getTrainingType = (moduleId: string): 'textual' | 'vocal' | 'visual' | 'social' | 'other' => {
  if (['word-puzzles', 'story-builder', 'chat-simulator', 'debate-master', 'vocabulary-quest', 'grammar-goblin'].includes(moduleId)) {
    return 'textual';
  }
  if (['pronunciation-pro', 'accent-trainer', 'voice-modulation', 'speaking-rhythm', 'vocal-warm-ups', 'clarity-coach'].includes(moduleId)) {
    return 'vocal';
  }
  if (['body-language-lab', 'gesture-guide', 'presentation-posture'].includes(moduleId)) {
    return 'visual';
  }
  if (['collaborate', 'challenge'].includes(moduleId)) {
    return 'social';
  }
  return 'other';
};

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty.toLowerCase()) {
    case 'beginner': return 'rgb(34, 197, 94)'; // green
    case 'intermediate': return 'rgb(234, 179, 8)'; // yellow
    case 'advanced': return 'rgb(239, 68, 68)'; // red
    default: return 'rgb(132, 0, 255)'; // violet
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'textual': return 'rgb(59, 130, 246)'; // blue
    case 'vocal': return 'rgb(168, 85, 247)'; // purple  
    case 'visual': return 'rgb(34, 197, 94)'; // green
    case 'social': return 'rgb(249, 115, 22)'; // orange
    default: return 'rgb(132, 0, 255)'; // violet
  }
};

export const DiscoverExpressify: React.FC = () => {
  const gridRef = useRef<HTMLDivElement>(null);
  const [displayedCards, setDisplayedCards] = useState<TrainingCardProps[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

  // Function to shuffle array
  const shuffleArray = (array: TrainingCardProps[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Function to refresh cards
  const refreshCards = () => {
    setIsRefreshing(true);
    const allCards = generateTrainingCardsFromNav();
    const shuffledCards = shuffleArray(allCards);
    setDisplayedCards(shuffledCards.slice(0, 6));
    
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  // Initialize with shuffled cards on component mount/reload
  useEffect(() => {
    refreshCards();
  }, []);

  useEffect(() => {
    const cards = gridRef.current?.querySelectorAll('.training-card');
    if (!cards) return;

    // Animate cards on mount/update
    gsap.fromTo(cards, 
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power2.out" }
    );

    // Hover animations
    cards.forEach((card) => {
      const handleMouseEnter = () => {
        gsap.to(card, { 
          scale: 1.02, 
          y: -5,
          duration: 0.3, 
          ease: "power2.out" 
        });
      };

      const handleMouseLeave = () => {
        gsap.to(card, { 
          scale: 1, 
          y: 0,
          duration: 0.3, 
          ease: "power2.out" 
        });
      };

      card.addEventListener('mouseenter', handleMouseEnter);
      card.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        card.removeEventListener('mouseenter', handleMouseEnter);
        card.removeEventListener('mouseleave', handleMouseLeave);
      };
    });
  }, [displayedCards]);

  const handleCardClick = (card: TrainingCardProps) => {
    const cardElement = gridRef.current?.querySelector(`[data-card-id="${card.id}"]`);
    if (cardElement) {
      // Create ripple effect
      const rect = cardElement.getBoundingClientRect();
      const ripple = document.createElement('div');
      ripple.className = 'absolute rounded-full bg-white/20 pointer-events-none';
      ripple.style.width = ripple.style.height = '100px';
      ripple.style.left = '50%';
      ripple.style.top = '50%';
      ripple.style.transform = 'translate(-50%, -50%) scale(0)';
      cardElement.appendChild(ripple);

      gsap.to(ripple, {
        scale: 3,
        opacity: 0,
        duration: 0.6,
        ease: "power2.out",
        onComplete: () => ripple.remove()
      });
    }

    // Navigate after animation
    setTimeout(() => {
      router.push(card.href);
    }, 200);
  };

  return (
    <div className="border-border bg-card/40 rounded-xl border p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Discover Expressify</h3>
          <p className="text-muted-foreground text-sm">
            Explore different learning modules • Synced with navigation
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshCards}
          disabled={isRefreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div 
        ref={gridRef}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {displayedCards.map((card) => (
          <div
            key={`${card.id}-${Math.random()}`}
            data-card-id={card.id}
            className="training-card relative group cursor-pointer overflow-hidden rounded-lg border border-border bg-card p-4 hover:shadow-lg transition-all duration-200"
            onClick={() => handleCardClick(card)}
          >
            {/* Type indicator */}
            <div 
              className="absolute top-2 right-2 w-2 h-2 rounded-full"
              style={{ backgroundColor: getTypeColor(card.trainingType) }}
            />

            {/* Icon */}
            <div className="mb-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <card.icon className="w-5 h-5" />
              </div>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">{card.title}</h4>
              </div>
              
              <p className="text-xs text-muted-foreground line-clamp-2">
                {card.description}
              </p>

              <div className="flex items-center justify-between">
                <span 
                  className="inline-flex items-center px-2 py-1 rounded text-xs font-medium"
                  style={{ 
                    backgroundColor: `${getDifficultyColor(card.difficulty)}20`,
                    color: getDifficultyColor(card.difficulty)
                  }}
                >
                  {card.difficulty}
                </span>
                <span className="text-xs text-muted-foreground">
                  {card.estimatedTime}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {card.label}
                </span>
                <span className="text-xs capitalize text-muted-foreground">
                  {card.trainingType}
                </span>
              </div>
            </div>

            {/* Hover effect overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </div>
        ))}
      </div>

      <div className="mt-4 text-center">
        <p className="text-xs text-muted-foreground">
          End Of The Page
        </p>
      </div>
    </div>
  );
};