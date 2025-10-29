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
import { ref, set, get, onValue } from 'firebase/database';
import { database } from '@/lib/firebase';

// Types
interface WordItem {
  id: string;
  text: string;
  isPlaced: boolean;
  placedInSlot?: number;
  draggedBy?: string;
}

interface GameSentence {
  id: string;
  template: string;
  slots: Array<{
    id: number;
    correctWord: string;
    hint: string;
  }>;
  words: WordItem[];
  difficulty: string;
  theme: string;
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

// Sample sentences for the game
const GAME_SENTENCES: GameSentence[] = [
  {
    id: '1',
    template: 'The ___ cat jumped over the ___ fence.',
    slots: [
      { id: 0, correctWord: 'quick', hint: 'fast' },
      { id: 1, correctWord: 'tall', hint: 'high' }
    ],
    words: [
      { id: 'w1', text: 'quick', isPlaced: false },
      { id: 'w2', text: 'slow', isPlaced: false },
      { id: 'w3', text: 'tall', isPlaced: false },
      { id: 'w4', text: 'short', isPlaced: false }
    ],
    difficulty: 'easy',
    theme: 'Animals'
  },
  {
    id: '2',
    template: 'The weather today is ___ and the sky looks ___.',
    slots: [
      { id: 0, correctWord: 'beautiful', hint: 'nice' },
      { id: 1, correctWord: 'clear', hint: 'not cloudy' }
    ],
    words: [
      { id: 'w1', text: 'beautiful', isPlaced: false },
      { id: 'w2', text: 'ugly', isPlaced: false },
      { id: 'w3', text: 'clear', isPlaced: false },
      { id: 'w4', text: 'cloudy', isPlaced: false },
      { id: 'w5', text: 'amazing', isPlaced: false },
      { id: 'w6', text: 'terrible', isPlaced: false }
    ],
    difficulty: 'medium',
    theme: 'Weather'
  },
  {
    id: '3',
    template: 'The ___ scientist discovered a ___ solution to the ___ problem.',
    slots: [
      { id: 0, correctWord: 'brilliant', hint: 'very smart' },
      { id: 1, correctWord: 'creative', hint: 'innovative' },
      { id: 2, correctWord: 'complex', hint: 'difficult' }
    ],
    words: [
      { id: 'w1', text: 'brilliant', isPlaced: false },
      { id: 'w2', text: 'lazy', isPlaced: false },
      { id: 'w3', text: 'creative', isPlaced: false },
      { id: 'w4', text: 'boring', isPlaced: false },
      { id: 'w5', text: 'complex', isPlaced: false },
      { id: 'w6', text: 'simple', isPlaced: false }
    ],
    difficulty: 'hard',
    theme: 'Science'
  }
];

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

  // Refs for game area
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const draggedWordRef = useRef<string | null>(null);
  const wordsRef = useRef<WordItem[]>([]);

  // Update refs when state changes
  useEffect(() => {
    draggedWordRef.current = draggedWord;
  }, [draggedWord]);

  useEffect(() => {
    wordsRef.current = words;
  }, [words]);

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
            const randomSentence = GAME_SENTENCES[Math.floor(Math.random() * GAME_SENTENCES.length)];
            const initialState = {
              currentSentence: randomSentence,
              words: randomSentence.words,
              progress: 0,
              timeLeft: gameData?.timeLimit ? gameData.timeLimit * 60 : 300
            };
            
            set(gameStateRef, initialState);
            setCurrentSentence(randomSentence);
            setWords(randomSentence.words);
            setGameProgress(0);
          }
        }
      });

      // Listen for real-time updates
      const unsubscribe = onValue(gameStateRef, (snapshot) => {
        const gameState = snapshot.val();
        if (gameState) {
          setCurrentSentence(gameState.currentSentence);
          setWords(gameState.words || []);
          setGameProgress(gameState.progress || 0);
        }
      });

      return () => unsubscribe();
    }
  }, [gamePhase, gameData?.id, user]);

  // Check for game over conditions
  useEffect(() => {
    if (!gameData?.id || !user?.uid) return;

    const currentGame = allGames.find(g => g.id === gameData.id);
    
    if (currentGame) {
      if (currentGame.status === 'finished') {
        toast.info('Game has ended');
        router.push('/training/social/collaborate');
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

  // Timer effect
  useEffect(() => {
    if (gamePhase === 'playing' && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGamePhase('finished');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [gamePhase, timeLeft]);

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
    if (!gameData?.id || !currentSentence) return;

    const updatedWords = words.map(word => {
      if (word.id === wordId) {
        const newWord = {
          ...word,
          isPlaced: true,
          placedInSlot: slotId
        };
        delete newWord.draggedBy;
        return newWord;
      }
      // If another word was in this slot, remove it
      if (word.placedInSlot === slotId) {
        const newWord = {
          ...word,
          isPlaced: false
        };
        delete newWord.placedInSlot;
        return newWord;
      }
      return word;
    });

    setWords(updatedWords);

    // Check if sentence is complete
    const filledSlots = updatedWords.filter(w => w.isPlaced).length;
    const totalSlots = currentSentence.slots.length;
    const progress = (filledSlots / totalSlots) * 100;
    setGameProgress(progress);

    // Update Firebase with progress and cleaned data
    const gameStateRef = ref(database, `gameSessions/${gameData.id}/gameState`);
    set(gameStateRef, {
      words: cleanWordsForFirebase(updatedWords),
      currentSentence: currentSentence,
      progress: progress
    });

    if (filledSlots === totalSlots) {
      toast.success('Sentence completed! Great teamwork!');
      addChatMessage(gameData.id, '🎉 Sentence completed successfully!', true);
      
      // Auto-start new sentence after 3 seconds
      setTimeout(() => {
        resetGame();
      }, 3000);
    }
  };

  const handleRemoveWordFromSlot = (wordId: string) => {
    if (!gameData?.id || !currentSentence) return;

    const updatedWords = words.map(word => {
      if (word.id === wordId) {
        const newWord = { ...word, isPlaced: false };
        delete newWord.placedInSlot;
        return newWord;
      }
      return word;
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
    
    const randomSentence = GAME_SENTENCES[Math.floor(Math.random() * GAME_SENTENCES.length)];
    setCurrentSentence(randomSentence);
    setWords(randomSentence.words);
    setGameProgress(0);
    setTimeLeft(gameData.timeLimit * 60);
    
    // Reset in Firebase
    const gameStateRef = ref(database, `gameSessions/${gameData.id}/gameState`);
    set(gameStateRef, {
      words: randomSentence.words,
      currentSentence: randomSentence,
      progress: 0
    });
    
    addChatMessage(gameData.id, '🔄 New sentence loaded!', true);
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
    if (!gameData?.id || !isUserHost) return;
    
    try {
      await set(ref(database, `gameSessions/${gameData.id}/status`), 'playing');
      await addChatMessage(gameData.id, '🎮 Game started! Work together to complete sentences!', true);
      setGamePhase('playing');
      toast.success('Game started!');
    } catch (error: any) {
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
          <div
            key={`slot-${slot.id}`}
            className="inline-block mx-2 min-w-[120px] h-12 border-2 border-dashed border-violet-300 rounded-lg bg-violet-50 dark:bg-violet-950 relative"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleSlotDrop(e, slot.id)}
          >
            {placedWord ? (
              <div className="absolute inset-0 flex items-center justify-center bg-violet-100 dark:bg-violet-900 border-2 border-violet-400 rounded-lg group">
                <span className="font-medium text-violet-700 dark:text-violet-300">{placedWord.text}</span>
                <button
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemoveWordFromSlot(placedWord.id)}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-violet-600 dark:text-violet-400">
                Drop here
              </div>
            )}
          </div>
        );
      }
    });

    return <div className="text-lg leading-relaxed">{elements}</div>;
  };

  // Handle game finished redirection
  useEffect(() => {
    if (gamePhase === 'finished' && gameData?.status === 'finished') {
      const currentUserPlayer = gameData?.players.find((p: any) => p.id === user?.uid);
      const isHost = currentUserPlayer?.isHost || false;
      
      if (!isHost) {
        // Non-host players get redirected faster
        setTimeout(() => {
          toast.info('Game has ended. Returning to lobby...');
          router.push('/training/social/collaborate');
        }, 2000);
      } else {
        // Host gets longer time to see results before being redirected
        setTimeout(() => {
          toast.info('Game ended. Returning to lobby...');
          router.push('/training/social/collaborate');
        }, 5000);
      }
    }
  }, [gamePhase, gameData?.status, gameData?.players, user?.uid, router]);

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
              <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <Button 
                      variant="ghost" 
                      onClick={() => router.push('/training/social/collaborate')}
                      className="p-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                      <h1 className="text-2xl font-bold">🧩 Collaborative Sentence Builder</h1>
                      <p className="text-muted-foreground">
                        Game Code: <span className="font-mono font-medium">{gameCode}</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {gamePhase === 'waiting' && (
                      <>
                        <Button
                          onClick={handleToggleReady}
                          variant={currentUserPlayer?.isReady ? "default" : "outline"}
                          className="flex items-center gap-2"
                        >
                          {currentUserPlayer?.isReady ? '✓ Ready' : 'Mark Ready'}
                        </Button>
                        {isUserHost && allPlayersReady && hasMinimumPlayers && (
                          <Button onClick={startGame} className="bg-green-600 hover:bg-green-700">
                            Start Game
                          </Button>
                        )}
                        <Button
                          onClick={() => router.push('/training/social/collaborate')}
                          variant="outline"
                          className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                        >
                          Leave Game
                        </Button>
                      </>
                    )}
                    
                    {isUserHost && gamePhase === 'playing' && (
                      <>
                        <Button onClick={resetGame} variant="outline">
                          New Sentence
                        </Button>
                        <Button 
                          onClick={handleEndGameForAll}
                          variant="outline"
                          className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                        >
                          End Game
                        </Button>
                      </>
                    )}
                    
                    {!isUserHost && gamePhase === 'playing' && (
                      <Button
                        onClick={() => router.push('/training/social/collaborate')}
                        variant="outline"
                        className="text-orange-600 border-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950 flex items-center gap-2"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Leave Game
                      </Button>
                    )}
                  </div>
                </div>

                {/* Game Status */}
                {gamePhase === 'waiting' && (
                  <Card className="mb-6">
                    <CardContent className="p-6">
                      <div className="text-center">
                        <div className="text-6xl mb-4">🎯</div>
                        <h2 className="text-xl font-semibold mb-2">Waiting for Players</h2>
                        <p className="text-muted-foreground mb-4">
                          Ready Players: {readyPlayersCount}/{totalPlayersCount} 
                          {!hasMinimumPlayers && ` (Need at least 2 players)`}
                        </p>
                        <Progress value={(readyPlayersCount / Math.max(totalPlayersCount, 1)) * 100} className="w-full max-w-md mx-auto" />
                        {isUserHost && !allPlayersReady && (
                          <p className="text-sm text-muted-foreground mt-2">
                            Waiting for all players to be ready...
                          </p>
                        )}
                        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                          <h3 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">How to Play:</h3>
                          <p className="text-sm text-blue-600 dark:text-blue-400">
                            Work together to complete sentences by dragging words into the blanks. 
                            You can see each other's cursors and coordinate your moves!
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {gamePhase === 'finished' && (
                  <Card className="mb-6">
                    <CardContent className="p-6">
                      <div className="text-center">
                        <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold mb-2">Game Complete!</h2>
                        <p className="text-muted-foreground">
                          Great teamwork on completing the sentences!
                        </p>
                        {isUserHost && (
                          <Button onClick={startGame} className="mt-4">
                            Play Again
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Main Game Area */}
                  <div className="lg:col-span-3 space-y-6 min-w-0">
                    {gamePhase === 'playing' && (
                      <>
                        {/* Game Info */}
                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-violet-50 to-blue-50 dark:from-violet-950 dark:to-blue-950 rounded-lg border">
                          <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                              <Timer className="h-5 w-5 text-violet-600" />
                              <span className="font-mono text-xl font-bold text-violet-700 dark:text-violet-300">
                                {formatTime(timeLeft)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Target className="h-5 w-5 text-blue-600" />
                              <span className="font-semibold text-blue-700 dark:text-blue-300">
                                Progress: {Math.round(gameProgress)}%
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MousePointer2 className="h-4 w-4 text-green-600" />
                              <span className="text-sm text-green-700 dark:text-green-300">
                                {Object.keys(cursors).length} active cursors
                              </span>
                            </div>
                          </div>
                          <Progress value={gameProgress} className="w-40" />
                        </div>

                        {/* Main Game Area with Cursor Tracking */}
                        <div 
                          ref={gameAreaRef}
                          className="relative space-y-6 w-full"
                        >
                          {/* Debug: Show cursor count */}
                          {Object.keys(cursors).length > 0 && (
                            <div className="absolute top-0 right-0 bg-black text-white text-xs px-2 py-1 rounded z-50">
                              Cursors: {Object.keys(cursors).length}
                            </div>
                          )}
                          
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
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <MessageCircle className="h-5 w-5" />
                                Complete the Sentence
                              </CardTitle>
                              <CardDescription>
                                Drag words from below to fill in the blanks. Work together with your team!
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="p-8 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950 rounded-lg min-h-[140px] flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700">
                                {renderSentenceWithSlots()}
                              </div>
                              {currentSentence && (
                                <div className="mt-4 flex items-center justify-center gap-4 text-sm text-muted-foreground">
                                  <Badge variant="outline">{currentSentence.theme}</Badge>
                                  <Badge variant="outline">{currentSentence.difficulty}</Badge>
                                  <span>{currentSentence.slots.length} blanks to fill</span>
                                </div>
                              )}
                            </CardContent>
                          </Card>

                          {/* Word Bank */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <Target className="h-5 w-5" />
                                Word Bank
                                <Badge variant="secondary" className="ml-2">
                                  {words.filter(w => !w.isPlaced).length} words left
                                </Badge>
                              </CardTitle>
                              <CardDescription>
                                Drag these words to complete the sentence above. Watch for other players' cursors!
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="relative min-h-[250px] p-8 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950 dark:via-purple-950 dark:to-pink-950 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 overflow-hidden">
                                {/* Draggable Words */}
                                <div className="flex flex-wrap gap-4 justify-center">
                                {words.filter(word => !word.isPlaced).map((word) => (
                                  <div
                                    key={word.id}
                                    className={`px-6 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl cursor-move transition-all duration-200 hover:shadow-lg select-none ${
                                      word.draggedBy && word.draggedBy !== user?.uid 
                                        ? 'opacity-60 cursor-not-allowed border-red-300 bg-red-50 dark:bg-red-950' 
                                        : 'hover:scale-105 hover:border-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950'
                                    } ${
                                      draggedWord === word.id ? 'shadow-xl scale-110 rotate-2 border-violet-400 bg-violet-100 dark:bg-violet-900 ring-4 ring-violet-200 dark:ring-violet-800' : ''
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
                                      <div className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
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
                                    <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                                    <p className="text-lg font-semibold text-green-700 dark:text-green-300">All words placed!</p>
                                    <p className="text-sm text-muted-foreground">Waiting for next sentence...</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>

                        </div>
                      </>
                    )}

                    {/* Chat */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MessageCircle className="h-5 w-5" />
                          Team Chat
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="h-32 overflow-y-auto border rounded-lg p-3 bg-gray-50 dark:bg-gray-900">
                            {chatMessages.length === 0 ? (
                              <p className="text-muted-foreground text-sm">No messages yet... Start chatting to coordinate!</p>
                            ) : (
                              <div className="space-y-2">
                                {chatMessages.map((message) => (
                                  <div key={message.id} className="text-sm">
                                    {message.isSystem ? (
                                      <div className="text-center text-muted-foreground italic">
                                        {message.message}
                                      </div>
                                    ) : (
                                      <div>
                                        <span className="font-medium text-violet-600">
                                          {message.senderName}:
                                        </span>{' '}
                                        <span>{message.message}</span>
                                        <span className="text-xs text-muted-foreground ml-2">
                                          {new Date(message.timestamp).toLocaleTimeString()}
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
                              placeholder="Type a message to coordinate..."
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleSendMessage();
                                }
                              }}
                            />
                            <Button onClick={handleSendMessage} size="sm">
                              <Send className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-6">
                    {/* Players */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          Players ({gameData?.players.length || 0}/{gameData?.maxPlayers || 4})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {gameData?.players.map((player: any, index: number) => (
                            <div 
                              key={player.id} 
                              className="flex items-center gap-3 p-3 rounded-lg border bg-white dark:bg-gray-900/50"
                            >
                              <UserAvatar user={player} size="sm" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm truncate">{player.name}</span>
                                  {player.isHost && (
                                    <Crown className="h-3 w-3 text-yellow-500" />
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <div 
                                    className="w-3 h-3 rounded-full border-2 border-white shadow-sm"
                                    style={{ backgroundColor: getPlayerColor(player.id) }}
                                  ></div>
                                  <span>Cursor</span>
                                  {gamePhase === 'playing' && Object.keys(cursors).includes(player.id) && (
                                    <span className="text-green-600 dark:text-green-400">• Active</span>
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
                    <Card>
                      <CardHeader>
                        <CardTitle>Game Info</CardTitle>
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
                      </CardContent>
                    </Card>
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