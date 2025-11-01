"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { SidebarProvider } from '@/components/ui/sidebar';
import { ExpressifySidebar } from '@/components/ui/expressify-sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ArrowLeft, 
  Users, 
  MessageCircle, 
  Send, 
  Timer, 
  Target, 
  Trophy,
  Crown,
  MousePointer2,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { useGameSessions, useGameSession } from '@/hooks/useCollaboration';
import { ref, set, get, onValue, remove } from 'firebase/database';
import { database } from '@/lib/firebase';
import { generateWikipediaSentence, WikipediaSentence, validateSentence } from '@/lib/wikipediaService';

// Types
interface WordItem {
  id: string;
  text: string;
  isPlaced: boolean;
  placedInSlot?: number;
  draggedBy?: string;
  isCorrect?: boolean;
}

interface GameSentence {
  id: string;
  template: string;
  slots: Array<{
    id: number;
    correctWord: string;
    position: number;
  }>;
  words: WordItem[];
  difficulty: string;
  theme: string;
  original?: string;
}

interface Cursor {
  playerId: string;
  playerName: string;
  x: number;
  y: number;
  color: string;
  lastUpdate: number;
  draggedWordText?: string; // Added for showing dragged word
}

// User Avatar Component
const UserAvatar = ({ user, size = "md" }: { user: any; size?: "sm" | "md" | "lg" }) => {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10", 
    lg: "h-12 w-12"
  };

  return (
    <Avatar className={sizeClasses[size]}>
      <AvatarImage src={user.avatar} alt={user.name} />
      <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
    </Avatar>
  );
};

// Player colors for cursors
const PLAYER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
  '#FECA57', '#FF9FF3', '#54A0FF', '#5F27CD'
];

export default function GamePage() {
  const router = useRouter();
  const params = useParams();
  const gameCode = params?.gameCode as string;
  const { user } = useAuth();

  // Game session data
  const { sessions: allGames } = useGameSessions();
  const { 
    session: gameData, 
    chatMessages, 
    loading: gameLoading, 
    addChatMessage, 
    togglePlayerReady
  } = useGameSession(gameCode);

  // Game state
  const [gamePhase, setGamePhase] = useState<'waiting' | 'playing' | 'finished'>('waiting');
  const [currentSentence, setCurrentSentence] = useState<GameSentence | null>(null);
  const [words, setWords] = useState<WordItem[]>([]);
  const [cursors, setCursors] = useState<Record<string, Cursor>>({});
  const [draggedWord, setDraggedWord] = useState<string | null>(null);
  const [gameProgress, setGameProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [chatMessage, setChatMessage] = useState('');
  const [joinedAt, setJoinedAt] = useState<number>(Date.now());
  const [playerScores, setPlayerScores] = useState<Record<string, number>>({});
  const [playerMadeMove, setPlayerMadeMove] = useState(false); // Track if current user made a move this sentence
  const [sentenceStartTime, setSentenceStartTime] = useState<number>(Date.now());

  // Refs for game area and timer
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const draggedWordRef = useRef<string | null>(null);
  const wordsRef = useRef<WordItem[]>([]);
  const gameDataRef = useRef(gameData);

  // Update refs when state changes
  useEffect(() => {
    draggedWordRef.current = draggedWord;
  }, [draggedWord]);

  useEffect(() => {
    wordsRef.current = words;
  }, [words]);

  useEffect(() => {
    gameDataRef.current = gameData;
  }, [gameData]);

  // Player color assignment
  const getPlayerColor = useCallback((playerId: string) => {
    const playerIndex = gameData?.players.findIndex((p: any) => p.id === playerId) || 0;
    return PLAYER_COLORS[playerIndex % PLAYER_COLORS.length];
  }, [gameData?.players]);

  // Helper function to clean words data for Firebase (remove undefined values)
  const cleanWordsForFirebase = (wordsArray: WordItem[]) => {
    return wordsArray.map(word => {
      const cleanWord: any = { ...word };
      Object.keys(cleanWord).forEach(key => {
        if (cleanWord[key] === undefined) {
          delete cleanWord[key];
        }
      });
      return cleanWord;
    });
  };

  // Helper function to convert WikipediaSentence to GameSentence
  const convertWikiToGameSentence = (wikiSentence: WikipediaSentence): GameSentence => {
    return {
      id: `wiki-${Date.now()}`,
      template: wikiSentence.blankedTemplate,
      slots: wikiSentence.slots,
      words: wikiSentence.words.map(w => ({
        id: w.id,
        text: w.text,
        isPlaced: w.isPlaced,
      })),
      difficulty: wikiSentence.difficulty,
      theme: wikiSentence.topic,
      original: wikiSentence.original,
    };
  };

  // Helper function to generate new sentence based on game difficulty
  const generateNewSentence = async (): Promise<GameSentence> => {
    const difficulty = (gameData?.difficulty || 'easy') as 'easy' | 'medium' | 'hard';
    try {
      const wikiSentence = await generateWikipediaSentence(difficulty);
      return convertWikiToGameSentence(wikiSentence);
    } catch (error) {
      console.error('Error generating Wikipedia sentence:', error);
      toast.error('Failed to generate new sentence. Please try again.');
      throw error;
    }
  };

  // Initialize game with synchronized sentence (only host creates, others sync)
  useEffect(() => {
    if (gamePhase === 'playing' && gameData?.id && user) {
      const gameStateRef = ref(database, `gameSessions/${gameData.id}/gameState`);
      
      // First, listen for existing game state
      get(gameStateRef).then((snapshot) => {
        const existingState = snapshot.val();
        
        if (existingState?.currentSentence) {
          // Sync with existing game state
          setCurrentSentence(existingState.currentSentence);
          setWords(existingState.words || existingState.currentSentence.words);
          setGameProgress(existingState.progress || 0);
        } else {
          // Host initializes the game
          const isHost = gameData.players.find((p: any) => p.id === user.uid)?.isHost;
          if (isHost) {
            // Initialize player scores to 100
            const scoresRef = ref(database, `gameSessions/${gameData.id}/playerScores`);
            const initialScores: Record<string, number> = {};
            gameData.players.forEach((player: any) => {
              initialScores[player.id] = 100;
            });
            set(scoresRef, initialScores);

            // Generate Wikipedia sentence
            generateNewSentence().then(randomSentence => {
              const initialState = {
                currentSentence: randomSentence,
                words: randomSentence.words,
                progress: 0,
                sentenceStartTime: Date.now()
              };
              
              set(gameStateRef, initialState);
              setCurrentSentence(randomSentence);
              setWords(randomSentence.words);
              setGameProgress(0);
            }).catch(error => {
              console.error('Failed to initialize game:', error);
            });
          }
        }
      });

      // Listen for real-time updates
      const unsubscribe = onValue(gameStateRef, (snapshot) => {
        const gameState = snapshot.val();
        if (gameState) {
          // Check if sentence changed (new sentence loaded)
          if (currentSentence && gameState.currentSentence?.id !== currentSentence.id) {
            setPlayerMadeMove(false); // Reset move tracking for new sentence
            setSentenceStartTime(gameState.sentenceStartTime || Date.now());
          }
          
          setCurrentSentence(gameState.currentSentence);
          setWords(gameState.words || []);
          setGameProgress(gameState.progress || 0);
        }
      });

      // Listen for player scores
      const scoresRef = ref(database, `gameSessions/${gameData.id}/playerScores`);
      const unsubscribeScores = onValue(scoresRef, (snapshot) => {
        const scores = snapshot.val();
        if (scores) {
          setPlayerScores(scores);
        }
      });

      return () => {
        unsubscribe();
        unsubscribeScores();
      };
    }
  }, [gamePhase, gameData?.id, user]);

  // Check for game over conditions
  useEffect(() => {
    if (!gameData?.id || !user?.uid) return;

    const currentGame = allGames.find(g => g.id === gameData.id);
    
    if (currentGame) {
      if (currentGame.status === 'finished') {
        // Don't redirect here - let the timer handler redirect to results
        return;
      }
      
      const userInGame = currentGame.players.some((player: any) => player.id === user.uid);
      
      if (!userInGame) {
        toast.error('You are not part of this game');
        router.push('/training/social/collaborate');
        return;
      }
    }
  }, [user, allGames, gameCode, router]);

  // Sync game state with Firebase data
  useEffect(() => {
    if (gameData) {
      setGamePhase(gameData.status);
    }
  }, [gameData]);

  // Authoritative Firebase Timer System - Never pauses, always accurate
  useEffect(() => {
    if (gamePhase !== 'playing' || !gameData?.id) return;
    
    console.log('Timer system initializing for game:', gameData.id);
    const timerRef = ref(database, `gameSessions/${gameData.id}/timer`);
    const gameId = gameData.id;
    
    let timerInterval: NodeJS.Timeout | null = null;
    
    // Listen for timer data from Firebase
    const unsubscribe = onValue(timerRef, (snapshot) => {
      const timerData = snapshot.val();
      
      if (timerData) {
        console.log('Timer data received from Firebase:', timerData);
        const { startTime, duration } = timerData;
        
        // Clear any existing interval
        if (timerInterval) {
          clearInterval(timerInterval);
        }
        
        // Calculate and update remaining time every second
        const updateTimer = () => {
          const now = Date.now();
          const elapsed = Math.floor((now - startTime) / 1000);
          const remaining = Math.max(0, duration - elapsed);
          
          setTimeLeft(remaining);
          
          // When time runs out, end game
          if (remaining <= 0) {
            if (timerInterval) clearInterval(timerInterval);
            
            const currentGameData = gameDataRef.current;
            if (currentGameData && currentGameData.status !== 'finished') {
              const isHost = currentGameData.players.find((p: any) => p.id === user?.uid)?.isHost;
              if (isHost) {
                console.log('Timer reached 0, host ending game');
                handleGameEnd();
              }
            }
          }
        };
        
        // Update immediately
        updateTimer();
        
        // Then update every second
        timerInterval = setInterval(updateTimer, 1000);
        
        console.log('Timer interval started, updating every second');
      } else {
        console.log('No timer data found in Firebase - waiting for initialization');
      }
    });

    return () => {
      console.log('Timer cleanup - clearing interval and unsubscribing');
      if (timerInterval) clearInterval(timerInterval);
      unsubscribe();
    };
  }, [gamePhase, gameData?.id, user?.uid]);

  // Handle game end - update status and navigate to results
  const handleGameEnd = async () => {
    if (!gameData?.id) return;
    
    const gameRef = ref(database, `gameSessions/${gameData.id}`);
    
    try {
      // Update game status to finished
      await set(ref(database, `gameSessions/${gameData.id}/status`), 'finished');
      
      toast.success('Game finished! Viewing results...');
      
      // Navigate to results page
      setTimeout(() => {
        router.push(`/training/social/collaborate/${gameCode}/results`);
      }, 1000);
    } catch (error) {
      console.error('Error ending game:', error);
      toast.error('Failed to end game');
    }
  };

  // Mouse tracking for cursor sharing with dragged word info
  useEffect(() => {
    if (!gameAreaRef.current || !user || gamePhase !== 'playing') {
      console.log('Mouse tracking not started:', { hasRef: !!gameAreaRef.current, hasUser: !!user, gamePhase });
      return;
    }

    console.log('Mouse tracking started for game:', gameData?.id);

    const handleMouseMove = (e: MouseEvent) => {
      updateCursorPosition(e.clientX, e.clientY);
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault(); // Allow drop
      updateCursorPosition(e.clientX, e.clientY);
    };

    const updateCursorPosition = (clientX: number, clientY: number) => {
      const rect = gameAreaRef.current?.getBoundingClientRect();
      if (!rect) return;

      // Get coordinates relative to the game area container
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      // Only track if mouse is within the game area
      if (x >= 0 && y >= 0 && x <= rect.width && y <= rect.height) {
        // Convert to percentage-based coordinates for viewport independence
        const normalizedX = rect.width > 0 ? Math.max(0, Math.min((x / rect.width) * 100, 100)) : 0;
        const normalizedY = rect.height > 0 ? Math.max(0, Math.min((y / rect.height) * 100, 100)) : 0;
        
        // Get dragged word text if any - use refs to avoid effect dependencies
        const currentDraggedWord = draggedWordRef.current;
        const draggedWordText = currentDraggedWord ? wordsRef.current.find(w => w.id === currentDraggedWord)?.text : undefined;
        
        // Update cursor position in Firebase with normalized coordinates and dragged word
        if (gameData?.id && rect.width > 0 && rect.height > 0) {
          const cursorRef = ref(database, `gameSessions/${gameData.id}/cursors/${user.uid}`);
          const cursorData: any = {
            playerId: user.uid,
            playerName: user.displayName || 'Anonymous',
            x: normalizedX,
            y: normalizedY,
            color: getPlayerColor(user.uid),
            lastUpdate: Date.now()
          };
          
          // Only add draggedWordText if there's actually a word being dragged
          if (draggedWordText) {
            cursorData.draggedWordText = draggedWordText;
          }
          
          set(cursorRef, cursorData);
        }
      }
    };

    // Track mouse on the game area container
    const gameArea = gameAreaRef.current;
    gameArea.addEventListener('mousemove', handleMouseMove);
    gameArea.addEventListener('dragover', handleDragOver); // Track during drag operations

    // Clear cursor when mouse leaves the game area
    const handleMouseLeave = () => {
      if (gameData?.id && user?.uid) {
        const cursorRef = ref(database, `gameSessions/${gameData.id}/cursors/${user.uid}`);
        set(cursorRef, null);
      }
    };

    gameArea.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      gameArea.removeEventListener('mousemove', handleMouseMove);
      gameArea.removeEventListener('dragover', handleDragOver);
      gameArea.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [user, gameData?.id, gamePhase, getPlayerColor]);

  // Listen to other players' cursors
  useEffect(() => {
    if (!gameData?.id || gamePhase !== 'playing') return;

    const cursorsRef = ref(database, `gameSessions/${gameData.id}/cursors`);
    
    const unsubscribe = onValue(cursorsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Filter out current user's cursor and old cursors
        const now = Date.now();
        const validCursors = Object.values(data).filter((cursor: any) => 
          cursor.playerId !== user?.uid && 
          (now - cursor.lastUpdate) < 5000 // Remove cursors older than 5 seconds
        );
        
        const cursorsMap: Record<string, Cursor> = {};
        validCursors.forEach((cursor: any) => {
          cursorsMap[cursor.playerId] = cursor;
        });
        
        setCursors(cursorsMap);
      } else {
        setCursors({});
      }
    });

    return () => unsubscribe();
  }, [gameData?.id, user?.uid, gamePhase]);

  // Re-render cursors when game area size changes
  useEffect(() => {
    const handleResize = () => {
      // Force re-render of cursors when viewport changes
      setCursors(prev => ({ ...prev }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Drag handlers for word dragging
  const handleWordDragStart = (e: React.DragEvent, wordId: string) => {
    const word = words.find((w: any) => w.id === wordId);
    if (!word || !gameData?.id || !user) return;

    // Set the dragged word locally
    setDraggedWord(wordId);
    
    // Mark word as being dragged by this user in Firebase
    const updatedWords = words.map((w: any) => 
      w.id === wordId 
        ? { ...w, draggedBy: user.uid }
        : w
    );
    setWords(updatedWords);
    
    // Update Firebase to show other users this word is being dragged
    const gameStateRef = ref(database, `gameSessions/${gameData.id}/gameState`);
    set(gameStateRef, {
      words: cleanWordsForFirebase(updatedWords),
      currentSentence: currentSentence,
      progress: gameProgress
    });

    // Store word data for drag operations
    e.dataTransfer.setData('text/plain', wordId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleWordDragEnd = () => {
    if (!draggedWord || !gameData?.id || !user) return;

    // Clear the dragged word locally
    setDraggedWord(null);
    
    // Remove draggedBy property from the word in Firebase
    const updatedWords = words.map((w: any) => {
      if (w.id === draggedWord && w.draggedBy === user.uid) {
        const newWord = { ...w };
        delete newWord.draggedBy;
        return newWord;
      }
      return w;
    });
    setWords(updatedWords);
    
    // Update Firebase
    const gameStateRef = ref(database, `gameSessions/${gameData.id}/gameState`);
    set(gameStateRef, {
      words: cleanWordsForFirebase(updatedWords),
      currentSentence: currentSentence,
      progress: gameProgress
    });
  };

  // Handle dropping words on slots
  const handleSlotDrop = (e: React.DragEvent, slotId: number) => {
    e.preventDefault();
    const wordId = e.dataTransfer.getData('text/plain');
    handleWordPlace(wordId, slotId);
  };

  const handleWordPlace = (wordId: string, slotId: number) => {
    if (!gameData?.id || !currentSentence || !user) return;

    // Clear dragged word state immediately
    setDraggedWord(null);

    const word = words.find(w => w.id === wordId);
    if (!word) return;

    // Check if word is already being dragged by someone else
    if (word.draggedBy && word.draggedBy !== user.uid) {
      toast.error('This word is being used by another player');
      return;
    }

    // Check if slot is already occupied
    const existingWord = words.find(w => w.placedInSlot === slotId);
    if (existingWord) {
      // If it's an incorrect locked word, can't replace it
      if (existingWord.isCorrect === false) {
        toast.error('Cannot replace incorrect words');
        return;
      }
      // If another player is currently dragging the word, don't allow placement
      if (existingWord.draggedBy && existingWord.draggedBy !== user.uid) {
        toast.error('This slot is being used by another player');
        return;
      }
    }

    // Find the correct word for this slot
    const slot = currentSentence.slots.find(s => s.id === slotId);
    if (!slot) return;

    const isCorrect = word.text.toLowerCase() === slot.correctWord.toLowerCase();
    const difficulty = gameData?.difficulty || 'easy';

    const updatedWords = words.map(w => {
      if (w.id === wordId) {
        const newWord = {
          ...w,
          isPlaced: true,
          placedInSlot: slotId,
          isCorrect: isCorrect // Track correctness
        };
        delete newWord.draggedBy;
        return newWord;
      }
      // If another word was in this slot, remove it
      if (w.placedInSlot === slotId) {
        const newWord = {
          ...w,
          isPlaced: false
        };
        delete newWord.placedInSlot;
        delete newWord.isCorrect;
        return newWord;
      }
      return w;
    });

    // Verify with Firebase before committing (race condition check)
    const gameStateRef = ref(database, `gameSessions/${gameData.id}/gameState`);
    get(gameStateRef).then((snapshot) => {
      const currentState = snapshot.val();
      if (currentState && currentState.words) {
        // Check if slot is still available in Firebase
        const firebaseWords = currentState.words;
        const slotOccupied = Object.values(firebaseWords).find((w: any) => w.placedInSlot === slotId);
        
        if (slotOccupied && (slotOccupied as any).id !== wordId) {
          // Another player got there first
          toast.error('Another player placed a word here first');
          // Revert local state
          const revertedWords = words.map(w => {
            if (w.id === wordId && w.draggedBy === user.uid) {
              const newWord = { ...w };
              delete newWord.draggedBy;
              return newWord;
            }
            return w;
          });
          setWords(revertedWords);
          return;
        }
        
        // Word is being used by another player in Firebase
        const wordInFirebase = Object.values(firebaseWords).find((w: any) => w.id === wordId);
        if (wordInFirebase && (wordInFirebase as any).draggedBy && (wordInFirebase as any).draggedBy !== user.uid) {
          toast.error('Another player is using this word');
          return;
        }
      }

      // All checks passed, commit the changes
      setWords(updatedWords);

      // Mark player as having made a move this sentence
      setPlayerMadeMove(true);

      // Update player score immediately
      const playerScoresRef = ref(database, `gameSessions/${gameData.id}/playerScores/${user.uid}`);
      get(playerScoresRef).then((snapshot) => {
        const currentScore = snapshot.val() || 100;
        let newScore = currentScore;
        
        if (isCorrect) {
          // Increase score for correct placement (capped at 100)
          newScore = Math.min(100, currentScore + Math.floor(100 / currentSentence.slots.length));
        } else {
          // Decrease score for incorrect placement (capped at 0)
          newScore = Math.max(0, currentScore - Math.floor(100 / currentSentence.slots.length));
        }
        
        set(playerScoresRef, newScore);
      });

      // Clear cursor's dragged word text in Firebase immediately
      const cursorRef = ref(database, `gameSessions/${gameData.id}/cursors/${user.uid}`);
      get(cursorRef).then((snapshot) => {
        const cursorData = snapshot.val();
        if (cursorData) {
          const updatedCursor = { ...cursorData };
          delete updatedCursor.draggedWordText;
          set(cursorRef, updatedCursor);
        }
      });

      // Check if sentence is complete
      const filledSlots = updatedWords.filter(w => w.isPlaced).length;
      const totalSlots = currentSentence.slots.length;
      const progress = (filledSlots / totalSlots) * 100;
      setGameProgress(progress);

      // Update Firebase with progress and cleaned data
      set(gameStateRef, {
        words: cleanWordsForFirebase(updatedWords),
        currentSentence: currentSentence,
        progress: progress
      });

      // Check if all slots are filled
      if (filledSlots === totalSlots) {
        const placedWords = updatedWords
          .filter(w => w.isPlaced && w.placedInSlot !== undefined)
          .map(w => ({
            slotId: w.placedInSlot!,
            word: w.text
          }));

        const validation = validateSentence(placedWords, currentSentence.slots);
        const scorePercentage = Math.round((validation.correctCount / validation.totalCount) * 100);

        if (validation.isCorrect) {
          toast.success(`Perfect! All ${validation.totalCount} words correct!`);
          addChatMessage(gameData.id, `Sentence completed! Score: ${scorePercentage}%`, true);
        } else {
          toast.warning(`${validation.correctCount}/${validation.totalCount} words correct (${scorePercentage}%)`);
          addChatMessage(gameData.id, `Sentence completed! Score: ${scorePercentage}% (${validation.correctCount}/${validation.totalCount} correct)`, true);
        }
        
        // Apply inactivity penalty to players who didn't participate
        if (!playerMadeMove) {
          const inactivityPenalty = 10; // Deduct 10 points for no participation
          const playerScoresRef = ref(database, `gameSessions/${gameData.id}/playerScores/${user.uid}`);
          get(playerScoresRef).then((snapshot) => {
            const currentScore = snapshot.val() || 100;
            const newScore = Math.max(0, currentScore - inactivityPenalty);
            set(playerScoresRef, newScore);
          });
          toast.warning(`-${inactivityPenalty} points for inactivity`, {
            description: 'Make at least one move per sentence!'
          });
        }
        
        // Immediately load new sentence (no delay, timer keeps running for cheat protection)
        // Only host generates and syncs the new sentence
        const isHost = gameData.players.find((p: any) => p.id === user?.uid)?.isHost;
        if (isHost) {
          resetGame();
        }
      }
    });
  };

  const handleRemoveWordFromSlot = (wordId: string) => {
    if (!gameData?.id || !currentSentence) return;

    const word = words.find(w => w.id === wordId);
    
    // Don't allow removing incorrect words
    if (word?.isCorrect === false) {
      toast.error('Cannot remove incorrect words');
      return;
    }

    const updatedWords = words.map(w => {
      if (w.id === wordId) {
        const newWord = { ...w, isPlaced: false };
        delete newWord.placedInSlot;
        delete newWord.isCorrect;
        return newWord;
      }
      return w;
    });

    setWords(updatedWords);

    // Update progress
    const filledSlots = updatedWords.filter(w => w.isPlaced).length;
    const totalSlots = currentSentence.slots.length;
    const progress = (filledSlots / totalSlots) * 100;
    setGameProgress(progress);

    // Update Firebase with cleaned data
    const gameStateRef = ref(database, `gameSessions/${gameData.id}/gameState`);
    set(gameStateRef, {
      words: cleanWordsForFirebase(updatedWords),
      currentSentence: currentSentence,
      progress: progress
    });
  };

  const resetGame = async () => {
    if (!gameData?.id) return;
    
    // Only host should generate new sentences to prevent race conditions
    const isHost = gameData.players.find((p: any) => p.id === user?.uid)?.isHost;
    if (!isHost) return;
    
    try {
      const randomSentence = await generateNewSentence();
      setCurrentSentence(randomSentence);
      setWords(randomSentence.words);
      setGameProgress(0);
      
      // Timer is managed separately in /timer path - NEVER touch it here
      // It runs independently based on startTime and duration
      
      // Update Firebase with new sentence - all players will sync automatically
      const gameStateRef = ref(database, `gameSessions/${gameData.id}/gameState`);
      await set(gameStateRef, {
        words: randomSentence.words,
        currentSentence: randomSentence,
        progress: 0,
        sentenceStartTime: Date.now() // Track when sentence started for inactivity penalties
      });
      
      addChatMessage(gameData.id, 'New sentence loaded!', true);
    } catch (error) {
      console.error('Failed to reset game:', error);
      toast.error('Failed to load new sentence');
    }
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !gameData?.id) return;
    
    try {
      await addChatMessage(gameData.id, chatMessage);
      setChatMessage('');
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const handleToggleReady = async () => {
    if (!gameData?.id) return;
    
    try {
      await togglePlayerReady(gameData.id);
    } catch (error: any) {
      toast.error('Failed to update ready status');
    }
  };

  const handleCancelGame = async () => {
    if (!gameData?.id || !isUserHost) return;
    
    try {
      // Delete the game from Firebase
      const gameRef = ref(database, `gameSessions/${gameData.id}`);
      await remove(gameRef);
      
      toast.success('Game cancelled successfully');
      router.push('/training/social/collaborate');
    } catch (error: any) {
      console.error('Failed to cancel game:', error);
      toast.error('Failed to cancel game');
    }
  };

  const handleEndGameForAll = async () => {
    if (!gameData?.id || !isUserHost) return;
    
    try {
      await set(ref(database, `gameSessions/${gameData.id}/status`), 'finished');
      await addChatMessage(gameData.id, 'Game ended by host', true);
      setGamePhase('finished');
      toast.success('Game ended for all players');
    } catch (error: any) {
      toast.error('Failed to end game');
    }
  };

  const startGame = async () => {
    console.log('[Page] startGame called - isUserHost:', isUserHost, 'gameData.id:', gameData?.id);
    if (!gameData?.id || !isUserHost) {
      console.log('[Page] startGame aborted - missing requirements');
      return;
    }
    
    try {
      console.log('[Page] Initializing game start sequence...');
      
      // Initialize all player scores to 100
      const scoresRef = ref(database, `gameSessions/${gameData.id}/playerScores`);
      const initialScores: Record<string, number> = {};
      gameData.players.forEach((player: any) => {
        initialScores[player.id] = 100;
      });
      await set(scoresRef, initialScores);
      console.log('[Page] Player scores initialized');
      
      // Initialize the authoritative timer - this NEVER pauses
      const timerRef = ref(database, `gameSessions/${gameData.id}/timer`);
      const duration = gameData?.timeLimit ? gameData.timeLimit * 60 : 600; // Convert minutes to seconds
      console.log('[Page] Setting timer with duration:', duration, 'seconds (', gameData?.timeLimit, 'minutes)');
      
      await set(timerRef, {
        startTime: Date.now(), // Authoritative start timestamp
        duration: duration,     // Total duration in seconds
        initialized: true
      });
      console.log('[Page] Timer initialized in Firebase at path:', `gameSessions/${gameData.id}/timer`);
      
      await set(ref(database, `gameSessions/${gameData.id}/status`), 'playing');
      console.log('[Page] Game status set to playing');
      
      await addChatMessage(gameData.id, 'Game started! Work together to complete sentences', true);
      
      setGamePhase('playing');
      console.log('[Page] Local gamePhase set to playing');
      
      toast.success('Game started!');
      console.log('[Page] startGame completed successfully');
    } catch (error: any) {
      console.error('[Page] Error starting game:', error);
      toast.error('Failed to start game');
    }
  };

  // Helper functions
  const currentUserPlayer = gameData?.players.find((p: any) => p.id === user?.uid);
  const isUserHost = currentUserPlayer?.isHost || false;
  const readyPlayersCount = gameData?.players.filter((p: any) => p.isReady).length || 0;
  const totalPlayersCount = gameData?.players.length || 0;
  const allPlayersReady = readyPlayersCount === totalPlayersCount && totalPlayersCount > 0;
  const hasMinimumPlayers = totalPlayersCount >= 2;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Render sentence with drag and drop slots
  const renderSentenceWithSlots = () => {
    if (!currentSentence) return null;

    const parts = currentSentence.template.split('___');
    const elements: React.ReactElement[] = [];

    parts.forEach((part, index) => {
      elements.push(<span key={`text-${index}`}>{part}</span>);
      
      if (index < currentSentence.slots.length) {
        const slot = currentSentence.slots[index];
        const placedWord = words.find(w => w.placedInSlot === slot.id);
        
        elements.push(
          <span key={`space-${index}`} className="inline-block w-2"></span>
        );
        elements.push(
          <div
            key={`slot-${slot.id}`}
            className="inline-block min-w-[120px] h-12 border-2 border-dashed border-border rounded-lg bg-muted/20 relative"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleSlotDrop(e, slot.id)}
          >
            {placedWord ? (
              <div className={`absolute inset-0 flex items-center justify-center bg-muted/30 border-2 rounded-lg ${
                placedWord.isCorrect === true ? 'border-green-600' : 
                placedWord.isCorrect === false ? 'border-red-600' : 'border-border/50'
              }`}>
                <span className="font-medium">{placedWord.text}</span>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                Drop here
              </div>
            )}
          </div>
        );
        elements.push(
          <span key={`space-after-${index}`} className="inline-block w-2"></span>
        );
      }
    });

    return <div className="text-base sm:text-lg leading-relaxed">{elements}</div>;
  };

  // Game finished state is now handled by the timer and navigates to results page

  if (gameLoading || !gameData) {
    return (
      <ProtectedRoute>
        <SidebarProvider>
          <div className="flex h-screen w-full">
            <ExpressifySidebar />
            <main className="flex-1 overflow-auto">
              <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading collaborative sentence builder...</p>
                </div>
              </div>
            </main>
          </div>
        </SidebarProvider>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <div className="flex h-screen w-full">
          <ExpressifySidebar />
          <main className="flex-1 overflow-auto">
            <div className="min-h-screen bg-background">
              {/* Header */}
              <div className="sticky top-0 z-10 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex flex-1 flex-col gap-2 p-2 sm:gap-4 sm:p-4">
                  <div className="mx-auto w-full max-w-6xl">
                    <div className="flex items-center justify-between px-2 sm:px-0">
                      <div className="flex items-center gap-3">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => router.push('/training/social/collaborate')}
                          className="h-8 w-8 p-0"
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">🧩 Sentence Builder</h1>
                          <p className="text-xs text-muted-foreground sm:text-sm">
                            Code: <span className="font-mono font-medium">{gameCode}</span>
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {gamePhase === 'waiting' && (
                          <>
                            {!isUserHost && (
                              <Button
                                onClick={handleToggleReady}
                                size="sm"
                                variant={currentUserPlayer?.isReady ? "default" : "outline"}
                              >
                                {currentUserPlayer?.isReady ? '✓ Ready' : 'Mark Ready'}
                              </Button>
                            )}
                            {isUserHost && (
                              <>
                                {allPlayersReady && hasMinimumPlayers ? (
                                  <Button onClick={startGame} size="sm">
                                    Start Game
                                  </Button>
                                ) : (
                                  <Button
                                    onClick={handleToggleReady}
                                    size="sm"
                                    variant={currentUserPlayer?.isReady ? "default" : "outline"}
                                  >
                                    {currentUserPlayer?.isReady ? '✓ Ready' : 'Mark Ready'}
                                  </Button>
                                )}
                                <Button
                                  onClick={handleCancelGame}
                                  variant="destructive"
                                  size="sm"
                                >
                                  Cancel Game
                                </Button>
                              </>
                            )}
                            {!isUserHost && (
                              <Button
                                onClick={() => router.push('/training/social/collaborate')}
                                variant="outline"
                                size="sm"
                              >
                                Leave
                              </Button>
                            )}
                          </>
                        )}
                        
                        {isUserHost && gamePhase === 'playing' && (
                          <Button 
                            onClick={handleEndGameForAll}
                            variant="outline"
                            size="sm"
                          >
                            End Game
                          </Button>
                        )}
                        
                        {!isUserHost && gamePhase === 'playing' && (
                          <Button
                            onClick={() => router.push('/training/social/collaborate')}
                            variant="outline"
                            size="sm"
                          >
                            <ArrowLeft className="h-3 w-3 mr-1" />
                            Leave
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div className="flex flex-1 flex-col gap-2 p-2 pt-0 sm:gap-4 sm:p-4">
                <div className="min-h-[calc(100vh-8rem)] flex-1 rounded-lg p-3 sm:rounded-xl sm:p-4 md:p-6">
                  <div className="mx-auto max-w-6xl space-y-4 sm:space-y-6">

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
                      {/* Game Status - Waiting/Finished */}
                      {gamePhase === 'waiting' && (
                        <div className="xl:col-span-2">
                          <Card className="border-border/50 h-full">
                            <CardContent className="p-6 h-full flex items-center justify-center">
                              <div className="text-center w-full">
                                <div className="flex justify-center mb-4">
                                  <svg className="w-16 h-16" viewBox="0 0 64 64" fill="none">
                                  <circle cx="32" cy="32" r="30" stroke="#fff" strokeWidth="4" fill="none" />
                                  <circle cx="32" cy="32" r="18" stroke="#e5e7eb" strokeWidth="3" fill="none" />
                                  <circle cx="32" cy="32" r="8" stroke="#e5e7eb" strokeWidth="2" fill="none" />
                                  <path d="M32 10v8M32 46v8M54 32h-8M18 32h-8" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                                  <circle cx="32" cy="32" r="3" stroke="#fff" strokeWidth="2" fill="none" />
                                  </svg>
                                </div>
                                <h2 className="text-xl font-semibold mb-2">Waiting for Players</h2>
                                <p className="text-sm text-muted-foreground mb-4">
                                  Ready Players: {readyPlayersCount}/{totalPlayersCount} 
                                  {!hasMinimumPlayers && ` (Need at least 2 players)`}
                                </p>
                                <Progress value={(readyPlayersCount / Math.max(totalPlayersCount, 1)) * 100} className="w-full max-w-md mx-auto" />
                                {isUserHost && !allPlayersReady && (
                                  <p className="text-xs text-muted-foreground mt-2">
                                    Waiting for all players to be ready...
                                  </p>
                                )}
                                <div className="mt-6 p-4 border border-border/50 rounded-lg bg-muted/20 max-w-lg mx-auto">
                                  <h3 className="text-sm font-semibold mb-2">How to Play</h3>
                                  <p className="text-xs text-muted-foreground">
                                    Work together to complete sentences by dragging words into the blanks. 
                                    You can see each other's cursors and coordinate your moves!
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      )}

                      {gamePhase === 'finished' && (
                        <div className="xl:col-span-2">
                          <Card className="border-border/50 h-full">
                            <CardContent className="p-6 h-full flex items-center justify-center">
                              <div className="text-center">
                                <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <h2 className="text-xl font-semibold mb-2">Game Complete!</h2>
                                <p className="text-sm text-muted-foreground">
                                  Great teamwork on completing the sentences!
                                </p>
                                {isUserHost && (
                                  <Button onClick={startGame} className="mt-4" size="sm">
                                    Play Again
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      )}

                      {/* Chat Sidebar for Waiting/Finished phases */}
                      {(gamePhase === 'waiting' || gamePhase === 'finished') && (
                        <div className="space-y-4 sm:space-y-6">
                          <Card className="border-border/50">
                            <CardHeader>
                              <CardTitle className="text-lg flex items-center gap-2">
                                <MessageCircle className="h-4 w-4" />
                                Team Chat
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                <div className="h-[400px] overflow-y-auto border border-border/50 rounded-lg p-3 bg-muted/10">
                                  {chatMessages.filter(msg => msg.timestamp >= joinedAt).length === 0 ? (
                                    <p className="text-xs text-muted-foreground">No messages yet... Start chatting!</p>
                                  ) : (
                                    <div className="space-y-2">
                                      {chatMessages.filter(msg => msg.timestamp >= joinedAt).map((message) => (
                                        <div key={message.id} className="text-xs">
                                          {message.isSystem ? (
                                            <div className="text-center text-muted-foreground italic">
                                              {message.message}
                                            </div>
                                          ) : (
                                            <div>
                                              <span className="font-medium">
                                                {message.senderName}:
                                              </span>{' '}
                                              <span className="text-muted-foreground">{message.message}</span>
                                              <span className="text-[10px] text-muted-foreground/70 ml-1">
                                                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <Input
                                    value={chatMessage}
                                    onChange={(e) => setChatMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="text-sm"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        handleSendMessage();
                                      }
                                    }}
                                  />
                                  <Button onClick={handleSendMessage} size="sm">
                                    <Send className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      )}

                      {/* Main Game Area */}
                      {gamePhase === 'playing' && (
                        <>
                          <div className="xl:col-span-2 space-y-4 sm:space-y-6 min-w-0">
                            {/* Game Info Bar */}
                            <div className="flex flex-wrap items-center justify-between gap-4 p-4 border border-border/50 rounded-lg bg-muted/20">
                              <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                                <div className="flex items-center gap-2">
                                  <Timer className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-mono text-lg font-bold">
                                    {formatTime(timeLeft)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Target className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm font-medium">
                                    {Math.round(gameProgress)}%
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <MousePointer2 className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">
                                    {Object.keys(cursors).length} cursors
                                  </span>
                                </div>
                              </div>
                              <Progress value={gameProgress} className="w-full sm:w-40" />
                            </div>

                            {/* Main Game Area with Cursor Tracking */}
                            <div 
                              ref={gameAreaRef}
                              className="relative space-y-4 sm:space-y-6 w-full"
                            >
                              {/* Other Players' Cursors - Positioned relative to main game area */}
                              {Object.values(cursors).map((cursor) => {
                                // Convert percentage coordinates back to pixels for rendering
                                const gameArea = gameAreaRef.current;
                                if (!gameArea) return null;
                                
                                const rect = gameArea.getBoundingClientRect();
                                // Add safeguards for edge cases
                                if (rect.width === 0 || rect.height === 0) return null;
                                
                                const pixelX = Math.max(0, Math.min((cursor.x / 100) * rect.width, rect.width));
                                const pixelY = Math.max(0, Math.min((cursor.y / 100) * rect.height, rect.height));
                                
                                return (
                                  <div
                                    key={cursor.playerId}
                                    className="absolute pointer-events-none z-50 transition-all duration-150"
                                    style={{
                                      left: pixelX,
                                      top: pixelY,
                                      transform: 'translate(-8px, -8px)'
                                    }}
                                  >
                                    <MousePointer2 
                                      className="h-5 w-5"
                                      style={{ color: cursor.color, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
                                    />
                                    <div 
                                      className="absolute top-6 left-0 px-2 py-1 rounded-md text-xs text-white shadow-lg whitespace-nowrap font-medium"
                                      style={{ backgroundColor: cursor.color }}
                                    >
                                      {cursor.playerName}
                                      {cursor.draggedWordText && (
                                        <span className="text-yellow-200">
                                          {` (${cursor.draggedWordText})`}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}

                              {/* Sentence Area */}
                              <Card className="border-border/50">
                                <CardHeader>
                                  <CardTitle className="text-lg flex items-center gap-2">
                                    <MessageCircle className="h-4 w-4" />
                                    Complete the Sentence
                                  </CardTitle>
                                  <CardDescription className="text-xs">
                                    Drag words from below to fill in the blanks. Work together with your team!
                                  </CardDescription>
                                </CardHeader>
                                <CardContent>
                                  <div className="p-6 sm:p-8 border border-border/50 rounded-lg bg-muted/20 min-h-[140px] flex items-center justify-center">
                                    {renderSentenceWithSlots()}
                                  </div>
                                  {currentSentence && (
                                    <div className="mt-4 flex items-center justify-center gap-3 text-xs text-muted-foreground">
                                      <Badge variant="outline" className="text-xs">{currentSentence.theme}</Badge>
                                      <Badge variant="outline" className="text-xs">{currentSentence.difficulty}</Badge>
                                      <span>{currentSentence.slots.length} blanks</span>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>

                              {/* Word Bank */}
                              <Card className="border-border/50">
                                <CardHeader>
                                  <CardTitle className="text-lg flex items-center gap-2">
                                    <Target className="h-4 w-4" />
                                    Word Bank
                                    <Badge variant="secondary" className="ml-2 text-xs">
                                      {words.filter(w => !w.isPlaced).length} left
                                    </Badge>
                                  </CardTitle>
                                  <CardDescription className="text-xs">
                                    Drag these words to complete the sentence above
                                  </CardDescription>
                                </CardHeader>
                                <CardContent>
                                  <div className="relative min-h-[250px] p-6 sm:p-8 border border-border/50 rounded-lg bg-muted/20 overflow-hidden">
                                    {/* Draggable Words */}
                                    <div className="flex flex-wrap gap-3 justify-center">
                                      {words.filter(word => !word.isPlaced).map((word) => (
                                        <div
                                          key={word.id}
                                          className={`px-5 py-2.5 bg-background border border-border rounded-lg cursor-move transition-all duration-200 hover:shadow-md select-none ${
                                            word.draggedBy && word.draggedBy !== user?.uid 
                                              ? 'opacity-50 cursor-not-allowed' 
                                              : 'hover:scale-105 hover:border-foreground/30'
                                          } ${
                                            draggedWord === word.id ? 'shadow-lg scale-105 border-foreground/50 ring-2 ring-muted-foreground/20' : ''
                                          }`}
                                          draggable={!word.draggedBy || word.draggedBy === user?.uid}
                                          onDragStart={(e) => {
                                            if (word.draggedBy && word.draggedBy !== user?.uid) {
                                              e.preventDefault();
                                              return;
                                            }
                                            handleWordDragStart(e, word.id);
                                          }}
                                          onDragEnd={handleWordDragEnd}
                                        >
                                          <span className="text-sm font-medium">{word.text}</span>
                                          {word.draggedBy && word.draggedBy !== user?.uid && (
                                            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                              <MousePointer2 className="h-3 w-3" />
                                              {gameData?.players.find((p: any) => p.id === word.draggedBy)?.name}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>

                                    {words.filter(word => !word.isPlaced).length === 0 && (
                                      <div className="flex items-center justify-center h-32">
                                        <div className="text-center">
                                          <Trophy className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                          <p className="text-base font-semibold">All words placed!</p>
                                          <p className="text-xs text-muted-foreground">Waiting for next sentence...</p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          </div>

                          {/* Sidebar - Chat for Playing phase */}
                          <div className="space-y-4 sm:space-y-6 h-full flex flex-col">
                            <Card className="border-border/50 flex-1 flex flex-col">
                              <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                  <MessageCircle className="h-4 w-4" />
                                  Team Chat
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="flex-1 flex flex-col">
                                <div className="space-y-3 flex-1 flex flex-col">
                                  <div className="flex-1 overflow-y-auto border border-border/50 rounded-lg p-3 bg-muted/10">
                                    {chatMessages.filter(msg => msg.timestamp >= joinedAt).length === 0 ? (
                                      <p className="text-xs text-muted-foreground">No messages yet... Start chatting!</p>
                                    ) : (
                                      <div className="space-y-2">
                                        {chatMessages.filter(msg => msg.timestamp >= joinedAt).map((message) => (
                                          <div key={message.id} className="text-xs">
                                            {message.isSystem ? (
                                              <div className="text-center text-muted-foreground italic">
                                                {message.message}
                                              </div>
                                            ) : (
                                              <div>
                                                <span className="font-medium">
                                                  {message.senderName}:
                                                </span>{' '}
                                                <span className="text-muted-foreground">{message.message}</span>
                                                <span className="text-[10px] text-muted-foreground/70 ml-1">
                                                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex gap-2">
                                    <Input
                                      value={chatMessage}
                                      onChange={(e) => setChatMessage(e.target.value)}
                                      placeholder="Type a message..."
                                      className="text-sm"
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          handleSendMessage();
                                        }
                                      }}
                                    />
                                    <Button onClick={handleSendMessage} size="sm">
                                      <Send className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Bottom Section - Players and Game Info Side by Side */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                      {/* Players */}
                      <Card className="border-border/50">
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Players ({gameData?.players.length || 0}/{gameData?.maxPlayers || 4})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {gameData?.players.map((player: any) => (
                              <div 
                                key={player.id} 
                                className="flex items-center gap-3 p-2.5 rounded-lg border border-border/50 bg-muted/10"
                              >
                                <UserAvatar user={player} size="sm" />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm truncate">{player.name}</span>
                                    {player.isHost && (
                                      <Crown className="h-3 w-3 text-muted-foreground" />
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <div 
                                      className="w-2 h-2 rounded-full border border-border"
                                      style={{ backgroundColor: getPlayerColor(player.id) }}
                                    ></div>
                                    <span>Score: {playerScores[player.id] !== undefined ? playerScores[player.id] : 100}</span>
                                    {gamePhase === 'playing' && Object.keys(cursors).includes(player.id) && (
                                      <span>• Active</span>
                                    )}
                                  </div>
                                </div>
                                <Badge 
                                  variant={player.isReady ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  {gamePhase === 'waiting' ? (player.isReady ? 'Ready' : 'Not Ready') : 'Playing'}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Game Info */}
                      <Card className="border-border/50">
                        <CardHeader>
                          <CardTitle className="text-lg">Game Info</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Current Theme:</span>
                            <span className="font-medium">{currentSentence?.theme || 'Loading...'}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Difficulty:</span>
                            <span className="font-medium">{currentSentence?.difficulty || 'Loading...'}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Time Limit:</span>
                            <span className="font-medium">{gameData?.timeLimit || 10} minutes</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Creator:</span>
                            <span className="font-medium">{gameData?.players.find((p: any) => p.isHost)?.name || 'Unknown'}</span>
                          </div>
                          <div className="pt-2 border-t border-border/50">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Game Code:</span>
                              <code className="font-mono text-xs bg-muted/30 px-2 py-1 rounded">{gameCode}</code>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
}