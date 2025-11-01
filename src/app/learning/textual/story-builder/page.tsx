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
import { Clock, Trophy, Sparkles, Zap, Target, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import dynamic from "next/dynamic";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });
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
import shoppingAnimation from "@/../public/shopping (1).json";

// Comprehensive word list organized by difficulty
const WORD_LISTS = {
  easy: [
    'HAPPY', 'BRAVE', 'SMART', 'QUICK', 'STRONG', 'LIGHT', 'DARK', 'COLD',
    'WARM', 'GOOD', 'KIND', 'SAFE', 'TRUE', 'FAIR', 'PURE', 'CALM',
    'SOFT', 'HARD', 'FAST', 'SLOW', 'HIGH', 'DEEP', 'WIDE', 'NEAR'
  ],
  medium: [
    'CODING', 'PUZZLE', 'SYSTEM', 'DESIGN', 'CREATE', 'DEPLOY', 'DEBUG',
    'QUERY', 'SERVER', 'CLIENT', 'ROUTER', 'SOCKET', 'CRYPTO', 'PROXY',
    'SCHEMA', 'BINARY', 'SYNTAX', 'THREAD', 'KERNEL', 'BUFFER', 'MEMORY',
    'PYTHON', 'DIGITAL', 'MATRIX', 'FRONTEND', 'BACKEND', 'DEVELOP'
  ],
  hard: [
    'ALGORITHM', 'INTERFACE', 'FUNCTION', 'VARIABLE', 'COMPONENT', 'TERMINAL',
    'DATABASE', 'NETWORK', 'PROTOCOL', 'JAVASCRIPT', 'FRAMEWORK', 'LIBRARY',
    'REPOSITORY', 'CONTAINER', 'PIPELINE', 'COMPILER', 'DEBUGGER', 'REFACTOR',
    'ITERATION', 'RECURSION', 'POLYMORPHISM', 'INHERITANCE', 'ENCAPSULATION'
  ],
  expert: [
    'AUTHENTICATION', 'AUTHORIZATION', 'OPTIMIZATION', 'CONFIGURATION',
    'ASYNCHRONOUS', 'SYNCHRONIZATION', 'PARALLELIZATION', 'VIRTUALIZATION',
    'ORCHESTRATION', 'MICROSERVICES', 'INFRASTRUCTURE', 'ARCHITECTURE',
    'SCALABILITY', 'RELIABILITY', 'AVAILABILITY', 'CONSISTENCY'
  ]
};

const getWordListForDifficulty = (difficulty: number): string[] => {
  switch(difficulty) {
    case 1: return WORD_LISTS.easy;
    case 2: return WORD_LISTS.medium;
    case 3: return WORD_LISTS.hard;
    case 4: return WORD_LISTS.expert;
    default: return WORD_LISTS.medium;
  }
};

interface Letter {
  id: number;
  char: string;
  x: number;
  y: number;
  speed: number;
}

export default function WordBucketPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [difficulty, setDifficulty] = useState(1);
  const [duration, setDuration] = useState(10);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'ended'>('menu');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [targetWord, setTargetWord] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fallingLetter, setFallingLetter] = useState<Letter | null>(null);
  const [bucketX, setBucketX] = useState(50);
  const [roundsCompleted, setRoundsCompleted] = useState(0);
  const [perfectCatches, setPerfectCatches] = useState(0);
  const [missedLetters, setMissedLetters] = useState(0);
  
  const rafRef = useRef<number | null>(null);
  const letterIdRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const bucketRef = useRef<HTMLDivElement>(null);
  const isSavingRef = useRef(false);
  const bucketXRef = useRef(50);
  const currentIndexRef = useRef(0);
  const targetWordRef = useRef('');
  const difficultyRef = useRef(1);

  const BUCKET_WIDTH = 120;
  const LETTER_SIZE = 45;
  const speedRandomizerRef = useRef<NodeJS.Timeout | null>(null);
  const currentSpeedRef = useRef(0.4); // Start with slow speed

  useEffect(() => {
    // Get settings from sessionStorage
    const savedDifficulty = sessionStorage.getItem("textual_game_difficulty");
    const savedDuration = sessionStorage.getItem("textual_game_duration");
    
    if (savedDifficulty) {
      const diff = parseInt(savedDifficulty);
      setDifficulty(diff);
      difficultyRef.current = diff;
    }
    if (savedDuration) setDuration(parseInt(savedDuration));

    // Check for saved game state
    const savedState = sessionStorage.getItem("word_bucket_game_state");
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        setGameState('playing');
        setScore(state.score);
        setTimeLeft(state.timeLeft);
        setTargetWord(state.targetWord);
        setCurrentIndex(state.currentIndex);
        setRoundsCompleted(state.roundsCompleted);
        setPerfectCatches(state.perfectCatches);
        setMissedLetters(state.missedLetters);
        
        // Update refs
        targetWordRef.current = state.targetWord;
        currentIndexRef.current = state.currentIndex;
      } catch (error) {
        console.error("Error restoring game state:", error);
      }
    } else {
      // Auto-start game if no saved state
      setTimeout(() => startGame(), 100);
    }
  }, []);

  // Update refs when state changes
  useEffect(() => {
    bucketXRef.current = bucketX;
  }, [bucketX]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    targetWordRef.current = targetWord;
  }, [targetWord]);

  useEffect(() => {
    difficultyRef.current = difficulty;
  }, [difficulty]);

  const getRandomWord = () => {
    const wordList = getWordListForDifficulty(difficultyRef.current);
    return wordList[Math.floor(Math.random() * wordList.length)];
  };

  const generateLetter = () => {
    const isTarget = Math.random() < 0.35; // 35% chance for correct letter
    let char;
    
    if (isTarget && currentIndexRef.current < targetWordRef.current.length) {
      char = targetWordRef.current[currentIndexRef.current];
    } else {
      // Generate random letter (not the target letter to avoid confusion)
      const targetChar = targetWordRef.current[currentIndexRef.current];
      do {
        char = String.fromCharCode(65 + Math.floor(Math.random() * 26));
      } while (char === targetChar);
    }
    
    return {
      id: letterIdRef.current++,
      char,
      x: Math.random() * 85,
      y: -5,
      speed: currentSpeedRef.current
    };
  };

  const startGame = () => {
    const word = getRandomWord();
    
    setGameState('playing');
    setScore(0);
    setTimeLeft(duration * 60);
    setTargetWord(word);
    targetWordRef.current = word;
    setCurrentIndex(0);
    currentIndexRef.current = 0;
    setFallingLetter(generateLetter());
    setBucketX(50);
    setRoundsCompleted(0);
    setPerfectCatches(0);
    setMissedLetters(0);
    letterIdRef.current = 0;

    // Initialize speed based on difficulty
    initializeSpeedRandomizer();

    // Store start time
    sessionStorage.setItem("word_bucket_start_time", Date.now().toString());
  };

  const initializeSpeedRandomizer = () => {
    // Clear any existing randomizer
    if (speedRandomizerRef.current) {
      clearInterval(speedRandomizerRef.current);
    }

    const diff = difficultyRef.current;
    
    if (diff === 1) {
      // Easy: Constant slow speed
      currentSpeedRef.current = 0.4;
    } else if (diff === 2) {
      // Medium: Random speed changes between 0.4 (slow) and 0.8 (fast)
      currentSpeedRef.current = 0.6;
      speedRandomizerRef.current = setInterval(() => {
        currentSpeedRef.current = 0.4 + Math.random() * 0.4; // Random between 0.4 and 0.8
      }, 3000); // Change speed every 3 seconds
    } else if (diff === 3) {
      // Hard: Fast speed with some variation
      currentSpeedRef.current = 0.9;
      speedRandomizerRef.current = setInterval(() => {
        currentSpeedRef.current = 0.8 + Math.random() * 0.3; // Random between 0.8 and 1.1
      }, 2000);
    } else {
      // Expert: Very fast constant speed
      currentSpeedRef.current = 1.2;
    }
  };

  const checkCollision = (letter: Letter | null, bucket: number) => {
    if (!letter || !containerRef.current) return false;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;
    
    const letterLeft = (letter.x / 100) * containerWidth;
    const letterRight = letterLeft + LETTER_SIZE;
    const letterBottom = (letter.y / 100) * containerHeight + LETTER_SIZE;
    
    const bucketLeft = (bucket / 100) * containerWidth;
    const bucketRight = bucketLeft + BUCKET_WIDTH;
    const bucketTop = containerHeight - 100;
    
    return (
      letterBottom >= bucketTop &&
      letterRight >= bucketLeft &&
      letterLeft <= bucketRight
    );
  };

  const handleCatch = (letter: Letter) => {
    const expected = targetWordRef.current[currentIndexRef.current];
    
    if (letter.char === expected) {
      // Correct letter caught
      setScore(s => s + 10);
      setPerfectCatches(p => p + 1);
      const newIndex = currentIndexRef.current + 1;
      setCurrentIndex(newIndex);
      currentIndexRef.current = newIndex;
      
      // Word completed - generate new word to continue until time runs out
      if (newIndex === targetWordRef.current.length) {
        const newWord = getRandomWord();
        setTargetWord(newWord);
        targetWordRef.current = newWord;
        setCurrentIndex(0);
        currentIndexRef.current = 0;
        setRoundsCompleted(r => r + 1);
        // Bonus for completing word
        setScore(s => s + 20);
      }
    } else {
      // Wrong letter caught
      setScore(s => Math.max(0, s - 5));
    }
  };

  const handleMiss = (letter: Letter) => {
    const expected = targetWordRef.current[currentIndexRef.current];
    if (letter.char === expected) {
      // Missed the correct letter
      setScore(s => Math.max(0, s - 5));
      setMissedLetters(m => m + 1);
    }
  };

  // Save game state periodically
  useEffect(() => {
    if (gameState !== 'playing') return;

    const saveInterval = setInterval(() => {
      const gameStateData = {
        score,
        timeLeft,
        targetWord,
        currentIndex,
        roundsCompleted,
        perfectCatches,
        missedLetters,
        difficulty,
        duration
      };
      sessionStorage.setItem("word_bucket_game_state", JSON.stringify(gameStateData));
    }, 2000); // Save every 2 seconds

    return () => clearInterval(saveInterval);
  }, [gameState, score, timeLeft, targetWord, currentIndex, roundsCompleted, perfectCatches, missedLetters, difficulty, duration]);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = () => {
      setFallingLetter(prev => {
        if (!prev) return generateLetter();
        
        const updated = { ...prev, y: prev.y + prev.speed };
        
        if (checkCollision(updated, bucketXRef.current)) {
          handleCatch(updated);
          return generateLetter();
        }
        
        if (updated.y > 105) {
          handleMiss(updated);
          return generateLetter();
        }
        
        return updated;
      });
      
      rafRef.current = requestAnimationFrame(gameLoop);
    };
    
    rafRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (speedRandomizerRef.current) clearInterval(speedRandomizerRef.current);
    };
  }, [gameState]);

  // Timer
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          handleTimeUp();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState]);

  const handleTimeUp = async () => {
    // Clear intervals
    if (timerRef.current) clearInterval(timerRef.current);
    if (speedRandomizerRef.current) clearInterval(speedRandomizerRef.current);
    
    setGameState('ended');
    await saveGameData();
    
    // Clear saved game state
    sessionStorage.removeItem("word_bucket_game_state");
    
    // Navigate to result page
    router.push("/learning/textual/result");
  };

  const checkForDuplicate = async (gameStats: any) => {
    if (!user) return false;

    try {
      const gameRef = ref(database, `games/word-bucket/${user.uid}`);
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
            entry.roundsCompleted === gameStats.roundsCompleted
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

  const saveGameData = async () => {
    if (!user || isSavingRef.current) return;

    isSavingRef.current = true;

    const totalLetters = perfectCatches + missedLetters;
    const accuracy = totalLetters > 0 ? Math.round((perfectCatches / totalLetters) * 100) : 0;
    const timeElapsed = Math.max(0, duration * 60 - timeLeft);

    const gameData = {
      userId: user.uid,
      score: score,
      accuracy: accuracy,
      roundsCompleted: roundsCompleted,
      perfectCatches: perfectCatches,
      missedLetters: missedLetters,
      difficulty: difficulty,
      duration: timeElapsed,
      timestamp: Date.now(),
      gameId: "word-bucket",
      status: "completed"
    };

    try {
      // Check for duplicates
      const isDuplicate = await checkForDuplicate(gameData);
      
      if (isDuplicate) {
        console.log("Duplicate game detected, skipping save");
        isSavingRef.current = false;
        return;
      }

      // Save to Firebase
      const gamesRef = ref(database, `games/word-bucket/${user.uid}`);
      await push(gamesRef, gameData);

      // Save to sessionStorage for result page (in the format expected by result page)
      const resultData = {
        score: score,
        timeElapsed: timeElapsed,
        difficulty: difficulty,
        accuracy: accuracy,
        completedWords: roundsCompleted,
        gameId: "word-bucket",
        status: "completed",
        timestamp: Date.now()
      };
      sessionStorage.setItem("textual_game_result", JSON.stringify(resultData));
      
      console.log("Word Bucket game data saved successfully");
    } catch (error) {
      console.error("Error saving game data:", error);
    } finally {
      isSavingRef.current = false;
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (gameState !== 'playing' || !containerRef.current || !bucketRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - containerRect.left;
    const containerWidth = containerRect.width;
    
    let bucketPercent = (mouseX / containerWidth) * 100 - (BUCKET_WIDTH / containerWidth * 100 / 2);
    bucketPercent = Math.max(0, Math.min(100 - (BUCKET_WIDTH / containerWidth * 100), bucketPercent));
    
    // Update ref for collision detection
    bucketXRef.current = bucketPercent;
    
    // Update bucket position directly via transform for smooth movement
    bucketRef.current.style.transform = `translateX(${bucketPercent}vw)`;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (gameState !== 'playing' || !containerRef.current || !bucketRef.current) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    const containerRect = containerRef.current.getBoundingClientRect();
    const touchX = touch.clientX - containerRect.left;
    const containerWidth = containerRect.width;
    
    let bucketPercent = (touchX / containerWidth) * 100 - (BUCKET_WIDTH / containerWidth * 100 / 2);
    bucketPercent = Math.max(0, Math.min(100 - (BUCKET_WIDTH / containerWidth * 100), bucketPercent));
    
    // Update ref for collision detection
    bucketXRef.current = bucketPercent;
    
    // Update bucket position directly via transform for smooth movement
    bucketRef.current.style.transform = `translateX(${bucketPercent}vw)`;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleBackToMenu = () => {
    router.push("/learning/textual");
  };

  const getDifficultyLabel = () => {
    const labels = ["Easy", "Medium", "Hard", "Expert"];
    return labels[difficulty - 1] || "Medium";
  };

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <ExpressifySidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/me/home">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/learning/textual">Textual Learning</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Word Bucket</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>

          {/* Game Area */}
          {gameState === 'playing' && (
            <div 
              ref={containerRef}
              className="relative w-full h-[calc(100vh-4rem)] overflow-hidden bg-gradient-to-b from-background to-muted/20 cursor-none"
              onMouseMove={handleMouseMove}
              onTouchMove={handleTouchMove}
            >
              {/* Stats Bar */}
              <div className="absolute top-0 left-0 right-0 z-10 bg-background/95 backdrop-blur-sm border-b">
                <div className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium text-muted-foreground">Score:</span>
                      <span className="text-xl font-bold text-primary">{score}</span>
                    </div>
                    <Separator orientation="vertical" className="h-6" />
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-green-500" />
                      <span className="text-sm font-medium text-muted-foreground">Words:</span>
                      <span className="text-xl font-bold">{roundsCompleted}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-orange-500" />
                      <span className="text-sm font-medium text-muted-foreground">Time:</span>
                      <span className="text-xl font-bold text-orange-500">{formatTime(timeLeft)}</span>
                    </div>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={handleTimeUp}
                      className="cursor-pointer"
                      style={{ pointerEvents: 'auto' }}
                    >
                      End Now
                    </Button>
                  </div>
                </div>
              </div>

              {/* Target Word Section */}
              <div className="absolute top-20 left-0 right-0 z-10 flex flex-col items-center gap-4 px-4">
                <Badge variant="secondary" className="text-sm">
                  Target Word
                </Badge>
                <div className="flex items-center gap-3">
                  {targetWord.split('').map((char, i) => (
                    <div
                      key={i}
                      className={`w-12 h-14 flex items-center justify-center text-2xl font-bold rounded-md border-2 transition-all ${
                        i < currentIndex
                          ? 'bg-primary/20 border-primary text-primary shadow-lg shadow-primary/20'
                          : 'bg-muted border-muted-foreground/20 text-muted-foreground'
                      }`}
                    >
                      {char}
                    </div>
                  ))}
                </div>
                <div className="text-sm text-muted-foreground">
                  Progress: {currentIndex} / {targetWord.length}
                </div>
              </div>

              {/* Falling Letter */}
              {fallingLetter && (
                <div
                  className="absolute w-12 h-12 flex items-center justify-center text-2xl font-bold bg-primary/20 backdrop-blur-sm border-2 border-primary text-primary rounded-md shadow-lg shadow-primary/50 z-20"
                  style={{
                    left: `${fallingLetter.x}%`,
                    top: `${fallingLetter.y}%`,
                  }}
                >
                  {fallingLetter.char}
                </div>
              )}

              {/* Bucket */}
              <div
                ref={bucketRef}
                className="absolute bottom-24 pointer-events-none z-30"
                style={{ 
                  left: '0',
                  transform: `translateX(${bucketX}vw)`,
                  willChange: 'transform',
                  width: `${BUCKET_WIDTH}px`,
                  height: '120px'
                }}
              >
                <Lottie 
                  animationData={shoppingAnimation} 
                  loop={true}
                  style={{ width: '100%', height: '100%', }}
                />
              </div>

              {/* Instructions */}
              <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                <Badge variant="outline" className="text-xs">
                  Move your cursor to control the bucket
                </Badge>
              </div>
            </div>
          )}
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
