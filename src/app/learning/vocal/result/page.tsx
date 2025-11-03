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
import { getVocalGameConfig } from "@/config/vocalGames";
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
  Bell,
  Mic
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface VocalGameStats {
  score: number;
  timeElapsed: number;
  difficulty: number;
  gameId: string;
  gameType?: string;
  duration?: number; // For continuous reading sessions
  // General vocal metrics
  pronunciationAccuracy?: number;
  fluencyScore?: number;
  clarityScore?: number;
  // Continuous reading specific fields
  wordsRead?: number;
  totalWords?: number;
  readingSpeed?: number;
  sessionId?: string;
  // Debate-specific fields
  topic?: string;
  messageCount?: number;
  totalMessages?: number;
  summary?: string;
  strengths?: string[];
  weaknesses?: string[];
  feedback?: string;
  // Story/creativity fields
  creativityScore?: number;
  coherenceScore?: number;
  emotionScore?: number;
  // Accent trainer fields
  accentAccuracy?: number;
  phrasesCompleted?: number;
  totalPhrases?: number;
}

export default function VocalGameResultPage() {
  const router = useRouter();
  const [stats, setStats] = useState<VocalGameStats | null>(null);
  const [gameConfig, setGameConfig] = useState<ReturnType<typeof getVocalGameConfig>>(null);

  useEffect(() => {
    // Get game results from sessionStorage
    const savedResult = sessionStorage.getItem("vocal_game_result");
    console.log("📊 Raw sessionStorage data:", savedResult);
    
    if (savedResult) {
      const gameStats = JSON.parse(savedResult);
      console.log("📊 Parsed game stats:", gameStats);
      setStats(gameStats);
      
      const config = getVocalGameConfig(gameStats.gameId);
      setGameConfig(config);
      
      // Data is already saved in the game page, no need to save again
    } else {
      // No stats found, redirect to vocal page
      console.log("❌ No game stats found in sessionStorage");
      router.push("/learning/vocal");
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
    sessionStorage.removeItem("vocal_game_result");
    router.push(`/learning/vocal/start?game=${stats.gameId}`);
  };

  const handleGoHome = () => {
    sessionStorage.removeItem("vocal_game_result");
    router.push("/me/home");
  };

  const handleBackToVocal = () => {
    sessionStorage.removeItem("vocal_game_result");
    router.push("/learning/vocal");
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

  const isDebate = stats.gameId === "voice-debate-duel";
  
  const performanceLevel = stats.score >= 90 ? "Outstanding" : 
    stats.score >= 75 ? "Excellent" :
    stats.score >= 60 ? "Good" : "Keep Practicing";

  const performanceColor = stats.score >= 90 ? "text-green-500" : 
    stats.score >= 75 ? "text-blue-500" :
    stats.score >= 60 ? "text-yellow-500" : "text-orange-500";

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
                    <BreadcrumbLink href="/learning/vocal">Vocal Training</BreadcrumbLink>
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
                    <CardContent className="pt-6">
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
                  <Button onClick={handleBackToVocal} variant="outline" size="lg" className="w-full sm:w-auto">
                    <Mic className="mr-2 h-5 w-5" />
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
                  {stats.gameType === 'continuous-reading' ? (
                    <>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center space-y-2">
                            <div className="rounded-lg bg-green-500/10 p-3 mx-auto w-fit">
                              <Trophy className="h-6 w-6 text-green-500" />
                            </div>
                            <div>
                              <p className="text-2xl font-bold">{stats.wordsRead || 0}</p>
                              <p className="text-xs text-muted-foreground">Words Read</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center space-y-2">
                            <div className="rounded-lg bg-blue-500/10 p-3 mx-auto w-fit">
                              <Clock className="h-6 w-6 text-blue-500" />
                            </div>
                            <div>
                              <p className="text-2xl font-bold">{formatTime(stats.timeElapsed)}</p>
                              <p className="text-xs text-muted-foreground">Reading Time</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center space-y-2">
                            <div className="rounded-lg bg-orange-500/10 p-3 mx-auto w-fit">
                              <Zap className="h-6 w-6 text-orange-500" />
                            </div>
                            <div>
                              <p className="text-2xl font-bold">{stats.readingSpeed || 0}</p>
                              <p className="text-xs text-muted-foreground">Words/Min</p>
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
                                {stats.wordsRead && stats.totalWords 
                                  ? Math.round((stats.wordsRead / stats.totalWords) * 100)
                                  : 0}%
                              </p>
                              <p className="text-xs text-muted-foreground">Progress</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  ) : (
                    <>
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
                                {stats.pronunciationAccuracy || stats.accentAccuracy || stats.clarityScore || 0}%
                              </p>
                              <p className="text-xs text-muted-foreground">Accuracy</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center space-y-2">
                            <div className="rounded-lg bg-orange-500/10 p-3 mx-auto w-fit">
                              <Zap className="h-6 w-6 text-orange-500" />
                            </div>
                            <div>
                              <p className="text-2xl font-bold">
                                {stats.fluencyScore || stats.coherenceScore || stats.creativityScore || 0}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {stats.fluencyScore ? "Fluency" : stats.coherenceScore ? "Coherence" : "Creativity"}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </>
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
                      ) : stats.gameType === 'continuous-reading' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Words Read */}
                          {stats.wordsRead !== undefined && (
                            <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10">
                              <span className="text-sm text-muted-foreground">Words Read</span>
                              <span className="font-semibold text-green-700 dark:text-green-400">{stats.wordsRead}</span>
                            </div>
                          )}

                          {/* Total Words Generated */}
                          {stats.totalWords !== undefined && (
                            <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10">
                              <span className="text-sm text-muted-foreground">Total Words</span>
                              <span className="font-semibold text-blue-700 dark:text-blue-400">{stats.totalWords}</span>
                            </div>
                          )}

                          {/* Reading Progress */}
                          {stats.wordsRead !== undefined && stats.totalWords !== undefined && (
                            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10">
                              <span className="text-sm text-muted-foreground">Progress</span>
                              <span className="font-semibold">{Math.round((stats.wordsRead / stats.totalWords) * 100)}%</span>
                            </div>
                          )}

                          {/* Reading Speed (WPM) */}
                          {stats.readingSpeed !== undefined && (
                            <div className="flex items-center justify-between p-3 rounded-lg bg-orange-500/10">
                              <span className="text-sm text-muted-foreground">Reading Speed</span>
                              <span className="font-semibold text-orange-700 dark:text-orange-400">{stats.readingSpeed} WPM</span>
                            </div>
                          )}

                          {/* Session Duration */}
                          {stats.duration !== undefined && (
                            <div className="flex items-center justify-between p-3 rounded-lg bg-purple-500/10">
                              <span className="text-sm text-muted-foreground">Duration</span>
                              <span className="font-semibold text-purple-700 dark:text-purple-400">{Math.round(stats.duration / 1000)}s</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <span className="text-sm text-muted-foreground">Difficulty Level</span>
                            <Badge variant="outline">{difficultyLabel}</Badge>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {stats.pronunciationAccuracy !== undefined && (
                            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                              <span className="text-sm text-muted-foreground">Pronunciation</span>
                              <span className="font-semibold">{stats.pronunciationAccuracy}%</span>
                            </div>
                          )}
                          {stats.fluencyScore !== undefined && (
                            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                              <span className="text-sm text-muted-foreground">Fluency</span>
                              <span className="font-semibold">{stats.fluencyScore}%</span>
                            </div>
                          )}
                          {stats.clarityScore !== undefined && (
                            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                              <span className="text-sm text-muted-foreground">Clarity</span>
                              <span className="font-semibold">{stats.clarityScore}%</span>
                            </div>
                          )}
                          {stats.creativityScore !== undefined && (
                            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                              <span className="text-sm text-muted-foreground">Creativity</span>
                              <span className="font-semibold">{stats.creativityScore}%</span>
                            </div>
                          )}
                          {stats.coherenceScore !== undefined && (
                            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                              <span className="text-sm text-muted-foreground">Coherence</span>
                              <span className="font-semibold">{stats.coherenceScore}%</span>
                            </div>
                          )}
                          {stats.emotionScore !== undefined && (
                            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                              <span className="text-sm text-muted-foreground">Emotion</span>
                              <span className="font-semibold">{stats.emotionScore}%</span>
                            </div>
                          )}
                          {stats.accentAccuracy !== undefined && (
                            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                              <span className="text-sm text-muted-foreground">Accent Accuracy</span>
                              <span className="font-semibold">{stats.accentAccuracy}%</span>
                            </div>
                          )}
                          {stats.phrasesCompleted !== undefined && stats.totalPhrases !== undefined && (
                            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                              <span className="text-sm text-muted-foreground">Phrases Completed</span>
                              <span className="font-semibold">{stats.phrasesCompleted} / {stats.totalPhrases}</span>
                            </div>
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
