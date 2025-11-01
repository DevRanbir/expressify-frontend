"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { ExpressifySidebar } from '@/components/ui/expressify-sidebar';
import { CollaborateHeader } from '@/components/ui/collaborate-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Trophy, 
  Medal, 
  Award, 
  Crown,
  Users, 
  Timer, 
  Target,
  ArrowLeft,
  BarChart3,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import { ref, get, onValue } from 'firebase/database';
import { database } from '@/lib/firebase';
import { motion } from 'framer-motion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Types
interface PlayerResult {
  id: string;
  name: string;
  avatar?: string;
  score: number;
  isHost: boolean;
}

interface GameResults {
  gameCode: string;
  gameName: string;
  category: string;
  difficulty: string;
  timeLimit: number;
  players: PlayerResult[];
  createdAt: number;
  finishedAt: number;
}

export default function ResultsPage() {
  const router = useRouter();
  const params = useParams();
  const gameCode = params?.gameCode as string;
  const { user } = useAuth();
  
  const [results, setResults] = useState<GameResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch game results
  useEffect(() => {
    if (!gameCode) return;

    const fetchResults = async () => {
      try {
        // Search all game sessions for the one with matching gameCode
        const gamesRef = ref(database, 'gameSessions');
        const snapshot = await get(gamesRef);
        
        if (!snapshot.exists()) {
          toast.error('No games found');
          router.push('/training/social/collaborate');
          return;
        }

        const allGames = snapshot.val();
        let gameId: string | null = null;
        let gameData: any = null;

        // Find the game with matching gameCode
        Object.entries(allGames).forEach(([id, data]: [string, any]) => {
          if (data.gameCode === gameCode) {
            gameId = id;
            gameData = data;
          }
        });

        if (!gameId || !gameData) {
          toast.error('Game not found');
          router.push('/training/social/collaborate');
          return;
        }
        
        // Get player scores
        const scoresRef = ref(database, `gameSessions/${gameId}/playerScores`);
        const scoresSnapshot = await get(scoresRef);
        const scores = scoresSnapshot.val() || {};

        // Combine player data with scores
        const playersWithScores: PlayerResult[] = gameData.players.map((player: any) => ({
          id: player.id,
          name: player.name,
          avatar: player.photoURL || player.avatar,
          score: scores[player.id] || 0,
          isHost: player.isHost || false,
        }));

        // Sort by score descending
        playersWithScores.sort((a, b) => b.score - a.score);

        const gameResults: GameResults = {
          gameCode: gameData.gameCode,
          gameName: gameData.name,
          category: gameData.category,
          difficulty: gameData.difficulty,
          timeLimit: gameData.timeLimit,
          players: playersWithScores,
          createdAt: gameData.createdAt,
          finishedAt: Date.now(),
        };

        setResults(gameResults);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching results:', error);
        toast.error('Failed to load results');
        setLoading(false);
      }
    };

    fetchResults();
  }, [gameCode, router]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const handleBackToLobby = () => {
    router.push('/training/social/collaborate');
  };

  const handlePlayAgain = () => {
    router.push('/training/social/collaborate/create');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (startTime: number, endTime: number) => {
    const durationInSeconds = Math.floor((endTime - startTime) / 1000);
    return formatTime(durationInSeconds);
  };

  const getPodiumIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="h-8 w-8 text-yellow-500" />;
      case 2:
        return <Medal className="h-7 w-7 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-orange-600" />;
      case 4:
        return <Trophy className="h-5 w-5 text-violet-500" />;
      default:
        return null;
    }
  };

  const getPodiumColor = (position: number) => {
    switch (position) {
      case 1:
        return 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/50';
      case 2:
        return 'from-gray-400/20 to-gray-500/10 border-gray-400/50';
      case 3:
        return 'from-orange-500/20 to-orange-600/10 border-orange-500/50';
      case 4:
        return 'from-violet-500/20 to-violet-600/10 border-violet-500/50';
      default:
        return 'from-muted/20 to-muted/10 border-border/50';
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <SidebarProvider>
          <ExpressifySidebar />
          <SidebarInset>
            <CollaborateHeader
              onRefresh={handleRefresh}
              isRefreshing={isRefreshing}
            />
            <div className="flex flex-1 flex-col gap-2 p-2 pt-0 sm:gap-4 sm:p-4">
              <div className="min-h-[calc(100vh-4rem)] flex-1 rounded-lg p-3 sm:rounded-xl sm:p-4 md:p-6">
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
                </div>
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </ProtectedRoute>
    );
  }

  if (!results) {
    return (
      <ProtectedRoute>
        <SidebarProvider>
          <ExpressifySidebar />
          <SidebarInset>
            <CollaborateHeader
              onRefresh={handleRefresh}
              isRefreshing={isRefreshing}
            />
            <div className="flex flex-1 flex-col gap-2 p-2 pt-0 sm:gap-4 sm:p-4">
              <div className="min-h-[calc(100vh-4rem)] flex-1 rounded-lg p-3 sm:rounded-xl sm:p-4 md:p-6">
                <div className="text-center">
                  <p className="text-muted-foreground">No results found</p>
                  <Button onClick={handleBackToLobby} className="mt-4">
                    Back to Lobby
                  </Button>
                </div>
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </ProtectedRoute>
    );
  }

  const topFourPlayers = results.players.slice(0, 4);
  const remainingPlayers = results.players.slice(4);

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <ExpressifySidebar />
        <SidebarInset>
          <CollaborateHeader
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
          />

          <div className="flex flex-1 flex-col gap-2 p-2 pt-0 sm:gap-4 sm:p-4">
            <div className="min-h-[calc(100vh-4rem)] flex-1 rounded-lg p-3 sm:rounded-xl sm:p-4 md:p-6">
              <div className="mx-auto max-w-6xl space-y-4 sm:space-y-6">
                {/* Header */}
                <div className="px-2 sm:px-0">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-foreground flex items-center gap-3">
                        <Trophy className="h-8 w-8 text-yellow-500" />
                        Game Results
                      </h1>
                      <p className="text-muted-foreground text-sm sm:text-base mt-1">
                        {results.gameName} - {results.category}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleBackToLobby}
                        variant="outline"
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Lobby
                      </Button>
                      <Button 
                        onClick={handlePlayAgain}
                        className="bg-violet-600 hover:bg-violet-700"
                      >
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Play Again
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Game Statistics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-violet-500/10">
                          <Users className="h-5 w-5 text-violet-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Total Players</p>
                          <p className="text-2xl font-bold">{results.players.length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/10">
                          <Timer className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Time Played</p>
                          <p className="text-2xl font-bold">{formatDuration(results.createdAt, results.finishedAt)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-500/10">
                          <Target className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Difficulty</p>
                          <p className="text-2xl font-bold capitalize">{results.difficulty}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-orange-500/10">
                          <BarChart3 className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Avg Score</p>
                          <p className="text-2xl font-bold">
                            {Math.round(results.players.reduce((sum, p) => sum + p.score, 0) / results.players.length)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Top 4 Players - Podium Style */}
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-yellow-500" />
                      Top Performers
                    </CardTitle>
                    <CardDescription>
                      The best players in this game
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {topFourPlayers.map((player, index) => (
                        <motion.div
                          key={player.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Card className={`border-2 bg-gradient-to-br ${getPodiumColor(index + 1)} overflow-hidden`}>
                            <CardContent className="p-4">
                              <div className="flex flex-col items-center text-center space-y-3">
                                {/* Position Icon */}
                                <div className="relative">
                                  {getPodiumIcon(index + 1)}
                                  <div className="absolute -top-1 -right-1 bg-background border-2 border-current rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                                    {index + 1}
                                  </div>
                                </div>

                                {/* Avatar */}
                                <Avatar className="h-16 w-16 border-4 border-background shadow-lg">
                                  <AvatarImage src={player.avatar} alt={player.name} />
                                  <AvatarFallback className="text-lg font-bold">
                                    {player.name?.charAt(0) || 'U'}
                                  </AvatarFallback>
                                </Avatar>

                                {/* Player Info */}
                                <div className="space-y-1">
                                  <div className="flex items-center justify-center gap-2">
                                    <p className="font-bold text-lg">{player.name}</p>
                                    {player.isHost && (
                                      <Crown className="h-4 w-4 text-yellow-600" />
                                    )}
                                  </div>
                                  
                                  {/* Score Badge */}
                                  <Badge 
                                    className="text-base font-bold px-3 py-1"
                                    variant={index === 0 ? 'default' : 'secondary'}
                                  >
                                    {player.score} pts
                                  </Badge>

                                  {/* Current User Badge */}
                                  {player.id === user?.uid && (
                                    <Badge variant="outline" className="text-xs">
                                      You
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Remaining Players Table */}
                {remainingPlayers.length > 0 && (
                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Other Players
                      </CardTitle>
                      <CardDescription>
                        All participants in this game
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-16">Rank</TableHead>
                            <TableHead>Player</TableHead>
                            <TableHead className="text-right">Score</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {remainingPlayers.map((player, index) => (
                            <TableRow 
                              key={player.id}
                              className={player.id === user?.uid ? 'bg-violet-500/5' : ''}
                            >
                              <TableCell className="font-medium">
                                #{index + 5}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={player.avatar} alt={player.name} />
                                    <AvatarFallback>
                                      {player.name?.charAt(0) || 'U'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{player.name}</span>
                                    {player.isHost && (
                                      <Crown className="h-3 w-3 text-yellow-600" />
                                    )}
                                    {player.id === user?.uid && (
                                      <Badge variant="outline" className="text-xs">
                                        You
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-bold">
                                {player.score}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}

                {/* Winner Announcement */}
                {results.players.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Card className="border-2 border-yellow-500/50 bg-gradient-to-br from-yellow-500/10 to-orange-500/5">
                      <CardContent className="p-6 text-center">
                        <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
                        <h3 className="text-2xl font-bold mb-2">
                          🎉 Congratulations {results.players[0].name}! 🎉
                        </h3>
                        <p className="text-muted-foreground">
                          Winner with {results.players[0].score} points!
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
