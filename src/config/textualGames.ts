import { LucideIcon, FileText, BookOpen, MessageSquare, Brain, Zap, Target } from "lucide-react";

export interface GameConfig {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  skills: string[];
  icon: LucideIcon;
  estimatedTime: string;
  xpRange: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  gameRoute: string;
  rules: string[];
  scoring: {
    title: string;
    points: string[];
  };
  tips: string[];
  difficultyLevels: {
    value: number;
    label: string;
    description: string;
    color: string;
  }[];
}

export const textualGamesConfig: Record<string, GameConfig> = {
  "crossword-puzzle": {
    id: "crossword-puzzle",
    name: "Crossword Puzzle",
    description: "Solve themed crossword grids by filling in words based on given clues. Strengthens vocabulary, spelling, and logical thinking.",
    longDescription: "Solve themed crossword grids by filling in words based on given clues. This game strengthens vocabulary, spelling, and logical thinking as you complete each interconnected puzzle.",
    skills: ["Vocabulary Building", "Spelling Practice", "Logical Reasoning", "Pattern Recognition"],
    icon: FileText,
    estimatedTime: "15-20 min",
    xpRange: "50-200 XP",
    difficulty: "Beginner",
    gameRoute: "/learning/textual/word-puzzles",
    rules: [
      "Read the clues carefully for each word",
      "Click on a cell to start entering letters",
      "Words can be placed horizontally (across) or vertically (down)",
      "Letters in intersecting words must match",
      "Use hints if you get stuck (reduces final score)"
    ],
    scoring: {
      title: "Scoring",
      points: [
        "Each correct word: +10 points",
        "Complete puzzle bonus: +50 points",
        "Time bonus: Faster completion = more points",
        "Hint used: -5 points per hint"
      ]
    },
    tips: [
      "Start with the easiest clues first",
      "Look for short words (3-4 letters) to begin",
      "Use intersecting letters as hints for other words",
      "Don't rush - accuracy matters more than speed"
    ],
    difficultyLevels: [
      { value: 1, label: "Easy", description: "Simple words, 5x5 grid", color: "text-green-500" },
      { value: 2, label: "Medium", description: "Moderate words, 7x7 grid", color: "text-yellow-500" },
      { value: 3, label: "Hard", description: "Complex words, 10x10 grid", color: "text-orange-500" },
      { value: 4, label: "Expert", description: "Advanced words, 12x12 grid", color: "text-red-500" },
    ]
  },
  "word-bucket": {
    id: "word-bucket",
    name: "Word Bucket",
    description: "Letters fall simultaneously. Quickly form the longest possible word from available letters. Longer words earn higher points.",
    longDescription: "Letters fall on the screen simultaneously. Players must quickly form the longest possible word from the available letters. Longer words earn higher points (25/50/100). The objective is to score as many points as possible before the round ends.",
    skills: ["Word Formation", "Speed", "Vocabulary", "Strategic Thinking"],
    icon: BookOpen,
    estimatedTime: "15-20 min",
    xpRange: "50-200 XP",
    difficulty: "Beginner",
    gameRoute: "/learning/textual/story-builder",
    rules: [
      "Letters fall simultaneously on the screen",
      "Click letters to form words",
      "Words must be at least 3 letters long",
      "Longer words earn more points",
      "Round ends when time runs out"
    ],
    scoring: {
      title: "Scoring",
      points: [
        "3-4 letter words: +25 points",
        "5-6 letter words: +50 points",
        "7+ letter words: +100 points",
        "Speed bonus: Submit quickly for extra points"
      ]
    },
    tips: [
      "Look for common letter combinations",
      "Try to form the longest word possible",
      "Don't waste time on very short words",
      "Keep an eye on the timer"
    ],
    difficultyLevels: [
      { value: 1, label: "Easy", description: "8 letters, 90 seconds", color: "text-green-500" },
      { value: 2, label: "Medium", description: "10 letters, 75 seconds", color: "text-yellow-500" },
      { value: 3, label: "Hard", description: "12 letters, 60 seconds", color: "text-orange-500" },
      { value: 4, label: "Expert", description: "15 letters, 45 seconds", color: "text-red-500" },
    ]
  },
  "chat-simulator": {
    id: "chat-simulator",
    name: "Chat Simulator",
    description: "Immersive role-play chat with three modes: Formal (interviews), Informal (social situations), and Chaotic (surreal scenarios).",
    longDescription: "An immersive role-play chat experience with three selectable modes. Players interact with simulated characters and respond according to the chosen style. Practice communication skills across different tones and environments.",
    skills: ["Communication", "Creativity", "Language Tone Control", "Situational Response"],
    icon: MessageSquare,
    estimatedTime: "20-25 min",
    xpRange: "75-250 XP",
    difficulty: "Intermediate",
    gameRoute: "/learning/textual/chat-simulator",
    rules: [
      "Select your preferred chat mode (Formal/Informal/Chaotic)",
      "Read the scenario and character description",
      "Respond to messages in the appropriate tone",
      "Stay in character throughout the conversation",
      "Complete the conversation to finish"
    ],
    scoring: {
      title: "Scoring",
      points: [
        "Appropriate tone: +15 points per message",
        "Creative responses: +10 points",
        "Maintaining character: +20 points",
        "Completing conversation: +50 points"
      ]
    },
    tips: [
      "Read the character description carefully",
      "Match your tone to the selected mode",
      "Be creative but stay relevant",
      "Think about real-life similar situations"
    ],
    difficultyLevels: [
      { value: 1, label: "Formal", description: "Professional & interview scenarios", color: "text-blue-500" },
      { value: 2, label: "Informal", description: "Casual social situations", color: "text-green-500" },
      { value: 3, label: "Chaotic", description: "Surreal & unpredictable scenarios", color: "text-purple-500" },
    ]
  },
  "debate-master": {
    id: "debate-master",
    name: "Debate Master",
    description: "Select a stance on a topic and debate against an AI opponent. Points awarded for clarity, relevance, creativity, and rebuttal strength.",
    longDescription: "A competitive debate game where the user selects a stance (for or against) on a given topic and debates against an AI opponent. Points are awarded based on argument clarity, relevance, creativity, and rebuttal strength.",
    skills: ["Critical Thinking", "Argument Building", "Persuasion", "Public Speaking Structure"],
    icon: Brain,
    estimatedTime: "30-40 min",
    xpRange: "100-300 XP",
    difficulty: "Intermediate",
    gameRoute: "/learning/textual/debate-master",
    rules: [
      "Choose a topic and select your stance (For/Against)",
      "Make your opening statement",
      "Respond to AI opponent's arguments",
      "Build strong rebuttals with evidence",
      "Conclude with a closing statement"
    ],
    scoring: {
      title: "Scoring",
      points: [
        "Argument clarity: +20 points",
        "Relevance to topic: +15 points",
        "Creative reasoning: +25 points",
        "Strong rebuttals: +30 points"
      ]
    },
    tips: [
      "Structure your arguments clearly",
      "Use examples to support your points",
      "Address opponent's arguments directly",
      "Stay calm and logical"
    ],
    difficultyLevels: [
      { value: 1, label: "Easy", description: "Simple topics, 3 rounds", color: "text-green-500" },
      { value: 2, label: "Medium", description: "Moderate topics, 4 rounds", color: "text-yellow-500" },
      { value: 3, label: "Hard", description: "Complex topics, 5 rounds", color: "text-orange-500" },
      { value: 4, label: "Expert", description: "Abstract topics, 6 rounds", color: "text-red-500" },
    ]
  },
  "vocabulary-quest": {
    id: "vocabulary-quest",
    name: "Vocabulary Quest",
    description: "A drag-and-drop vocabulary game. Match synonyms and antonyms from ten word options into the correct category slots.",
    longDescription: "A drag-and-drop vocabulary game. A target word is displayed at the top, and players must drag matching synonyms and antonyms from a box of ten word options into the correct category slots.",
    skills: ["Vocabulary Building", "Word Association", "Semantic Understanding"],
    icon: Zap,
    estimatedTime: "15-20 min",
    xpRange: "50-200 XP",
    difficulty: "Beginner",
    gameRoute: "/learning/textual/vocabulary-quest",
    rules: [
      "A target word is displayed at the top",
      "Drag words from the options box",
      "Place synonyms in the synonym slot",
      "Place antonyms in the antonym slot",
      "Complete all rounds to finish"
    ],
    scoring: {
      title: "Scoring",
      points: [
        "Correct synonym: +10 points",
        "Correct antonym: +10 points",
        "Perfect round: +20 bonus points",
        "Time bonus: Complete quickly for extra points"
      ]
    },
    tips: [
      "Think about word meanings carefully",
      "Synonyms have similar meanings",
      "Antonyms have opposite meanings",
      "Don't rush - accuracy is important"
    ],
    difficultyLevels: [
      { value: 1, label: "Easy", description: "Common words, 5 rounds", color: "text-green-500" },
      { value: 2, label: "Medium", description: "Moderate words, 8 rounds", color: "text-yellow-500" },
      { value: 3, label: "Hard", description: "Advanced words, 10 rounds", color: "text-orange-500" },
      { value: 4, label: "Expert", description: "Complex words, 12 rounds", color: "text-red-500" },
    ]
  },
  "grammar-goblin": {
    id: "grammar-goblin",
    name: "Grammar Goblin",
    description: "Identify the incorrect word in each sentence and provide the correct version to earn points and progress.",
    longDescription: "A sentence-based grammar challenge where one word in each sentence is intentionally incorrect. Players must identify the incorrect word and provide the correct version to earn points and progress.",
    skills: ["Grammar Accuracy", "Proofreading", "Attention to Detail"],
    icon: Target,
    estimatedTime: "20-25 min",
    xpRange: "75-250 XP",
    difficulty: "Intermediate",
    gameRoute: "/learning/textual/grammar-goblin",
    rules: [
      "Read each sentence carefully",
      "Find the grammatically incorrect word",
      "Click on the incorrect word",
      "Type the correct version",
      "Submit your answer to continue"
    ],
    scoring: {
      title: "Scoring",
      points: [
        "Correct identification: +15 points",
        "Correct fix: +15 points",
        "Perfect sentence: +30 points total",
        "Streak bonus: Consecutive correct answers"
      ]
    },
    tips: [
      "Read the entire sentence first",
      "Look for verb tense issues",
      "Check subject-verb agreement",
      "Watch for common grammar mistakes"
    ],
    difficultyLevels: [
      { value: 1, label: "Easy", description: "Basic grammar, 10 sentences", color: "text-green-500" },
      { value: 2, label: "Medium", description: "Mixed errors, 12 sentences", color: "text-yellow-500" },
      { value: 3, label: "Hard", description: "Complex grammar, 15 sentences", color: "text-orange-500" },
      { value: 4, label: "Expert", description: "Advanced errors, 20 sentences", color: "text-red-500" },
    ]
  }
};

export const getGameConfig = (gameId: string): GameConfig | null => {
  return textualGamesConfig[gameId] || null;
};

export const getAllGameIds = (): string[] => {
  return Object.keys(textualGamesConfig);
};
