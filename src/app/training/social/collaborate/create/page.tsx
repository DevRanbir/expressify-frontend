"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { SidebarProvider } from '@/components/ui/sidebar';
import { ExpressifySidebar } from '@/components/ui/expressify-sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { UserAvatar } from '@/components/UserAvatar';
import Comp481 from '@/components/comp-481';
import { useGameSession, useGameSessions } from '@/hooks/useCollaboration';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Users, 
  Settings, 
  MessageCircle, 
  Copy, 
  Share, 
  Play,
  Clock,
  Trophy,
  Gamepad2,
  Crown
} from 'lucide-react';

// Mock data for connected players
const mockPlayers = [
  {
    id: '1',
    name: 'You',
    email: 'user@example.com',
    avatar: null,
    isHost: true,
    status: 'Ready',
    joinedAt: 'Host'
  }
];

export default function CreateGamePage() {
  const [gameSettings, setGameSettings] = useState({
    category: 'sentence-builder',
    difficulty: 'medium',
    maxPlayers: '4',
    timeLimit: '10',
    description: ''
  });
  
  const [gameCreated, setGameCreated] = useState(false);
  const [creating, setCreating] = useState(false);
  const [gameCode, setGameCode] = useState('');
  const [newMessage, setNewMessage] = useState('');
  
  const router = useRouter();
  const { user } = useAuth();
  
  // Check if user is already in a game
  const { sessions: allGames } = useGameSessions();
  
  // Use Firebase game session hook
  const { createGameSession, session, chatMessages, addChatMessage, startGame } = useGameSession(gameCode);

  // Check if user is already in an active game and redirect
  useEffect(() => {
    if (user && allGames && allGames.length > 0) {
      const userActiveGame = allGames.find(game => 
        game.players.some(player => player.id === user.uid) && 
        (game.status === 'waiting' || game.status === 'playing')
      );
      
      if (userActiveGame) {
        toast.info(`Redirecting to your active game: ${userActiveGame.name}`);
        router.push(`/training/social/collaborate/${userActiveGame.gameCode}`);
        return;
      }
    }
  }, [user, allGames, router]);

  const handleCreateGame = async () => {
    if (!gameSettings.category) {
      toast.error('Please select a game category');
      return;
    }

    // Auto-generate game name: category-by-creatorname
    const creatorName = user?.displayName || 'Anonymous';
    const gameName = `${gameSettings.category}-by-${creatorName}`;

    setCreating(true);
    try {
      const newGameCode = await createGameSession({
        name: gameName,
        category: gameSettings.category,
        difficulty: gameSettings.difficulty,
        timeLimit: parseInt(gameSettings.timeLimit),
        maxPlayers: parseInt(gameSettings.maxPlayers),
        creator: creatorName,
        creatorId: user?.uid || '',
        description: gameSettings.description,
        status: 'waiting'
      });
      
      setGameCode(newGameCode);
      setGameCreated(true);
      toast.success('Game created successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create game');
    } finally {
      setCreating(false);
    }
  };

  const handleStartGame = async () => {
    if (!session?.id) return;
    
    try {
      await startGame(session.id);
      router.push(`/training/social/collaborate/${gameCode}`);
      toast.success('Game started!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to start game');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !session?.id) return;
    
    try {
      await addChatMessage(session.id, newMessage);
      setNewMessage('');
    } catch (error: any) {
      toast.error('Failed to send message');
    }
  };

  const copyGameCode = () => {
    navigator.clipboard.writeText(gameCode);
    toast.success('Game code copied to clipboard!');
  };

  const shareGame = () => {
    const shareUrl = `${window.location.origin}/training/social/collaborate/${gameCode}`;
    const gameName = session?.name || `${gameSettings.category} game`;
    if (navigator.share) {
      navigator.share({
        title: `Join my ${gameName}!`,
        text: `Game Code: ${gameCode}`,
        url: shareUrl,
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success('Game link copied to clipboard!');
    }
  };

  const handleSettingChange = (key: string, value: string) => {
    setGameSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <ExpressifySidebar />
        <div className="flex-1 overflow-auto">
          <div className="flex flex-1 flex-col gap-2 p-2 pt-0 sm:gap-4 sm:p-4">
            <div className="min-h-[calc(100vh-4rem)] flex-1 rounded-lg p-3 sm:rounded-xl sm:p-4 md:p-6">
              <div className="mx-auto max-w-6xl space-y-4 sm:space-y-6">
                
                {/* Header */}
                <div className="px-2 sm:px-0">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <Button 
                        variant="ghost" 
                        onClick={() => router.back()}
                        size="icon"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <div className="rounded-lg bg-violet-500/10 p-2">
                        <Gamepad2 className="h-6 w-6 text-violet-500" />
                      </div>
                      <div>
                        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                          {gameCreated ? 'Game Lobby' : 'Create Game'}
                        </h1>
                        <p className="text-sm text-muted-foreground sm:text-base">
                          {gameCreated ? `Game Code: ${gameCode}` : 'Set up your collaborative training session'}
                        </p>
                      </div>
                    </div>
                    {gameCreated && gameCode && (
                      <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={copyGameCode} size="sm">
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Code
                        </Button>
                        <Button variant="outline" onClick={shareGame} size="sm">
                          <Share className="h-4 w-4 mr-2" />
                          Share
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Main Layout - Full Width */}
                <div className="space-y-4 sm:space-y-6">
                  {!gameCreated ? (
                    <Card className="border-border/50">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Settings className="h-5 w-5" />
                          Game Settings
                        </CardTitle>
                        <CardDescription>
                          Configure your collaborative training session
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="p-4 border border-border/50 rounded-lg bg-muted/20">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="h-1 w-1 rounded-full bg-muted-foreground"></div>
                            <p className="text-sm font-medium">Game Name Preview</p>
                          </div>
                          <div className="flex items-center gap-2 p-3 bg-background/50 rounded-md border border-border/30">
                            <Trophy className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <code className="text-sm font-mono text-foreground">{gameSettings.category}-by-{user?.displayName ? user.displayName.replace(/\s+/g, '') : 'Anonymous'}</code>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2 italic">
                            *Automatically generated from category and your username
                          </p>
                        </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <Label htmlFor="category">Category *</Label>
                              <Select 
                                value={gameSettings.category}
                                onValueChange={(value) => handleSettingChange('category', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="sentence-builder">Sentence Builder</SelectItem>
                                    <SelectItem value="vocabulary" disabled>Vocabulary Building</SelectItem>
                                    <SelectItem value="storytelling" disabled>Collaborative Storytelling</SelectItem>
                                    <SelectItem value="debate" disabled>Debate & Discussion</SelectItem>
                                    <SelectItem value="wordplay" disabled>Word Games</SelectItem>
                                    <SelectItem value="grammar" disabled>Grammar Challenges</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                        <Label htmlFor="difficulty">Difficulty</Label>
                        <Select 
                          value={gameSettings.difficulty}
                          onValueChange={(value) => handleSettingChange('difficulty', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="easy">Easy</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="hard">Hard</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="maxPlayers">Max Players</Label>
                        <Select 
                          value={gameSettings.maxPlayers}
                          onValueChange={(value) => handleSettingChange('maxPlayers', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="2">2 Players</SelectItem>
                            <SelectItem value="3">3 Players</SelectItem>
                            <SelectItem value="4">4 Players</SelectItem>
                            <SelectItem value="6">6 Players</SelectItem>
                            <SelectItem value="8">8 Players</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                        <Select 
                          value={gameSettings.timeLimit}
                          onValueChange={(value) => handleSettingChange('timeLimit', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5 minutes</SelectItem>
                            <SelectItem value="10">10 minutes</SelectItem>
                            <SelectItem value="15">15 minutes</SelectItem>
                            <SelectItem value="20">20 minutes</SelectItem>
                            <SelectItem value="30">30 minutes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description (Optional)</Label>
                      <Textarea
                        id="description"
                        placeholder="Add any special rules or notes for players..."
                        value={gameSettings.description}
                        onChange={(e) => handleSettingChange('description', e.target.value)}
                        rows={3}
                      />
                    </div>

                          <Button 
                            onClick={handleCreateGame}
                            disabled={creating || !gameSettings.category}
                            className="w-full h-12"
                            size="lg"
                          >
                            <Gamepad2 className="h-4 w-4 mr-2" />
                            {creating ? 'Creating Game...' : 'Create Game'}
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="border-border/50">
                        <CardHeader className="pb-4">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-violet-500" />
                            {session?.name || 'Game Lobby'}
                          </CardTitle>
                          <CardDescription>
                            Game Code: <span className="font-mono font-bold text-violet-600">{gameCode}</span>
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-4 border border-border/50 rounded-lg bg-gradient-to-br from-blue-500/5 to-blue-500/10">
                              <Users className="h-5 w-5 mx-auto mb-2 text-blue-500" />
                              <div className="text-xl font-bold">{session?.players.length || 0}/{gameSettings.maxPlayers}</div>
                              <div className="text-xs text-muted-foreground">Players</div>
                            </div>
                            <div className="text-center p-4 border border-border/50 rounded-lg bg-gradient-to-br from-green-500/5 to-green-500/10">
                              <Clock className="h-5 w-5 mx-auto mb-2 text-green-500" />
                              <div className="text-xl font-bold">{gameSettings.timeLimit}m</div>
                              <div className="text-xs text-muted-foreground">Duration</div>
                            </div>
                            <div className="text-center p-4 border border-border/50 rounded-lg bg-gradient-to-br from-purple-500/5 to-purple-500/10">
                              <Trophy className="h-5 w-5 mx-auto mb-2 text-purple-500" />
                              <div className="text-xl font-bold capitalize">{gameSettings.difficulty}</div>
                              <div className="text-xs text-muted-foreground">Difficulty</div>
                            </div>
                            <div className="text-center p-4 border border-border/50 rounded-lg bg-gradient-to-br from-orange-500/5 to-orange-500/10">
                              <Gamepad2 className="h-5 w-5 mx-auto mb-2 text-orange-500" />
                              <div className="text-xl font-bold capitalize">{gameSettings.category.replace('-', ' ')}</div>
                              <div className="text-xs text-muted-foreground">Category</div>
                            </div>
                          </div>

                          {gameSettings.description && (
                            <div className="p-4 bg-muted/50 rounded-lg border border-border/50">
                              <h4 className="font-medium mb-2 text-sm">Game Description</h4>
                              <p className="text-sm text-muted-foreground leading-relaxed">{gameSettings.description}</p>
                            </div>
                          )}

                          <Button 
                            onClick={handleStartGame}
                            disabled={(session?.players.length || 0) < 2}
                            className="w-full h-12 bg-green-600 hover:bg-green-700"
                            size="lg"
                          >
                            <Play className="h-5 w-5 mr-2" />
                            Start Game
                          </Button>
                          
                          {(session?.players.length || 0) < 2 && (
                            <div className="text-center p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                              <p className="text-sm text-muted-foreground">
                                Waiting for at least 2 players to start the game
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                  {/* Chat - Full Width */}
                  {gameCreated && (
                    <Card className="border-border/50">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <MessageCircle className="h-5 w-5" />
                          Chat
                        </CardTitle>
                        <CardDescription>
                          Communicate with other players
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="h-64 overflow-y-auto space-y-2 p-3 border border-border/50 rounded-lg bg-muted/20">
                          {chatMessages.map((message) => (
                            <div 
                              key={message.id} 
                              className={`text-sm ${message.isSystem ? 'text-center text-muted-foreground italic py-1' : 'py-1'}`}
                            >
                              {!message.isSystem && (
                                <span className="font-medium text-foreground">{message.senderName}: </span>
                              )}
                              <span className={message.isSystem ? '' : 'text-muted-foreground'}>
                                {message.message}
                              </span>
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex gap-2">
                          <Input
                            placeholder="Type a message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            className="flex-1"
                          />
                          <Button onClick={handleSendMessage} size="sm">
                            Send
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

              </div>
            </div>
          </div>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
}