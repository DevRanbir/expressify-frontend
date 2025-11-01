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
import { Clock, Trophy, Sparkles, AlertCircle, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ref, push, get } from "firebase/database";
import { database } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  generateGrammarSentences, 
  type GrammarSentence 
} from "@/lib/groqService";

const GOBLIN_RESPONSES = {
  correct: [
    "Smart human! You've mastered this one!",
    "Excellent grammar skills!",
    "You're too clever!",
    "Brilliant! Keep it up!",
    "Perfect! Well done!"
  ],
  incorrect: [
    "Not quite right. Try again!",
    "Oops! That's not correct.",
    "Close, but not quite!",
    "Keep trying!",
    "Almost there! Review the hint."
  ]
};

export default function GrammarGoblinPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [difficulty, setDifficulty] = useState(1);
  const [duration, setDuration] = useState(10);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [score, setScore] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [selectedWordIndex, setSelectedWordIndex] = useState<number | null>(null);
  const [showInput, setShowInput] = useState(false);
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string, points?: number } | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [sentences, setSentences] = useState<GrammarSentence[]>([]);
  const [isLoadingSentences, setIsLoadingSentences] = useState(true);
  const [showHint, setShowHint] = useState(false);
  const [attemptsOnCurrent, setAttemptsOnCurrent] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);
  const hasCalledTimeUpRef = useRef(false);

  const currentSentence = sentences[currentLevel] || null;
  
  // Calculate max attempts before showing hint based on difficulty
  const getMaxAttemptsBeforeHint = () => {
    if (difficulty === 1) return 8; // Easy: 8 attempts
    if (difficulty === 2) return 4; // Medium: 4 attempts
    return 1; // Hard: 1 attempt
  };

  useEffect(() => {
    const savedDifficulty = sessionStorage.getItem("textual_game_difficulty");
    const savedDuration = sessionStorage.getItem("textual_game_duration");
    
    if (savedDifficulty) setDifficulty(parseInt(savedDifficulty));
    if (savedDuration) setDuration(parseInt(savedDuration));

    // Check for existing game session
    const savedGameState = sessionStorage.getItem("grammar_goblin_game_state");
    
    if (savedGameState) {
      // Restore previous game state
      try {
        const gameState = JSON.parse(savedGameState);
        setSentences(gameState.sentences);
        setScore(gameState.score);
        setCurrentLevel(gameState.currentLevel);
        setCorrectCount(gameState.correctCount);
        setWrongCount(gameState.wrongCount);
        setTimeElapsed(gameState.timeElapsed);
        setGameStarted(true);
        setIsLoadingSentences(false);
        console.log("Restored game state from session");
      } catch (error) {
        console.error("Error restoring game state:", error);
        loadNewGame(savedDifficulty);
      }
    } else {
      // Load new game
      loadNewGame(savedDifficulty);
    }
  }, []);

  const loadNewGame = async (savedDifficulty: string | null) => {
    const diff = parseInt(savedDifficulty || "1");
    setIsLoadingSentences(true);
    try {
      const generatedSentences = await generateGrammarSentences(diff, 8);
      setSentences(generatedSentences);
      
      // Save initial game state
      const initialGameState = {
        sentences: generatedSentences,
        score: 0,
        currentLevel: 0,
        correctCount: 0,
        wrongCount: 0,
        timeElapsed: 0,
        timestamp: Date.now()
      };
      sessionStorage.setItem("grammar_goblin_game_state", JSON.stringify(initialGameState));
    } catch (error) {
      console.error("Error loading sentences:", error);
    } finally {
      setIsLoadingSentences(false);
    }
  };

  // Save game state whenever it changes
  useEffect(() => {
    if (gameStarted && sentences.length > 0) {
      const gameState = {
        sentences,
        score,
        currentLevel,
        correctCount,
        wrongCount,
        timeElapsed,
        timestamp: Date.now()
      };
      sessionStorage.setItem("grammar_goblin_game_state", JSON.stringify(gameState));
    }
  }, [score, currentLevel, correctCount, wrongCount, timeElapsed, gameStarted, sentences]);

  // Save game state on unmount or reload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (gameStarted && sentences.length > 0 && !isSavingRef.current) {
        const gameState = {
          sentences,
          score,
          currentLevel,
          correctCount,
          wrongCount,
          timeElapsed,
          timestamp: Date.now()
        };
        sessionStorage.setItem("grammar_goblin_game_state", JSON.stringify(gameState));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [gameStarted, sentences, score, currentLevel, correctCount, wrongCount, timeElapsed]);

  useEffect(() => {
    if (!gameStarted) return;

    timerRef.current = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [gameStarted]);

  // Watch for time expiration
  useEffect(() => {
    if (!gameStarted || hasCalledTimeUpRef.current) return;
    
    const timeLimit = duration * 60;
    if (timeElapsed >= timeLimit) {
      // Time is up, end the game
      hasCalledTimeUpRef.current = true;
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Small delay to ensure state is updated
      setTimeout(() => {
        handleTimeUp();
      }, 100);
    }
  }, [timeElapsed, duration, gameStarted]);

  const checkForDuplicate = async (gameStats: any) => {
    if (!user) return false;

    try {
      const gameRef = ref(database, `games/grammar-goblin/${user.uid}`);
      const snapshot = await get(gameRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        const entries = Object.values(data) as any[];
        
        const recentEntries = entries
          .sort((a: any, b: any) => b.timestamp - a.timestamp)
          .slice(0, 3);
        
        const isDuplicate = recentEntries.some((entry: any) => {
          const timeDiff = Math.abs(gameStats.timestamp - entry.timestamp);
          return (
            timeDiff < 5000 &&
            entry.score === gameStats.score &&
            entry.accuracy === gameStats.accuracy
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

  const handleTimeUp = async () => {
    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Prevent duplicate calls
    if (!user || isSavingRef.current) return;

    isSavingRef.current = true;

    const accuracy = correctCount + wrongCount > 0 
      ? Math.round((correctCount / (correctCount + wrongCount)) * 100) 
      : 0;

    const gameStats = {
      score,
      timeElapsed: duration * 60,
      difficulty,
      completedWords: correctCount,
      totalWords: correctCount + wrongCount,
      accuracy,
      gameId: "grammar-goblin",
      status: "timeout",
      timestamp: Date.now(),
    };

    try {
      const isDuplicate = await checkForDuplicate(gameStats);
      
      if (!isDuplicate) {
        const gameRef = ref(database, `games/grammar-goblin/${user.uid}`);
        await push(gameRef, gameStats);
        console.log("Time up - Grammar Goblin data saved successfully");
      }
    } catch (error) {
      console.error("Error saving to Firebase:", error);
    }

    sessionStorage.removeItem("grammar_goblin_game_state");
    sessionStorage.setItem("textual_game_result", JSON.stringify(gameStats));
    router.push("/learning/textual/result");
  };

  const finishGame = async () => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (!user || isSavingRef.current) return;

    isSavingRef.current = true;

    const accuracy = correctCount + wrongCount > 0 
      ? Math.round((correctCount / (correctCount + wrongCount)) * 100) 
      : 0;

    const gameStats = {
      score,
      timeElapsed,
      difficulty,
      completedWords: correctCount,
      totalWords: correctCount + wrongCount,
      accuracy,
      gameId: "grammar-goblin",
      status: "completed",
      timestamp: Date.now(),
    };

    if (user) {
      try {
        const isDuplicate = await checkForDuplicate(gameStats);
        
        if (!isDuplicate) {
          const gameRef = ref(database, `games/grammar-goblin/${user.uid}`);
          await push(gameRef, gameStats);
          console.log("Grammar Goblin data saved successfully");
        }
      } catch (error) {
        console.error("Error saving to Firebase:", error);
      }
    }

    sessionStorage.removeItem("grammar_goblin_game_state");
    sessionStorage.setItem("textual_game_result", JSON.stringify(gameStats));
    router.push("/learning/textual/result");
  };

  const handleWordSelect = (index: number) => {
    if (!showInput && !feedback && gameStarted) {
      setSelectedWordIndex(index);
      setShowInput(true);
      setUserAnswer("");
    }
  };

  const handleSubmitAnswer = () => {
    if (!currentSentence || userAnswer.trim() === "") return;

    const isCorrectWord = selectedWordIndex === currentSentence.incorrectIndex;
    const isCorrectAnswer = userAnswer.toLowerCase().trim() === currentSentence.correctWord.toLowerCase().trim();

    if (isCorrectWord && isCorrectAnswer) {
      const points = currentSentence.difficulty * 10;
      setScore(prev => prev + points);
      setCorrectCount(prev => prev + 1);
      
      // Show subtle success feedback
      setFeedback({ type: 'success', message: 'Correct!', points });

      setTimeout(() => {
        if (currentLevel < sentences.length - 1) {
          setCurrentLevel(prev => prev + 1);
          resetRound();
        } else {
          finishGame();
        }
      }, 1500);
    } else {
      setWrongCount(prev => prev + 1);
      setAttemptsOnCurrent(prev => prev + 1);
      
      // Check if hint should be shown based on attempts
      const maxAttempts = getMaxAttemptsBeforeHint();
      if (attemptsOnCurrent + 1 >= maxAttempts) {
        setShowHint(true);
      }
      
      // Show subtle error feedback
      setFeedback({ type: 'error', message: 'Try again' });

      setTimeout(() => {
        setFeedback(null);
        setShowInput(false);
        setUserAnswer("");
        setSelectedWordIndex(null);
      }, 1000);
    }
  };

  const resetRound = () => {
    setSelectedWordIndex(null);
    setShowInput(false);
    setUserAnswer("");
    setFeedback(null);
    setShowHint(false);
    setAttemptsOnCurrent(0);
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

  const getDifficultyLabel = () => {
    if (difficulty === 1) return "Beginner";
    if (difficulty === 2) return "Intermediate";
    return "Advanced";
  };

  useEffect(() => {
    // Auto-start game once sentences are loaded
    if (!gameStarted && !isLoadingSentences && sentences.length > 0) {
      setGameStarted(true);
    }
  }, [gameStarted, isLoadingSentences, sentences]);

  // Show loading state
  if (isLoadingSentences) {
    return (
      <ProtectedRoute>
        <SidebarProvider>
          <ExpressifySidebar />
          <SidebarInset>
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
                      <BreadcrumbPage>Grammar Goblin</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </header>
            <div className="flex flex-1 items-center justify-center p-4">
              <Card className="w-full max-w-md">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center gap-4 text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <div>
                      <h3 className="text-lg font-semibold">Preparing Grammar Challenges</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        AI is generating unique sentences for you...
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </ProtectedRoute>
    );
  }

  if (!currentSentence) {
    finishGame();
    return null;
  }

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <ExpressifySidebar />
        <SidebarInset>
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
                    <BreadcrumbPage>Grammar Goblin</BreadcrumbPage>
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
            </div>
          </header>

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
                        <p className="text-xs text-muted-foreground">Progress</p>
                        <p className="text-sm font-bold">{currentLevel + 1} / {sentences.length}</p>
                      </div>
                    </div>

                    <Separator orientation="vertical" className="h-10" />
                    
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Correct</p>
                        <p className="text-sm font-bold">{correctCount}</p>
                      </div>
                    </div>

                    <Separator orientation="vertical" className="h-10" />
                    
                    <div className="flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-red-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Wrong</p>
                        <p className="text-sm font-bold">{wrongCount}</p>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={finishGame} 
                    variant="destructive" 
                    size="sm"
                  >
                    End Game
                  </Button>
                </div>



                {/* Main Content - Game Info Left, Sentence Right */}
                <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
                  {/* Left Side - Game Info */}
                  <div className="lg:w-80 lg:flex-shrink-0">
                    <Card className="h-full">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Grammar Goblin</CardTitle>
                        <Badge className="text-xs mt-2 w-fit" variant="outline">
                          {getDifficultyLabel()}
                        </Badge>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Current Score</h4>
                          <div className="flex items-baseline gap-2">
                            <AnimatePresence mode="popLayout">
                              <motion.span
                                key={score}
                                initial={{ scale: 1.5, color: '#22c55e' }}
                                animate={{ scale: 1, color: 'hsl(var(--primary))' }}
                                transition={{ duration: 0.5 }}
                                className="text-3xl font-bold"
                              >
                                {score}
                              </motion.span>
                            </AnimatePresence>
                            <span className="text-sm text-muted-foreground">points</span>
                            <AnimatePresence>
                              {feedback?.type === 'success' && feedback.points && (
                                <motion.span
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: 10 }}
                                  className="text-sm font-semibold text-green-500 ml-1"
                                >
                                  +{feedback.points}
                                </motion.span>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Challenge</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Difficulty:</span>
                              <span className="font-medium">{'★'.repeat(currentSentence.difficulty)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Points:</span>
                              <span className="font-medium">{currentSentence.difficulty * 10} pts</span>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <h4 className="text-sm font-semibold mb-2">Stats</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Attempts:</span>
                              <span className="font-medium">{attemptsOnCurrent}/{getMaxAttemptsBeforeHint()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Correct:</span>
                              <span className="font-medium text-green-500">{correctCount}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Wrong:</span>
                              <span className="font-medium text-red-500">{wrongCount}</span>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <Button
                            onClick={() => setShowHint(true)}
                            disabled={showHint || attemptsOnCurrent < getMaxAttemptsBeforeHint()}
                            variant="outline"
                            size="sm"
                            className="w-full"
                          >
                            <Sparkles className="h-4 w-4 mr-2" />
                            {showHint ? 'Hint Revealed' : `Show Hint (${getMaxAttemptsBeforeHint() - attemptsOnCurrent} attempts left)`}
                          </Button>
                        </div>

                        {showHint && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20"
                          >
                            <div className="flex items-start gap-2">
                              <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
                              <div>
                                <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-1">Hint</h4>
                                <p className="text-xs text-muted-foreground">
                                  {currentSentence.explanation}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right Side - Sentence & Input Area */}
                  <Card className="flex-1 flex flex-col min-h-0">
                    <CardHeader>
                      <CardTitle className="text-lg">Find the Grammar Mistake</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col space-y-4">
                      {/* Sentence Display */}
                      <div className="flex-1 flex items-start justify-center pt-8">
                        <div className="flex flex-wrap gap-3 justify-center text-xl max-w-3xl">
                          {currentSentence.words.map((word, index) => (
                            <Button
                              key={index}
                              onClick={() => handleWordSelect(index)}
                              disabled={feedback !== null}
                              variant={selectedWordIndex === index ? "default" : "outline"}
                              size="lg"
                              className={`
                                text-lg px-6 py-6 transition-all
                                ${selectedWordIndex === index ? 'ring-2 ring-primary' : ''}
                              `}
                            >
                              {word}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Input Area - Shows when word is selected */}
                      {showInput && selectedWordIndex !== null && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="border-t pt-4 space-y-4"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-sm font-medium">Selected Word</label>
                              <Badge variant="secondary" className="text-base px-3">
                                {currentSentence.words[selectedWordIndex]}
                              </Badge>
                            </div>
                            
                            <div className="flex gap-2">
                              <div className="flex-1 relative">
                                <Input
                                  type="text"
                                  value={userAnswer}
                                  onChange={(e) => setUserAnswer(e.target.value)}
                                  onKeyPress={(e) => e.key === 'Enter' && handleSubmitAnswer()}
                                  placeholder="Type the correct word..."
                                  autoFocus
                                  className={`text-lg ${feedback?.type === 'error' ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                                  disabled={feedback !== null}
                                />
                                {feedback?.type === 'error' && (
                                  <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2"
                                  >
                                    <XCircle className="h-5 w-5 text-red-500" />
                                  </motion.div>
                                )}
                              </div>
                              <Button 
                                onClick={handleSubmitAnswer} 
                                disabled={!userAnswer.trim() || feedback !== null}
                                size="lg"
                                className="px-8"
                              >
                                Submit
                              </Button>
                            </div>
                            
                            {feedback?.type === 'error' && (
                              <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-xs text-red-500 flex items-center gap-1"
                              >
                                <AlertCircle className="h-3 w-3" />
                                {feedback.message}
                              </motion.p>
                            )}
                          </div>
                        </motion.div>
                      )}
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
