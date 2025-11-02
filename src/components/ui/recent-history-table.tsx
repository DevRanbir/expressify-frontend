'use client';

import { memo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  History,
  Target,
  Calendar,
  Trophy,
  Mic,
  Users,
  Clock,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { database } from '@/lib/firebase';
import { ref, onValue, off } from 'firebase/database';

interface Activity {
  id: string;
  activity: string;
  type: string;
  score: number;
  duration: string;
  timestamp: string;
  icon: any;
  color: string;
}

const gameTypeToName: Record<string, string> = {
  'chat-simulator': 'Chat Simulator',
  'crossword-puzzle': 'Crossword Puzzle',
  'debate-master': 'Debate Master',
  'grammar-goblin': 'Grammar Goblin',
  'vocabulary-quest': 'Vocabulary Quest',
  'word-bucket': 'Word Bucket',
};

const gameTypeToIcon: Record<string, any> = {
  'chat-simulator': Users,
  'crossword-puzzle': Target,
  'debate-master': Mic,
  'grammar-goblin': Trophy,
  'vocabulary-quest': Target,
  'word-bucket': Trophy,
};

const gameTypeToColor: Record<string, string> = {
  'chat-simulator': 'text-green-500',
  'crossword-puzzle': 'text-blue-500',
  'debate-master': 'text-purple-500',
  'grammar-goblin': 'text-orange-500',
  'vocabulary-quest': 'text-cyan-500',
  'word-bucket': 'text-red-500',
};

const formatTimestamp = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  return `${days} day${days !== 1 ? 's' : ''} ago`;
};

const formatDuration = (seconds: number): string => {
  if (!seconds || seconds === 0) return '0 min';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
};

export const RecentHistoryTable = memo(() => {
  const { user } = useAuth();
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const gameTypes = ['chat-simulator', 'crossword-puzzle', 'debate-master', 'grammar-goblin', 'vocabulary-quest', 'word-bucket'];
    
    const allActivities: Activity[] = [];
    let loadedCount = 0;
    const unsubscribers: Array<() => void> = [];

    gameTypes.forEach((gameType) => {
      const gameRef = ref(database, `games/${gameType}/${user.uid}`);
      
      const unsubscribe = onValue(gameRef, (snapshot) => {
        if (snapshot.exists()) {
          const gamesData = snapshot.val();
          
          Object.entries(gamesData).forEach(([gameId, game]: [string, any]) => {
            const accuracy = game.accuracy || 0;
            const duration = game.duration || 0;
            const timestamp = game.timestamp || Date.now();
            
            allActivities.push({
              id: gameId,
              activity: `Completed ${gameTypeToName[gameType] || gameType}`,
              type: 'textual', // Can be enhanced based on game type
              score: accuracy,
              duration: formatDuration(duration),
              timestamp: formatTimestamp(timestamp),
              icon: gameTypeToIcon[gameType] || Target,
              color: gameTypeToColor[gameType] || 'text-blue-500',
            });
          });
        }

        loadedCount++;
        
        if (loadedCount === gameTypes.length) {
          // Sort by timestamp (most recent first) and take top 5
          const sortedActivities = allActivities
            .sort((a, b) => {
              // Extract numeric value from timestamp string for sorting
              const getMinutes = (ts: string) => {
                if (ts.includes('min ago')) return parseInt(ts);
                if (ts.includes('hour')) return parseInt(ts) * 60;
                if (ts.includes('day')) return parseInt(ts) * 1440;
                return 99999;
              };
              return getMinutes(a.timestamp) - getMinutes(b.timestamp);
            })
            .slice(0, 5);
          
          setRecentActivities(sortedActivities);
          setIsLoading(false);
        }
      });

      unsubscribers.push(() => off(gameRef));
    });

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [user]);
  return (
    <div className="border-border bg-card/40 rounded-xl border p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <History className="h-5 w-5 text-blue-500" />
            Recent History
          </h3>
          <p className="text-muted-foreground text-sm">
            Your latest learning activities and achievements
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Calendar className="mr-2 h-4 w-4" />
          View All
        </Button>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading activities...
          </div>
        ) : recentActivities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No recent activities. Start playing games to see your history!
          </div>
        ) : (
          recentActivities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="border-border/50 flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <div className={`rounded-lg p-2 ${activity.color} bg-opacity-10`}>
                  <activity.icon className={`h-4 w-4 ${activity.color}`} />
                </div>
                <div>
                  <div className="font-medium">{activity.activity}</div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="capitalize">{activity.type} training</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-lg">{activity.score}%</div>
                <div className="text-xs text-muted-foreground">{activity.timestamp}</div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Summary Footer */}
      {recentActivities.length > 0 && (
        <div className="border-border/50 mt-6 border-t pt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {recentActivities.length} activities completed recently
            </span>
            <span className="font-medium">
              Avg. Score: {Math.round(recentActivities.reduce((sum, item) => sum + item.score, 0) / recentActivities.length) || 0}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
});

RecentHistoryTable.displayName = 'RecentHistoryTable';