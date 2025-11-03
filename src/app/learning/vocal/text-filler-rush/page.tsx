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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Clock, 
  Trophy, 
  Mic, 
  MicOff, 
  CheckCircle2, 
  XCircle, 
  Bell, 
  AlertCircle,
  Loader2,
  Volume2,
  Pause
} from "lucide-react";
import { ref, push, set } from "firebase/database";
import { database } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import Groq from "groq-sdk";

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

interface GameStats {
  totalWords: number;
  correctWords: number;
  incorrectWords: number;
  wordsPerMinute: number;
  accuracy: number;
  score: number;
  timeElapsed: number;
}

// Helper function to calculate Levenshtein distance for fuzzy matching
const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,     // deletion
        matrix[j - 1][i] + 1,     // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  
  return matrix[str2.length][str1.length];
};

// Simple phonetic matching using common sound substitutions
const getPhoneticKey = (word: string): string => {
  return word.toLowerCase()
    // Handle common speech recognition substitutions
    .replace(/ph/g, 'f')
    .replace(/th/g, 't')
    .replace(/sh/g, 's')
    .replace(/ch/g, 's')
    .replace(/ck/g, 'k')
    .replace(/c([eiy])/g, 's$1')
    .replace(/c/g, 'k')
    .replace(/z/g, 's')
    .replace(/x/g, 'ks')
    .replace(/q/g, 'k')
    // Remove common vowel confusions in speech recognition
    .replace(/[aeiou]+/g, 'a') // Simplify vowel sounds
    .replace(/[^a-z]/g, '');
};

// Helper function to check if two words are similar enough
const areWordsSimilar = (word1: string, word2: string): boolean => {
  if (!word1 || !word2) return false;
  
  // Exact match
  if (word1 === word2) return true;
  
  // Too different in length
  if (Math.abs(word1.length - word2.length) > 3) return false;
  
  // For very short words, be more strict but allow some flexibility
  if (word1.length <= 2 || word2.length <= 2) {
    // Allow exact match or single character difference for short words
    const distance = levenshteinDistance(word1, word2);
    return distance <= 1;
  }
  
  // Check phonetic similarity first
  const phonetic1 = getPhoneticKey(word1);
  const phonetic2 = getPhoneticKey(word2);
  
  if (phonetic1 === phonetic2) {
    console.log(`🔊 Phonetic match: "${word1}" → "${phonetic1}" ≈ "${word2}" → "${phonetic2}"`);
    return true;
  }
  
  // Use Levenshtein distance for fuzzy matching
  const distance = levenshteinDistance(word1, word2);
  const maxLength = Math.max(word1.length, word2.length);
  const similarity = 1 - (distance / maxLength);
  
  // Require at least 75% similarity for longer words (more lenient than before)
  const threshold = maxLength <= 4 ? 0.8 : 0.75;
  const isMatch = similarity >= threshold;
  
  if (isMatch) {
    console.log(`📐 Distance match: "${word1}" vs "${word2}" = ${similarity.toFixed(2)} (threshold: ${threshold})`);
  }
  
  return isMatch;
};

// Helper function to clean and normalize words
const normalizeWord = (word: string): string => {
  return word.toLowerCase()
    .replace(/[^\w]/g, "")  // Remove punctuation
    .trim();
};

// Auto-scroll function to keep current word in the top 4 lines
const scrollToCurrentWord = (currentIndex: number, textContainerRef: React.RefObject<HTMLDivElement>) => {
  if (!textContainerRef.current) return;
  
  const container = textContainerRef.current;
  const currentWordElement = container.querySelector(`[data-word-index="${currentIndex}"]`) as HTMLElement;
  
  if (!currentWordElement) return;
  
  const containerRect = container.getBoundingClientRect();
  const wordRect = currentWordElement.getBoundingClientRect();
  
  // Calculate line height (assuming 1.75 for leading-relaxed)
  const lineHeight = parseFloat(getComputedStyle(currentWordElement).lineHeight) || 28;
  const topLinesOffset = lineHeight * 4; // Keep within top 4 lines
  
  // Check if word is below the top 4 lines
  const relativeWordTop = wordRect.top - containerRect.top + container.scrollTop;
  const shouldScroll = wordRect.top > containerRect.top + topLinesOffset;
  
  if (shouldScroll) {
    // Smooth scroll to position the current word in the 2nd line (for some padding)
    const targetScrollTop = relativeWordTop - lineHeight * 1.5;
    
    container.scrollTo({
      top: Math.max(0, targetScrollTop),
      behavior: 'smooth'
    });
  }
};

export default function TextFillerRushPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  // Game state
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentText, setCurrentText] = useState<string[]>([]);
  const [spokenWords, setSpokenWords] = useState<Set<number>>(new Set());
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [gameSessionId, setGameSessionId] = useState<string>("");
  
  // Speech recognition
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [browserCompatible, setBrowserCompatible] = useState(false);
  const recognitionRef = useRef<any>(null);
  
  // Timer and settings
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [difficulty, setDifficulty] = useState(1);
  const [duration, setDuration] = useState(10);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  
  // Use refs to avoid stale closure issues
  const currentWordIndexRef = useRef(0);
  const spokenWordsRef = useRef<Set<number>>(new Set());
  const gameStartedRef = useRef(false);
  const gameEndedRef = useRef(false);
  const currentTextRef = useRef<string[]>([]);
  const isGeneratingTextRef = useRef(false);
  const shouldEndGameRef = useRef(false);
  
  // Auto-scroll refs
  const textContainerRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;
  const currentWordRef = useRef<HTMLSpanElement>(null);
  
  // Stats (removed incorrectWords)
  const [stats, setStats] = useState<GameStats>({
    totalWords: 0,
    correctWords: 0,
    incorrectWords: 0, // Keep for compatibility but won't be used
    wordsPerMinute: 0,
    accuracy: 0,
    score: 0,
    timeElapsed: 0,
  });

  // Sync refs with state
  useEffect(() => {
    currentWordIndexRef.current = currentWordIndex;
  }, [currentWordIndex]);

  useEffect(() => {
    spokenWordsRef.current = spokenWords;
  }, [spokenWords]);

  useEffect(() => {
    gameStartedRef.current = gameStarted;
  }, [gameStarted]);

  useEffect(() => {
    gameEndedRef.current = gameEnded;
  }, [gameEnded]);

  useEffect(() => {
    currentTextRef.current = currentText;
    console.log("📝 Text updated in ref:", currentText.length, "words");
    
    // Check if we need to generate more text (when user is near the end)
    const wordsRemaining = currentText.length - currentWordIndexRef.current;
    if (gameStartedRef.current && !gameEndedRef.current && wordsRemaining < 20 && !isGeneratingTextRef.current) {
      generateMoreText();
    }
  }, [currentText]);

  useEffect(() => {
    isGeneratingTextRef.current = isGeneratingText;
  }, [isGeneratingText]);

  // Auto-scroll effect to keep current word in top 4 lines
  useEffect(() => {
    if (gameStarted && !gameEnded && currentWordIndex > 0) {
      scrollToCurrentWord(currentWordIndex, textContainerRef);
    }
  }, [currentWordIndex, gameStarted, gameEnded]);

  // Handle end game when timer expires (separate from render cycle)
  useEffect(() => {
    if (shouldEndGameRef.current && !gameEndedRef.current) {
      console.log("⏰ Timer expired, ending game via useEffect");
      shouldEndGameRef.current = false; // Reset the flag
      endGame();
    }
  });

  // Check browser compatibility and load game settings
  useEffect(() => {
    // Check if Speech Recognition API is available
    const hasSpeechRecognition = typeof window !== "undefined" && 
      ("webkitSpeechRecognition" in window || "SpeechRecognition" in window);
    
    // Log browser info for debugging
    if (typeof window !== "undefined") {
      console.log("🌐 Browser User Agent:", navigator.userAgent);
      console.log("🎤 Speech Recognition Available:", hasSpeechRecognition);
      
      // Check specifically for Vivaldi
      const isVivaldi = /Vivaldi/i.test(navigator.userAgent);
      if (isVivaldi) {
        console.warn("⚠️ Vivaldi detected - Speech Recognition support may be limited");
      }
    }
    
    setBrowserCompatible(hasSpeechRecognition);
    
    if (!hasSpeechRecognition) {
      setIsLoading(false);
      return;
    }

    // Try to restore session first
    const restored = restoreGameSession();
    
    if (!restored) {
      // Load game settings from session storage for new game
      const savedDifficulty = sessionStorage.getItem("vocal_game_difficulty");
      const savedDuration = sessionStorage.getItem("vocal_game_duration");
      
      if (!savedDifficulty || !savedDuration) {
        // No settings found, redirect to start page
        router.push("/learning/vocal/start?game=text-filler-rush");
        return;
      }
      
      const diff = parseInt(savedDifficulty);
      const dur = parseInt(savedDuration);
      
      setDifficulty(diff);
      setDuration(dur);
      setTimeRemaining(dur * 60);
      
      // Auto-start game
      startGame(diff, dur);
    }
  }, [router]);

  // Generate text using Groq API
  const generateText = async (useDifficulty: number) => {
    try {
      const difficultyMap: Record<number, string> = {
        1: "simple everyday vocabulary with short sentences (50-80 words)",
        2: "moderate vocabulary with medium-length sentences (80-120 words)",
        3: "advanced vocabulary with complex sentences (120-150 words)",
        4: "sophisticated vocabulary with elaborate sentences and technical terms (150-200 words)",
      };

      const prompt = `Generate a ${difficultyMap[useDifficulty]} paragraph about a random interesting topic. 
      Make it engaging and natural to read aloud. 
      Focus on clarity and proper sentence structure.
      DO NOT include any introductions, titles, or meta-commentary.
      Just provide the pure paragraph text.`;

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a content generator that creates engaging, clear paragraphs for reading practice. Output only the paragraph text, nothing else.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.8,
        max_tokens: 500,
      });

      const generatedText = completion.choices[0]?.message?.content?.trim() || "";
      const words = generatedText.split(/\s+/).filter(word => word.length > 0);
      
      console.log("✅ Text generated successfully:", words.length, "words");
      console.log("📝 First 10 words:", words.slice(0, 10));
      
      setCurrentText(words);
      setStats(prev => ({ ...prev, totalWords: words.length }));
    } catch (error) {
      console.error("❌ Error generating text:", error);
      // Fallback text
      const fallbackTexts = [
        "The art of communication is the language of leadership. Effective communication is not just about speaking clearly, but also about listening actively and understanding diverse perspectives. It bridges gaps between people and creates meaningful connections.",
        "Technology has transformed how we learn and interact with information. From artificial intelligence to virtual reality, innovations continue to reshape our educational landscape. These tools offer unprecedented opportunities for personalized learning experiences.",
        "The power of determination can overcome almost any obstacle. Success is not merely about talent or resources, but about persistence and the willingness to learn from failures. Every challenge presents an opportunity for growth.",
      ];
      const words = fallbackTexts[Math.floor(Math.random() * fallbackTexts.length)].split(/\s+/);
      console.log("⚠️ Using fallback text:", words.length, "words");
      console.log("📝 First 10 words:", words.slice(0, 10));
      setCurrentText(words);
      setStats(prev => ({ ...prev, totalWords: words.length }));
    }
  };

  // Save game state to sessionStorage and Firebase
  const saveGameSession = async () => {
    if (!user || !gameStarted) return;
    
    const sessionData = {
      sessionId: gameSessionId,
      currentText,
      spokenWords: Array.from(spokenWords),
      currentWordIndex,
      stats,
      timeRemaining,
      difficulty,
      duration,
      startTime: startTimeRef.current,
      timestamp: Date.now(),
    };
    
    // Save to sessionStorage for quick recovery
    sessionStorage.setItem("vocal_game_session", JSON.stringify(sessionData));
    
    // Save to Firebase for persistence
    try {
      const sessionRef = ref(database, `users/${user.uid}/activeSession/text-filler-rush`);
      await push(sessionRef, sessionData);
    } catch (error) {
      console.error("Error saving session to Firebase:", error);
    }
  };

  // Restore game session from sessionStorage or Firebase
  const restoreGameSession = (): boolean => {
    try {
      // Try sessionStorage first
      const sessionData = sessionStorage.getItem("vocal_game_session");
      
      if (sessionData) {
        const data = JSON.parse(sessionData);
        console.log("🔄 Restoring game session from sessionStorage");
        
        // Restore state
        setGameSessionId(data.sessionId || `session_${Date.now()}`);
        setCurrentText(data.currentText || []);
        setSpokenWords(new Set(data.spokenWords || []));
        setCurrentWordIndex(data.currentWordIndex || 0);
        setStats(data.stats || { totalWords: 0, correctWords: 0, incorrectWords: 0, wordsPerMinute: 0, accuracy: 0, score: 0, timeElapsed: 0 });
        setTimeRemaining(data.timeRemaining || 0);
        setDifficulty(data.difficulty || 1);
        setDuration(data.duration || 10);
        startTimeRef.current = data.startTime || Date.now();
        
        // Update refs
        currentWordIndexRef.current = data.currentWordIndex || 0;
        spokenWordsRef.current = new Set(data.spokenWords || []);
        currentTextRef.current = data.currentText || [];
        
        // Resume game
        setGameStarted(true);
        setGameEnded(false);
        setIsLoading(false);
        
        // Initialize speech recognition
        initializeSpeechRecognition();
        
        // Resume timer
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          setTimeRemaining(prev => {
            if (prev <= 1) {
              shouldEndGameRef.current = true;
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        return true;
      }
    } catch (error) {
      console.error("Error restoring session:", error);
    }
    
    return false;
  };

  // Save session periodically
  useEffect(() => {
    if (gameStarted && !gameEnded) {
      const sessionInterval = setInterval(saveGameSession, 5000); // Save to sessionStorage every 5 seconds
      const firebaseInterval = setInterval(saveGameProgress, 10000); // Save to Firebase every 10 seconds
      
      return () => {
        clearInterval(sessionInterval);
        clearInterval(firebaseInterval);
      };
    }
  }, [gameStarted, gameEnded, currentText, spokenWords, currentWordIndex, stats, timeRemaining]);
  const generateMoreText = async () => {
    if (isGeneratingTextRef.current || gameEndedRef.current) return;
    
    setIsGeneratingText(true);
    console.log("🔄 Generating more text to continue the game...");
    
    try {
      const difficultyMap: Record<number, string> = {
        1: "simple everyday vocabulary with short sentences (40-60 words)",
        2: "moderate vocabulary with medium-length sentences (60-80 words)", 
        3: "advanced vocabulary with complex sentences (80-100 words)",
        4: "sophisticated vocabulary with elaborate sentences and technical terms (100-120 words)",
      };

      // Generate a unique seed based on current session and timestamp
      const uniqueSeed = `${gameSessionId}_${Date.now()}_${Math.random()}`;
      
      // Varied topic categories to ensure diversity
      const topics = [
        "scientific discoveries and innovations",
        "travel destinations and cultural experiences", 
        "culinary traditions from around the world",
        "environmental conservation efforts",
        "technological advancements and future trends",
        "historical events and their impact",
        "artistic movements and creative expression",
        "space exploration and astronomical phenomena",
        "wildlife and natural habitats",
        "sports and athletic achievements",
        "educational systems and learning methods",
        "urban planning and sustainable cities",
        "medical breakthroughs and health research",
        "renewable energy and green technology",
        "communication and social media evolution"
      ];
      
      const randomTopic = topics[Math.floor(Math.random() * topics.length)];
      
      const prompt = `Write a ${difficultyMap[difficulty]} paragraph about ${randomTopic}. 
      Make it unique, engaging, and natural to read aloud with proper flow and rhythm.
      Use varied sentence structures and avoid repetitive patterns.
      Focus on specific details and examples rather than generic statements.
      Session context: ${uniqueSeed}
      DO NOT include any introductions, titles, or meta-commentary.
      Just provide the pure paragraph text.`;

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system", 
            content: `You are a creative content generator that creates diverse, engaging paragraphs for reading practice. 
            Each response should be completely unique and avoid repetitive themes or sentence structures.
            Vary your writing style, vocabulary, and approach with each generation.
            Output only the paragraph text, nothing else.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.9, // Increased temperature for more variety
        max_tokens: 300,
        top_p: 0.95, // Add nucleus sampling for more diversity
      });

      const generatedText = completion.choices[0]?.message?.content?.trim() || "";
      const newWords = generatedText.split(/\s+/).filter(word => word.length > 0);
      
      console.log("✅ Additional text generated:", newWords.length, "words");
      
      // Append to existing text
      setCurrentText(prev => {
        const updatedText = [...prev, ...newWords];
        console.log("📝 Total text now:", updatedText.length, "words");
        return updatedText;
      });
      
      setStats(prev => ({ ...prev, totalWords: prev.totalWords + newWords.length }));
      
    } catch (error) {
      console.error("❌ Error generating additional text:", error);
      
      // Fallback additional text with more variety
      const fallbackTexts = [
        "Innovation drives progress in countless fields. From renewable energy solutions to medical breakthroughs, human creativity continues to solve complex challenges. Each discovery opens new possibilities for future generations to explore and develop.",
        "The natural world offers endless inspiration through its intricate systems. Ocean currents carry nutrients across continents while ancient forests regulate climate patterns. Understanding these connections helps us appreciate the delicate balance of our ecosystem.",
        "Cultural diversity enriches our global community in remarkable ways. Different traditions, languages, and perspectives create a vibrant tapestry of human experience. Learning from one another builds bridges across geographical and social boundaries.",
        "Technology transforms how we communicate and collaborate daily. Social media platforms connect people across vast distances while artificial intelligence assists with complex problem-solving. These tools reshape our understanding of human interaction.",
        "Sustainable architecture represents the future of urban development. Green buildings incorporate solar panels, rainwater collection, and natural ventilation systems. These innovations reduce environmental impact while creating healthier living spaces.",
        "Music transcends cultural boundaries and touches universal emotions. Different instruments, rhythms, and melodies reflect unique regional histories. Whether classical symphonies or folk traditions, music connects us to our shared humanity.",
        "Space exploration continues to expand our cosmic perspective. Advanced telescopes reveal distant galaxies while robotic missions explore neighboring planets. Each discovery challenges our understanding of the universe and our place within it."
      ];
      
      // Use timestamp to ensure different fallback each time
      const fallbackIndex = Math.floor(Date.now() / 1000) % fallbackTexts.length;
      const fallbackText = fallbackTexts[fallbackIndex];
      const newWords = fallbackText.split(/\s+/);
      
      setCurrentText(prev => [...prev, ...newWords]);
      setStats(prev => ({ ...prev, totalWords: prev.totalWords + newWords.length }));
    } finally {
      setIsGeneratingText(false);
    }
  };

  // Initialize speech recognition
  const initializeSpeechRecognition = () => {
    if (typeof window === "undefined" || !("webkitSpeechRecognition" in window)) {
      return;
    }
    
    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = "en-US";
    
    // Improved settings for better accuracy
    recognitionRef.current.maxAlternatives = 3; // Get multiple alternatives
    recognitionRef.current.serviceURI = ""; // Use default service

    recognitionRef.current.onresult = (event: any) => {
      let interimTranscript = "";
      let finalTranscript = "";
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        const confidence = event.results[i][0].confidence;
        
        // Chrome often returns confidence as 0, so we need to handle this
        const isConfidenceReliable = confidence > 0;
        const minConfidence = isConfidenceReliable ? 0.4 : 0; // Use 0 when confidence is unreliable
        
        if (event.results[i].isFinal) {
          if (confidence >= minConfidence || !isConfidenceReliable) {
            finalTranscript += transcript + " ";
            console.log(`📝 Final transcript: "${transcript}" (confidence: ${confidence || 'N/A'})`);
          } else {
            console.log(`🔇 Low confidence final transcript ignored: "${transcript}" (confidence: ${confidence})`);
          }
        } else {
          // For interim results, be more lenient
          if (confidence >= (isConfidenceReliable ? 0.2 : 0) || !isConfidenceReliable) {
            interimTranscript += transcript + " ";
            console.log(`💭 Interim transcript: "${transcript}" (confidence: ${confidence || 'N/A'})`);
          }
        }
      }
      
      // Process both interim and final transcripts for real-time feedback
      const fullTranscript = (finalTranscript + interimTranscript).trim();
      
      if (fullTranscript) {
        console.log(`🔊 Full transcript to process: "${fullTranscript}"`);
        processSpokenText(fullTranscript);
        setTranscript(fullTranscript);
      }
    };

    recognitionRef.current.onerror = (event: any) => {
      // Handle different error types - fix network error
      if (event.error === "no-speech") {
        // Silently restart on no-speech
        if (gameStartedRef.current && !gameEndedRef.current) {
          setTimeout(() => {
            try {
              recognitionRef.current?.start();
              setIsListening(true);
            } catch (e) {
              // Already listening
            }
          }, 100);
        }
      } else if (event.error === "network") {
        // Network error - this often happens, just continue (FIXED)
        if (gameStartedRef.current && !gameEndedRef.current) {
          setTimeout(() => {
            try {
              recognitionRef.current?.start();
              setIsListening(true);
            } catch (e) {
              // Already listening
            }
          }, 500);
        }
      } else if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setIsListening(false);
        alert("Microphone access is required. Please enable it in your browser settings.");
      }
    };

    recognitionRef.current.onend = () => {
      // Auto-restart if game is still active
      if (gameStartedRef.current && !gameEndedRef.current) {
        setTimeout(() => {
          try {
            recognitionRef.current?.start();
            setIsListening(true);
          } catch (e) {
            // Already listening
          }
        }, 100);
      }
    };
  };

  // Process spoken text and match with current words - improved algorithm
  const processSpokenText = (spokenText: string) => {
    if (!spokenText) {
      console.warn("⚠️ No spoken text provided");
      return;
    }
    
    const textArray = currentTextRef.current; // Use ref to avoid stale closure
    
    if (!textArray.length) {
      console.warn("⚠️ No text loaded yet! Current text length:", textArray.length);
      return;
    }
    
    console.log("📋 Current text has", textArray.length, "words. First 5:", textArray.slice(0, 5));
    console.log("📍 Currently at word index:", currentWordIndexRef.current);

    const spokenWordsArray = spokenText.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    console.log("🗣️ Spoken words to process:", spokenWordsArray);
    
    // New approach: Try to match the current expected word with any word from the transcript
    const currentIndex = currentWordIndexRef.current;
    
    if (currentIndex >= textArray.length) {
      console.log("🏁 Already at end of text");
      return;
    }
    
    const expectedWord = normalizeWord(textArray[currentIndex]);
    console.log(`� Looking for word "${expectedWord}" at index ${currentIndex}`);
    
    // Check if any of the spoken words match the current expected word
    let foundMatch = false;
    
    for (const spokenWord of spokenWordsArray) {
      const cleanSpoken = normalizeWord(spokenWord);
      
      // Skip empty or very short nonsense words (but allow valid short words like "a", "I", etc.)
      if (!cleanSpoken) continue;
      
      console.log(`🔍 Checking spoken word: "${cleanSpoken}" vs expected: "${expectedWord}"`);
      
      // Check if this matches the current expected word
      if (areWordsSimilar(cleanSpoken, expectedWord)) {
        console.log(`✅ MATCH! "${cleanSpoken}" = "${expectedWord}"`);
        
        // Mark this word as correct and move forward
        setSpokenWords(prev => new Set([...prev, currentIndex]));
        setCurrentWordIndex(currentIndex + 1);
        setStats(prev => ({
          ...prev,
          correctWords: prev.correctWords + 1,
        }));
        
        console.log(`➡️ Moving to next word: ${currentIndex} → ${currentIndex + 1}`);
        
        // Save progress to Firebase in real-time
        setTimeout(() => saveGameProgress(), 100); // Small delay to ensure state updates
        
        // Check if we need to generate more text (when user is close to the end)
        const wordsRemaining = currentText.length - (currentIndex + 1);
        console.log(`📊 Words remaining: ${wordsRemaining}`);
        
        if (wordsRemaining <= 15 && !isGeneratingTextRef.current && !gameEndedRef.current) {
          console.log("🔄 Close to end, generating more text...");
          generateMoreText();
        }
        
        foundMatch = true;
        break; // Stop processing after finding the current word
      }
    }
    
    if (!foundMatch) {
      console.log(`⏳ Current word "${expectedWord}" not found in this transcript, waiting for user...`);
      // Don't mark as incorrect - let the user keep trying
    }
  };

  // Start game
  const startGame = async (diff: number, dur: number) => {
    console.log("🎮 Starting game with difficulty:", diff, "duration:", dur, "minutes");
    
    // Prevent multiple calls during loading
    if (gameStartedRef.current) {
      console.log("⚠️ Game already started, ignoring duplicate call");
      return;
    }
    
    // Generate unique session ID
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setGameSessionId(sessionId);
    
    setGameStarted(true);
    setGameEnded(false);
    setSpokenWords(new Set());
    setCurrentWordIndex(0);
    setTranscript("");
    setStats({
      totalWords: 0,
      correctWords: 0,
      incorrectWords: 0,
      wordsPerMinute: 0,
      accuracy: 0,
      score: 0,
      timeElapsed: 0,
    });
    
    // Reset refs
    currentWordIndexRef.current = 0;
    spokenWordsRef.current = new Set();
    startTimeRef.current = Date.now();
    
    console.log("📝 Generating text...");
    await generateText(diff);
    console.log("✅ Text generation complete");
    
    // Initialize speech recognition
    console.log("🎤 Initializing speech recognition...");
    initializeSpeechRecognition();
    console.log("✅ Speech recognition initialized");
    
    // Auto-start microphone after a short delay
    setTimeout(() => {
      if (recognitionRef.current && browserCompatible) {
        try {
          recognitionRef.current.start();
          setIsListening(true);
          console.log("🎤 Microphone started successfully");
        } catch (e) {
          console.error("Failed to start microphone:", e);
        }
      }
    }, 1000);
    
    // Start timer
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          shouldEndGameRef.current = true;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    setIsLoading(false);
  };

  // Toggle listening
  const toggleListening = () => {
    if (!isListening) {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (e) {
        console.log("Already listening");
      }
    } else {
      recognitionRef.current?.stop();
      setIsListening(false);
    }
  };

  // Skip current word if user can't pronounce it
  const skipCurrentWord = () => {
    const currentIndex = currentWordIndexRef.current;
    
    if (currentIndex >= currentText.length) {
      console.log("🏁 No more words to skip");
      return;
    }
    
    console.log(`⏭️ Skipping word "${currentText[currentIndex]}" at index ${currentIndex}`);
    
    // Just move to next word without marking as incorrect
    setCurrentWordIndex(currentIndex + 1);
  };

  // End game
  const endGame = () => {
    setGameEnded(true);
    setGameStarted(false);
    setIsListening(false);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    recognitionRef.current?.stop();
    
    // Debug logging
    console.log("🏁 EndGame Debug:", {
      currentWordIndex,
      totalWords: currentText.length,
      statsCorrectWords: stats.correctWords,
      spokenWordsCount: spokenWords.size,
      timeRemaining,
      duration
    });
    
    // Calculate final stats with NaN protection
    const timeElapsedMinutes = Math.max(0.1, (duration * 60 - timeRemaining) / 60);
    const wpm = timeElapsedMinutes > 0 ? Math.round(stats.correctWords / timeElapsedMinutes) : 0;
    
    // For this continuous reading game, accuracy is based on reading flow
    const totalWordsAttempted = currentWordIndex; // Words the user reached
    const accuracy = totalWordsAttempted > 0 
      ? Math.round((stats.correctWords / totalWordsAttempted) * 100) 
      : 100;
    
    // Enhanced scoring system for continuous reading (capped at 200)
    let score = 0;
    
    // Base score from words read (up to 120 points)
    const baseScore = Math.min(120, stats.correctWords * 2);
    score += baseScore;
    
    // Speed score with optimal range and penalties (up to 50 points)
    const optimalWPM = difficulty === 1 ? 120 : difficulty === 2 ? 140 : difficulty === 3 ? 160 : 180;
    const speedRatio = wpm / optimalWPM;
    let speedScore = 0;
    
    if (speedRatio >= 0.8 && speedRatio <= 1.2) {
      // Optimal range: full points
      speedScore = 50;
    } else if (speedRatio >= 0.6 && speedRatio <= 1.4) {
      // Good range: partial points
      speedScore = 35;
    } else if (speedRatio >= 0.4 && speedRatio <= 1.6) {
      // Acceptable range: minimal points
      speedScore = 20;
    } else {
      // Too slow or too fast: penalty
      speedScore = 10;
    }
    
    score += speedScore;
    
    // Consistency bonus (up to 30 points)
    const progressEfficiency = (stats.correctWords / Math.max(totalWordsAttempted, 1)) * 100;
    let consistencyScore = 0;
    
    if (progressEfficiency >= 95) {
      consistencyScore = 30;
    } else if (progressEfficiency >= 85) {
      consistencyScore = 20;
    } else if (progressEfficiency >= 75) {
      consistencyScore = 10;
    } else {
      consistencyScore = 0;
    }
    
    score += consistencyScore;
    
    // Time utilization penalty/bonus
    const timeUtilization = (duration * 60 - timeRemaining) / (duration * 60);
    if (timeUtilization < 0.8) {
      // Penalty for not using enough time
      score = Math.round(score * 0.9);
    } else if (timeUtilization >= 0.95) {
      // Bonus for full time utilization
      score = Math.round(score * 1.05);
    }
    
    // Apply difficulty multiplier (harder = higher potential score)
    const difficultyMultiplier = difficulty === 1 ? 0.85 : difficulty === 2 ? 0.95 : difficulty === 3 ? 1.0 : 1.1;
    score = Math.round(score * difficultyMultiplier);
    
    // Cap the score at 200 and ensure it's positive
    score = Math.max(0, Math.min(200, score));
    
    // Debug logging for scoring breakdown
    console.log("🏆 Scoring Breakdown:", {
      baseScore: baseScore,
      speedScore: speedScore,
      consistencyScore: consistencyScore,
      wpm: wpm,
      optimalWPM: optimalWPM,
      speedRatio: speedRatio.toFixed(2),
      progressEfficiency: progressEfficiency.toFixed(1),
      timeUtilization: (timeUtilization * 100).toFixed(1) + "%",
      difficultyMultiplier: difficultyMultiplier,
      finalScore: score
    });
    
    // Ensure all values are valid numbers
    const safeWpm = isFinite(wpm) ? wpm : 0;
    const safeAccuracy = isFinite(accuracy) ? accuracy : 100;
    const safeScore = isFinite(score) ? score : 0;
    
    const finalStats: GameStats = {
      totalWords: currentText.length || 0,
      correctWords: stats.correctWords || 0,
      incorrectWords: 0, // Not tracking incorrect words anymore
      wordsPerMinute: safeWpm,
      accuracy: safeAccuracy,
      score: safeScore,
      timeElapsed: duration * 60 - timeRemaining,
    };
    
    setStats(finalStats);
    
    // Save final results to Firebase
    saveGameResults(finalStats);
    
    // Clear session storage
    sessionStorage.removeItem("vocal_game_session");
    
    // Save to session storage for result page
    const resultData = {
      score: finalStats.score,
      timeElapsed: finalStats.timeElapsed,
      difficulty,
      gameId: "text-filler-rush",
      wordsRead: finalStats.correctWords,
      totalWords: finalStats.totalWords,
      readingSpeed: safeWpm,
      fluencyScore: Math.min(100, safeWpm * 2),
      sessionId: gameSessionId,
      gameType: "continuous-reading",
      duration: duration * 60 * 1000, // Convert to milliseconds for consistency
    };
    
    console.log("💾 Saving result data:", resultData);
    sessionStorage.setItem("vocal_game_result", JSON.stringify(resultData));
    
    // Navigate to result page
    router.push("/learning/vocal/result");
  };

  // Save real-time game progress to Firebase  
  const saveGameProgress = async () => {
    if (!user || !gameSessionId || !gameStarted) return;
    
    try {
      const currentTime = Date.now();
      const timeElapsed = duration * 60 - timeRemaining;
      const timeElapsedMinutes = Math.max(0.1, timeElapsed / 60);
      const currentWpm = timeElapsedMinutes > 0 ? Math.round(stats.correctWords / timeElapsedMinutes) : 0;
      
      const progressData = {
        sessionId: gameSessionId,
        currentWordIndex,
        totalWords: currentText.length,
        wordsRead: stats.correctWords,
        timeElapsed,
        timeRemaining,
        currentWpm,
        progressPercentage: Math.round((currentWordIndex / Math.max(currentText.length, 1)) * 100),
        difficulty,
        duration,
        status: "in-progress",
        lastUpdate: currentTime,
        userId: user.uid,
        userEmail: user.email,
        gameType: "continuous-reading"
      };
      
      // Save to real-time path for live tracking
      const progressRef = ref(database, `games/text-filler-rush/${gameSessionId}/progress`);
      await set(progressRef, progressData);
      
      console.log("💾 Real-time progress saved to Firebase");
    } catch (error) {
      console.error("Error saving game progress:", error);
    }
  };

  // Save game results to Firebase
  const saveGameResults = async (finalStats: GameStats) => {
    if (!user) return;
    
    try {
      // Recalculate scoring details for Firebase storage
      const timeElapsedMinutes = Math.max(0.1, finalStats.timeElapsed / 60);
      const optimalWPM = difficulty === 1 ? 120 : difficulty === 2 ? 140 : difficulty === 3 ? 160 : 180;
      const speedRatio = finalStats.wordsPerMinute / optimalWPM;
      const progressEfficiency = (finalStats.correctWords / Math.max(currentWordIndex, 1)) * 100;
      const timeUtilization = finalStats.timeElapsed / (duration * 60);
      
      // Sanitize data - ensure no NaN or Infinity values
      const sanitizedStats = {
        sessionId: gameSessionId,
        totalWords: isFinite(finalStats.totalWords) ? finalStats.totalWords : 0,
        wordsRead: isFinite(finalStats.correctWords) ? finalStats.correctWords : 0,
        wordsPerMinute: isFinite(finalStats.wordsPerMinute) ? finalStats.wordsPerMinute : 0,
        accuracy: isFinite(finalStats.accuracy) ? finalStats.accuracy : 100,
        score: isFinite(finalStats.score) ? finalStats.score : 0,
        timeElapsed: isFinite(finalStats.timeElapsed) ? finalStats.timeElapsed : 0,
        difficulty: isFinite(difficulty) ? difficulty : 1,
        duration: isFinite(duration) ? duration : 10,
        timestamp: Date.now(),
        gameType: "continuous-reading",
        textLength: currentText.length,
        progressPercentage: Math.round((currentWordIndex / Math.max(currentText.length, 1)) * 100),
        userId: user.uid,
        userEmail: user.email,
        endReason: timeRemaining <= 0 ? "timer-completed" : "manual",
        status: "completed",
        // Scoring breakdown for feedback analysis
        scoringDetails: {
          optimalWPM: optimalWPM,
          speedRatio: isFinite(speedRatio) ? Number(speedRatio.toFixed(2)) : 1.0,
          progressEfficiency: isFinite(progressEfficiency) ? Number(progressEfficiency.toFixed(1)) : 100,
          timeUtilization: isFinite(timeUtilization) ? Number((timeUtilization * 100).toFixed(1)) : 100,
          difficultyLevel: difficulty,
          maxPossibleScore: 200
        }
      };
      
      // Save to the games path structure: games/{gameName}/{gameId}/data
      const gameResultsRef = ref(database, `games/text-filler-rush/${gameSessionId}/data`);
      await set(gameResultsRef, sanitizedStats);
      console.log("✅ Game results saved to Firebase at games/text-filler-rush/" + gameSessionId);
    } catch (error) {
      console.error("Error saving game results:", error);
    }
  };

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors on cleanup
        }
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

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
                    <BreadcrumbLink href="/learning/vocal">Vocal Training</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Text Filler Rush</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            <div className="ml-auto flex items-center gap-2 px-4">
              {gameStarted && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-sm px-3 py-1">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatTime(timeRemaining)}
                  </Badge>
                  <Badge variant="outline" className="text-sm px-3 py-1">
                    <Trophy className="h-3 w-3 mr-1" />
                    {stats.correctWords}
                  </Badge>
                  <Button 
                    onClick={endGame}
                    variant="destructive" 
                    size="sm"
                    className="ml-2"
                  >
                    <Pause className="h-4 w-4 mr-1" />
                    End Game
                  </Button>
                </div>
              )}
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
            </div>
          </header>

          {/* Content */}
          <div className="flex flex-1 flex-col gap-2 p-2 pt-0 sm:gap-4 sm:p-4">
            <div className="min-h-[calc(100vh-4rem)] flex-1 rounded-lg sm:rounded-xl">
              {/* Browser Compatibility Warning */}
              {!browserCompatible ? (
                <div className="p-3 sm:p-4 md:p-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-6 py-12 max-w-2xl mx-auto"
                  >
                    <Alert variant="destructive">
                      <AlertCircle className="h-5 w-5" />
                      <AlertTitle className="text-lg font-bold">Speech Recognition Not Supported</AlertTitle>
                      <AlertDescription className="mt-3 space-y-3">
                        <p>Your current browser doesn't support the Web Speech API required for this game.</p>
                        <div className="text-left">
                          <p className="font-semibold mb-2">✅ Fully Supported Browsers:</p>
                          <ul className="list-disc list-inside space-y-1 ml-2">
                            <li><strong>Google Chrome</strong> (Desktop & Mobile) - Recommended</li>
                            <li><strong>Microsoft Edge</strong> (Latest version) - Recommended</li>
                            <li><strong>Safari</strong> (macOS & iOS)</li>
                          </ul>
                          <p className="font-semibold mb-2 mt-3">⚠️ Limited/No Support:</p>
                          <ul className="list-disc list-inside space-y-1 ml-2">
                            <li>Vivaldi - May have issues with Web Speech API</li>
                            <li>Opera - Limited support</li>
                            <li>Firefox - No Web Speech API support</li>
                          </ul>
                        </div>
                        <p className="text-sm mt-4 font-semibold">Please use Chrome or Edge for the best experience.</p>
                      </AlertDescription>
                    </Alert>
                    <Button 
                      onClick={() => router.push("/learning/vocal")} 
                      variant="outline"
                      size="lg"
                    >
                      Back to Vocal Training
                    </Button>
                  </motion.div>
                </div>
              ) : isLoading ? (
                <div className="flex items-center justify-center h-full p-6">
                  <div className="text-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                    <p className="text-lg text-muted-foreground">Preparing your training session...</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col lg:flex-row h-full gap-4 p-3 sm:p-4 md:p-6">
                  {/* Left Side - Microphone Controls & Stats */}
                  <div className="lg:w-2/5 space-y-4">
                    {/* Microphone Control */}
                    <Card className="border-2 border-primary/20">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Mic className="h-5 w-5" />
                          Microphone
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex flex-col items-center gap-4">
                          <Button
                            onClick={toggleListening}
                            size="lg"
                            variant={isListening ? "destructive" : "default"}
                            className="h-20 w-20 rounded-full"
                          >
                            {isListening ? (
                              <Mic className="h-10 w-10 animate-pulse" />
                            ) : (
                              <MicOff className="h-10 w-10" />
                            )}
                          </Button>
                          
                          <div className="text-center w-full">
                            <p className="text-sm font-medium">
                              {isListening ? "🎤 Listening..." : "Click to start"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {isListening ? "Reading your voice in real-time" : "Microphone is off"}
                            </p>
                          </div>
                        </div>
                        
                        {/* Live transcription */}
                        {isListening && transcript && (
                          <div className="mt-3 p-3 rounded-lg bg-muted/50 border">
                            <p className="text-xs text-muted-foreground mb-1 font-semibold">Hearing:</p>
                            <p className="text-sm font-mono">{transcript}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Live Stats */}
                    <div className="grid grid-cols-2 gap-3">
                      <Card>
                        <CardContent className="pt-4 pb-3">
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">Words Read</p>
                            <p className="text-2xl font-bold text-green-500">{stats.correctWords}</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-4 pb-3">
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">Progress</p>
                            <p className="text-2xl font-bold text-blue-500">
                              {Math.round((currentWordIndex / Math.max(currentText.length, 1)) * 100)}%
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-4 pb-3">
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">Speed</p>
                            <p className="text-2xl font-bold text-purple-500">
                              {Math.round(stats.correctWords / Math.max((duration * 60 - timeRemaining) / 60, 0.1))} WPM
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-4 pb-3">
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">Time Left</p>
                            <p className="text-2xl font-bold text-orange-500">
                              {formatTime(timeRemaining)}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Skip Current Word Button */}
                    {gameStarted && currentWordIndex < currentText.length ? (
                      <Button onClick={skipCurrentWord} variant="outline" size="lg" className="w-full">
                        <Pause className="mr-2 h-5 w-5" />
                        Skip Current Word
                      </Button>
                    ) : (
                      <Button onClick={endGame} variant="outline" size="lg" className="w-full">
                        <Pause className="mr-2 h-5 w-5" />
                        End Game
                      </Button>
                    )}
                  </div>

                  {/* Right Side - Text Display */}
                  <div className="lg:w-3/5">
                    <Card className="h-full">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Volume2 className="h-5 w-5" />
                          Read This Text Aloud
                        </CardTitle>
                      </CardHeader>
                      <CardContent 
                        ref={textContainerRef}
                        className="h-[calc(100vh-12rem)] overflow-y-auto"
                        style={{ maxHeight: '100vh' }}
                      >
                        <div className="prose prose-lg max-w-none">
                          <p className="leading-relaxed text-lg">
                            {currentText.map((word, index) => {
                              const isSpoken = spokenWords.has(index);
                              const isCurrent = index === currentWordIndex;
                              
                              return (
                                <motion.span
                                  key={index}
                                  ref={isCurrent ? currentWordRef : undefined}
                                  data-word-index={index}
                                  initial={{ opacity: 0.4 }}
                                  animate={{
                                    opacity: isSpoken ? 1 : 0.7,
                                    color: isSpoken 
                                      ? "rgb(34, 197, 94)" // green-500
                                      : isCurrent
                                      ? "rgb(59, 130, 246)" // blue-500
                                      : "currentColor",
                                    fontWeight: isCurrent ? 700 : isSpoken ? 600 : 400,
                                    scale: isCurrent ? 1.05 : 1,
                                  }}
                                  transition={{ duration: 0.2 }}
                                  className="inline-block mr-2"
                                >
                                  {word}
                                  {isSpoken && (
                                    <CheckCircle2 className="inline h-3 w-3 ml-1 text-green-500" />
                                  )}
                                </motion.span>
                              );
                            })}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
