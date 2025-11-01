'use client';

import { memo } from 'react';
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

const recentActivities = [
  {
    id: 1,
    activity: 'Completed Word Puzzles',
    type: 'textual',
    score: 85,
    duration: '12 min',
    timestamp: '2 hours ago',
    icon: Target,
    color: 'text-blue-500',
  },
  {
    id: 2,
    activity: 'AI Phone Conversation',
    type: 'vocal',
    score: 92,
    duration: '8 min',
    timestamp: '4 hours ago',
    icon: Mic,
    color: 'text-purple-500',
  },
  {
    id: 3,
    activity: 'Multiplayer Sentence Builder',
    type: 'social',
    score: 78,
    duration: '15 min',
    timestamp: '1 day ago',
    icon: Users,
    color: 'text-green-500',
  },
  {
    id: 4,
    activity: 'Pronunciation Practice',
    type: 'vocal',
    score: 88,
    duration: '10 min',
    timestamp: '2 days ago',
    icon: Mic,
    color: 'text-purple-500',
  },
  {
    id: 5,
    activity: 'Body Language Lab',
    type: 'visual',
    score: 91,
    duration: '20 min',
    timestamp: '3 days ago',
    icon: Trophy,
    color: 'text-orange-500',
  },
];

export const RecentHistoryTable = memo(() => {
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
        {recentActivities.map((activity, index) => (
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
                  <Clock className="h-3 w-3" />
                  {activity.duration}
                  <span>•</span>
                  <span className="capitalize">{activity.type} training</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-lg">{activity.score}%</div>
              <div className="text-xs text-muted-foreground">{activity.timestamp}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Summary Footer */}
      <div className="border-border/50 mt-6 border-t pt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {recentActivities.length} activities completed this week
          </span>
          <span className="font-medium">
            Avg. Score: {Math.round(recentActivities.reduce((sum, item) => sum + item.score, 0) / recentActivities.length)}%
          </span>
        </div>
      </div>
    </div>
  );
});

RecentHistoryTable.displayName = 'RecentHistoryTable';