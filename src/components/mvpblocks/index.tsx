'use client';

import { useState, useEffect } from 'react';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Users, Activity, Phone, Mic, Target, Trophy } from 'lucide-react';
import { DashboardCard } from '@/components/ui/dashboard-card';
import { WeeklyActivityChart } from '@/components/ui/weekly-activity-chart';
import { RecentHistoryTable } from '@/components/ui/recent-history-table';
import { LearningActions } from '@/components/ui/learning-actions';
import { DiscoverExpressify } from '@/components/ui/infinite-training-bento';
import { DashboardHeader } from '@/components/ui/dashboard-header';
import { ExpressifySidebar } from '@/components/ui/expressify-sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { database } from '@/lib/firebase';
import { ref, onValue, off } from 'firebase/database';

interface DashboardStats {
  trainingSessions: number;
  gamesPlayed: number;
  aiConversations: number;
  skillsImproved: number;
  previousTrainingSessions?: number;
  previousGamesPlayed?: number;
  previousAiConversations?: number;
  previousSkillsImproved?: number;
}

export default function ExpressifyDashboard() {
  const { user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    trainingSessions: 0,
    gamesPlayed: 0,
    aiConversations: 0,
    skillsImproved: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch dashboard stats from Firebase games data
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const gameTypes = [
      'chat-simulator',
      'crossword-puzzle',
      'debate-master',
      'grammar-goblin',
      'vocabulary-quest',
      'word-bucket'
    ];

    let totalGames = 0;
    let completedGames = 0;
    let totalRounds = 0;
    let loadedCount = 0;

    const unsubscribers: Array<() => void> = [];

    gameTypes.forEach((gameType) => {
      const gameRef = ref(database, `games/${gameType}/${user.uid}`);
      
      const unsubscribe = onValue(gameRef, (snapshot) => {
        if (snapshot.exists()) {
          const gamesData = snapshot.val();
          const games = Object.values(gamesData);
          
          games.forEach((game: any) => {
            totalGames++;
            if (game.status === 'completed') {
              completedGames++;
            }
            if (game.roundsCompleted) {
              totalRounds += game.roundsCompleted;
            }
          });
        }

        loadedCount++;
        
        if (loadedCount === gameTypes.length) {
          // Calculate skills improved based on completed games
          const skillsImproved = Math.floor(completedGames / 5); // 1 skill per 5 completed games
          
          setDashboardStats({
            trainingSessions: totalRounds, // Total rounds as training sessions
            gamesPlayed: totalGames,
            aiConversations: 0, // To be implemented with AI calling data
            skillsImproved: skillsImproved,
            previousTrainingSessions: 0,
            previousGamesPlayed: 0,
            previousAiConversations: 0,
            previousSkillsImproved: 0,
          });
          setIsLoading(false);
        }
      });

      unsubscribers.push(() => off(gameRef));
    });

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [user]);

  // Calculate percentage change
  const calculateChange = (current: number, previous: number = 0): string => {
    if (previous === 0) return '+0%';
    const change = ((current - previous) / previous) * 100;
    const sign = change >= 0 ? '+' : '';
    return `${sign}${Math.round(change)}%`;
  };

  // Generate stats array with real data
  const getChangeType = (current: number, previous: number = 0): 'positive' | 'negative' => {
    return current >= previous ? 'positive' : 'negative';
  };

  const stats = [
    {
      title: 'Training Sessions',
      value: isLoading ? '...' : dashboardStats.trainingSessions.toString(),
      change: calculateChange(dashboardStats.trainingSessions, dashboardStats.previousTrainingSessions),
      changeType: getChangeType(dashboardStats.trainingSessions, dashboardStats.previousTrainingSessions),
      icon: Target,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Games Played',
      value: isLoading ? '...' : dashboardStats.gamesPlayed.toString(),
      change: calculateChange(dashboardStats.gamesPlayed, dashboardStats.previousGamesPlayed),
      changeType: getChangeType(dashboardStats.gamesPlayed, dashboardStats.previousGamesPlayed),
      icon: Trophy,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'AI Conversations',
      value: isLoading ? '...' : dashboardStats.aiConversations.toString(),
      change: calculateChange(dashboardStats.aiConversations, dashboardStats.previousAiConversations),
      changeType: getChangeType(dashboardStats.aiConversations, dashboardStats.previousAiConversations),
      icon: Mic,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Skills Improved',
      value: isLoading ? '...' : dashboardStats.skillsImproved.toString(),
      change: calculateChange(dashboardStats.skillsImproved, dashboardStats.previousSkillsImproved),
      changeType: getChangeType(dashboardStats.skillsImproved, dashboardStats.previousSkillsImproved),
      icon: Users,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
  ];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const handleExport = () => {
    console.log('Exporting data...');
  };

  const handleAddUser = () => {
    console.log('Adding new user...');
  };

  return (
    <SidebarProvider>
      <ExpressifySidebar />
      <SidebarInset>
        <DashboardHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onRefresh={handleRefresh}
          onExport={handleExport}
          isRefreshing={isRefreshing}
        />

        <div className="flex flex-1 flex-col gap-2 p-2 pt-0 sm:gap-4 sm:p-4">
          <div className="min-h-[calc(100vh-4rem)] flex-1 rounded-lg p-3 sm:rounded-xl sm:p-4 md:p-6">
            <div className="mx-auto max-w-6xl space-y-4 sm:space-y-6">
              <div className="px-2 sm:px-0">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Welcome Back!
                </h1>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Here&apos;s your learning progress and activities this week.
                </p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
                {stats.map((stat, index) => (
                  <DashboardCard key={stat.title} stat={stat} index={index} />
                ))}
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-3">
                {/* Charts Section */}
                <div className="space-y-4 sm:space-y-6 xl:col-span-2">
                  <WeeklyActivityChart />
                  <RecentHistoryTable />
                </div>

                {/* Sidebar Section - Full Height */}
                <div className="flex flex-col">
                  <LearningActions />
                </div>
              </div>

              {/* Full Width Discover Expressify Section */}
              <div className="mt-4 sm:mt-6">
                <DiscoverExpressify />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
