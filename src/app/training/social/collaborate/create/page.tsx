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
    name: '',
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
    if (!gameSettings.name || !gameSettings.category) {
      toast.error('Please fill in the game name and category');
      return;
    }

    setCreating(true);
    try {
      const newGameCode = await createGameSession({
        name: gameSettings.name,
        category: gameSettings.category,
        difficulty: gameSettings.difficulty,
        timeLimit: parseInt(gameSettings.timeLimit),
        maxPlayers: parseInt(gameSettings.maxPlayers),
        creator: user?.displayName || 'Anonymous',
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
    if (navigator.share) {
      navigator.share({
        title: `Join my ${gameSettings.name} game!`,
        text: `Game Code: ${gameCode}`,
        url: shareUrl,
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
    }
  };

  const handleSettingChange = (key: string, value: string) => {
    setGameSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <div className="flex h-screen">
          <ExpressifySidebar />
          <div className="flex-1 overflow-auto">
            <div className="min-h-screen bg-background">
              <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => router.back()}
                className="p-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  {gameCreated ? 'Game Lobby' : 'Create Game'}
                </h1>
                <p className="text-muted-foreground">
                  {gameCreated ? `Game Code: ${gameCode}` : 'Set up your collaborative training session'}
                </p>
              </div>
            </div>
            {gameCreated && gameCode && (
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={copyGameCode}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Code
                </Button>
                <Button variant="outline" onClick={shareGame}>
                  <Share className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Game Settings */}
            <div className="lg:col-span-2">
              {!gameCreated ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Game Settings
                    </CardTitle>
                    <CardDescription>
                      Configure your collaborative training session
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">Game Name *</Label>
                        <Input
                          id="name"
                          placeholder="Enter game name"
                          value={gameSettings.name}
                          onChange={(e) => handleSettingChange('name', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="category">Category *</Label>
                        <Select onValueChange={(value) => handleSettingChange('category', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sentence-builder">Sentence Builder</SelectItem>
                            <SelectItem value="vocabulary">Vocabulary Building</SelectItem>
                            <SelectItem value="storytelling">Collaborative Storytelling</SelectItem>
                            <SelectItem value="debate">Debate & Discussion</SelectItem>
                            <SelectItem value="wordplay">Word Games</SelectItem>
                            <SelectItem value="grammar">Grammar Challenges</SelectItem>
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
                      disabled={!gameSettings.name || !gameSettings.category}
                      className="w-full bg-violet-600 hover:bg-violet-700"
                    >
                      <Gamepad2 className="h-4 w-4 mr-2" />
                      Create Game
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5" />
                      {gameSettings.name}
                    </CardTitle>
                    <CardDescription>
                      Game Code: <span className="font-mono font-bold">{gameCode}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 border rounded-lg">
                        <Users className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                        <div className="text-lg font-semibold">{session?.players.length || 0}/{gameSettings.maxPlayers}</div>
                        <div className="text-xs text-muted-foreground">Players</div>
                      </div>
                      <div className="text-center p-3 border rounded-lg">
                        <Clock className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                        <div className="text-lg font-semibold">{gameSettings.timeLimit}m</div>
                        <div className="text-xs text-muted-foreground">Duration</div>
                      </div>
                      <div className="text-center p-3 border rounded-lg">
                        <Trophy className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                        <div className="text-lg font-semibold capitalize">{gameSettings.difficulty}</div>
                        <div className="text-xs text-muted-foreground">Difficulty</div>
                      </div>
                      <div className="text-center p-3 border rounded-lg">
                        <Gamepad2 className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                        <div className="text-lg font-semibold capitalize">{gameSettings.category}</div>
                        <div className="text-xs text-muted-foreground">Category</div>
                      </div>
                    </div>

                    {gameSettings.description && (
                      <div className="p-4 bg-muted rounded-lg">
                        <h4 className="font-medium mb-2">Game Description</h4>
                        <p className="text-sm text-muted-foreground">{gameSettings.description}</p>
                      </div>
                    )}

                    <Button 
                      onClick={handleStartGame}
                      disabled={(session?.players.length || 0) < 2}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start Game
                    </Button>
                    
                    {(session?.players.length || 0) < 2 && (
                      <p className="text-center text-sm text-muted-foreground">
                        Waiting for at least 2 players to start the game
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Players and Chat */}
            <div className="space-y-6">
              {/* Players List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Players ({session?.players.length || 0}/{gameCreated ? gameSettings.maxPlayers : '?'})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {session?.players.map((player) => (
                      <div key={player.id} className="flex items-center gap-3 p-2 rounded-lg border">
                        <UserAvatar user={player} size="sm" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">{player.name}</span>
                            {player.isHost && (
                              <Crown className="h-3 w-3 text-yellow-500" />
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(player.joinedAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <Badge 
                          variant={player.isReady ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {player.isReady ? 'Ready' : 'Not Ready'}
                        </Badge>
                      </div>
                    )) || []}
                    
                    {gameCreated && (session?.players.length || 0) < parseInt(gameSettings.maxPlayers) && (
                      <div className="text-center p-4 border-2 border-dashed border-muted rounded-lg">
                        <Users className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Waiting for more players...
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Chat */}
              {gameCreated && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageCircle className="h-5 w-5" />
                      Chat
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="h-64 overflow-y-auto space-y-2 p-2 border rounded-lg bg-muted/20">
                        {chatMessages.map((message) => (
                          <div key={message.id} className={`text-sm ${message.isSystem ? 'text-center text-muted-foreground italic' : ''}`}>
                            {!message.isSystem && (
                              <span className="font-medium">{message.senderName}: </span>
                            )}
                            <span>{message.message}</span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex gap-2">
                        <Input
                          placeholder="Type a message..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        />
                        <Button onClick={handleSendMessage} size="sm">
                          Send
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
}