"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Trophy, Clock } from 'lucide-react';

interface StorytellingGameProps {
  gameData: any;
  gamePhase: 'waiting' | 'playing' | 'finished';
  onGamePhaseChange: (phase: 'waiting' | 'playing' | 'finished') => void;
}

export default function StorytellingGame({ gameData, gamePhase, onGamePhaseChange }: StorytellingGameProps) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (gamePhase === 'playing') {
      setTimeLeft(gameData?.timeLimit ? gameData.timeLimit * 60 : 300);
    }
  }, [gamePhase, gameData?.timeLimit]);

  // Timer effect
  useEffect(() => {
    if (gamePhase === 'playing' && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            onGamePhaseChange('finished');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [gamePhase, timeLeft, onGamePhaseChange]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (gamePhase === 'waiting') {
    return (
      <div className="text-center py-8">
        <FileText className="h-16 w-16 text-purple-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-4">Collaborative Storytelling</h3>
        <p className="text-muted-foreground">Waiting for the game to start...</p>
      </div>
    );
  }

  if (gamePhase === 'finished') {
    return (
      <div className="text-center py-8">
        <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold mb-2">Story Complete!</h3>
        <p className="text-muted-foreground">Amazing collaborative storytelling!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Game header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6 text-purple-600" />
          Collaborative Storytelling
        </h2>
        <Badge variant="outline" className="text-lg px-3 py-1 flex items-center gap-1">
          <Clock className="h-4 w-4" />
          {formatTime(timeLeft)}
        </Badge>
      </div>

      {/* Coming soon placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Coming Soon!</CardTitle>
          <CardDescription className="text-center">
            Collaborative storytelling game is under development
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <FileText className="h-24 w-24 text-purple-300 mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">
            Create amazing stories together with your teammates, one sentence at a time.
          </p>
          <Button 
            onClick={() => onGamePhaseChange('finished')} 
            variant="outline"
          >
            End Game
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}