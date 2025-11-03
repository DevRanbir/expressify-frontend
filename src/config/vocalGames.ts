import { LucideIcon, Zap, MessageSquare, BookOpen, AudioLines, VolumeX, Mic } from "lucide-react";

export interface VocalGameConfig {
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

export const vocalGamesConfig: Record<string, VocalGameConfig> = {
  "text-filler-rush": {
    id: "text-filler-rush",
    name: "Text Filler Rush",
    description: "Players see a written text on screen and must speak it aloud. The faster and more accurately their speech fills the text on screen, the higher their score.",
    longDescription: "Players see a written text on screen and must speak it aloud. The faster and more accurately their speech fills the text on screen, the higher their score. Speed, pronunciation, and fluency all count toward performance.",
    skills: ["Reading Comprehension", "Fluency", "Pronunciation", "Focus"],
    icon: Zap,
    estimatedTime: "15-20 min",
    xpRange: "75-250 XP",
    difficulty: "Beginner",
    gameRoute: "/learning/vocal/text-filler-rush",
    rules: [
      "Read the displayed text aloud clearly and accurately",
      "Your speech will be transcribed in real-time",
      "Speak at a natural pace - too fast may reduce accuracy",
      "Complete the full text within the time limit",
      "Mispronunciations will be highlighted for correction"
    ],
    scoring: {
      title: "Scoring System",
      points: [
        "Pronunciation accuracy: Up to 40 points",
        "Reading speed: Up to 30 points",
        "Fluency (no pauses/stutters): Up to 20 points",
        "Completion bonus: +10 points"
      ]
    },
    tips: [
      "Practice breathing techniques before starting",
      "Maintain a steady pace throughout",
      "Focus on clear enunciation over speed",
      "Preview the text before starting if available"
    ],
    difficultyLevels: [
      { value: 1, label: "Easy", description: "Short passages, simple words, 2-3 minutes", color: "text-green-500" },
      { value: 2, label: "Medium", description: "Moderate passages, mixed vocabulary, 3-5 minutes", color: "text-yellow-500" },
      { value: 3, label: "Hard", description: "Long passages, complex words, 5-7 minutes", color: "text-orange-500" },
      { value: 4, label: "Expert", description: "Extended passages, technical terms, 7-10 minutes", color: "text-red-500" },
    ]
  },
  "voice-debate-duel": {
    id: "voice-debate-duel",
    name: "Voice Debate Duel",
    description: "Face off against an AI opponent in a timed voice debate on random or chosen topics. The AI challenges your arguments with counterpoints.",
    longDescription: "Face off against an AI opponent in a timed voice debate on random or chosen topics. The AI challenges your arguments with counterpoints and evaluates your tone, logic, confidence, and clarity after each round. Outthink and out-speak the machine to win!",
    skills: ["Critical Thinking", "Public Speaking", "Logical Reasoning", "Communication", "Adaptability"],
    icon: MessageSquare,
    estimatedTime: "25-30 min",
    xpRange: "100-300 XP",
    difficulty: "Advanced",
    gameRoute: "/learning/vocal/voice-debate-duel",
    rules: [
      "Choose a debate topic or receive a random one",
      "Select your stance (For/Against)",
      "Present your opening argument (60 seconds)",
      "Listen to AI counterarguments and respond",
      "Each round has a time limit for responses",
      "AI evaluates logic, clarity, confidence, and tone"
    ],
    scoring: {
      title: "Evaluation Criteria",
      points: [
        "Logical reasoning: Up to 30 points",
        "Speech clarity: Up to 25 points",
        "Confidence and tone: Up to 20 points",
        "Argument strength: Up to 25 points"
      ]
    },
    tips: [
      "Structure your arguments with clear points",
      "Anticipate counterarguments in advance",
      "Maintain confident and steady tone",
      "Use evidence and examples to support claims",
      "Listen carefully to AI responses before replying"
    ],
    difficultyLevels: [
      { value: 1, label: "Easy", description: "Simple topics, 3 rounds, basic AI", color: "text-green-500" },
      { value: 2, label: "Medium", description: "Moderate topics, 4 rounds, challenging AI", color: "text-yellow-500" },
      { value: 3, label: "Hard", description: "Complex topics, 5 rounds, advanced AI", color: "text-orange-500" },
      { value: 4, label: "Expert", description: "Abstract topics, 6 rounds, expert AI", color: "text-red-500" },
    ]
  },
  "story-time-creator": {
    id: "story-time-creator",
    name: "Story Time Creator",
    description: "The player listens to or reads a story prompt and continues it using their own voice. The AI scores creativity, coherence, and emotion.",
    longDescription: "The player listens to or reads a story prompt and continues it using their own voice. The AI scores creativity, coherence, and emotion in narration. Each round challenges players to build better storytelling flow and expression.",
    skills: ["Creativity", "Narration", "Imagination", "Coherence"],
    icon: BookOpen,
    estimatedTime: "20-25 min",
    xpRange: "80-250 XP",
    difficulty: "Intermediate",
    gameRoute: "/learning/vocal/story-time-creator",
    rules: [
      "Listen to or read the story prompt carefully",
      "Continue the story using your voice (2-3 minutes)",
      "Maintain narrative coherence with the prompt",
      "Use expressive tone and emotion",
      "AI evaluates creativity, flow, and emotion"
    ],
    scoring: {
      title: "Storytelling Metrics",
      points: [
        "Creativity and originality: Up to 30 points",
        "Narrative coherence: Up to 25 points",
        "Emotional expression: Up to 25 points",
        "Voice modulation: Up to 20 points"
      ]
    },
    tips: [
      "Visualize the story as you narrate",
      "Use varied tone for different characters",
      "Build tension and release in your narrative",
      "Stay consistent with the original prompt's style",
      "Practice emotional range before recording"
    ],
    difficultyLevels: [
      { value: 1, label: "Easy", description: "Simple prompts, 2-3 min story, basic themes", color: "text-green-500" },
      { value: 2, label: "Medium", description: "Moderate prompts, 3-4 min story, mixed themes", color: "text-yellow-500" },
      { value: 3, label: "Hard", description: "Complex prompts, 4-5 min story, abstract themes", color: "text-orange-500" },
      { value: 4, label: "Expert", description: "Open-ended prompts, 5-7 min story, any theme", color: "text-red-500" },
    ]
  },
  "accent-trainer": {
    id: "accent-trainer",
    name: "Accent Trainer",
    description: "Players repeat words or phrases in different English accents (like British, American, or Australian).",
    longDescription: "Players repeat words or phrases in different English accents (like British, American, or Australian). The AI provides real-time pronunciation feedback and accuracy scores, helping refine speech clarity and cultural adaptability.",
    skills: ["Pronunciation", "Listening", "Adaptability", "Global Communication"],
    icon: AudioLines,
    estimatedTime: "20-25 min",
    xpRange: "75-225 XP",
    difficulty: "Intermediate",
    gameRoute: "/learning/vocal/accent-trainer",
    rules: [
      "Listen to the target accent pronunciation",
      "Repeat the word or phrase in the same accent",
      "AI analyzes pronunciation accuracy",
      "Receive instant feedback on your attempt",
      "Practice until you achieve target accuracy"
    ],
    scoring: {
      title: "Accent Accuracy",
      points: [
        "Phonetic accuracy: Up to 35 points",
        "Intonation match: Up to 25 points",
        "Rhythm and pacing: Up to 20 points",
        "Consistency across phrases: Up to 20 points"
      ]
    },
    tips: [
      "Listen carefully to subtle sound differences",
      "Pay attention to vowel sounds and stress patterns",
      "Practice mouth positioning for different sounds",
      "Record yourself and compare with target",
      "Start with easier words before complex phrases"
    ],
    difficultyLevels: [
      { value: 1, label: "Easy", description: "Single accent, common words, 10-15 phrases", color: "text-green-500" },
      { value: 2, label: "Medium", description: "2 accents, moderate words, 15-20 phrases", color: "text-yellow-500" },
      { value: 3, label: "Hard", description: "3 accents, complex words, 20-25 phrases", color: "text-orange-500" },
      { value: 4, label: "Expert", description: "Multiple accents, idioms, 25-30 phrases", color: "text-red-500" },
    ]
  },
  "tongue-twister-challenge": {
    id: "tongue-twister-challenge",
    name: "Tongue Twister Challenge",
    description: "Players race against time to correctly pronounce complex tongue twisters without mistakes.",
    longDescription: "Players race against time to correctly pronounce complex tongue twisters without mistakes. The AI detects slurring or mispronunciation and rewards clear articulation and rhythm.",
    skills: ["Pronunciation", "Speech Clarity", "Agility", "Focus"],
    icon: VolumeX,
    estimatedTime: "15-20 min",
    xpRange: "60-200 XP",
    difficulty: "Intermediate",
    gameRoute: "/learning/vocal/tongue-twister-challenge",
    rules: [
      "Read the displayed tongue twister",
      "Speak it clearly within the time limit",
      "AI detects mispronunciations and slurring",
      "Multiple attempts allowed with reduced score",
      "Speed increases accuracy multiplier"
    ],
    scoring: {
      title: "Articulation Scoring",
      points: [
        "Pronunciation accuracy: Up to 40 points",
        "Speed completion: Up to 30 points",
        "Clarity (no slurring): Up to 20 points",
        "First-attempt bonus: +10 points"
      ]
    },
    tips: [
      "Start slowly, then increase speed",
      "Break tongue twisters into smaller segments",
      "Focus on consonant sounds",
      "Practice difficult sound combinations separately",
      "Warm up your mouth muscles before starting"
    ],
    difficultyLevels: [
      { value: 1, label: "Easy", description: "Short twisters, 5-7 challenges, 30 sec each", color: "text-green-500" },
      { value: 2, label: "Medium", description: "Medium twisters, 7-10 challenges, 20 sec each", color: "text-yellow-500" },
      { value: 3, label: "Hard", description: "Long twisters, 10-12 challenges, 15 sec each", color: "text-orange-500" },
      { value: 4, label: "Expert", description: "Complex twisters, 12-15 challenges, 10 sec each", color: "text-red-500" },
    ]
  },
  "topic-simulator": {
    id: "topic-simulator",
    name: "Topic Simulator",
    description: "Players receive a random topic and have 60 seconds to speak confidently about it.",
    longDescription: "Players receive a random topic and have 60 seconds to speak confidently about it. The AI rates their fluency, vocabulary variety, and engagement. Great for building impromptu speaking and self-confidence.",
    skills: ["Fluency", "Vocabulary", "Spontaneous Speaking", "Confidence"],
    icon: Mic,
    estimatedTime: "15-20 min",
    xpRange: "70-220 XP",
    difficulty: "Beginner",
    gameRoute: "/learning/vocal/topic-simulator",
    rules: [
      "Receive a random topic",
      "Prepare mentally for 10 seconds",
      "Speak about the topic for 60 seconds",
      "Maintain fluency and coherence",
      "AI evaluates content, delivery, and vocabulary"
    ],
    scoring: {
      title: "Speaking Assessment",
      points: [
        "Fluency and pace: Up to 30 points",
        "Vocabulary variety: Up to 25 points",
        "Content relevance: Up to 25 points",
        "Confidence and engagement: Up to 20 points"
      ]
    },
    tips: [
      "Use the prep time to outline key points",
      "Start with a clear statement",
      "Use examples to fill time naturally",
      "Vary your vocabulary to avoid repetition",
      "End with a strong conclusion"
    ],
    difficultyLevels: [
      { value: 1, label: "Easy", description: "Familiar topics, 60 sec, 5-7 rounds", color: "text-green-500" },
      { value: 2, label: "Medium", description: "Mixed topics, 60 sec, 7-10 rounds", color: "text-yellow-500" },
      { value: 3, label: "Hard", description: "Abstract topics, 90 sec, 10-12 rounds", color: "text-orange-500" },
      { value: 4, label: "Expert", description: "Random topics, 120 sec, 12-15 rounds", color: "text-red-500" },
    ]
  },
};

export function getVocalGameConfig(gameId: string): VocalGameConfig | null {
  return vocalGamesConfig[gameId] || null;
}
