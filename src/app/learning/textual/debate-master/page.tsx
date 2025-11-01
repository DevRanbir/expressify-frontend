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
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Clock, Trophy, Send, Loader2, User, Bot, Sparkles, Info, Target, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ref, push, get } from "firebase/database";
import { database } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { 
  generateDebateTopic,
  generateDebateResponse,
  summarizeDebate,
  type DebateTopic,
  type ChatMessage 
} from "@/lib/groqService";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export default function DebateMasterPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [difficulty, setDifficulty] = useState(1); // 1=Beginner, 2=Intermediate, 3=Advanced
  const [duration, setDuration] = useState(10);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [score, setScore] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [debateTopic, setDebateTopic] = useState<DebateTopic | null>(null);
  const [showStartDialog, setShowStartDialog] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [isLoadingTopic, setIsLoadingTopic] = useState(true);
  const [isDebateEnding, setIsDebateEnding] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isSavingRef = useRef(false);
  const hasCalledTimeUpRef = useRef(false);

  useEffect(() => {
    // Get settings from sessionStorage
    const savedDifficulty = sessionStorage.getItem("textual_game_difficulty");
    const savedDuration = sessionStorage.getItem("textual_game_duration");
    
    if (savedDifficulty) setDifficulty(parseInt(savedDifficulty));
    if (savedDuration) setDuration(parseInt(savedDuration));

    // Load debate topic dynamically from Groq AI
    const loadDebateTopic = async () => {
      const diff = parseInt(savedDifficulty || "1");
      setIsLoadingTopic(true);
      try {
        const generatedTopic = await generateDebateTopic(diff);
        setDebateTopic(generatedTopic);
      } catch (error) {
        console.error("Error loading debate topic:", error);
      } finally {
        setIsLoadingTopic(false);
      }
    };

    loadDebateTopic();
  }, []);

  const handleStartGame = () => {
    setShowStartDialog(false);
    setGameStarted(true);
    
    // Set start time
    sessionStorage.setItem("debate_master_start_time", Date.now().toString());
    
    // Add AI's opening statement
    if (debateTopic) {
      setMessages([{
        id: "initial",
        role: "assistant",
        content: debateTopic.openingStatement,
        timestamp: Date.now()
      }]);
    }
  };

  // Timer effect - just increment
  useEffect(() => {
    if (!gameStarted) return;

    timerRef.current = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameStarted]);

  // Watcher effect - check time and call handleTimeUp once
  useEffect(() => {
    if (!gameStarted || hasCalledTimeUpRef.current) return;

    const timeLimit = duration * 60;
    if (timeElapsed >= timeLimit) {
      hasCalledTimeUpRef.current = true;
      if (timerRef.current) clearInterval(timerRef.current);
      
      // Small delay to ensure state is synced
      setTimeout(() => {
        handleTimeUp();
      }, 100);
    }
  }, [timeElapsed, duration, gameStarted]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Save game state on unmount
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (messages.length > 1 && timeElapsed > 0 && !isDebateEnding) {
        await saveGameData();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [messages, timeElapsed, score, user, isDebateEnding]);

  const checkForDuplicate = async (gameStats: any) => {
    if (!user) return false;

    try {
      const gameRef = ref(database, `games/debate-master/${user.uid}`);
      const snapshot = await get(gameRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        const entries = Object.values(data) as any[];
        
        // Sort by timestamp and get last 3
        const recentEntries = entries
          .sort((a: any, b: any) => b.timestamp - a.timestamp)
          .slice(0, 3);
        
        const isDuplicate = recentEntries.some((entry: any) => {
          const timeDiff = Math.abs(gameStats.timestamp - entry.timestamp);
          return (
            timeDiff < 5000 &&
            entry.score === gameStats.score &&
            entry.messageCount === gameStats.messageCount
          );
        });

        return isDuplicate;
      }
      return false;
    } catch (error) {
      console.error("Error checking for duplicate:", error);
      return false;
    }
  };

  const saveGameData = async (clearSession: boolean = true) => {
    if (!user || isSavingRef.current || messages.length <= 1) return;

    isSavingRef.current = true;

    const userMessages = messages.filter(m => m.role === "user").length;

    const gameStats = {
      score,
      timeElapsed,
      difficulty,
      messageCount: userMessages,
      totalMessages: messages.length,
      gameId: "debate-master",
      mode: difficulty === 1 ? "Beginner" : difficulty === 2 ? "Intermediate" : "Advanced",
      topic: debateTopic?.topic || "Unknown",
      status: "incomplete",
      timestamp: Date.now(),
    };

    try {
      const isDuplicate = await checkForDuplicate(gameStats);
      
      if (isDuplicate) {
        console.log("Duplicate entry detected, skipping save");
        isSavingRef.current = false;
        return;
      }

      const gameRef = ref(database, `games/debate-master/${user.uid}`);
      await push(gameRef, gameStats);
      console.log("Debate data saved successfully");

      if (clearSession) {
        sessionStorage.removeItem("debate_master_start_time");
      }
    } catch (error) {
      console.error("Error saving game data:", error);
    } finally {
      isSavingRef.current = false;
    }
  };

  const handleTimeUp = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (isDebateEnding) return;
    
    setIsDebateEnding(true);
    
    // Summarize debate with AI
    await endDebateWithSummary("time_up");
  };

  const endDebateWithSummary = async (endReason: "time_up" | "manual") => {
    if (!user || isSavingRef.current || !debateTopic) return;

    isSavingRef.current = true;
    setIsGenerating(true);

    try {
      // Get AI summary and scoring
      const conversationHistory: ChatMessage[] = messages.map(msg => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content
      }));

      const summary = await summarizeDebate(
        conversationHistory,
        difficulty,
        debateTopic.topic
      );

      const userMessages = messages.filter(m => m.role === "user").length;
      
      const gameStats = {
        score: summary.score,
        timeElapsed: endReason === "time_up" ? duration * 60 : timeElapsed,
        difficulty,
        messageCount: userMessages,
        totalMessages: messages.length,
        gameId: "debate-master",
        mode: difficulty === 1 ? "Beginner" : difficulty === 2 ? "Intermediate" : "Advanced",
        topic: debateTopic.topic,
        userStance: debateTopic.stance === "for" ? "against" : "for",
        aiStance: debateTopic.stance,
        status: "completed",
        endReason,
        summary: summary.summary,
        strengths: summary.userStrengths,
        weaknesses: summary.userWeaknesses,
        feedback: summary.feedback,
        timestamp: Date.now(),
      };

      const isDuplicate = await checkForDuplicate(gameStats);
      
      if (!isDuplicate) {
        const gameRef = ref(database, `games/debate-master/${user.uid}`);
        await push(gameRef, gameStats);
        console.log("Debate ended - Data with AI summary saved successfully");
      }

      sessionStorage.removeItem("debate_master_start_time");
      sessionStorage.setItem("textual_game_result", JSON.stringify(gameStats));
      router.push("/learning/textual/result");
    } catch (error) {
      console.error("Error ending debate:", error);
      // Fallback without AI summary
      const userMessages = messages.filter(m => m.role === "user").length;
      const fallbackStats = {
        score,
        timeElapsed: endReason === "time_up" ? duration * 60 : timeElapsed,
        difficulty,
        messageCount: userMessages,
        totalMessages: messages.length,
        gameId: "debate-master",
        mode: difficulty === 1 ? "Beginner" : difficulty === 2 ? "Intermediate" : "Advanced",
        topic: debateTopic?.topic || "Unknown",
        status: "completed",
        endReason,
        timestamp: Date.now(),
      };
      
      sessionStorage.setItem("textual_game_result", JSON.stringify(fallbackStats));
      router.push("/learning/textual/result");
    } finally {
      isSavingRef.current = false;
    }
  };

  const finishDebate = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (isDebateEnding) return;
    
    setIsDebateEnding(true);
    await endDebateWithSummary("manual");
  };

  const generateAIResponse = async (userMessage: string): Promise<string> => {
    if (!debateTopic) return "I maintain my position on this topic.";

    try {
      // Build conversation history for context
      const conversationHistory: ChatMessage[] = messages.map(msg => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content
      }));

      // Add the new user message
      conversationHistory.push({
        role: "user",
        content: userMessage
      });

      // Generate AI debate response using Groq
      const response = await generateDebateResponse(
        conversationHistory,
        difficulty,
        {
          topic: debateTopic.topic,
          stance: debateTopic.stance,
          description: debateTopic.description,
          context: debateTopic.context
        }
      );

      return response;
    } catch (error) {
      console.error("Error generating AI response:", error);
      // Fallback response
      return "That's an interesting point, but I still maintain my position. What's your counter-argument?";
    }
  };

  const handleSendMessage = async () => {
    if (!userInput.trim() || isGenerating || isDebateEnding) return;

    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userInput.trim(),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, newUserMessage]);
    setUserInput("");
    setIsGenerating(true);
    setMessageCount(prev => prev + 1);

    // Score based on argument length and quality
    const messageLength = userInput.trim().length;
    if (messageLength > 100) {
      setScore(prev => Math.min(100, prev + 12)); // Detailed argument
    } else if (messageLength > 50) {
      setScore(prev => Math.min(100, prev + 8)); // Good argument
    } else if (messageLength > 20) {
      setScore(prev => Math.min(100, prev + 4)); // Basic argument
    }

    // Generate AI counter-argument
    const aiResponse = await generateAIResponse(userInput);
    
    const newAIMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: aiResponse,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, newAIMessage]);
    setIsGenerating(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getTimeRemaining = () => {
    const remaining = duration * 60 - timeElapsed;
    return Math.max(0, remaining);
  };

  const getDifficultyColor = () => {
    if (difficulty === 1) return "text-green-500";
    if (difficulty === 2) return "text-yellow-500";
    return "text-red-500";
  };

  const getDifficultyLabel = () => {
    if (difficulty === 1) return "Beginner";
    if (difficulty === 2) return "Intermediate";
    return "Advanced";
  };

  const getUserStance = () => {
    if (!debateTopic) return "Your Position";
    return debateTopic.stance === "for" ? "AGAINST" : "FOR";
  };

  const getAIStance = () => {
    if (!debateTopic) return "AI Position";
    return debateTopic.stance === "for" ? "FOR" : "AGAINST";
  };

  if (isLoadingTopic || !debateTopic) {
    return (
      <ProtectedRoute>
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Generating your debate topic with AI...</p>
        </div>
      </ProtectedRoute>
    );
  }

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
                    <BreadcrumbPage>Debate Master</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            <div className="ml-auto flex items-center gap-2 px-4">
              <Badge variant="outline" className="hidden sm:flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTime(timeElapsed)}
              </Badge>
              <Badge variant="outline" className="hidden sm:flex items-center gap-1">
                <Trophy className="h-3 w-3" />
                {score} pts
              </Badge>
              <Badge variant="outline" className={`hidden sm:flex items-center gap-1 ${getDifficultyColor()}`}>
                <Target className="h-3 w-3" />
                {getDifficultyLabel()}
              </Badge>
            </div>
          </header>

          {/* Start Dialog */}
          {debateTopic && (
            <Dialog open={showStartDialog} onOpenChange={setShowStartDialog}>
              <DialogContent className="max-w-6xl w-[106vw] max-h-[95vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Target className={`h-5 w-5 ${getDifficultyColor()}`} />
                    Debate Master - {getDifficultyLabel()}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-foreground text-sm">Debate Topic:</h4>
                    <div className="p-4 bg-primary/10 rounded-lg border-l-4 border-primary">
                      <p className="font-medium text-base leading-relaxed">{debateTopic.topic}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold text-foreground text-sm">Context:</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{debateTopic.context}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                      <p className="text-xs text-muted-foreground mb-1">Your Position</p>
                      <p className="font-bold text-xl text-blue-600 dark:text-blue-400">{getUserStance()}</p>
                    </div>
                    <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                      <p className="text-xs text-muted-foreground mb-1">AI Position</p>
                      <p className="font-bold text-xl text-red-600 dark:text-red-400">{getAIStance()}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-foreground text-sm">Debate Rules:</h4>
                    <ul className="text-xs space-y-1.5 list-disc list-inside text-muted-foreground leading-relaxed">
                      <li>You have {duration} minutes to present your arguments</li>
                      <li>Longer, detailed arguments earn more points (100+ chars = 12 pts, 50+ = 8 pts, 20+ = 4 pts)</li>
                      <li>Stay focused on the topic and support your position with reasoning</li>
                      <li>AI will provide counter-arguments - address them directly</li>
                      <li className="text-primary font-medium">At the end, AI will summarize the debate and provide a detailed score</li>
                      <li>The timer starts when you click "Start Debate"</li>
                    </ul>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button onClick={handleStartGame} className="w-full sm:w-auto" size="lg">
                    Start Debate
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {/* Content */}
          <div className="flex flex-1 flex-col gap-2 p-2 pt-0 sm:gap-4 sm:p-4">
            <div className="min-h-[calc(100vh-4rem)] flex-1 rounded-lg p-3 sm:rounded-xl sm:p-4 md:p-6">
              <div className="mx-auto max-w-7xl h-full flex flex-col space-y-4">
                {/* Game Status - Top Bar */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-card border">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Clock className={`h-5 w-5 ${getTimeRemaining() < 60 ? "text-red-500 animate-pulse" : "text-primary"}`} />
                      <div>
                        <p className="text-xs text-muted-foreground">Time Remaining</p>
                        <p className={`text-sm font-bold ${getTimeRemaining() < 60 ? "text-red-500" : ""}`}>
                          {formatTime(getTimeRemaining())}
                        </p>
                      </div>
                    </div>
                    
                    <Separator orientation="vertical" className="h-10" />
                    
                    <div className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-yellow-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Messages</p>
                        <p className="text-sm font-bold">{messageCount}</p>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={finishDebate} 
                    variant="default" 
                    size="sm"
                    disabled={messages.length <= 1 || isDebateEnding}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {isDebateEnding ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Summarizing...
                      </>
                    ) : (
                      "End Debate & Get Score"
                    )}
                  </Button>
                </div>

                {/* Main Content - Topic Info Left, Chat Right */}
                <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0 h-[calc(100vh-16rem)]">
                  {/* Left Side - Debate Topic Info */}
                  <div className="lg:w-80 lg:flex-shrink-0 h-full">
                    <Card className="h-full flex flex-col">
                      <CardHeader className="pb-3 flex-shrink-0">
                        <div className="flex items-center gap-3 mb-2">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-red-500 text-white text-lg">
                              <Target className="h-6 w-6" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <CardTitle className="text-base leading-tight">Debate Topic</CardTitle>
                            <Badge className={`${getDifficultyColor()} mt-1 text-xs`} variant="outline">
                              {getDifficultyLabel()}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4 flex-1 overflow-y-auto">
                        <div>
                          <p className="text-sm font-medium mb-2">{debateTopic.topic}</p>
                          <p className="text-xs text-muted-foreground">{debateTopic.description}</p>
                        </div>
                        <Separator />
                        <div className="space-y-3">
                          <div className="p-2 bg-blue-500/10 rounded border-l-2 border-blue-500">
                            <p className="text-xs text-muted-foreground">Your Stance</p>
                            <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{getUserStance()}</p>
                          </div>
                          <div className="p-2 bg-red-500/10 rounded border-l-2 border-red-500">
                            <p className="text-xs text-muted-foreground">AI Stance</p>
                            <p className="text-sm font-bold text-red-600 dark:text-red-400">{getAIStance()}</p>
                          </div>
                        </div>
                        <Separator />
                        <div>
                          <h4 className="text-xs font-semibold mb-2 text-muted-foreground">Scoring Tips:</h4>
                          <ul className="text-xs text-muted-foreground space-y-1 leading-relaxed">
                            <li>• Present clear, logical arguments</li>
                            <li>• Address AI's counter-arguments</li>
                            <li>• Use evidence and examples</li>
                            <li>• Stay consistent with your position</li>
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right Side - Chat Area */}
                  <Card className="flex-1 flex flex-col min-h-0 h-full">
                    <CardContent className="flex-1 flex flex-col p-4 min-h-0">
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto pr-4" ref={scrollRef}>
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex gap-3 ${
                              message.role === "user" ? "justify-end" : "justify-start"
                            }`}
                          >
                            {message.role === "assistant" && (
                              <Avatar className="h-8 w-8 mt-1">
                                <AvatarFallback className="bg-primary text-primary-foreground">
                                  <Bot className="h-4 w-4" />
                                </AvatarFallback>
                              </Avatar>
                            )}
                            
                            <div
                              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                                message.role === "user"
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted"
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            </div>

                            {message.role === "user" && (
                              <Avatar className="h-8 w-8 mt-1">
                                <AvatarFallback className="bg-secondary">
                                  <User className="h-4 w-4" />
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        ))}
                        
                        {isGenerating && (
                          <div className="flex gap-3 justify-start">
                            <Avatar className="h-8 w-8 mt-1">
                              <AvatarFallback className="bg-primary text-primary-foreground">
                                <Bot className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="bg-muted rounded-lg px-4 py-2">
                              <div className="flex gap-1">
                                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Input Area */}
                    <div className="mt-4 flex gap-2">
                      <Textarea
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Present your argument..."
                        disabled={isGenerating || isDebateEnding}
                        className="min-h-[60px] max-h-[120px] resize-none"
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!userInput.trim() || isGenerating || isDebateEnding}
                        size="icon"
                        className="h-[60px] w-[60px]"
                      >
                        {isGenerating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
