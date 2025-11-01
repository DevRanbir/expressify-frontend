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
import { Clock, Trophy, Send, Loader2, User, Bot, Sparkles, Info, Bell, AlertTriangle } from "lucide-react";
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
  generateChatScenario, 
  generateChatResponse, 
  type ChatScenario, 
  type ChatMessage 
} from "@/lib/groqService";
import { 
  moderateContent, 
  getModerationResponse, 
  applyScorePenalty 
} from "@/lib/contentModeration";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export default function ChatSimulatorPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [difficulty, setDifficulty] = useState(1); // 1=Formal, 2=Informal, 3=Chaotic
  const [duration, setDuration] = useState(10);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [score, setScore] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [scenario, setScenario] = useState<ChatScenario | null>(null);
  const [showStartDialog, setShowStartDialog] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [isLoadingScenario, setIsLoadingScenario] = useState(true);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [strikeCount, setStrikeCount] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isSavingRef = useRef(false);

  useEffect(() => {
    // Get settings from sessionStorage
    const savedDifficulty = sessionStorage.getItem("textual_game_difficulty");
    const savedDuration = sessionStorage.getItem("textual_game_duration");
    
    if (savedDifficulty) setDifficulty(parseInt(savedDifficulty));
    if (savedDuration) setDuration(parseInt(savedDuration));

    // Load scenario dynamically from Groq AI
    const loadScenario = async () => {
      const diff = parseInt(savedDifficulty || "1");
      setIsLoadingScenario(true);
      try {
        const generatedScenario = await generateChatScenario(diff);
        setScenario(generatedScenario);
      } catch (error) {
        console.error("Error loading scenario:", error);
      } finally {
        setIsLoadingScenario(false);
      }
    };

    loadScenario();
  }, []);

  const handleStartGame = () => {
    setShowStartDialog(false);
    setGameStarted(true);
    
    // Set start time
    sessionStorage.setItem("chat_simulator_start_time", Date.now().toString());
    
    // Add initial message from character
    if (scenario) {
      setMessages([{
        id: "initial",
        role: "assistant",
        content: scenario.firstMessage,
        timestamp: Date.now()
      }]);
    }
  };

  useEffect(() => {
    if (!gameStarted) return;

    // Start timer
    timerRef.current = setInterval(() => {
      setTimeElapsed((prev) => {
        const newTime = prev + 1;
        
        // Check if time is up
        if (newTime >= duration * 60) {
          handleTimeUp();
          return prev;
        }
        return newTime;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [duration, gameStarted]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Save game state on unmount
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (messages.length > 1 && timeElapsed > 0) {
        await saveGameData();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [messages, timeElapsed, score, user]);

  const checkForDuplicate = async (gameStats: any) => {
    if (!user) return false;

    try {
      const gameRef = ref(database, `games/chat-simulator/${user.uid}`);
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
            entry.accuracy === gameStats.accuracy &&
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

    // Calculate accuracy based on message quality
    const userMessages = messages.filter(m => m.role === "user").length;
    const accuracy = Math.min(100, score);

    const gameStats = {
      score,
      timeElapsed,
      difficulty,
      messageCount: userMessages,
      totalMessages: messages.length,
      accuracy,
      gameId: "chat-simulator",
      mode: difficulty === 1 ? "Formal" : difficulty === 2 ? "Informal" : "Chaotic",
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

      const gameRef = ref(database, `games/chat-simulator/${user.uid}`);
      await push(gameRef, gameStats);
      console.log("Chat simulator data saved successfully");

      if (clearSession) {
        sessionStorage.removeItem("chat_simulator_start_time");
      }
    } catch (error) {
      console.error("Error saving game data:", error);
    } finally {
      isSavingRef.current = false;
    }
  };

  const handleTimeUp = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    if (!user || isSavingRef.current) return;

    isSavingRef.current = true;

    const userMessages = messages.filter(m => m.role === "user").length;
    const accuracy = Math.min(100, score);

    const gameStats = {
      score,
      timeElapsed: duration * 60,
      difficulty,
      messageCount: userMessages,
      totalMessages: messages.length,
      accuracy,
      gameId: "chat-simulator",
      mode: difficulty === 1 ? "Formal" : difficulty === 2 ? "Informal" : "Chaotic",
      status: "timeout",
      endReason: "time_up",
      timestamp: Date.now(),
    };

    try {
      const isDuplicate = await checkForDuplicate(gameStats);
      
      if (!isDuplicate) {
        const gameRef = ref(database, `games/chat-simulator/${user.uid}`);
        await push(gameRef, gameStats);
        console.log("Time up - Chat data saved successfully");
      }
    } catch (error) {
      console.error("Error saving to Firebase:", error);
    }

    sessionStorage.removeItem("chat_simulator_start_time");
    sessionStorage.setItem("textual_game_result", JSON.stringify(gameStats));
    router.push("/learning/textual/result");
  };

  const finishConversation = async () => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (!user || isSavingRef.current) return;

    isSavingRef.current = true;

    const userMessages = messages.filter(m => m.role === "user").length;
    const accuracy = Math.min(100, score);

    const gameStats = {
      score,
      timeElapsed,
      difficulty,
      messageCount: userMessages,
      totalMessages: messages.length,
      accuracy,
      gameId: "chat-simulator",
      mode: difficulty === 1 ? "Formal" : difficulty === 2 ? "Informal" : "Chaotic",
      status: "completed",
      endReason: "manual",
      timestamp: Date.now(),
    };

    if (user) {
      try {
        const isDuplicate = await checkForDuplicate(gameStats);
        
        if (!isDuplicate) {
          const gameRef = ref(database, `games/chat-simulator/${user.uid}`);
          await push(gameRef, gameStats);
          console.log("Conversation ended - Data saved successfully");
        }
      } catch (error) {
        console.error("Error saving to Firebase:", error);
      }
    }

    sessionStorage.removeItem("chat_simulator_start_time");
    sessionStorage.setItem("textual_game_result", JSON.stringify(gameStats));
    router.push("/learning/textual/result");
  };

  const generateAIResponse = async (userMessage: string): Promise<string> => {
    if (!scenario) return "I appreciate our conversation. Please continue.";

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

      // Generate AI response using Groq
      const response = await generateChatResponse(
        conversationHistory,
        difficulty,
        {
          character: scenario.character,
          personality: scenario.personality || "engaging, thoughtful, responsive",
          description: scenario.description
        }
      );

      return response;
    } catch (error) {
      console.error("Error generating AI response:", error);
      // Fallback response
      return "That's interesting. Could you tell me more about that?";
    }
  };

  const handleSendMessage = async () => {
    if (!userInput.trim() || isGenerating) return;

    // Clear any previous warning
    setWarningMessage(null);

    // Check for inappropriate content
    const moderationResult = moderateContent(userInput.trim());
    
    if (moderationResult.isInappropriate) {
      // Show warning to user
      setWarningMessage(moderationResult.warningMessage || "Please keep the conversation appropriate.");
      
      // Apply score penalty
      setScore(prev => applyScorePenalty(prev, moderationResult.reason || 'inappropriate_language'));
      
      // Increment strike count
      setStrikeCount(prev => prev + 1);
      
      // If 3 strikes, auto-end the conversation
      if (strikeCount >= 2) {
        const warningMsg: Message = {
          id: Date.now().toString(),
          role: "assistant",
          content: "I'm sorry, but due to repeated inappropriate messages, I need to end this conversation. Please restart and maintain a respectful dialogue.",
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, warningMsg]);
        
        // Auto-end after 2 seconds
        setTimeout(() => {
          finishConversation();
        }, 2000);
        return;
      }

      // Generate moderation response from AI character
      const moderationResponse = getModerationResponse(difficulty, moderationResult.reason || 'inappropriate_language');
      
      const warningAIMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: moderationResponse,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, warningAIMessage]);
      setUserInput("");
      return;
    }

    // Message is appropriate, proceed normally
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

    // Score based on message length and quality
    const messageLength = userInput.trim().length;
    if (messageLength > 50) {
      setScore(prev => Math.min(100, prev + 10)); // Good response
    } else if (messageLength > 20) {
      setScore(prev => Math.min(100, prev + 5)); // Decent response
    }

    // Generate AI response
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

  const getModeColor = () => {
    if (difficulty === 1) return "text-blue-500";
    if (difficulty === 2) return "text-green-500";
    return "text-purple-500";
  };

  const getModeLabel = () => {
    if (difficulty === 1) return "Formal";
    if (difficulty === 2) return "Informal";
    return "Chaotic";
  };

  if (isLoadingScenario || !scenario) {
    return (
      <ProtectedRoute>
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Generating your chat scenario with AI...</p>
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
                    <BreadcrumbPage>Chat Simulator</BreadcrumbPage>
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
              <Badge variant="outline" className={`hidden sm:flex items-center gap-1 ${getModeColor()}`}>
                <Sparkles className="h-3 w-3" />
                {getModeLabel()}
              </Badge>
            </div>
          </header>

          {/* Start Dialog */}
          {scenario && (
            <Dialog open={showStartDialog} onOpenChange={setShowStartDialog}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-blue-500" />
                    Chat Simulator - {getModeLabel()}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-foreground">Your Situation:</h4>
                    <p className="text-sm text-muted-foreground">{scenario.situation}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold text-foreground">Who You're Talking To:</h4>
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback>{scenario.character[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{scenario.character}</p>
                        <p className="text-sm text-muted-foreground">{scenario.description}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-foreground">Game Rules:</h4>
                    <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                      <li>You have {duration} minutes to complete the conversation</li>
                      <li>Longer messages earn more points (50+ chars = 10 pts, 20+ chars = 5 pts)</li>
                      <li>Stay in character and respond appropriately for the situation</li>
                      <li className="text-amber-600 dark:text-amber-500 font-medium">Keep conversation respectful - inappropriate content results in score penalties</li>
                      <li>The timer starts when you click "Start Conversation"</li>
                    </ul>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button onClick={handleStartGame} className="w-full sm:w-auto">
                    Start Conversation
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
                    onClick={finishConversation} 
                    variant="destructive" 
                    size="sm"
                    disabled={messages.length <= 1}
                  >
                    End Conversation
                  </Button>
                </div>

                {/* Warning Banner */}
                {warningMessage && (
                  <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-destructive/20 p-2">
                        <Bell className="h-4 w-4 text-destructive" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-destructive mb-1">
                          Warning {strikeCount > 0 && `(Strike ${strikeCount}/3)`}
                        </h4>
                        <p className="text-sm text-muted-foreground">{warningMessage}</p>
                        {strikeCount >= 2 && (
                          <p className="text-xs text-destructive mt-2 font-medium">
                            Final warning! One more inappropriate message will end the conversation.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Main Content - Scenario Left, Chat Right */}
                <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
                  {/* Left Side - Scenario Info */}
                  <div className="lg:w-80 lg:flex-shrink-0">
                    <Card className="h-full">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3 mb-2">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                              {scenario.character[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <CardTitle className="text-base leading-tight">{scenario.character}</CardTitle>
                            <Badge className={`${getModeColor()} mt-1 text-xs`} variant="outline">
                              {getModeLabel()} Mode
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <p className="text-sm text-muted-foreground">{scenario.description}</p>
                        </div>
                        <Separator />
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Situation:</h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">{scenario.situation}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right Side - Chat Area */}
                  <Card className="flex-1 flex flex-col min-h-0">
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
                        placeholder="Type your response..."
                        disabled={isGenerating}
                        className="min-h-[60px] max-h-[120px] resize-none"
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!userInput.trim() || isGenerating}
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
