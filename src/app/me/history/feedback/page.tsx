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
import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { database } from "@/lib/firebase";
import { ref, get } from "firebase/database";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User as UserIcon, 
  Clock, 
  Target, 
  Trophy,
  TrendingUp,
  AlertCircle,
  Loader2,
  ArrowLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { groq } from "@/lib/groqService";

// Simple askGroqQuestion function
async function askGroqQuestion(prompt: string): Promise<string> {
  try {
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 1024,
    });

    return response.choices[0]?.message?.content || "I apologize, but I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error("Error calling Groq API:", error);
    throw error;
  }
}

interface GameSession {
  gameId: string;
  score: number;
  accuracy: number;
  timeElapsed: number;
  difficulty: string;
  status: string;
  timestamp: number;
  hintsUsed?: number;
  completedWords?: number;
  totalWords?: number;
  missedLetters?: number;
  perfectCatches?: number;
  roundsCompleted?: number;
  messageCount?: number;
  topic?: string;
  userStance?: string;
  aiStance?: string;
  summary?: string;
  strengths?: string[];
  weaknesses?: string[];
  feedback?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

function FeedbackPageContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  const gameName = searchParams.get('gameName');
  
  const [sessionData, setSessionData] = useState<GameSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSessionData = async () => {
      if (!user || !sessionId) {
        setIsLoading(false);
        return;
      }

      try {
        // Try to fetch from different game types
        const gameTypes = ['crossword-puzzle', 'chat-simulator', 'grammar-goblin', 'debate-master', 'vocabulary-quest', 'word-bucket'];
        
        // Handle text-filler-rush separately due to different path structure
        if (gameName === 'Text Filler Rush' || gameName === 'text-filler-rush') {
          const sessionRef = ref(database, `games/text-filler-rush/${sessionId}/data`);
          const snapshot = await get(sessionRef);
          
          if (snapshot.exists()) {
            setSessionData(snapshot.val() as GameSession);
            
            // Add initial welcome message with context for vocal training
            const welcomeMessage: ChatMessage = {
              role: 'assistant',
              content: `Hello! I'm here to help you understand your performance in Text Filler Rush (Vocal Training). You can ask me about:\n\n• Reading speed and fluency analysis\n• How the scoring system works\n• Tips to improve pronunciation accuracy\n• Speech recognition optimization\n• Reading comprehension strategies\n• Any questions about your results\n\nWhat would you like to know about your vocal training session?`,
              timestamp: Date.now(),
            };
            setChatMessages([welcomeMessage]);
            setIsLoading(false);
            return;
          }
        }
        
        // Try standard game paths for other games
        for (const gameType of gameTypes) {
          const sessionRef = ref(database, `games/${gameType}/${user.uid}/${sessionId}`);
          const snapshot = await get(sessionRef);
          
          if (snapshot.exists()) {
            setSessionData(snapshot.val() as GameSession);
            
            // Add initial welcome message with context
            const welcomeMessage: ChatMessage = {
              role: 'assistant',
              content: `Hello! I'm here to help you understand your performance in ${gameName || 'this game'}. You can ask me about:\n\n• Why certain answers were wrong\n• How to improve your score\n• Tips for better performance\n• Explanation of game mechanics\n• Any questions about your results\n\nWhat would you like to know?`,
              timestamp: Date.now(),
            };
            setChatMessages([welcomeMessage]);
            break;
          }
        }
      } catch (error) {
        console.error("Error fetching session data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessionData();
  }, [user, sessionId, gameName]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isSending) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: Date.now(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsSending(true);

    try {
      // Prepare context for Groq
      const context = `
You are a helpful AI tutor analyzing a student's game performance in "${gameName}".

Game Session Data:
- Score: ${sessionData?.score || 0}
- Accuracy: ${sessionData?.accuracy || 0}%
- Time: ${sessionData?.timeElapsed || 0} seconds
- Difficulty: ${sessionData?.difficulty || 'N/A'}
- Status: ${sessionData?.status || 'N/A'}
${sessionData?.hintsUsed !== undefined ? `- Hints Used: ${sessionData.hintsUsed}` : ''}
${sessionData?.completedWords !== undefined ? `- Completed Words: ${sessionData.completedWords}/${sessionData.totalWords}` : ''}
${sessionData?.missedLetters !== undefined ? `- Missed Letters: ${sessionData.missedLetters}` : ''}
${sessionData?.perfectCatches !== undefined ? `- Perfect Catches: ${sessionData.perfectCatches}` : ''}
${sessionData?.roundsCompleted !== undefined ? `- Rounds Completed: ${sessionData.roundsCompleted}` : ''}
${sessionData?.topic ? `- Topic: ${sessionData.topic}` : ''}
${sessionData?.strengths?.length ? `- Strengths: ${sessionData.strengths.join(', ')}` : ''}
${sessionData?.weaknesses?.length ? `- Weaknesses: ${sessionData.weaknesses.join(', ')}` : ''}
${sessionData?.feedback ? `- Feedback: ${sessionData.feedback}` : ''}

Conversation History:
${chatMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

Student Question: ${inputMessage}

Provide a helpful, encouraging response that addresses their question. Be specific about their performance data when relevant. Keep responses concise but informative.
`;

      const response = await askGroqQuestion(context);
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      };

      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error getting AI response:", error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: "I apologize, but I'm having trouble processing your question right now. Please try again.",
        timestamp: Date.now(),
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'excellent':
        return 'bg-green-500';
      case 'very good':
        return 'bg-blue-500';
      case 'good':
        return 'bg-yellow-500';
      default:
        return 'bg-red-500';
    }
  };

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
                    <BreadcrumbLink href="/me/history">History</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Session Feedback</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            <div className="ml-auto flex items-center gap-2 px-4">
              <Button variant="outline" size="sm" onClick={() => router.push('/me/history')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to History
              </Button>
            </div>
          </header>

          <div className="flex flex-1 flex-col gap-4 p-4">
            {isLoading ? (
              <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-muted-foreground">Loading session data...</p>
                </div>
              </div>
            ) : !sessionData ? (
              <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
                <Card className="w-full max-w-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                      Session Not Found
                    </CardTitle>
                    <CardDescription>
                      We couldn't find the training session you're looking for.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={() => router.push('/me/history')} className="w-full">
                      Return to History
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
                {/* Left Column - Session Details */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Header Card */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-2xl">{gameName}</CardTitle>
                          <CardDescription className="mt-1">
                            {new Date(sessionData.timestamp).toLocaleString()}
                          </CardDescription>
                        </div>
                        <Badge className={cn(getStatusColor(sessionData.status), "text-white")}>
                          {sessionData.status}
                        </Badge>
                      </div>
                    </CardHeader>
                  </Card>

                  {/* Performance Metrics */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        Performance Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                        <div className="flex flex-col">
                          <span className="text-2xl font-bold text-primary">{sessionData.score}</span>
                          <span className="text-sm text-muted-foreground">Score</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-2xl font-bold text-blue-500">{sessionData.accuracy}%</span>
                          <span className="text-sm text-muted-foreground">Accuracy</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-2xl font-bold text-purple-500">
                            {formatDuration(sessionData.timeElapsed)}
                          </span>
                          <span className="text-sm text-muted-foreground">Duration</span>
                        </div>
                        {sessionData.hintsUsed !== undefined && (
                          <div className="flex flex-col">
                            <span className="text-2xl font-bold text-orange-500">{sessionData.hintsUsed}</span>
                            <span className="text-sm text-muted-foreground">Hints Used</span>
                          </div>
                        )}
                        {sessionData.completedWords !== undefined && (
                          <div className="flex flex-col">
                            <span className="text-2xl font-bold text-green-500">
                              {sessionData.completedWords}/{sessionData.totalWords}
                            </span>
                            <span className="text-sm text-muted-foreground">Words Completed</span>
                          </div>
                        )}
                        {sessionData.roundsCompleted !== undefined && (
                          <div className="flex flex-col">
                            <span className="text-2xl font-bold text-cyan-500">{sessionData.roundsCompleted}</span>
                            <span className="text-sm text-muted-foreground">Rounds</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Strengths & Weaknesses */}
                  {(sessionData.strengths?.length || sessionData.weaknesses?.length) && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-green-500" />
                          Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {sessionData.strengths && sessionData.strengths.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-green-600 mb-2">Strengths</h4>
                            <ul className="list-disc list-inside space-y-1">
                              {sessionData.strengths.map((strength, idx) => (
                                <li key={idx} className="text-sm">{strength}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {sessionData.weaknesses && sessionData.weaknesses.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-red-600 mb-2">Areas for Improvement</h4>
                            <ul className="list-disc list-inside space-y-1">
                              {sessionData.weaknesses.map((weakness, idx) => (
                                <li key={idx} className="text-sm">{weakness}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* General Feedback */}
                  {sessionData.feedback && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MessageSquare className="h-5 w-5 text-blue-500" />
                          Feedback
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm leading-relaxed">{sessionData.feedback}</p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Game-Specific Details */}
                  {sessionData.topic && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Debate Details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div>
                          <span className="font-semibold">Topic: </span>
                          <span>{sessionData.topic}</span>
                        </div>
                        {sessionData.userStance && (
                          <div>
                            <span className="font-semibold">Your Stance: </span>
                            <span>{sessionData.userStance}</span>
                          </div>
                        )}
                        {sessionData.summary && (
                          <div className="mt-2">
                            <span className="font-semibold">Summary: </span>
                            <p className="text-sm text-muted-foreground mt-1">{sessionData.summary}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Right Column - AI Chatbot */}
                <div className="lg:col-span-3">
                  <Card className="h-[calc(100vh-8rem)] flex flex-col">
                    <CardHeader className="border-b">
                      <CardTitle className="flex items-center gap-2">
                        <Bot className="h-5 w-5 text-primary" />
                      </CardTitle>
                      <CardDescription>
                        Ask questions about your performance
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="flex-1 p-0 overflow-hidden">
                      <div className="h-full overflow-y-auto p-4" ref={scrollAreaRef}>
                        <div className="space-y-4">
                          {chatMessages.map((message, idx) => (
                            <div
                              key={idx}
                              className={cn(
                                "flex gap-3",
                                message.role === 'user' ? "justify-end" : "justify-start"
                              )}
                            >
                              {message.role === 'assistant' && (
                                <div className="flex-shrink-0">
                                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Bot className="h-4 w-4 text-primary" />
                                  </div>
                                </div>
                              )}
                              
                              <div
                                className={cn(
                                  "max-w-[80%] rounded-lg px-4 py-2",
                                  message.role === 'user'
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted"
                                )}
                              >
                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                <span className="text-xs opacity-70 mt-1 block">
                                  {new Date(message.timestamp).toLocaleTimeString()}
                                </span>
                              </div>

                              {message.role === 'user' && (
                                <div className="flex-shrink-0">
                                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                                    <UserIcon className="h-4 w-4 text-primary-foreground" />
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                          {isSending && (
                            <div className="flex gap-3 justify-start">
                              <div className="flex-shrink-0">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <Bot className="h-4 w-4 text-primary" />
                                </div>
                              </div>
                              <div className="bg-muted rounded-lg px-4 py-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                              </div>
                            </div>
                          )}
                          <div ref={messagesEndRef} />
                        </div>
                      </div>
                    </CardContent>

                    <div className="border-t p-4">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Ask about your performance..."
                          value={inputMessage}
                          onChange={(e) => setInputMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          disabled={isSending}
                        />
                        <Button
                          onClick={handleSendMessage}
                          disabled={!inputMessage.trim() || isSending}
                          size="icon"
                        >
                          {isSending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}

// Wrapper component with Suspense
export default function FeedbackPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <FeedbackPageContent />
    </Suspense>
  );
}
