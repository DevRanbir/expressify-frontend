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
import { Clock, Lightbulb, Trophy, RefreshCw, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { generateCrosswordPuzzle, CrosswordPuzzle, CrosswordClue } from "@/lib/groqService";
import { ref, push, query, orderByChild, limitToLast, get } from "firebase/database";
import { database } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

export default function CrosswordGamePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [difficulty, setDifficulty] = useState(2);
  const [duration, setDuration] = useState(10);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [score, setScore] = useState(100);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [puzzle, setPuzzle] = useState<CrosswordPuzzle | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [completedWords, setCompletedWords] = useState(0);
  const [totalPuzzlesSolved, setTotalPuzzlesSolved] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [focusedCell, setFocusedCell] = useState<{row: number, col: number} | null>(null);
  const isSavingRef = useRef(false);

  useEffect(() => {
    // Get settings from sessionStorage
    const savedDifficulty = sessionStorage.getItem("textual_game_difficulty");
    const savedDuration = sessionStorage.getItem("textual_game_duration");
    const savedTimeElapsed = sessionStorage.getItem("crossword_time_elapsed");
    const savedStartTime = sessionStorage.getItem("crossword_start_time");
    
    if (savedDifficulty) setDifficulty(parseInt(savedDifficulty));
    if (savedDuration) setDuration(parseInt(savedDuration));
    
    // Restore time elapsed or calculate from start time
    if (savedStartTime) {
      const startTime = parseInt(savedStartTime);
      const currentTime = Date.now();
      const elapsed = Math.floor((currentTime - startTime) / 1000);
      setTimeElapsed(elapsed);
    } else if (savedTimeElapsed) {
      setTimeElapsed(parseInt(savedTimeElapsed));
    } else {
      // Set start time for new game
      sessionStorage.setItem("crossword_start_time", Date.now().toString());
    }

    // Generate initial puzzle
    loadNewPuzzle(parseInt(savedDifficulty || "2"));
  }, []);

  // Auto-focus the focused cell
  useEffect(() => {
    if (focusedCell && puzzle) {
      const cellElement = document.getElementById(`cell-${focusedCell.row}-${focusedCell.col}`);
      if (cellElement) {
        cellElement.focus();
      }
    }
  }, [focusedCell, puzzle]);

  useEffect(() => {
    if (!puzzle) return;

    // Start timer
    timerRef.current = setInterval(() => {
      setTimeElapsed((prev) => {
        const newTime = prev + 1;
        // Save time elapsed to sessionStorage
        sessionStorage.setItem("crossword_time_elapsed", newTime.toString());
        
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
  }, [puzzle, duration]);

  // Save game state when user leaves or closes tab
  useEffect(() => {
    const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
      if (puzzle && timeElapsed > 0) {
        await saveGameData(false);
      }
    };

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden' && puzzle && timeElapsed > 0) {
        await saveGameData(false);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [puzzle, timeElapsed, completedWords, score, hintsUsed, totalPuzzlesSolved, user]);

  const checkForDuplicate = async (gameStats: any) => {
    if (!user) return false;

    try {
      const gameRef = ref(database, `games/crossword-puzzle/${user.uid}`);
      const recentQuery = query(gameRef, orderByChild('timestamp'), limitToLast(3));
      const snapshot = await get(recentQuery);

      if (snapshot.exists()) {
        const data = snapshot.val();
        const entries = Object.values(data) as any[];
        
        // Check if any recent entry matches (within 5 seconds and same stats)
        const isDuplicate = entries.some((entry) => {
          const timeDiff = Math.abs(gameStats.timestamp - entry.timestamp);
          return (
            timeDiff < 5000 && // Within 5 seconds
            entry.score === gameStats.score &&
            entry.accuracy === gameStats.accuracy &&
            entry.timeElapsed === gameStats.timeElapsed &&
            entry.hintsUsed === gameStats.hintsUsed
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
    if (!puzzle || !user || isSavingRef.current) return;

    isSavingRef.current = true;

    const accuracy = (completedWords / puzzle.clues.length) * 100;

    const gameStats = {
      score,
      timeElapsed,
      hintsUsed,
      difficulty,
      completedWords: completedWords + (totalPuzzlesSolved * (puzzle?.clues.length || 0)),
      totalWords: (totalPuzzlesSolved + 1) * (puzzle?.clues.length || 0),
      accuracy: Math.round(accuracy),
      gameId: "crossword-puzzle",
      puzzlesSolved: totalPuzzlesSolved + (completedWords === puzzle?.clues.length ? 1 : 0),
      status: completedWords === puzzle?.clues.length ? "completed" : "incomplete",
      timestamp: Date.now(),
    };

    try {
      // Check for duplicate before saving
      const isDuplicate = await checkForDuplicate(gameStats);
      
      if (isDuplicate) {
        console.log("Duplicate entry detected, skipping save");
        isSavingRef.current = false;
        return;
      }

      const gameRef = ref(database, `games/crossword-puzzle/${user.uid}`);
      await push(gameRef, gameStats);
      console.log("Game data saved successfully");

      if (clearSession) {
        sessionStorage.removeItem("crossword_time_elapsed");
        sessionStorage.removeItem("crossword_start_time");
      }
    } catch (error) {
      console.error("Error saving game data:", error);
    } finally {
      isSavingRef.current = false;
    }
  };

  const loadNewPuzzle = async (diff: number) => {
    setLoading(true);
    try {
      const newPuzzle = await generateCrosswordPuzzle(diff);
      setPuzzle(newPuzzle);
      setUserAnswers({});
      setCompletedWords(0);
      setUsedHints(new Set());
      setFocusedCell(null);
    } catch (error) {
      console.error("Error loading puzzle:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeUp = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    if (!puzzle || !user || isSavingRef.current) return;

    isSavingRef.current = true;

    const accuracy = (completedWords / puzzle.clues.length) * 100;

    const gameStats = {
      score,
      timeElapsed: duration * 60, // Full duration since time is up
      hintsUsed,
      difficulty,
      completedWords: completedWords + (totalPuzzlesSolved * (puzzle?.clues.length || 0)),
      totalWords: (totalPuzzlesSolved + 1) * (puzzle?.clues.length || 0),
      accuracy: Math.round(accuracy),
      gameId: "crossword-puzzle",
      puzzlesSolved: totalPuzzlesSolved + (completedWords === puzzle?.clues.length ? 1 : 0),
      status: completedWords === puzzle?.clues.length ? "completed" : "timeout",
      endReason: "time_up",
      timestamp: Date.now(),
    };

    // Save to Firebase
    try {
      // Check for duplicate before saving
      const isDuplicate = await checkForDuplicate(gameStats);
      
      if (!isDuplicate) {
        const gameRef = ref(database, `games/crossword-puzzle/${user.uid}`);
        await push(gameRef, gameStats);
        console.log("Time up - Game data saved successfully");
      } else {
        console.log("Duplicate entry detected on time up, skipping save");
      }
    } catch (error) {
      console.error("Error saving to Firebase:", error);
    }

    // Clear timer data
    sessionStorage.removeItem("crossword_time_elapsed");
    sessionStorage.removeItem("crossword_start_time");
    
    sessionStorage.setItem("textual_game_result", JSON.stringify(gameStats));
    router.push("/learning/textual/result");
  };

  const checkPuzzleCompletion = (answers: Record<string, string>) => {
    if (!puzzle) return false;
    
    let completed = 0;
    puzzle.clues.forEach((clue) => {
      const key = `${clue.number}-${clue.direction}`;
      const userAnswer = answers[key]?.toUpperCase() || "";
      if (userAnswer === clue.answer) {
        completed++;
      }
    });

    setCompletedWords(completed);

    // If all words are correct, generate new puzzle
    if (completed === puzzle.clues.length) {
      setTimeout(() => {
        setTotalPuzzlesSolved((prev) => prev + 1);
        loadNewPuzzle(difficulty);
      }, 1000);
      return true;
    }
    return false;
  };

  const handleAnswerChange = (clueNumber: number, direction: string, value: string) => {
    const key = `${clueNumber}-${direction}`;
    const clue = puzzle?.clues.find(c => c.number === clueNumber && c.direction === direction);
    
    if (!clue) return;

    const newAnswers = { ...userAnswers, [key]: value.toUpperCase() };
    setUserAnswers(newAnswers);

    // Check if answer is correct
    if (value.length === clue.answer.length) {
      if (value.toUpperCase() === clue.answer) {
        // Correct answer: +10%
        setScore((prev) => Math.min(100, prev + 10));
      } else {
        // Incorrect answer: -20%
        setScore((prev) => Math.max(0, prev - 20));
      }
      
      checkPuzzleCompletion(newAnswers);
    }
  };

  const [usedHints, setUsedHints] = useState<Set<string>>(new Set());

  const handleHint = (clueNumber: number, direction: string) => {
    const clue = puzzle?.clues.find(c => c.number === clueNumber && c.direction === direction);
    if (!clue) return;

    const key = `${clueNumber}-${direction}`;
    
    // Check if hint already used for this word
    if (usedHints.has(key)) return;

    const currentAnswer = userAnswers[key] || "";
    
    // Reveal first missing letter
    for (let i = 0; i < clue.answer.length; i++) {
      if (!currentAnswer[i] || currentAnswer[i] !== clue.answer[i]) {
        const newAnswer = currentAnswer.slice(0, i) + clue.answer[i] + currentAnswer.slice(i + 1);
        setUserAnswers({ ...userAnswers, [key]: newAnswer });
        setHintsUsed((prev) => prev + 1);
        setUsedHints(new Set([...usedHints, key]));
        setScore((prev) => Math.max(0, prev - 5)); // Penalty for hint
        break;
      }
    }
  };

  const handleCellClick = (row: number, col: number) => {
    if (!puzzle) return;

    // Get the current cell's letter
    let userLetter = "";
    puzzle.clues.forEach((clue) => {
      const key = `${clue.number}-${clue.direction}`;
      const userAnswer = userAnswers[key] || "";
      
      if (clue.direction === "across" && clue.row === row) {
        const offset = col - clue.col;
        if (offset >= 0 && offset < clue.answer.length) {
          userLetter = userAnswer[offset] || userLetter;
        }
      } else if (clue.direction === "down" && clue.col === col) {
        const offset = row - clue.row;
        if (offset >= 0 && offset < clue.answer.length) {
          userLetter = userAnswer[offset] || userLetter;
        }
      }
    });

    // If cell already has a letter, find nearest empty cell
    if (userLetter) {
      const nearestEmpty = findNearestEmptyCell(row, col);
      if (nearestEmpty) {
        setFocusedCell({ row: nearestEmpty.row, col: nearestEmpty.col });
        return;
      }
    }

    setFocusedCell({ row, col });
  };

  const findNearestEmptyCell = (startRow: number, startCol: number): {row: number, col: number} | null => {
    if (!puzzle) return null;

    // BFS to find nearest empty cell
    const queue: Array<{row: number, col: number, distance: number}> = [
      {row: startRow, col: startCol, distance: 0}
    ];
    const visited = new Set<string>();
    visited.add(`${startRow}-${startCol}`);

    const directions = [
      {dr: 0, dc: 1},   // right
      {dr: 0, dc: -1},  // left
      {dr: 1, dc: 0},   // down
      {dr: -1, dc: 0},  // up
      {dr: 1, dc: 1},   // diagonal down-right
      {dr: 1, dc: -1},  // diagonal down-left
      {dr: -1, dc: 1},  // diagonal up-right
      {dr: -1, dc: -1}, // diagonal up-left
    ];

    while (queue.length > 0) {
      const current = queue.shift()!;
      
      // Skip the starting cell
      if (current.distance > 0) {
        const cellLetter = puzzle.grid[current.row][current.col];
        if (!cellLetter) continue; // Skip empty cells

        // Check if this cell needs input
        let hasLetter = false;
        puzzle.clues.forEach((clue) => {
          const key = `${clue.number}-${clue.direction}`;
          const userAnswer = userAnswers[key] || "";
          
          if (clue.direction === "across" && clue.row === current.row) {
            const offset = current.col - clue.col;
            if (offset >= 0 && offset < clue.answer.length) {
              if (userAnswer[offset]) hasLetter = true;
            }
          } else if (clue.direction === "down" && clue.col === current.col) {
            const offset = current.row - clue.row;
            if (offset >= 0 && offset < clue.answer.length) {
              if (userAnswer[offset]) hasLetter = true;
            }
          }
        });

        if (!hasLetter) {
          return {row: current.row, col: current.col};
        }
      }

      // Add neighbors
      for (const dir of directions) {
        const newRow = current.row + dir.dr;
        const newCol = current.col + dir.dc;
        const key = `${newRow}-${newCol}`;

        if (newRow >= 0 && newRow < puzzle.size && 
            newCol >= 0 && newCol < puzzle.size && 
            !visited.has(key)) {
          visited.add(key);
          queue.push({row: newRow, col: newCol, distance: current.distance + 1});
        }
      }
    }

    return null;
  };

  const handleCellKeyDown = (e: React.KeyboardEvent, row: number, col: number) => {
    if (!puzzle) return;

    // Handle arrow key navigation
    if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      let newRow = row;
      let newCol = col;

      switch (e.key) {
        case "ArrowUp":
          newRow = Math.max(0, row - 1);
          break;
        case "ArrowDown":
          newRow = Math.min(puzzle.size - 1, row + 1);
          break;
        case "ArrowLeft":
          newCol = Math.max(0, col - 1);
          break;
        case "ArrowRight":
          newCol = Math.min(puzzle.size - 1, col + 1);
          break;
      }

      // Skip empty cells
      while (newRow !== row || newCol !== col) {
        if (puzzle.grid[newRow][newCol]) {
          setFocusedCell({ row: newRow, col: newCol });
          return;
        }
        
        // Continue in the same direction if empty
        if (e.key === "ArrowUp") {
          newRow--;
          if (newRow < 0) return;
        } else if (e.key === "ArrowDown") {
          newRow++;
          if (newRow >= puzzle.size) return;
        } else if (e.key === "ArrowLeft") {
          newCol--;
          if (newCol < 0) return;
        } else if (e.key === "ArrowRight") {
          newCol++;
          if (newCol >= puzzle.size) return;
        }
      }
      return;
    }

    // Handle backspace
    if (e.key === "Backspace") {
      e.preventDefault();
      updateCellValue(row, col, "");
      return;
    }

    // Handle letter input
    if (/^[a-zA-Z]$/.test(e.key)) {
      e.preventDefault();
      updateCellValue(row, col, e.key.toUpperCase());
    }
  };

  const updateCellValue = (row: number, col: number, value: string) => {
    if (!puzzle) return;

    // Find which clue(s) this cell belongs to
    const cluesForCell = puzzle.clues.filter((clue) => {
      if (clue.direction === "across" && clue.row === row) {
        const offset = col - clue.col;
        return offset >= 0 && offset < clue.answer.length;
      } else if (clue.direction === "down" && clue.col === col) {
        const offset = row - clue.row;
        return offset >= 0 && offset < clue.answer.length;
      }
      return false;
    });

    if (cluesForCell.length === 0) return;

    // Update all clues that include this cell
    const newAnswers = { ...userAnswers };
    let scoreChanged = false;

    cluesForCell.forEach((clue) => {
      const clueKey = `${clue.number}-${clue.direction}`;
      const currentAnswer = userAnswers[clueKey] || "";
      let position = 0;

      if (clue.direction === "across") {
        position = col - clue.col;
      } else {
        position = row - clue.row;
      }

      // Ensure answer has correct length with spaces
      let paddedAnswer = currentAnswer.padEnd(clue.answer.length, " ");
      
      const newAnswer = 
        paddedAnswer.slice(0, position) + 
        value + 
        paddedAnswer.slice(position + 1);

      newAnswers[clueKey] = newAnswer.trimEnd();

      // Check if word is complete and update score
      if (newAnswer.trim().length === clue.answer.length && !scoreChanged) {
        if (newAnswer.trim().toUpperCase() === clue.answer) {
          setScore((prev) => Math.min(100, prev + 10));
        } else {
          setScore((prev) => Math.max(0, prev - 20));
        }
        scoreChanged = true;
      }
    });

    setUserAnswers(newAnswers);
    checkPuzzleCompletion(newAnswers);
  };

  const finishGame = async () => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (!puzzle || isSavingRef.current) return;

    isSavingRef.current = true;

    const accuracy = (completedWords / puzzle.clues.length) * 100;

    const gameStats = {
      score,
      timeElapsed,
      hintsUsed,
      difficulty,
      completedWords: completedWords + (totalPuzzlesSolved * (puzzle?.clues.length || 0)),
      totalWords: (totalPuzzlesSolved + 1) * (puzzle?.clues.length || 0),
      accuracy: Math.round(accuracy),
      gameId: "crossword-puzzle",
      puzzlesSolved: totalPuzzlesSolved + (completedWords === puzzle?.clues.length ? 1 : 0),
      status: completedWords === puzzle?.clues.length ? "completed" : "ended",
      endReason: completedWords === puzzle?.clues.length ? "completed" : "manual",
      timestamp: Date.now(),
    };

    // Save to Firebase
    if (user) {
      try {
        // Check for duplicate before saving
        const isDuplicate = await checkForDuplicate(gameStats);
        
        if (!isDuplicate) {
          const gameRef = ref(database, `games/crossword-puzzle/${user.uid}`);
          await push(gameRef, gameStats);
          console.log("Finish game - Data saved successfully");
        } else {
          console.log("Duplicate entry detected on finish, skipping save");
        }
      } catch (error) {
        console.error("Error saving to Firebase:", error);
      }
    }

    // Clear timer data from sessionStorage
    sessionStorage.removeItem("crossword_time_elapsed");
    sessionStorage.removeItem("crossword_start_time");
    
    sessionStorage.setItem("textual_game_result", JSON.stringify(gameStats));
    router.push("/learning/textual/result");
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
                    <BreadcrumbPage>Crossword Puzzle</BreadcrumbPage>
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
              <Badge variant="outline" className="hidden sm:flex items-center gap-1">
                <Lightbulb className="h-3 w-3" />
                {hintsUsed} hints
              </Badge>
            </div>
          </header>

          {/* Content */}
          <div className="flex flex-1 flex-col gap-2 p-2 pt-0 sm:gap-4 sm:p-4">
            <div className="min-h-[calc(100vh-4rem)] flex-1 rounded-lg p-3 sm:rounded-xl sm:p-4 md:p-6">
              <div className="mx-auto max-w-6xl space-y-4 sm:space-y-6">
                {/* Mobile Stats */}
                <div className="grid grid-cols-3 gap-3 sm:hidden">
                  <Card>
                    <CardContent className="pt-4 pb-4">
                      <div className="text-center">
                        <Clock className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Time</p>
                        <p className="text-sm font-bold">{formatTime(timeElapsed)}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 pb-4">
                      <div className="text-center">
                        <Trophy className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Score</p>
                        <p className="text-sm font-bold">{score}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 pb-4">
                      <div className="text-center">
                        <Lightbulb className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Hints</p>
                        <p className="text-sm font-bold">{hintsUsed}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Game Status Bar */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-card border">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Clock className={`h-5 w-5 ${getTimeRemaining() < 60 ? "text-red-500 animate-pulse" : "text-primary"}`} />
                      <div>
                        <p className="text-xs text-muted-foreground">Time Remaining</p>
                        <p className={`text-lg font-bold ${getTimeRemaining() < 60 ? "text-red-500" : ""}`}>
                          {formatTime(getTimeRemaining())}
                        </p>
                      </div>
                    </div>
                    
                    <Separator orientation="vertical" className="h-10" />
                    
                    <div className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-yellow-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Puzzles Solved</p>
                        <p className="text-lg font-bold">{totalPuzzlesSolved}</p>
                      </div>
                    </div>
                    
                    <Separator orientation="vertical" className="h-10" />
                    
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 ${
                          completedWords === puzzle?.clues.length 
                            ? "border-green-500 bg-green-50 dark:bg-green-950" 
                            : "border-primary/20"
                        }`}>
                          <span className="text-lg font-bold">
                            {puzzle ? Math.round((completedWords / puzzle.clues.length) * 100) : 0}%
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Completion</p>
                        <p className="text-sm font-medium">{completedWords}/{puzzle?.clues.length || 0} words</p>
                      </div>
                    </div>
                  </div>
                  
                  <Button onClick={finishGame} variant="destructive" size="lg">
                    End Game
                  </Button>
                </div>

                {/* Game Area */}
                {loading ? (
                  <Card className="min-h-[500px]">
                    <CardContent className="pt-6 flex items-center justify-center">
                      <div className="text-center space-y-4">
                        <Loader2 className="h-16 w-16 mx-auto text-primary animate-spin" />
                        <p className="text-lg font-medium">Generating crossword puzzle...</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : puzzle ? (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Crossword Grid */}
                    <Card className="lg:col-span-2 max-h-[550px] overflow-hidden">
                      <CardHeader>
                        <CardTitle className="text-lg">Crossword Grid</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto flex justify-center pt-2">
                          <div 
                            className="inline-grid gap-0"
                            style={{
                              gridTemplateColumns: `repeat(${puzzle.size}, minmax(0, 1fr))`,
                            }}
                          >
                            {Array.from({ length: puzzle.size }).map((_, row) =>
                              Array.from({ length: puzzle.size }).map((_, col) => {
                                const cellLetter = puzzle.grid[row][col];
                                const isEmpty = !cellLetter;
                                
                                // Find if this cell is the start of a clue
                                const clueNumber = puzzle.clues.find(
                                  (clue) => clue.row === row && clue.col === col
                                )?.number;

                                // Get user's input for this cell
                                let userLetter = "";
                                puzzle.clues.forEach((clue) => {
                                  const key = `${clue.number}-${clue.direction}`;
                                  const userAnswer = userAnswers[key] || "";
                                  
                                  if (clue.direction === "across" && clue.row === row) {
                                    const offset = col - clue.col;
                                    if (offset >= 0 && offset < clue.answer.length) {
                                      userLetter = userAnswer[offset] || userLetter;
                                    }
                                  } else if (clue.direction === "down" && clue.col === col) {
                                    const offset = row - clue.row;
                                    if (offset >= 0 && offset < clue.answer.length) {
                                      userLetter = userAnswer[offset] || userLetter;
                                    }
                                  }
                                });

                                const isCorrect = userLetter && userLetter === cellLetter;
                                const isWrong = userLetter && userLetter !== cellLetter;

                                const isFocused = focusedCell?.row === row && focusedCell?.col === col;

                                return (
                                  <div
                                    key={`${row}-${col}`}
                                    id={`cell-${row}-${col}`}
                                    tabIndex={isEmpty ? -1 : 0}
                                    onClick={() => !isEmpty && handleCellClick(row, col)}
                                    onKeyDown={(e) => !isEmpty && handleCellKeyDown(e, row, col)}
                                    className={`
                                      relative w-9 h-9 sm:w-12 sm:h-12 
                                      ${isEmpty 
                                        ? "bg-gray-900/0" 
                                        : isCorrect
                                          ? "border-2 border-green-500 bg-card"
                                          : isWrong
                                            ? "border-2 border-red-500 bg-card"
                                            : userLetter
                                              ? "border border-border bg-card"
                                              : "border border-border bg-card cursor-pointer hover:bg-muted/30 transition-colors"
                                      }
                                      ${isFocused && !isEmpty ? "ring-2 ring-primary z-10" : ""}
                                      flex items-center justify-center
                                      font-mono font-bold text-base sm:text-xl
                                      ${!isEmpty ? "focus:outline-none" : ""}
                                    `}
                                  >
                                    {clueNumber && (
                                      <span className="absolute top-0.5 left-1 text-[9px] sm:text-[11px] font-bold text-primary">
                                        {clueNumber}
                                      </span>
                                    )}
                                    {!isEmpty && (
                                      <span className={`
                                        ${isCorrect ? "text-green-600 dark:text-green-400" : ""}
                                        ${isWrong ? "text-red-600 dark:text-red-400" : "text-foreground"}
                                      `}>
                                        {userLetter || ""}
                                      </span>
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Clues Section */}
                    <div className="space-y-1.5">
                      {/* Across Clues */}
                      <Card>
                        <CardHeader className="px-3 -gap-5">
                          <CardTitle className="text-lg">Across</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-0.5 max-h-[280px] overflow-y-auto px-3 py-2">
                          {puzzle.clues
                            .filter((c) => c.direction === "across")
                            .map((clue) => {
                              const key = `${clue.number}-${clue.direction}`;
                              const userAnswer = userAnswers[key] || "";
                              const isCorrect = userAnswer.toUpperCase() === clue.answer;
                              const hintUsed = usedHints.has(key);
                              
                              return (
                                <div key={key} className="flex items-start gap-2 p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
                                  <span className="font-bold text-sm min-w-[24px] mt-0.5">{clue.number}.</span>
                                  <p className="text-sm flex-1">{clue.clue}</p>
                                  <div className="flex items-center gap-2">
                                    {isCorrect && (
                                      <Badge variant="default" className="bg-green-600 text-xs">
                                        ✓
                                      </Badge>
                                    )}
                                    <Button
                                      size="sm"
                                      variant={hintUsed ? "secondary" : "outline"}
                                      onClick={() => handleHint(clue.number, clue.direction)}
                                      disabled={isCorrect || hintUsed}
                                      title={hintUsed ? "Hint already used" : "Get hint"}
                                    >
                                      <Lightbulb className={`h-4 w-4 ${hintUsed ? "text-muted-foreground" : ""}`} />
                                    </Button>
                                  </div>
                                  {/* Hidden input for accessibility */}
                                  <input
                                    id={`input-${clue.number}-${clue.direction}`}
                                    type="text"
                                    className="sr-only"
                                    value={userAnswer}
                                    onChange={(e) => handleAnswerChange(clue.number, clue.direction, e.target.value)}
                                    maxLength={clue.answer.length}
                                  />
                                </div>
                              );
                            })}
                        </CardContent>
                      </Card>

                      {/* Down Clues */}
                      <Card>
                        <CardHeader className="px-3 -gap-5">
                          <CardTitle className="text-lg">Down</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-0.5 max-h-[280px] overflow-y-auto px-3 py-2">
                          {puzzle.clues
                            .filter((c) => c.direction === "down")
                            .map((clue) => {
                              const key = `${clue.number}-${clue.direction}`;
                              const userAnswer = userAnswers[key] || "";
                              const isCorrect = userAnswer.toUpperCase() === clue.answer;
                              const hintUsed = usedHints.has(key);
                              
                              return (
                                <div key={key} className="flex items-start gap-2 p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
                                  <span className="font-bold text-sm min-w-[20px] mt-0.5">{clue.number}.</span>
                                  <p className="text-sm flex-1">{clue.clue}</p>
                                  <div className="flex items-center gap-1.5">
                                    {isCorrect && (
                                      <Badge variant="default" className="bg-green-600 text-xs h-5 px-1.5">
                                        ✓
                                      </Badge>
                                    )}
                                    <Button
                                      size="sm"
                                      variant={hintUsed ? "secondary" : "outline"}
                                      onClick={() => handleHint(clue.number, clue.direction)}
                                      disabled={isCorrect || hintUsed}
                                      title={hintUsed ? "Hint already used" : "Get hint"}
                                      className="h-7 w-7 p-0"
                                    >
                                      <Lightbulb className={`h-3.5 w-3.5 ${hintUsed ? "text-muted-foreground" : ""}`} />
                                    </Button>
                                  </div>
                                  {/* Hidden input for accessibility */}
                                  <input
                                    id={`input-${clue.number}-${clue.direction}`}
                                    type="text"
                                    className="sr-only"
                                    value={userAnswer}
                                    onChange={(e) => handleAnswerChange(clue.number, clue.direction, e.target.value)}
                                    maxLength={clue.answer.length}
                                  />
                                </div>
                              );
                            })}
                        </CardContent>
                      </Card>
                    </div>

                    {/* Progress Card */}
                    <Card className="lg:col-span-3">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>Your Progress</span>
                          {completedWords === puzzle.clues.length && (
                            <Badge variant="default" className="animate-pulse">
                              Puzzle Complete! 🎉
                            </Badge>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="flex flex-col items-center p-3 rounded-lg bg-muted">
                            <span className="text-xs text-muted-foreground mb-1">Score</span>
                            <span className={`text-xl font-bold ${
                              score >= 80 ? "text-green-600" : 
                              score >= 50 ? "text-yellow-600" : "text-red-600"
                            }`}>
                              {score}%
                            </span>
                          </div>
                          
                          <div className="flex flex-col items-center p-3 rounded-lg bg-muted">
                            <span className="text-xs text-muted-foreground mb-1">Completed</span>
                            <span className="text-xl font-bold">{completedWords}/{puzzle.clues.length}</span>
                          </div>
                          
                          <div className="flex flex-col items-center p-3 rounded-lg bg-muted">
                            <span className="text-xs text-muted-foreground mb-1">Hints</span>
                            <span className="text-xl font-bold">{hintsUsed}</span>
                          </div>
                          
                          <div className="flex flex-col items-center p-3 rounded-lg bg-muted">
                            <span className="text-xs text-muted-foreground mb-1">Puzzles</span>
                            <span className="text-xl font-bold">{totalPuzzlesSolved}</span>
                          </div>

                          {completedWords === puzzle.clues.length && (
                            <div className="flex items-center justify-center col-span-2 md:col-span-4">
                              <Button 
                                onClick={() => loadNewPuzzle(difficulty)} 
                                size="lg"
                              >
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Next Puzzle
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
