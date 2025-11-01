"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { ExpressifySidebar } from "@/components/ui/expressify-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getGameConfig } from "@/config/textualGames";
import { 
  Trophy, 
  Clock, 
  Target, 
  Zap, 
  Award,
  TrendingUp,
  CheckCircle2,
  Home,
  RotateCcw,
  Share2,
  Bell
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface GameStats {
  score: number;
  timeElapsed: number;
  hintsUsed?: number;
  difficulty: number;
  completedWords?: number;
  totalWords?: number;
  accuracy?: number;
  gameId: string;
  // Debate-specific fields
  topic?: string;
  userStance?: string;
  aiStance?: string;
  messageCount?: number;
  totalMessages?: number;
  summary?: string;
  strengths?: string[];
  weaknesses?: string[];
  feedback?: string;
}

export default function TextualGameResultPage() {
  const router = useRouter();
  const [stats, setStats] = useState<GameStats | null>(null);
  const [gameConfig, setGameConfig] = useState<ReturnType<typeof getGameConfig>>(null);

  useEffect(() => {
    // Get game results from sessionStorage
    const savedResult = sessionStorage.getItem("textual_game_result");
    if (savedResult) {
      const gameStats = JSON.parse(savedResult);
      setStats(gameStats);
      
      const config = getGameConfig(gameStats.gameId);
      setGameConfig(config);
      
      // Data is already saved in the game page, no need to save again
    } else {
      // No stats found, redirect to textual page
      router.push("/learning/textual");
    }
  }, [router]);

  const formatTime = (seconds: number) => {
    const totalSeconds = Math.max(0, Math.floor(seconds));
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}m ${secs}s`;
  };

  const handlePlayAgain = () => {
    if (!stats) return;
    sessionStorage.removeItem("textual_game_result");
    router.push(`/learning/textual/start?game=${stats.gameId}`);
  };

  const handleGoHome = () => {
    sessionStorage.removeItem("textual_game_result");
    router.push("/me/home");
  };

  const handleBackToTextual = () => {
    sessionStorage.removeItem("textual_game_result");
    router.push("/learning/textual");
  };

  if (!stats || !gameConfig) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">Loading results...</p>
        </div>
      </ProtectedRoute>
    );
  }

  const isDebate = stats.gameId === "debate-master";
  
  const performanceLevel = isDebate
    ? stats.score >= 90 ? "Outstanding" : 
      stats.score >= 75 ? "Excellent" :
      stats.score >= 60 ? "Good" : "Needs Improvement"
    : stats.accuracy! >= 90 ? "Excellent" : 
      stats.accuracy! >= 75 ? "Very Good" :
      stats.accuracy! >= 60 ? "Good" : "Keep Practicing";

  const performanceColor = isDebate
    ? stats.score >= 90 ? "text-green-500" : 
      stats.score >= 75 ? "text-blue-500" :
      stats.score >= 60 ? "text-yellow-500" : "text-orange-500"
    : stats.accuracy! >= 90 ? "text-green-500" : 
      stats.accuracy! >= 75 ? "text-blue-500" :
      stats.accuracy! >= 60 ? "text-yellow-500" : "text-orange-500";

  const difficultyLabel = gameConfig.difficultyLevels[stats.difficulty - 1]?.label || "Medium";

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <ExpressifySidebar />
        <SidebarInset>
          {/* Header */}
          <header className="bg-background/95 sticky top-0 z-50 flex h-16 w-full shrink-0 items-center gap-2 border-b backdrop-blur transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="/me/home">Home</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="/learning/textual">Textual Training</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Game Results</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            <div className="ml-auto flex items-center gap-2 px-4">
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
            </div>
          </header>

          {/* Content */}
          <div className="flex flex-1 flex-col gap-2 p-2 pt-0 sm:gap-4 sm:p-4">
            <div className="min-h-[calc(100vh-4rem)] flex-1 rounded-lg p-3 sm:rounded-xl sm:p-4 md:p-6">
              <div className="mx-auto max-w-4xl space-y-4 sm:space-y-6">
                {/* Header Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center space-y-2"
                >
                  <div className="flex justify-center">
                    <div className="rounded-full bg-primary/10 p-6">
                      <Trophy className="h-12 w-12 text-primary" />
                    </div>
                  </div>
                  <h1 className="text-3xl font-bold">Game Complete!</h1>
                  <p className="text-muted-foreground">
                    {gameConfig.name} - {difficultyLabel} Level
                  </p>
                  <Badge variant="outline" className="text-green-500 border-green-500">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Stats Saved
                  </Badge>
                </motion.div>

                {/* Performance Card */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="border-primary/50">
                    <CardContent className="pt-1">
                      <div className="text-center space-y-2">
                        <p className="text-sm text-muted-foreground">Performance</p>
                        <p className={`text-4xl font-bold ${performanceColor}`}>
                          {performanceLevel}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex flex-col sm:flex-row gap-3 justify-center"
                >
                  <Button onClick={handlePlayAgain} size="lg" className="w-full sm:w-auto">
                    <RotateCcw className="mr-2 h-5 w-5" />
                    Play Again
                  </Button>
                  <Button onClick={handleBackToTextual} variant="outline" size="lg" className="w-full sm:w-auto">
                    <Target className="mr-2 h-5 w-5" />
                    More Games
                  </Button>
                  <Button onClick={handleGoHome} variant="outline" size="lg" className="w-full sm:w-auto">
                    <Home className="mr-2 h-5 w-5" />
                    Go Home
                  </Button>
                </motion.div>

                {/* Stats Grid */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4"
                >
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center space-y-2">
                        <div className="rounded-lg bg-blue-500/10 p-3 mx-auto w-fit">
                          <Trophy className="h-6 w-6 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{stats.score}</p>
                          <p className="text-xs text-muted-foreground">Total Score</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center space-y-2">
                        <div className="rounded-lg bg-green-500/10 p-3 mx-auto w-fit">
                          <Clock className="h-6 w-6 text-green-500" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{formatTime(stats.timeElapsed)}</p>
                          <p className="text-xs text-muted-foreground">Time Taken</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center space-y-2">
                        <div className="rounded-lg bg-purple-500/10 p-3 mx-auto w-fit">
                          <Target className="h-6 w-6 text-purple-500" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">
                            {isDebate ? stats.messageCount : stats.accuracy}
                            {!isDebate && "%"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {isDebate ? "Arguments" : "Accuracy"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {stats.gameId !== "chat-simulator" && stats.gameId !== "debate-master" && (
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center space-y-2">
                          <div className="rounded-lg bg-orange-500/10 p-3 mx-auto w-fit">
                            <Zap className="h-6 w-6 text-orange-500" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold">{stats.hintsUsed}</p>
                            <p className="text-xs text-muted-foreground">Hints Used</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </motion.div>

                {/* Detailed Stats */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        Game Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isDebate ? (
                        <div className="space-y-4">
                          {/* Debate Topic */}
                          {stats.topic && (
                            <div className="p-3 rounded-lg bg-primary/10 border-l-4 border-primary">
                              <p className="text-xs text-muted-foreground mb-1">Debate Topic</p>
                              <p className="text-sm font-medium">{stats.topic}</p>
                            </div>
                          )}
                          
                          {/* Stances */}
                          <div className="grid grid-cols-2 gap-3">
                            {stats.userStance && (
                              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                <p className="text-xs text-muted-foreground mb-1">Your Position</p>
                                <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{stats.userStance.toUpperCase()}</p>
                              </div>
                            )}
                            {stats.aiStance && (
                              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                                <p className="text-xs text-muted-foreground mb-1">AI Position</p>
                                <p className="text-sm font-bold text-red-600 dark:text-red-400">{stats.aiStance.toUpperCase()}</p>
                              </div>
                            )}
                          </div>

                          {/* AI Summary */}
                          {stats.summary && (
                            <div className="p-3 rounded-lg bg-muted">
                              <p className="text-xs font-semibold text-muted-foreground mb-2">AI Analysis</p>
                              <p className="text-sm leading-relaxed">{stats.summary}</p>
                            </div>
                          )}

                          {/* Strengths */}
                          {stats.strengths && stats.strengths.length > 0 && (
                            <div className="p-3 rounded-lg bg-green-500/10">
                              <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-2">Strengths</p>
                              <ul className="space-y-1">
                                {stats.strengths.map((strength, idx) => (
                                  <li key={idx} className="text-sm flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                    <span>{strength}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Weaknesses */}
                          {stats.weaknesses && stats.weaknesses.length > 0 && (
                            <div className="p-3 rounded-lg bg-orange-500/10">
                              <p className="text-xs font-semibold text-orange-700 dark:text-orange-400 mb-2">Areas for Improvement</p>
                              <ul className="space-y-1">
                                {stats.weaknesses.map((weakness, idx) => (
                                  <li key={idx} className="text-sm flex items-start gap-2">
                                    <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                                    <span>{weakness}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Feedback */}
                          {stats.feedback && (
                            <div className="p-3 rounded-lg bg-blue-500/10">
                              <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-2">Personalized Feedback</p>
                              <p className="text-sm leading-relaxed">{stats.feedback}</p>
                            </div>
                          )}

                          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <span className="text-sm text-muted-foreground">Difficulty Level</span>
                            <Badge variant="outline">{difficultyLabel}</Badge>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {stats.gameId !== "chat-simulator" && stats.completedWords !== undefined && stats.totalWords !== undefined && (
                            <>
                              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                <span className="text-sm text-muted-foreground">Completed</span>
                                <span className="font-semibold">{stats.completedWords} / {stats.totalWords}</span>
                              </div>
                              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                <span className="text-sm text-muted-foreground">Completion Rate</span>
                                <span className="font-semibold">
                                  {Math.round((stats.completedWords / stats.totalWords) * 100)}%
                                </span>
                              </div>
                            </>
                          )}
                          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <span className="text-sm text-muted-foreground">Difficulty Level</span>
                            <Badge variant="outline">{difficultyLabel}</Badge>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
