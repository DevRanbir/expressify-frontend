"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { ExpressifySidebar } from '@/components/ui/expressify-sidebar';
import { CollaborateHeader } from '@/components/ui/collaborate-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/UserAvatar';
import Comp485 from '@/components/comp-485';
import { useGameSessions, useGameSession } from '@/hooks/useCollaboration';
import { toast } from 'sonner';
import { Users, Plus, Search, Timer, Trophy, Gamepad2 } from 'lucide-react';

export default function CollaboratePage() {
  const [joinCode, setJoinCode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  
  // Use real-time game sessions from Firebase
  const { sessions: games, loading } = useGameSessions();
  const { joinGameSession } = useGameSession();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const handleJoinByCode = async () => {
    try {
      if (!joinCode.trim()) {
        toast.error('Please enter a game code');
        return;
      }
      
      const sessionId = await joinGameSession(joinCode.toUpperCase());
      router.push(`/training/social/collaborate/${joinCode.toUpperCase()}`);
      toast.success('Joined game successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to join game');
    }
  };

  const handleJoinGame = async (gameCode: string) => {
    try {
      const sessionId = await joinGameSession(gameCode);
      router.push(`/training/social/collaborate/${gameCode}`);
      toast.success('Joined game successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to join game');
    }
  };

  // Filter games based on search query and exclude finished games
  const filteredGames = games.filter(game => 
    game.status !== 'finished' && (
      game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.creator.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'hard': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'playing': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'finished': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  // Check if user is already in an active game and show notification
  useEffect(() => {
    if (user && games && games.length > 0) {
      const userActiveGame = games.find(game => 
        game.players.some(player => player.id === user.uid) && 
        (game.status === 'waiting' || game.status === 'playing')
      );
      
      if (userActiveGame) {
        toast.info(`You have an active game: ${userActiveGame.name}. Click to rejoin!`, {
          action: {
            label: 'Rejoin',
            onClick: () => router.push(`/training/social/collaborate/${userActiveGame.gameCode}`)
          }
        });
      }
    }
  }, [user, games, router]);

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
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
                        Collaborative Training
                      </h1>
                      <p className="text-muted-foreground text-sm sm:text-base mt-1">
                        Join others in interactive communication challenges
                      </p>
                    </div>
                    <Button 
                      onClick={() => router.push('/training/social/collaborate/create')}
                      className="mt-4 md:mt-0 bg-violet-600 hover:bg-violet-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Game
                    </Button>
                  </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">{/* Join by Code Section */}
                  <div className="lg:col-span-1 space-y-4 sm:space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Gamepad2 className="h-5 w-5" />
                          Join by Code
                        </CardTitle>
                        <CardDescription>
                          Enter a game code to join a specific session
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Input
                            placeholder="Enter game code (e.g., WORD123)"
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                            className="text-center font-mono"
                            maxLength={10}
                          />
                        </div>
                        <Button 
                          onClick={handleJoinByCode}
                          disabled={!joinCode.trim()}
                          className="w-full"
                        >
                          Join Game
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Quick Stats */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Quick Stats</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Active Games</span>
                          <Badge variant="secondary">{filteredGames.filter(g => g.status === 'waiting').length}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Players Online</span>
                          <Badge variant="secondary">{filteredGames.reduce((acc, game) => acc + game.players.length, 0)}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Your Level</span>
                          <Badge className="bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-300">
                            Intermediate
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Available Games Section */}
                  <div className="lg:col-span-2">
                    <Card>
                      <CardHeader>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              <Users className="h-5 w-5" />
                              Available Games
                            </CardTitle>
                            <CardDescription>
                              Join ongoing games or wait for others to join
                            </CardDescription>
                          </div>
                          <div className="relative w-full sm:w-auto">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Search games..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="pl-10 w-full sm:w-64"
                            />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {loading ? (
                            <div className="text-center py-8">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 mx-auto"></div>
                              <p className="text-muted-foreground mt-2">Loading games...</p>
                            </div>
                          ) : filteredGames.length === 0 ? (
                            <div className="text-center py-8">
                              <Gamepad2 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                              <p className="text-muted-foreground">No games available. Create one to get started!</p>
                            </div>
                          ) : (
                            filteredGames.map((game) => (
                              <div 
                                key={game.id}
                                className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                              >
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                  <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-3">
                                      <h3 className="font-semibold text-lg">{game.name}</h3>
                                      <Badge className="font-mono text-xs">{game.gameCode}</Badge>
                                    </div>
                                    
                                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                      <span>Created by {game.creator}</span>
                                      <span>•</span>
                                      <span className="flex items-center gap-1">
                                        <Timer className="h-3 w-3" />
                                        {game.timeLimit} min
                                      </span>
                                      <span>•</span>
                                      <span>{formatTimeAgo(game.createdAt)}</span>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                      <Badge className={getDifficultyColor(game.difficulty)}>
                                        {game.difficulty}
                                      </Badge>
                                      <Badge variant="outline">{game.category}</Badge>
                                      <Badge className={getStatusColor(game.status)}>
                                        {game.status}
                                      </Badge>
                                      <Badge variant="secondary">
                                        <Users className="h-3 w-3 mr-1" />
                                        {game.players.length}/{game.maxPlayers}
                                      </Badge>
                                    </div>
                                  </div>

                                  <Button
                                    onClick={() => handleJoinGame(game.gameCode)}
                                    disabled={game.players.length >= game.maxPlayers}
                                    variant={game.status === 'waiting' ? 'default' : 'outline'}
                                    className={game.status === 'waiting' ? 'bg-violet-600 hover:bg-violet-700' : ''}
                                  >
                                    {game.players.length >= game.maxPlayers ? 'Full' : 
                                     game.status === 'playing' ? 'Spectate' : 'Join'}
                                  </Button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}