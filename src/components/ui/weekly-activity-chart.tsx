'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { BarChart3, Calendar } from 'lucide-react';

const weeklyActivityData = [
  { day: 'Mon', activities: 12, color: 'bg-blue-500' },
  { day: 'Tue', activities: 8, color: 'bg-green-500' },
  { day: 'Wed', activities: 15, color: 'bg-purple-500' },
  { day: 'Thu', activities: 6, color: 'bg-yellow-500' },
  { day: 'Fri', activities: 18, color: 'bg-red-500' },
  { day: 'Sat', activities: 22, color: 'bg-cyan-500' },
  { day: 'Sun', activities: 10, color: 'bg-orange-500' },
];

export const WeeklyActivityChart = memo(() => {
  const maxActivities = Math.max(...weeklyActivityData.map(item => item.activities));
  const totalActivities = weeklyActivityData.reduce((sum, item) => sum + item.activities, 0);
  const averageActivities = Math.round(totalActivities / 7);

  return (
    <div className="border-border bg-card/40 rounded-xl border p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            Weekly Activity
          </h3>
          <p className="text-muted-foreground text-sm">
            Your learning activities by day of the week
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Calendar className="mr-2 h-4 w-4" />
          This Week
        </Button>
      </div>

      {/* Chart Area */}
      <div className="relative mb-4 h-64 rounded-lg p-4">
        <div className="flex h-full items-end justify-between gap-3">
          {weeklyActivityData.map((item, index) => (
            <div
              key={item.day}
              className="group flex flex-1 flex-col items-center"
            >
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(item.activities / maxActivities) * 180}px` }}
                transition={{ duration: 1, delay: index * 0.1 }}
                className={`w-full ${item.color} relative min-h-[20px] cursor-pointer rounded-t-lg transition-opacity hover:opacity-80`}
              >
                {/* Tooltip */}
                <div className="border-border bg-popover absolute -top-16 left-1/2 z-10 -translate-x-1/2 transform rounded-lg border px-3 py-2 text-sm whitespace-nowrap opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                  <div className="font-medium">
                    {item.activities} activities
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Games, lessons & conversations
                  </div>
                </div>
              </motion.div>
              <div className="text-muted-foreground mt-2 text-center text-xs font-medium">
                {item.day}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="border-border/50 grid grid-cols-3 gap-4 border-t pt-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-500">{totalActivities}</div>
          <div className="text-muted-foreground text-xs">Total Activities</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-500">{averageActivities}</div>
          <div className="text-muted-foreground text-xs">Daily Average</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-500">{Math.max(...weeklyActivityData.map(item => item.activities))}</div>
          <div className="text-muted-foreground text-xs">Best Day</div>
        </div>
      </div>
    </div>
  );
});

WeeklyActivityChart.displayName = 'WeeklyActivityChart';