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
import { Badge } from "@/components/ui/badge";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Clock, Trophy, Sparkles, CheckCircle2, XCircle, Bell, Target, Loader2 } from "lucide-react";
import { ref, push, get } from "firebase/database";
import { database } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { generateVocabularyQuestions, type VocabularyWordSet } from "@/lib/groqService";

// ============================================
// FALLBACK DATA - Used only if AI generation fails
// ============================================
const FALLBACK_WORD_SETS: Record<number, VocabularyWordSet[]> = {
  1: [ // Easy (5 rounds)
    {
      target: 'HAPPY',
      synonyms: ['joyful', 'cheerful', 'pleased'],
      antonyms: ['sad', 'gloomy'],
      distractors: ['angry', 'tired', 'hungry', 'loud', 'bright']
    },
    {
      target: 'FAST',
      synonyms: ['quick', 'rapid', 'swift'],
      antonyms: ['slow', 'sluggish'],
      distractors: ['loud', 'soft', 'heavy', 'round', 'sharp']
    },
    {
      target: 'BIG',
      synonyms: ['large', 'huge', 'giant'],
      antonyms: ['small', 'tiny'],
      distractors: ['round', 'flat', 'tall', 'wide', 'heavy']
    },
    {
      target: 'BRIGHT',
      synonyms: ['shiny', 'brilliant', 'radiant'],
      antonyms: ['dark', 'dim'],
      distractors: ['soft', 'loud', 'smooth', 'rough', 'warm']
    },
    {
      target: 'EASY',
      synonyms: ['simple', 'effortless', 'basic'],
      antonyms: ['hard', 'difficult'],
      distractors: ['quick', 'slow', 'heavy', 'light', 'strong']
    }
  ],
  2: [ // Medium (8 rounds)
    {
      target: 'BRAVE',
      synonyms: ['courageous', 'fearless', 'bold'],
      antonyms: ['cowardly', 'timid'],
      distractors: ['reckless', 'careful', 'wise', 'foolish', 'strong']
    },
    {
      target: 'GENUINE',
      synonyms: ['authentic', 'real', 'sincere'],
      antonyms: ['fake', 'artificial'],
      distractors: ['expensive', 'common', 'valuable', 'broken', 'old']
    },
    {
      target: 'ABUNDANT',
      synonyms: ['plentiful', 'ample', 'copious'],
      antonyms: ['scarce', 'sparse'],
      distractors: ['expensive', 'colorful', 'fragile', 'distant', 'modern']
    },
    {
      target: 'ANCIENT',
      synonyms: ['old', 'archaic', 'antique'],
      antonyms: ['modern', 'new'],
      distractors: ['broken', 'expensive', 'beautiful', 'valuable', 'rare']
    },
    {
      target: 'COMPLEX',
      synonyms: ['intricate', 'complicated', 'elaborate'],
      antonyms: ['simple', 'basic'],
      distractors: ['expensive', 'beautiful', 'large', 'small', 'useful']
    },
    {
      target: 'SERENE',
      synonyms: ['peaceful', 'calm', 'tranquil'],
      antonyms: ['chaotic', 'turbulent'],
      distractors: ['beautiful', 'ugly', 'bright', 'dark', 'loud']
    },
    {
      target: 'EFFICIENT',
      synonyms: ['effective', 'productive', 'capable'],
      antonyms: ['inefficient', 'wasteful'],
      distractors: ['expensive', 'cheap', 'modern', 'old', 'broken']
    },
    {
      target: 'HOSTILE',
      synonyms: ['unfriendly', 'antagonistic', 'aggressive'],
      antonyms: ['friendly', 'welcoming'],
      distractors: ['loud', 'quiet', 'strong', 'weak', 'fast']
    }
  ],
  3: [ // Hard (10 rounds)
    {
      target: 'EPHEMERAL',
      synonyms: ['fleeting', 'transient', 'momentary'],
      antonyms: ['permanent', 'enduring'],
      distractors: ['ethereal', 'tangible', 'volatile', 'mundane', 'static']
    },
    {
      target: 'TACITURN',
      synonyms: ['reserved', 'reticent', 'laconic'],
      antonyms: ['talkative', 'garrulous'],
      distractors: ['eloquent', 'articulate', 'cryptic', 'verbose', 'mumbling']
    },
    {
      target: 'UBIQUITOUS',
      synonyms: ['omnipresent', 'pervasive', 'universal'],
      antonyms: ['rare', 'isolated'],
      distractors: ['ambiguous', 'conspicuous', 'obsolete', 'sporadic', 'elusive']
    },
    {
      target: 'ZEALOUS',
      synonyms: ['fervent', 'passionate', 'ardent'],
      antonyms: ['apathetic', 'indifferent'],
      distractors: ['cautious', 'reckless', 'modest', 'arrogant', 'timid']
    },
    {
      target: 'METICULOUS',
      synonyms: ['careful', 'thorough', 'precise'],
      antonyms: ['careless', 'sloppy'],
      distractors: ['hasty', 'deliberate', 'casual', 'formal', 'rigid']
    },
    {
      target: 'BENEVOLENT',
      synonyms: ['kind', 'charitable', 'generous'],
      antonyms: ['malevolent', 'cruel'],
      distractors: ['neutral', 'indifferent', 'selfish', 'humble', 'proud']
    },
    {
      target: 'LUCID',
      synonyms: ['clear', 'coherent', 'intelligible'],
      antonyms: ['confused', 'obscure'],
      distractors: ['ambiguous', 'precise', 'vague', 'abstract', 'literal']
    },
    {
      target: 'CANDID',
      synonyms: ['frank', 'honest', 'straightforward'],
      antonyms: ['deceptive', 'evasive'],
      distractors: ['tactful', 'blunt', 'subtle', 'diplomatic', 'vague']
    },
    {
      target: 'AUSTERE',
      synonyms: ['stern', 'severe', 'strict'],
      antonyms: ['lenient', 'indulgent'],
      distractors: ['moderate', 'flexible', 'harsh', 'gentle', 'neutral']
    },
    {
      target: 'PRAGMATIC',
      synonyms: ['practical', 'realistic', 'sensible'],
      antonyms: ['idealistic', 'impractical'],
      distractors: ['theoretical', 'concrete', 'abstract', 'logical', 'emotional']
    }
  ],
  4: [ // Expert (12 rounds)
    {
      target: 'PROPITIOUS',
      synonyms: ['favorable', 'auspicious', 'advantageous'],
      antonyms: ['unfavorable', 'inauspicious'],
      distractors: ['ominous', 'neutral', 'ambiguous', 'fortuitous', 'inevitable']
    },
    {
      target: 'OBDURATE',
      synonyms: ['stubborn', 'inflexible', 'obstinate'],
      antonyms: ['flexible', 'compliant'],
      distractors: ['determined', 'wavering', 'resolute', 'docile', 'firm']
    },
    {
      target: 'EBULLIENT',
      synonyms: ['enthusiastic', 'exuberant', 'vivacious'],
      antonyms: ['subdued', 'somber'],
      distractors: ['lively', 'calm', 'animated', 'reserved', 'cheerful']
    },
    {
      target: 'SAGACIOUS',
      synonyms: ['wise', 'perceptive', 'astute'],
      antonyms: ['foolish', 'naive'],
      distractors: ['intelligent', 'ignorant', 'shrewd', 'simple', 'learned']
    },
    {
      target: 'PERFUNCTORY',
      synonyms: ['cursory', 'superficial', 'hasty'],
      antonyms: ['thorough', 'meticulous'],
      distractors: ['careless', 'careful', 'casual', 'deliberate', 'rushed']
    },
    {
      target: 'LACHRYMOSE',
      synonyms: ['tearful', 'mournful', 'sorrowful'],
      antonyms: ['cheerful', 'joyful'],
      distractors: ['emotional', 'stoic', 'sad', 'happy', 'melancholy']
    },
    {
      target: 'RECALCITRANT',
      synonyms: ['defiant', 'unruly', 'obstinate'],
      antonyms: ['obedient', 'compliant'],
      distractors: ['rebellious', 'submissive', 'stubborn', 'cooperative', 'resistant']
    },
    {
      target: 'SANGUINE',
      synonyms: ['optimistic', 'hopeful', 'confident'],
      antonyms: ['pessimistic', 'gloomy'],
      distractors: ['realistic', 'idealistic', 'cheerful', 'doubtful', 'certain']
    },
    {
      target: 'PARSIMONIOUS',
      synonyms: ['frugal', 'stingy', 'miserly'],
      antonyms: ['generous', 'lavish'],
      distractors: ['thrifty', 'wasteful', 'economical', 'extravagant', 'careful']
    },
    {
      target: 'INTREPID',
      synonyms: ['fearless', 'brave', 'dauntless'],
      antonyms: ['cowardly', 'timid'],
      distractors: ['cautious', 'bold', 'reckless', 'careful', 'heroic']
    },
    {
      target: 'LOQUACIOUS',
      synonyms: ['talkative', 'garrulous', 'verbose'],
      antonyms: ['taciturn', 'reticent'],
      distractors: ['eloquent', 'silent', 'chatty', 'quiet', 'articulate']
    },
    {
      target: 'FASTIDIOUS',
      synonyms: ['meticulous', 'particular', 'demanding'],
      antonyms: ['careless', 'sloppy'],
      distractors: ['careful', 'casual', 'precise', 'relaxed', 'thorough']
    }
  ]
};

// ============================================
// WORD TILE COMPONENT
// ============================================
interface WordTileProps {
  word: string;
  onDragStart: (word: string) => void;
  isSubmitted: boolean;
  status: 'correct' | 'incorrect' | null;
}

const WordTile = ({ word, onDragStart, isSubmitted, status }: WordTileProps) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', word);
    onDragStart(word);
  };

  const getStatusClass = () => {
    if (!isSubmitted) return 'bg-card hover:bg-accent cursor-grab active:cursor-grabbing border-border hover:border-primary';
    if (status === 'correct') return 'bg-green-500/20 border-green-500';
    if (status === 'incorrect') return 'bg-destructive/20 border-destructive';
    return 'bg-card border-border';
  };

  return (
    <div
      draggable={!isSubmitted}
      onDragStart={handleDragStart}
      className={`px-4 py-2 rounded-lg border-2 transition-all duration-200 ${getStatusClass()}`}
    >
      <span className="text-foreground font-medium text-sm uppercase tracking-wide">
        {word}
      </span>
    </div>
  );
};

// ============================================
// DROP ZONE COMPONENT
// ============================================
interface DropZoneProps {
  label: string;
  words: string[];
  onDrop: (word: string, zoneType: 'synonym' | 'antonym') => void;
  onRemove: (word: string, zoneType: 'synonym' | 'antonym') => void;
  isSubmitted: boolean;
  correctWords: string[];
  type: 'synonym' | 'antonym';
}

const DropZone = ({ label, words, onDrop, onRemove, isSubmitted, correctWords, type }: DropZoneProps) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isSubmitted) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!isSubmitted) {
      const word = e.dataTransfer.getData('text/plain');
      onDrop(word, type);
    }
  };

  const getWordStatus = (word: string) => {
    if (!isSubmitted) return null;
    return correctWords.includes(word) ? 'correct' : 'incorrect';
  };

  return (
    <Card
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`min-h-48 transition-all duration-300 ${
        isDragOver ? 'border-primary bg-primary/10 scale-[1.02]' : ''
      }`}
    >
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          {type === 'synonym' ? '👍' : '👎'} {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {words.length === 0 && (
            <p className="text-muted-foreground italic text-sm">Drop words here...</p>
          )}
          <AnimatePresence>
            {words.map((word, index) => (
              <motion.div
                key={`${word}-${index}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative group"
              >
                <WordTile
                  word={word}
                  onDragStart={() => {}}
                  isSubmitted={isSubmitted}
                  status={getWordStatus(word)}
                />
                {!isSubmitted && (
                  <button
                    onClick={() => onRemove(word, type)}
                    className="absolute -top-2 -right-2 bg-destructive hover:bg-destructive/80 text-destructive-foreground rounded-full w-5 h-5 text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    ×
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================
// MAIN GAME COMPONENT
// ============================================
export default function VocabularyQuestPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [difficulty, setDifficulty] = useState(1);
  const [duration, setDuration] = useState(10);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [score, setScore] = useState(0);
  const [currentRound, setCurrentRound] = useState(0);
  const [synonymDropZone, setSynonymDropZone] = useState<string[]>([]);
  const [antonymDropZone, setAntonymDropZone] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [roundsCompleted, setRoundsCompleted] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [roundScore, setRoundScore] = useState(0);
  const [wordSets, setWordSets] = useState<VocabularyWordSet[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);
  const hasCalledTimeUpRef = useRef(false);

  const currentWordSet = wordSets[currentRound];
  const totalRounds = wordSets.length;

  // Shuffle array utility
  const shuffleArray = (array: string[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Initialize game
  useEffect(() => {
    const savedDifficulty = sessionStorage.getItem("textual_game_difficulty");
    const savedDuration = sessionStorage.getItem("textual_game_duration");
    
    if (savedDifficulty) setDifficulty(parseInt(savedDifficulty));
    if (savedDuration) setDuration(parseInt(savedDuration));

    // Check for existing game session
    const savedGameState = sessionStorage.getItem("vocabulary_quest_game_state");
    
    if (savedGameState) {
      try {
        const gameState = JSON.parse(savedGameState);
        setScore(gameState.score);
        setCurrentRound(gameState.currentRound);
        setRoundsCompleted(gameState.roundsCompleted);
        setCorrectAnswers(gameState.correctAnswers);
        setTotalAttempts(gameState.totalAttempts);
        setTimeElapsed(gameState.timeElapsed);
        setWordSets(gameState.wordSets || []);
        setGameStarted(true);
        setIsLoadingQuestions(false);
        console.log("Restored game state from session");
      } catch (error) {
        console.error("Error restoring game state:", error);
        loadNewGame(savedDifficulty);
      }
    } else {
      loadNewGame(savedDifficulty);
    }
  }, []);

  // Load AI-generated questions
  const loadNewGame = async (savedDifficulty: string | null) => {
    const diff = parseInt(savedDifficulty || "1");
    setIsLoadingQuestions(true);
    
    try {
      // Determine number of rounds based on difficulty
      const roundsMap: Record<number, number> = {
        1: 5,   // Easy: 5 rounds
        2: 8,   // Medium: 8 rounds
        3: 10,  // Hard: 10 rounds
        4: 12   // Expert: 12 rounds
      };
      
      const numberOfRounds = roundsMap[diff] || 8;
      
      console.log(`Loading ${numberOfRounds} AI-generated vocabulary questions for difficulty ${diff}...`);
      const generatedWordSets = await generateVocabularyQuestions(diff, numberOfRounds);
      
      setWordSets(generatedWordSets);
      setGameStarted(true);
      
      // Save initial game state with word sets
      const initialGameState = {
        wordSets: generatedWordSets,
        score: 0,
        currentRound: 0,
        roundsCompleted: 0,
        correctAnswers: 0,
        totalAttempts: 0,
        timeElapsed: 0,
        timestamp: Date.now()
      };
      sessionStorage.setItem("vocabulary_quest_game_state", JSON.stringify(initialGameState));
      
      console.log(`Successfully loaded ${generatedWordSets.length} word sets`);
    } catch (error) {
      console.error("Error loading vocabulary questions:", error);
      
      // Use fallback data
      const fallbackSets = FALLBACK_WORD_SETS[diff] || FALLBACK_WORD_SETS[2];
      setWordSets(fallbackSets);
      setGameStarted(true);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  // Initialize round
  useEffect(() => {
    if (gameStarted && currentWordSet) {
      const allWords = [
        ...currentWordSet.synonyms,
        ...currentWordSet.antonyms,
        ...currentWordSet.distractors
      ];
      setAvailableWords(shuffleArray(allWords));
      setSynonymDropZone([]);
      setAntonymDropZone([]);
      setIsSubmitted(false);
    }
  }, [gameStarted, currentRound, difficulty]);

  // Save game state
  useEffect(() => {
    if (gameStarted && wordSets.length > 0) {
      const gameState = {
        wordSets,
        score,
        currentRound,
        roundsCompleted,
        correctAnswers,
        totalAttempts,
        timeElapsed,
        timestamp: Date.now()
      };
      sessionStorage.setItem("vocabulary_quest_game_state", JSON.stringify(gameState));
    }
  }, [score, currentRound, roundsCompleted, correctAnswers, totalAttempts, timeElapsed, gameStarted, wordSets]);

  // Timer
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
      hasCalledTimeUpRef.current = true;
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      setTimeout(() => {
        handleTimeUp();
      }, 100);
    }
  }, [timeElapsed, duration, gameStarted]);

  const checkForDuplicate = async (gameStats: any) => {
    if (!user) return false;

    try {
      const gameRef = ref(database, `games/vocabulary-quest/${user.uid}`);
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
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (!user || isSavingRef.current) return;
    isSavingRef.current = true;

    const accuracy = totalAttempts > 0 
      ? Math.round((correctAnswers / totalAttempts) * 100) 
      : 0;

    const gameStats = {
      score,
      timeElapsed: duration * 60,
      difficulty,
      completedWords: roundsCompleted,
      totalWords: totalRounds,
      accuracy,
      gameId: "vocabulary-quest",
      status: "timeout",
      timestamp: Date.now(),
    };

    try {
      const isDuplicate = await checkForDuplicate(gameStats);
      
      if (!isDuplicate) {
        const gameRef = ref(database, `games/vocabulary-quest/${user.uid}`);
        await push(gameRef, gameStats);
        console.log("Time up - Vocabulary Quest data saved successfully");
      }
    } catch (error) {
      console.error("Error saving to Firebase:", error);
    }

    sessionStorage.removeItem("vocabulary_quest_game_state");
    sessionStorage.setItem("textual_game_result", JSON.stringify(gameStats));
    router.push("/learning/textual/result");
  };

  const finishGame = async () => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (!user || isSavingRef.current) return;
    isSavingRef.current = true;

    const accuracy = totalAttempts > 0 
      ? Math.round((correctAnswers / totalAttempts) * 100) 
      : 0;

    const gameStats = {
      score,
      timeElapsed,
      difficulty,
      completedWords: roundsCompleted + 1,
      totalWords: totalRounds,
      accuracy,
      gameId: "vocabulary-quest",
      status: "completed",
      timestamp: Date.now(),
    };

    if (user) {
      try {
        const isDuplicate = await checkForDuplicate(gameStats);
        
        if (!isDuplicate) {
          const gameRef = ref(database, `games/vocabulary-quest/${user.uid}`);
          await push(gameRef, gameStats);
          console.log("Vocabulary Quest data saved successfully");
        }
      } catch (error) {
        console.error("Error saving to Firebase:", error);
      }
    }

    sessionStorage.removeItem("vocabulary_quest_game_state");
    sessionStorage.setItem("textual_game_result", JSON.stringify(gameStats));
    router.push("/learning/textual/result");
  };

  const handleDrop = (word: string, zoneType: 'synonym' | 'antonym') => {
    setAvailableWords(prev => prev.filter(w => w !== word));
    
    if (zoneType === 'synonym') {
      setAntonymDropZone(prev => prev.filter(w => w !== word));
      setSynonymDropZone(prev => [...prev, word]);
    } else {
      setSynonymDropZone(prev => prev.filter(w => w !== word));
      setAntonymDropZone(prev => [...prev, word]);
    }
  };

  const handleRemove = (word: string, zoneType: 'synonym' | 'antonym') => {
    if (zoneType === 'synonym') {
      setSynonymDropZone(prev => prev.filter(w => w !== word));
    } else {
      setAntonymDropZone(prev => prev.filter(w => w !== word));
    }
    setAvailableWords(prev => [...prev, word]);
  };

  const handleSubmit = () => {
    let roundPoints = 0;
    let correctCount = 0;
    let totalCount = 0;

    // Check synonyms
    synonymDropZone.forEach(word => {
      totalCount++;
      if (currentWordSet.synonyms.includes(word)) {
        roundPoints += 10;
        correctCount++;
      }
    });

    // Check antonyms
    antonymDropZone.forEach(word => {
      totalCount++;
      if (currentWordSet.antonyms.includes(word)) {
        roundPoints += 10;
        correctCount++;
      }
    });

    // Perfect round bonus
    if (correctCount === (currentWordSet.synonyms.length + currentWordSet.antonyms.length) &&
        synonymDropZone.length === currentWordSet.synonyms.length &&
        antonymDropZone.length === currentWordSet.antonyms.length) {
      roundPoints += 20;
      setFeedbackMessage('Perfect Round! +20 Bonus');
    } else if (correctCount > 0) {
      setFeedbackMessage(`${correctCount}/${totalCount} Correct`);
    } else {
      setFeedbackMessage('Try Again!');
    }

    setScore(prev => prev + roundPoints);
    setRoundScore(roundPoints);
    setCorrectAnswers(prev => prev + correctCount);
    setTotalAttempts(prev => prev + totalCount);
    setIsSubmitted(true);
    setShowFeedback(true);

    setTimeout(() => {
      setShowFeedback(false);
    }, 2000);
  };

  const handleNextRound = () => {
    setRoundsCompleted(prev => prev + 1);
    
    if (currentRound < totalRounds - 1) {
      setCurrentRound(prev => prev + 1);
    } else {
      finishGame();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const timeLeft = (duration * 60) - timeElapsed;
  const progress = totalRounds > 0 ? (roundsCompleted / totalRounds) * 100 : 0;

  if (isLoadingQuestions || !gameStarted || !currentWordSet) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">
              {isLoadingQuestions ? "Generating vocabulary questions with AI..." : "Loading game..."}
            </p>
          </div>
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
                    <BreadcrumbPage>Vocabulary Quest</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            <div className="ml-auto flex items-center gap-2 px-4">
              <Badge variant="outline" className="hidden sm:flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTime(timeLeft)}
              </Badge>
              <Badge variant="outline" className="hidden sm:flex items-center gap-1">
                <Trophy className="h-3 w-3" />
                {score} pts
              </Badge>
              <Badge variant="outline" className="hidden sm:flex items-center gap-1">
                <Target className="h-3 w-3" />
                Round {currentRound + 1}/{totalRounds}
              </Badge>
            </div>
          </header>

          {/* Content */}
          <div className="flex flex-1 flex-col gap-2 p-2 pt-0 sm:gap-4 sm:p-4">
            <div className="min-h-[calc(100vh-4rem)] flex-1 rounded-lg p-3 sm:rounded-xl sm:p-4 md:p-6">
              <div className="mx-auto max-w-5xl space-y-4">
                {/* Game Status - Top Bar */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-card border">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Clock className={`h-5 w-5 ${timeLeft <= 60 ? "text-red-500 animate-pulse" : "text-primary"}`} />
                      <div>
                        <p className="text-xs text-muted-foreground">Time Left</p>
                        <p className={`text-sm font-bold ${timeLeft <= 60 ? "text-red-500" : ""}`}>
                          {formatTime(timeLeft)}
                        </p>
                      </div>
                    </div>
                    
                    <Separator orientation="vertical" className="h-10" />
                    
                    <div className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-yellow-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Score</p>
                        <p className="text-sm font-bold">{score}</p>
                      </div>
                    </div>
                    
                    <Separator orientation="vertical" className="h-10" />
                    
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-purple-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Progress</p>
                        <p className="text-sm font-bold">{Math.round(progress)}%</p>
                      </div>
                    </div>
                    
                    <Separator orientation="vertical" className="h-10" />
                    
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Accuracy</p>
                        <p className="text-sm font-bold">
                          {totalAttempts > 0 ? Math.round((correctAnswers / totalAttempts) * 100) : 0}%
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <Button variant="destructive" size="sm" onClick={handleTimeUp}>
                    Exit Game
                  </Button>
                </div>

                {/* Feedback Message */}
                <AnimatePresence>
                  {showFeedback && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="text-center"
                    >
                      <Badge variant={roundScore > 0 ? "default" : "destructive"} className="text-lg py-2 px-4">
                        {feedbackMessage} {roundScore > 0 && `+${roundScore} points`}
                      </Badge>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Target Word */}
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Target Word</p>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-wider text-primary">
                      {currentWordSet.target}
                    </h2>
                  </CardContent>
                </Card>

                {/* Drop Zones */}
                <div className="grid md:grid-cols-2 gap-4">
                  <DropZone
                    label="Synonyms (Similar Meaning)"
                    words={synonymDropZone}
                    onDrop={handleDrop}
                    onRemove={handleRemove}
                    isSubmitted={isSubmitted}
                    correctWords={currentWordSet.synonyms}
                    type="synonym"
                  />
                  <DropZone
                    label="Antonyms (Opposite Meaning)"
                    words={antonymDropZone}
                    onDrop={handleDrop}
                    onRemove={handleRemove}
                    isSubmitted={isSubmitted}
                    correctWords={currentWordSet.antonyms}
                    type="antonym"
                  />
                </div>

                {/* Available Words */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Available Words</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {availableWords.length === 0 && (
                        <p className="text-muted-foreground italic text-sm">All words placed!</p>
                      )}
                      <AnimatePresence>
                        {availableWords.map((word, index) => (
                          <motion.div
                            key={`${word}-${index}`}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                          >
                            <WordTile
                              word={word}
                              onDragStart={() => {}}
                              isSubmitted={false}
                              status={null}
                            />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex justify-center gap-3">
                  {!isSubmitted ? (
                    <Button
                      onClick={handleSubmit}
                      disabled={synonymDropZone.length === 0 && antonymDropZone.length === 0}
                      size="lg"
                      className="min-w-[200px]"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Submit Answers
                    </Button>
                  ) : (
                    <Button
                      onClick={handleNextRound}
                      size="lg"
                      className="min-w-[200px]"
                    >
                      {currentRound < totalRounds - 1 ? 'Next Round' : 'Finish Game'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
