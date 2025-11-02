"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { ExpressifySidebar } from "@/components/ui/expressify-sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useEffect, useState, Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { database } from "@/lib/firebase";
import { ref, get } from "firebase/database";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ArrowLeft, 
  Users, 
  Clock, 
  Trophy, 
  MessageCircle, 
  Target,
  Calendar,
  Timer,
  Crown,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CollaborativeGameData {
  id: string;
  name: string;
  module: string;
  date: string;
  duration: string;
  type: "Collaborative";
  status: "Excellent" | "Very Good" | "Good" | "Needs Work";
  score: number;
  gameId: string;
  gameData: {
    gameId: string;
    gameCode: string;
    score: number;
    timeElapsed: number;
    difficulty: string;
    gameType: string;
    sentencesCompleted: number;
    totalPlayers: number;
    playerPosition: number;
    chatMessagesCount: number;
    emojisUsed: number;
    totalChatMessages: number;
    totalEmojisUsed: number;
    gameStartTime: number;
    gameEndTime: number;
    timeLimit: number;
    status: string;
    timestamp: number;
    isHost: boolean;
    finalProgress: number;
    currentSentenceTheme: string;
    currentSentenceDifficulty: string;
    allPlayers: Array<{
      id: string;
      name: string;
      isHost: boolean;
      finalScore: number;
    }>;
    events: Array<{
      type: string;
      timestamp: number;
      description: string;
    }>;
  };
}

function CollaborativeDetailsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [gameData, setGameData] = useState<CollaborativeGameData | null>(null);
  const [loading, setLoading] = useState(true);

  const gameId = searchParams.get('gameId');
  const sessionId = searchParams.get('sessionId');

  useEffect(() => {
    if (!user || !gameId) {
      setLoading(false);
      return;
    }

    const loadGameData = async () => {
      try {
        // Load from user's history
        const userHistoryRef = ref(database, `users/${user.uid}/history/collaborative/${gameId}`);
        const snapshot = await get(userHistoryRef);
        
        if (snapshot.exists()) {
          setGameData(snapshot.val());
        } else {
          console.error('Game data not found');
        }
      } catch (error) {
        console.error('Error loading game data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadGameData();
  }, [user, gameId]);

  if (loading) {
    return (
      <ProtectedRoute>
        <SidebarProvider>
          <ExpressifySidebar />
          <SidebarInset>
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading game details...</p>
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </ProtectedRoute>
    );
  }

  if (!gameData) {
    return (
      <ProtectedRoute>
        <SidebarProvider>
          <ExpressifySidebar />
          <SidebarInset>
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <p className="text-lg font-semibold mb-2">Game Not Found</p>
                <p className="text-muted-foreground mb-4">The requested game data could not be found.</p>
                <Button onClick={() => router.push('/me/history')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to History
                </Button>
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </ProtectedRoute>
    );
  }

  const { gameData: details } = gameData;

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <ExpressifySidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="/me/home">Dashboard</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="/me/history">History</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbPage>Collaborative Game Details</BreadcrumbPage>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>

          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="min-h-[calc(100vh-8rem)] flex-1 rounded-lg p-4 md:p-6">
              <div className="mx-auto max-w-4xl space-y-6">
                
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold">{gameData.name}</h1>
                    <p className="text-muted-foreground">Game Code: {details.gameCode}</p>
                  </div>
                  <Button variant="outline" onClick={() => router.push('/me/history')}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to History
                  </Button>
                </div>

                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Final Score</CardTitle>
                      <Trophy className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{details.score}</div>
                      <Badge className={cn(
                        gameData.status === "Excellent" && "bg-green-500 text-white",
                        gameData.status === "Very Good" && "bg-blue-500 text-white",
                        gameData.status === "Good" && "bg-yellow-500 text-white",
                        gameData.status === "Needs Work" && "bg-red-500 text-white"
                      )}>
                        {gameData.status}
                      </Badge>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Duration</CardTitle>
                      <Timer className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{gameData.duration}</div>
                      <p className="text-xs text-muted-foreground">
                        of {Math.floor(details.timeLimit / 60)}m limit
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Position</CardTitle>
                      <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">#{details.playerPosition}</div>
                      <p className="text-xs text-muted-foreground">
                        of {details.totalPlayers} players
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Game Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Game Performance
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Sentences Completed:</span>
                        <span className="font-medium">{details.sentencesCompleted}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Final Progress:</span>
                        <span className="font-medium">{Math.round(details.finalProgress)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Difficulty:</span>
                        <Badge variant="outline">{details.difficulty}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Theme:</span>
                        <span className="font-medium">{details.currentSentenceTheme}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageCircle className="h-5 w-5" />
                        Communication Stats
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Messages Sent:</span>
                        <span className="font-medium">{details.chatMessagesCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Emojis Used:</span>
                        <span className="font-medium">{details.emojisUsed}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Team Messages:</span>
                        <span className="font-medium">{details.totalChatMessages}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Team Emojis:</span>
                        <span className="font-medium">{details.totalEmojisUsed}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Players */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Team Members ({details.allPlayers.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {details.allPlayers.map((player, index) => (
                        <div 
                          key={player.id} 
                          className="flex items-center justify-between p-3 border border-border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{player.name}</span>
                                {player.isHost && (
                                  <Crown className="h-4 w-4 text-yellow-500" />
                                )}
                                {player.id === user?.uid && (
                                  <Badge variant="secondary" className="text-xs">You</Badge>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">Position #{index + 1}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{player.finalScore}</div>
                            <div className="text-xs text-muted-foreground">score</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Game Timeline */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Game Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {details.events.map((event, index) => (
                        <div key={index} className="flex items-center gap-3 p-2">
                          <div className="flex-shrink-0">
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium">{event.description}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(event.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex justify-center gap-4">
                  <Button onClick={() => router.push('/training/social/collaborate')}>
                    Play Another Collaborative Game
                  </Button>
                  <Button variant="outline" onClick={() => router.push('/me/history')}>
                    Back to History
                  </Button>
                </div>

              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}

export default function CollaborativeDetailsPage() {
  return (
    <Suspense fallback={
      <ProtectedRoute>
        <SidebarProvider>
          <ExpressifySidebar />
          <SidebarInset>
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading game details...</p>
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </ProtectedRoute>
    }>
      <CollaborativeDetailsContent />
    </Suspense>
  );
}