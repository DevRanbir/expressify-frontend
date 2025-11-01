import { useState, useEffect, useCallback } from 'react';
import { database } from '@/lib/firebase';
import { ref, push, set, onValue, off, serverTimestamp, remove } from 'firebase/database';
import { useAuth } from '@/contexts/AuthContext';

// Types for collaboration system
export interface GameSession {
  id: string;
  name: string;
  category: string;
  difficulty: string;
  timeLimit: number;
  maxPlayers: number;
  creator: string;
  creatorId: string;
  description: string;
  status: 'waiting' | 'playing' | 'finished';
  players: Player[];
  createdAt: number;
  gameCode: string;
}

export interface Player {
  id: string;
  name: string;
  photoURL?: string | null;
  isHost: boolean;
  joinedAt: number;
  isReady: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface GameState {
  currentTurn?: number;
  timeLeft?: number;
  progress?: number;
  currentPrompt?: string;
  scores?: Record<string, number>;
}

// Hook for managing game sessions
export const useGameSessions = () => {
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionsRef = ref(database, 'gameSessions');
    
    const unsubscribe = onValue(sessionsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const sessionsList = Object.entries(data).map(([key, value]: [string, any]) => ({
          id: key,
          ...value
        }));
        setSessions(sessionsList.sort((a, b) => b.createdAt - a.createdAt));
      } else {
        setSessions([]);
      }
      setLoading(false);
    });

    return () => off(sessionsRef, 'value', unsubscribe);
  }, []);

  return { sessions, loading };
};

// Hook for creating and managing a specific game session
export const useGameSession = (gameCode?: string) => {
  const { user } = useAuth();
  const [session, setSession] = useState<GameSession | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [gameState, setGameState] = useState<GameState>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create a new game session
  const createGameSession = useCallback(async (gameData: Omit<GameSession, 'id' | 'players' | 'createdAt' | 'gameCode'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const gameCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const sessionRef = push(ref(database, 'gameSessions'));
      
      const newSession: Omit<GameSession, 'id'> = {
        ...gameData,
        gameCode,
        players: [{
          id: user.uid,
          name: user.displayName || 'Anonymous',
          photoURL: user.photoURL || null,
          isHost: true,
          joinedAt: Date.now(),
          isReady: false
        }],
        createdAt: Date.now()
      };

      await set(sessionRef, newSession);
      return gameCode;
    } catch (err) {
      console.error('Error creating game session:', err);
      throw err;
    }
  }, [user]);

  // Join an existing game session
  const joinGameSession = useCallback(async (code: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Find session by game code
      const sessionsRef = ref(database, 'gameSessions');
      const snapshot = await new Promise<any>((resolve) => {
        onValue(sessionsRef, resolve, { onlyOnce: true });
      });

      const sessions = snapshot.val();
      if (!sessions) throw new Error('Game not found');

      const sessionEntry = Object.entries(sessions).find(([_, session]: [string, any]) => 
        session.gameCode === code
      );

      if (!sessionEntry) throw new Error('Game not found');

      const [sessionId, sessionData] = sessionEntry as [string, any];

      // Check if user is already in the game
      const existingPlayer = sessionData.players?.find((p: Player) => p.id === user.uid);
      if (existingPlayer) {
        return sessionId; // Already in game
      }

      // Check if game is full
      if (sessionData.players?.length >= sessionData.maxPlayers) {
        throw new Error('Game is full');
      }

      // Check if game has already started
      if (sessionData.status === 'playing') {
        throw new Error('Game has already started');
      }

      // Add player to the session
      const newPlayer: Player = {
        id: user.uid,
        name: user.displayName || 'Anonymous',
        photoURL: user.photoURL || null,
        isHost: false,
        joinedAt: Date.now(),
        isReady: false
      };

      const updatedPlayers = [...(sessionData.players || []), newPlayer];
      await set(ref(database, `gameSessions/${sessionId}/players`), updatedPlayers);

      // Add system message
      await addChatMessage(sessionId, `${newPlayer.name} joined the game`, true);

      return sessionId;
    } catch (err) {
      console.error('Error joining game session:', err);
      throw err;
    }
  }, [user]);

  // Leave game session
  const leaveGameSession = useCallback(async (sessionId: string) => {
    if (!user || !session) return;

    try {
      const updatedPlayers = session.players.filter(p => p.id !== user.uid);
      
      if (updatedPlayers.length === 0) {
        // If no players left, delete the session
        await remove(ref(database, `gameSessions/${sessionId}`));
      } else {
        // If host is leaving, assign new host
        if (session.players.find(p => p.id === user.uid)?.isHost && updatedPlayers.length > 0) {
          updatedPlayers[0].isHost = true;
        }
        
        await set(ref(database, `gameSessions/${sessionId}/players`), updatedPlayers);
        await addChatMessage(sessionId, `${user.displayName || 'Player'} left the game`, true);
      }
    } catch (err) {
      console.error('Error leaving game session:', err);
    }
  }, [user, session]);

  // Add chat message
  const addChatMessage = useCallback(async (sessionId: string, message: string, isSystem = false) => {
    if (!user && !isSystem) return;

    try {
      const messagesRef = ref(database, `gameChats/${sessionId}`);
      const newMessage: Omit<ChatMessage, 'id'> = {
        senderId: isSystem ? 'system' : user!.uid,
        senderName: isSystem ? 'System' : user!.displayName || 'Anonymous',
        message,
        timestamp: Date.now(),
        isSystem
      };

      await push(messagesRef, newMessage);
    } catch (err) {
      console.error('Error adding chat message:', err);
    }
  }, [user]);

  // Update game state
  const updateGameState = useCallback(async (sessionId: string, newState: Partial<GameState>) => {
    try {
      const gameStateRef = ref(database, `gameStates/${sessionId}`);
      await set(gameStateRef, { ...gameState, ...newState });
    } catch (err) {
      console.error('Error updating game state:', err);
    }
  }, [gameState]);

  // Toggle player ready status
  const togglePlayerReady = useCallback(async (sessionId: string) => {
    if (!user || !session) return;

    try {
      const playerIndex = session.players.findIndex(p => p.id === user.uid);
      if (playerIndex === -1) return;

      const updatedPlayers = [...session.players];
      updatedPlayers[playerIndex].isReady = !updatedPlayers[playerIndex].isReady;

      await set(ref(database, `gameSessions/${sessionId}/players`), updatedPlayers);
    } catch (err) {
      console.error('Error toggling ready status:', err);
    }
  }, [user, session]);

  // Start game
  const startGame = useCallback(async (sessionId: string) => {
    if (!user || !session) return;

    const userPlayer = session.players.find(p => p.id === user.uid);
    if (!userPlayer?.isHost) throw new Error('Only host can start the game');

    try {
      console.log('[Hook] startGame called for session:', sessionId);
      
      // Initialize player scores to 100
      const scoresRef = ref(database, `gameSessions/${sessionId}/playerScores`);
      const initialScores: Record<string, number> = {};
      session.players.forEach((player) => {
        initialScores[player.id] = 100;
      });
      await set(scoresRef, initialScores);
      console.log('[Hook] Player scores initialized');

      // Initialize authoritative timer in Firebase
      const timerRef = ref(database, `gameSessions/${sessionId}/timer`);
      const duration = session?.timeLimit ? session.timeLimit * 60 : 600; // minutes to seconds
      console.log('[Hook] Setting timer with duration:', duration, 'seconds (', session?.timeLimit, 'minutes)');
      
      await set(timerRef, {
        startTime: Date.now(),
        duration: duration,
        initialized: true
      });
      console.log('[Hook] Timer initialized in Firebase');

      // Update game status to playing
      await set(ref(database, `gameSessions/${sessionId}/status`), 'playing');
      console.log('[Hook] Game status set to playing');
      
      await addChatMessage(sessionId, 'Game started! Good luck everyone!', true);
      console.log('[Hook] startGame completed successfully');
    } catch (err) {
      console.error('Error starting game:', err);
      throw err;
    }
  }, [user, session, addChatMessage]);

  // Subscribe to session updates
  useEffect(() => {
    if (!gameCode) {
      setLoading(false);
      return;
    }

    const fetchSession = async () => {
      try {
        const sessionsRef = ref(database, 'gameSessions');
        const unsubscribe = onValue(sessionsRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const sessionEntry = Object.entries(data).find(([_, session]: [string, any]) => 
              session.gameCode === gameCode
            );

            if (sessionEntry) {
              const [sessionId, sessionData] = sessionEntry as [string, any];
              setSession({ id: sessionId, ...sessionData });
              setError(null);
            } else {
              setError('Game session not found');
              setSession(null);
            }
          } else {
            setError('Game session not found');
            setSession(null);
          }
          setLoading(false);
        });

        return unsubscribe;
      } catch (err) {
        console.error('Error fetching session:', err);
        setError('Failed to load game session');
        setLoading(false);
      }
    };

    const unsubscribe = fetchSession();
    return () => {
      if (unsubscribe) {
        Promise.resolve(unsubscribe).then(unsub => {
          if (typeof unsub === 'function') unsub();
        });
      }
    };
  }, [gameCode]);

  // Subscribe to chat messages
  useEffect(() => {
    if (!session?.id) return;

    const chatRef = ref(database, `gameChats/${session.id}`);
    const unsubscribe = onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const messagesList = Object.entries(data).map(([key, value]: [string, any]) => ({
          id: key,
          ...value
        }));
        setChatMessages(messagesList.sort((a, b) => a.timestamp - b.timestamp));
      } else {
        setChatMessages([]);
      }
    });

    return () => off(chatRef, 'value', unsubscribe);
  }, [session?.id]);

  // Subscribe to game state
  useEffect(() => {
    if (!session?.id) return;

    const gameStateRef = ref(database, `gameStates/${session.id}`);
    const unsubscribe = onValue(gameStateRef, (snapshot) => {
      const data = snapshot.val();
      setGameState(data || {});
    });

    return () => off(gameStateRef, 'value', unsubscribe);
  }, [session?.id]);

  return {
    session,
    chatMessages,
    gameState,
    loading,
    error,
    createGameSession,
    joinGameSession,
    leaveGameSession,
    addChatMessage,
    updateGameState,
    togglePlayerReady,
    startGame
  };
};