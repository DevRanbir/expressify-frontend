"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { UserAvatar } from '@/components/UserAvatar';
import { database } from '@/lib/firebase';
import { ref, set, onValue, off } from 'firebase/database';
import { toast } from 'sonner';
import { 
  CheckCircle,
  Zap,
  Target,
  RotateCcw,
  MousePointer2,
  Trophy
} from 'lucide-react';

// Types for the drag-and-drop sentence game
interface WordItem {
  id: string;
  text: string;
  isPlaced: boolean;
  placedInSlot?: number;
  draggedBy?: string; // player ID currently dragging
}

interface SentenceSlot {
  id: number;
  correctWord?: string;
  hint?: string;
}

interface Cursor {
  playerId: string;
  playerName: string;
  x: number;
  y: number;
  color: string;
  lastUpdate: number;
}

interface GameSentence {
  id: string;
  template: string; // "The ___ jumped over the ___"
  slots: SentenceSlot[];
  words: WordItem[];
  difficulty: 'easy' | 'medium' | 'hard';
  theme: string;
}

// Predefined sentences for the game
const GAME_SENTENCES: GameSentence[] = [
  {
    id: '1',
    template: 'The ___ cat jumped over the ___ fence.',
    slots: [
      { id: 0, correctWord: 'quick', hint: 'speed' },
      { id: 1, correctWord: 'tall', hint: 'height' }
    ],
    words: [
      { id: 'w1', text: 'quick', isPlaced: false },
      { id: 'w2', text: 'slow', isPlaced: false },
      { id: 'w3', text: 'tall', isPlaced: false },
      { id: 'w4', text: 'short', isPlaced: false },
      { id: 'w5', text: 'blue', isPlaced: false },
      { id: 'w6', text: 'wooden', isPlaced: false }
    ],
    difficulty: 'easy',
    theme: 'Animals'
  },
  {
    id: '2',
    template: 'She ___ a ___ book about ___ adventures.',
    slots: [
      { id: 0, correctWord: 'read', hint: 'past tense of reading' },
      { id: 1, correctWord: 'fascinating', hint: 'very interesting' },
      { id: 2, correctWord: 'amazing', hint: 'wonderful' }
    ],
    words: [
      { id: 'w1', text: 'read', isPlaced: false },
      { id: 'w2', text: 'wrote', isPlaced: false },
      { id: 'w3', text: 'fascinating', isPlaced: false },
      { id: 'w4', text: 'boring', isPlaced: false },
      { id: 'w5', text: 'amazing', isPlaced: false },
      { id: 'w6', text: 'terrible', isPlaced: false }
    ],
    difficulty: 'medium',
    theme: 'Reading'
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

interface SentenceBuilderGameProps {
  gameData: any;
  gamePhase: 'waiting' | 'playing' | 'finished';
  onGamePhaseChange: (phase: 'waiting' | 'playing' | 'finished') => void;
}

export default function SentenceBuilderGame({ gameData, gamePhase, onGamePhaseChange }: SentenceBuilderGameProps) {
  const { user } = useAuth();

  // Game state
  const [currentSentence, setCurrentSentence] = useState<GameSentence | null>(null);
  const [words, setWords] = useState<WordItem[]>([]);
  const [cursors, setCursors] = useState<Record<string, Cursor>>({});
  const [draggedWord, setDraggedWord] = useState<string | null>(null);
  const [gameProgress, setGameProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);

  // Refs for game area
  const gameAreaRef = useRef<HTMLDivElement>(null);

  // Player color assignment
  const getPlayerColor = useCallback((playerId: string) => {
    const playerIndex = gameData?.players.findIndex((p: any) => p.id === playerId) || 0;
    return PLAYER_COLORS[playerIndex % PLAYER_COLORS.length];
  }, [gameData?.players]);

  // Initialize game with random sentence
  useEffect(() => {
    if (gamePhase === 'playing' && !currentSentence) {
      const randomSentence = GAME_SENTENCES[Math.floor(Math.random() * GAME_SENTENCES.length)];
      setCurrentSentence(randomSentence);
      setWords(randomSentence.words);
      setTimeLeft(gameData?.timeLimit ? gameData.timeLimit * 60 : 300); // 5 minutes default
    }
  }, [gamePhase, currentSentence, gameData?.timeLimit]);

  // Timer effect
  useEffect(() => {
    if (gamePhase === 'playing' && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            onGamePhaseChange('finished');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [gamePhase, timeLeft, onGamePhaseChange]);

  // Mouse tracking for cursor sharing
  useEffect(() => {
    if (!gameAreaRef.current || !user || gamePhase !== 'playing') return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = gameAreaRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Update cursor position in Firebase
      if (gameData?.id) {
        const cursorRef = ref(database, `gameSessions/${gameData.id}/cursors/${user.uid}`);
        set(cursorRef, {
          playerId: user.uid,
          playerName: user.displayName || 'Anonymous',
          x,
          y,
          color: getPlayerColor(user.uid),
          lastUpdate: Date.now()
        });
      }
    };

    const gameArea = gameAreaRef.current;
    gameArea.addEventListener('mousemove', handleMouseMove);

    return () => {
      gameArea.removeEventListener('mousemove', handleMouseMove);
    };
  }, [gameData?.id, user, gamePhase, getPlayerColor]);

  // Listen for cursor updates from other players
  useEffect(() => {
    if (!gameData?.id || gamePhase !== 'playing') return;

    const cursorsRef = ref(database, `gameSessions/${gameData.id}/cursors`);
    
    const unsubscribe = onValue(cursorsRef, (snapshot) => {
      const cursorsData = snapshot.val();
      if (cursorsData) {
        // Filter out current user's cursor and stale cursors (older than 5 seconds)
        const now = Date.now();
        const activeCursors = Object.entries(cursorsData)
          .filter(([playerId, cursor]: [string, any]) => 
            playerId !== user?.uid && 
            cursor.lastUpdate && 
            (now - cursor.lastUpdate) < 5000
          )
          .reduce((acc, [playerId, cursor]) => {
            acc[playerId] = cursor as Cursor;
            return acc;
          }, {} as Record<string, Cursor>);

        setCursors(activeCursors);
      } else {
        setCursors({});
      }
    });

    return () => off(cursorsRef, 'value', unsubscribe);
  }, [gameData?.id, user?.uid, gamePhase]);

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, wordId: string) => {
    e.dataTransfer.setData('text/plain', wordId);
    setDraggedWord(wordId);

    // Update Firebase to show this word is being dragged
    if (gameData?.id && user) {
      const wordRef = ref(database, `gameSessions/${gameData.id}/draggedWords/${wordId}`);
      set(wordRef, {
        draggedBy: user.uid,
        playerName: user.displayName || 'Anonymous',
        timestamp: Date.now()
      });
    }
  };

  const handleDragEnd = () => {
    if (draggedWord && gameData?.id) {
      // Clear dragged state in Firebase
      const wordRef = ref(database, `gameSessions/${gameData.id}/draggedWords/${draggedWord}`);
      set(wordRef, null);
    }
    setDraggedWord(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, slotId: number) => {
    e.preventDefault();
    const wordId = e.dataTransfer.getData('text/plain');

    if (!wordId || !currentSentence) return;

    // Find the word being dropped
    const wordIndex = words.findIndex(w => w.id === wordId);
    if (wordIndex === -1) return;

    // Check if slot is already occupied
    const slotOccupied = words.some(w => w.placedInSlot === slotId && w.id !== wordId);
    if (slotOccupied) {
      toast.error('This slot is already occupied!');
      return;
    }

    // Update word placement
    const updatedWords = [...words];
    
    // Remove word from previous slot if it was placed
    if (updatedWords[wordIndex].isPlaced) {
      updatedWords[wordIndex].isPlaced = false;
      updatedWords[wordIndex].placedInSlot = undefined;
    }

    // Place word in new slot
    updatedWords[wordIndex].isPlaced = true;
    updatedWords[wordIndex].placedInSlot = slotId;

    setWords(updatedWords);

    // Update progress
    const placedWords = updatedWords.filter(w => w.isPlaced).length;
    setGameProgress((placedWords / currentSentence.slots.length) * 100);

    // Check if sentence is complete
    if (placedWords === currentSentence.slots.length) {
      toast.success('Sentence completed! Moving to next challenge...');
      setTimeout(() => {
        const nextSentence = GAME_SENTENCES[Math.floor(Math.random() * GAME_SENTENCES.length)];
        setCurrentSentence(nextSentence);
        setWords(nextSentence.words);
        setGameProgress(0);
      }, 2000);
    }

    // Sync with Firebase
    if (gameData?.id) {
      const wordsRef = ref(database, `gameSessions/${gameData.id}/gameState/words`);
      set(wordsRef, updatedWords);
    }
  };

  const handleRemoveWord = (wordId: string) => {
    const updatedWords = words.map(w => 
      w.id === wordId 
        ? { ...w, isPlaced: false, placedInSlot: undefined }
        : w
    );
    setWords(updatedWords);

    const placedWords = updatedWords.filter(w => w.isPlaced).length;
    setGameProgress(currentSentence ? (placedWords / currentSentence.slots.length) * 100 : 0);

    // Sync with Firebase
    if (gameData?.id) {
      const wordsRef = ref(database, `gameSessions/${gameData.id}/gameState/words`);
      set(wordsRef, updatedWords);
    }
  };

  const renderSentenceWithSlots = () => {
    if (!currentSentence) return null;

    const parts = currentSentence.template.split('___');
    const result = [];

    for (let i = 0; i < parts.length; i++) {
      result.push(
        <span key={`text-${i}`} className="text-xl font-medium">
          {parts[i]}
        </span>
      );

      if (i < currentSentence.slots.length) {
        const slot = currentSentence.slots[i];
        const placedWord = words.find(w => w.placedInSlot === slot.id);

        result.push(
          <div
            key={`slot-${slot.id}`}
            className={`
              inline-flex items-center justify-center min-w-[120px] h-12 mx-2 px-4
              border-2 border-dashed rounded-lg transition-all duration-200
              ${placedWord 
                ? 'border-green-400 bg-green-50 text-green-800' 
                : 'border-blue-300 bg-blue-50 hover:border-blue-400'
              }
            `}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, slot.id)}
          >
            {placedWord ? (
              <div className="flex items-center gap-2">
                <span className="font-semibold">{placedWord.text}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRemoveWord(placedWord.id)}
                  className="h-6 w-6 p-0 hover:bg-red-100"
                >
                  ×
                </Button>
              </div>
            ) : (
              <span className="text-sm text-blue-600 font-medium">
                Drop word here
              </span>
            )}
          </div>
        );
      }
    }

    return <div className="text-center leading-relaxed">{result}</div>;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (gamePhase === 'waiting') {
    return (
      <div className="text-center py-8">
        <h3 className="text-xl font-semibold mb-4">Sentence Builder Game</h3>
        <p className="text-muted-foreground">Waiting for the game to start...</p>
      </div>
    );
  }

  if (gamePhase === 'finished') {
    return (
      <div className="text-center py-8">
        <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold mb-2">Game Finished!</h3>
        <p className="text-muted-foreground">Great collaboration on sentence building!</p>
      </div>
    );
  }

  return (
    <div ref={gameAreaRef} className="relative">
      {/* Other players' cursors */}
      {Object.values(cursors).map(cursor => (
        <div
          key={cursor.playerId}
          className="absolute pointer-events-none z-50 transition-all duration-100"
          style={{
            left: cursor.x,
            top: cursor.y,
            transform: 'translate(-2px, -2px)'
          }}
        >
          <MousePointer2 
            className="h-5 w-5" 
            style={{ color: cursor.color }}
          />
          <div 
            className="text-xs px-2 py-1 rounded shadow-lg text-white font-medium whitespace-nowrap"
            style={{ backgroundColor: cursor.color }}
          >
            {cursor.playerName}
          </div>
        </div>
      ))}

      {/* Game header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6 text-blue-600" />
            Sentence Builder
          </h2>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-lg px-3 py-1">
              {formatTime(timeLeft)}
            </Badge>
            <Badge variant="secondary">
              {currentSentence?.theme || 'Loading...'}
            </Badge>
          </div>
        </div>
        
        {gameProgress > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(gameProgress)}%</span>
            </div>
            <Progress value={gameProgress} className="h-2" />
          </div>
        )}
      </div>

      {/* Sentence building area */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-center">Complete the Sentence</CardTitle>
          <CardDescription className="text-center">
            Drag words from below to fill in the blanks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 px-4 min-h-[120px] flex items-center justify-center">
            {renderSentenceWithSlots()}
          </div>
        </CardContent>
      </Card>

      {/* Available words */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Available Words
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {words.filter(word => !word.isPlaced).map(word => (
              <div
                key={word.id}
                draggable
                onDragStart={(e) => handleDragStart(e, word.id)}
                onDragEnd={handleDragEnd}
                className={`
                  p-3 text-center bg-white border-2 border-blue-200 rounded-lg 
                  cursor-grab active:cursor-grabbing hover:border-blue-400 
                  hover:shadow-md transition-all duration-200 font-medium
                  ${draggedWord === word.id ? 'opacity-50 scale-95' : ''}
                `}
              >
                {word.text}
              </div>
            ))}
          </div>
          
          {words.filter(word => !word.isPlaced).length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
              All words have been placed!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}