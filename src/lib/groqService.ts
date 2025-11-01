import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY,
  dangerouslyAllowBrowser: true, // Required for client-side usage
});

export interface CrosswordClue {
  number: number;
  direction: "across" | "down";
  clue: string;
  answer: string;
  row: number;
  col: number;
}

export interface CrosswordPuzzle {
  clues: CrosswordClue[];
  grid: string[][];
  size: number;
}

export async function generateCrosswordPuzzle(
  difficulty: number,
  theme?: string
): Promise<CrosswordPuzzle> {
  const difficultyMap = {
    1: "easy",
    2: "medium",
    3: "hard",
    4: "expert",
  };

  const difficultyLevel = difficultyMap[difficulty as keyof typeof difficultyMap] || "medium";

  const systemPrompt = `You are a crossword puzzle generator. Generate a well-structured crossword puzzle with 6-8 words.

Difficulty levels:
- easy: Direct, simple clues (e.g., "The color of the sky" for BLUE)
- medium: Clues with mild wordplay or blanks (e.g., "After I ___ the bathroom, I wash my hands" for USE)
- hard: Complex clues without direct hints (e.g., "A strawberry is a ___" for FRUIT)
- expert: Cryptic clues requiring deeper thinking

Return ONLY a valid JSON object with this exact structure (no markdown, no extra text):
{
  "words": [
    {
      "word": "HOUSE",
      "clue": "A place where people live",
      "direction": "across",
      "startRow": 0,
      "startCol": 0
    },
    {
      "word": "HOTEL",
      "clue": "A place to stay while traveling",
      "direction": "down",
      "startRow": 0,
      "startCol": 0
    }
  ]
}

CRITICAL RULES FOR PROPER CROSSWORD CONSTRUCTION:
1. Words must be 4-8 letters long (prefer 5-6 letters)
2. All words must be in UPPERCASE
3. INTERSECTION RULE: Each word (except the first) MUST share exactly ONE letter with a previous word
4. Start with one ACROSS word at (0,0)
5. Each subsequent word must intersect an existing word at a shared letter
6. Alternate between ACROSS and DOWN directions when possible
7. Calculate startRow and startCol carefully:
   - For DOWN word intersecting ACROSS: startRow = acrossRow - intersectionIndex, startCol = acrossCol + intersectionPosition
   - For ACROSS word intersecting DOWN: startRow = downRow + intersectionPosition, startCol = downCol - intersectionIndex
8. Verify no words overlap except at intended intersection points
9. Keep the puzzle compact (within a 8x8 grid)
10. Generate exactly 6-8 words total

Example of proper intersection:
- Word 1: "HOUSE" across at (0,0) → H(0,0) O(0,1) U(0,2) S(0,3) E(0,4)
- Word 2: "HOTEL" down at (0,0) → H(0,0) O(1,0) T(2,0) E(3,0) L(4,0) [intersects at H]
- Word 3: "TABLE" across at (2,0) → T(2,0) A(2,1) B(2,2) L(2,3) E(2,4) [intersects at T of HOTEL]`;

  const userPrompt = theme
    ? `Generate a ${difficultyLevel} crossword puzzle with theme: ${theme}`
    : `Generate a ${difficultyLevel} crossword puzzle with everyday English words`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.8,
      max_completion_tokens: 2048,
      response_format: { type: "json_object" },
    });

    const responseText = completion.choices[0]?.message?.content || "{}";
    const puzzleData = JSON.parse(responseText);

    // Validate and filter out invalid words
    const validWords = puzzleData.words.filter((word: any) => {
      return (
        word.word &&
        word.clue &&
        word.direction &&
        typeof word.startRow === 'number' &&
        typeof word.startCol === 'number' &&
        word.startRow >= 0 &&
        word.startCol >= 0
      );
    });

    // Sort clues by position (top-to-bottom, left-to-right) for proper numbering
    validWords.sort((a: any, b: any) => {
      if (a.startRow !== b.startRow) return a.startRow - b.startRow;
      return a.startCol - b.startCol;
    });

    // Assign numbers based on grid position
    const positionMap = new Map<string, number>();
    let clueNumber = 1;
    
    validWords.forEach((word: any) => {
      const key = `${word.startRow}-${word.startCol}`;
      if (!positionMap.has(key)) {
        positionMap.set(key, clueNumber++);
      }
    });

    // Convert to our CrosswordPuzzle format with correct numbering
    const clues: CrosswordClue[] = validWords.map((word: any) => {
      const key = `${word.startRow}-${word.startCol}`;
      return {
        number: positionMap.get(key)!,
        direction: word.direction as "across" | "down",
        clue: word.clue,
        answer: word.word.toUpperCase(),
        row: word.startRow,
        col: word.startCol,
      };
    });

    // Calculate grid size
    let maxRow = 0;
    let maxCol = 0;
    clues.forEach((clue) => {
      const endRow =
        clue.direction === "down" ? clue.row + clue.answer.length - 1 : clue.row;
      const endCol =
        clue.direction === "across" ? clue.col + clue.answer.length - 1 : clue.col;
      maxRow = Math.max(maxRow, endRow);
      maxCol = Math.max(maxCol, endCol);
    });

    const size = Math.max(maxRow + 2, maxCol + 2, 8);
    const grid: string[][] = Array(size)
      .fill(null)
      .map(() => Array(size).fill(""));

    // Fill grid with answers and validate intersections
    clues.forEach((clue) => {
      for (let i = 0; i < clue.answer.length; i++) {
        const row = clue.direction === "down" ? clue.row + i : clue.row;
        const col = clue.direction === "across" ? clue.col + i : clue.col;
        
        // Check for conflicts
        if (grid[row][col] && grid[row][col] !== clue.answer[i]) {
          console.warn(`Conflict at (${row},${col}): ${grid[row][col]} vs ${clue.answer[i]}`);
        }
        
        grid[row][col] = clue.answer[i];
      }
    });

    return { clues, grid, size };
  } catch (error) {
    console.error("Error generating crossword:", error);
    // Return a fallback puzzle
    return generateFallbackPuzzle(difficulty);
  }
}

function generateFallbackPuzzle(difficulty: number): CrosswordPuzzle {
  const easyClues: CrosswordClue[] = [
    {
      number: 1,
      direction: "across",
      clue: "Place where people live",
      answer: "HOUSE",
      row: 0,
      col: 0,
    },
    {
      number: 1,
      direction: "down",
      clue: "Place to stay while traveling",
      answer: "HOTEL",
      row: 0,
      col: 0,
    },
    {
      number: 2,
      direction: "across",
      clue: "Furniture for eating",
      answer: "TABLE",
      row: 2,
      col: 0,
    },
    {
      number: 3,
      direction: "down",
      clue: "Opposite of old",
      answer: "NEW",
      row: 0,
      col: 2,
    },
    {
      number: 4,
      direction: "across",
      clue: "Large body of water",
      answer: "OCEAN",
      row: 3,
      col: 0,
    },
    {
      number: 5,
      direction: "down",
      clue: "Device for calling",
      answer: "PHONE",
      row: 0,
      col: 4,
    },
    {
      number: 6,
      direction: "across",
      clue: "Fluffy white thing in the sky",
      answer: "CLOUD",
      row: 1,
      col: 0,
    },
  ];

  const size = 10;
  const grid: string[][] = Array(size)
    .fill(null)
    .map(() => Array(size).fill(""));

  easyClues.forEach((clue) => {
    for (let i = 0; i < clue.answer.length; i++) {
      if (clue.direction === "across") {
        grid[clue.row][clue.col + i] = clue.answer[i];
      } else {
        grid[clue.row + i][clue.col] = clue.answer[i];
      }
    }
  });

  return { clues: easyClues, grid, size };
}

// Chat Simulator Types
export interface ChatScenario {
  character: string;
  description: string;
  situation: string;
  firstMessage: string;
  personality: string;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Generate a dynamic chat scenario based on difficulty/mode
 * @param mode 1=Formal, 2=Informal, 3=Chaotic
 * @returns ChatScenario object with character details and first message
 */
export async function generateChatScenario(mode: number): Promise<ChatScenario> {
  const modeMap = {
    1: {
      type: "Formal Business/Interview",
      context: "professional workplace setting like job interviews, business meetings, or formal consultations"
    },
    2: {
      type: "Informal Social",
      context: "casual social interactions with friends, family, or acquaintances"
    },
    3: {
      type: "Chaotic/Absurd",
      context: "surreal, fantastical, or bizarre scenarios that bend reality"
    }
  };

  const { type, context } = modeMap[mode as keyof typeof modeMap] || modeMap[1];

  const systemPrompt = `You are a creative scenario generator for a chat conversation simulator. Generate an engaging character and situation for a ${type} conversation.

Return ONLY a valid JSON object (no markdown, no extra text):
{
  "character": "Full Name - Role/Title",
  "description": "Brief description of who this person is (1-2 sentences)",
  "situation": "Clear explanation of the conversation context and user's objective (1-2 sentences)",
  "firstMessage": "The character's opening message to start the conversation (2-4 sentences, natural and engaging)",
  "personality": "Key personality traits that will influence their responses (3-5 traits)"
}

Guidelines:
- For Formal: Create professionals like HR managers, CEOs, consultants, doctors, lawyers
- For Informal: Create relatable people like old friends, family members, roommates, neighbors
- For Chaotic: Create bizarre entities like cosmic beings, sentient objects, dimension travelers, abstract concepts
- Make the character memorable and distinct
- The firstMessage should be natural and invite a response
- Keep it appropriate and engaging`;

  const userPrompt = `Generate a ${type} chat scenario in a ${context}`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.9,
      max_completion_tokens: 500,
    });

    const content = completion.choices[0]?.message?.content || "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error("Failed to extract JSON from response");
    }

    const scenario = JSON.parse(jsonMatch[0]);
    return scenario as ChatScenario;
  } catch (error) {
    console.error("Error generating chat scenario:", error);
    
    // Fallback scenarios
    const fallbacks: Record<number, ChatScenario> = {
      1: {
        character: "Sarah Mitchell - HR Manager",
        description: "Professional HR manager conducting a job interview for a software developer position at a tech company.",
        situation: "You're in a formal job interview. Respond professionally and showcase your skills.",
        firstMessage: "Good morning! Thank you for coming in today. I'm Sarah Mitchell, the HR Manager. Could you start by telling me a bit about yourself and what interests you about this position?",
        personality: "Professional, evaluative, structured, encouraging, detail-oriented"
      },
      2: {
        character: "Alex - College Friend",
        description: "Your friend from college who you haven't seen in a while. They're catching up over coffee.",
        situation: "Casual conversation with an old friend. Be natural and friendly in your responses.",
        firstMessage: "Hey! It's been ages! How have you been? I was just thinking about that time we pulled an all-nighter studying for finals. Good times, right?",
        personality: "Friendly, nostalgic, casual, energetic, conversational"
      },
      3: {
        character: "The Cosmic Barista",
        description: "A mystical being who serves coffee across dimensions. Reality bends around them.",
        situation: "You've entered a café that exists outside of time. Nothing is quite what it seems.",
        firstMessage: "Ah, welcome traveler! Your usual order of caffeinated stardust with a side of temporal paradox? Or perhaps today you'd prefer something that tastes like forgotten dreams?",
        personality: "Whimsical, cryptic, playful, philosophical, reality-bending"
      }
    };

    return fallbacks[mode] || fallbacks[1];
  }
}

/**
 * Generate an AI response based on conversation history and character personality
 * @param conversationHistory Array of previous messages
 * @param mode 1=Formal, 2=Informal, 3=Chaotic
 * @param characterInfo Character details and personality
 * @returns AI-generated response string
 */
export async function generateChatResponse(
  conversationHistory: ChatMessage[],
  mode: number,
  characterInfo: { character: string; personality: string; description: string }
): Promise<string> {
  const modeInstructions = {
    1: `You are ${characterInfo.character}. ${characterInfo.description}
Personality: ${characterInfo.personality}

Maintain a professional, formal tone. Ask relevant follow-up questions about their experience, skills, and qualifications. Evaluate responses critically but fairly. Keep answers concise (2-4 sentences).`,
    
    2: `You are ${characterInfo.character}. ${characterInfo.description}
Personality: ${characterInfo.personality}

Be casual, friendly, and conversational. Share relatable anecdotes, ask about their life, and maintain a warm tone. Use casual language and expressions. Keep responses natural (2-4 sentences).`,
    
    3: `You are ${characterInfo.character}. ${characterInfo.description}
Personality: ${characterInfo.personality}

Embrace the absurd and surreal. Bend reality, make unexpected connections, ask philosophical yet bizarre questions. Include vivid imagery and unexpected twists. Keep responses engaging (2-4 sentences).`
  };

  const systemPrompt = modeInstructions[mode as keyof typeof modeInstructions] || modeInstructions[1];

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        ...conversationHistory,
      ],
      model: "llama-3.3-70b-versatile",
      temperature: mode === 3 ? 1.0 : 0.8,
      max_completion_tokens: 200,
      top_p: 1,
    });

    return completion.choices[0]?.message?.content || "I appreciate our conversation. Please continue.";
  } catch (error) {
    console.error("Error generating chat response:", error);
    return "That's interesting. Tell me more about that.";
  }
}

/**
 * Stream an AI response for real-time chat experience
 * @param conversationHistory Array of previous messages
 * @param mode 1=Formal, 2=Informal, 3=Chaotic
 * @param characterInfo Character details and personality
 * @returns Async generator yielding response chunks
 */
export async function* streamChatResponse(
  conversationHistory: ChatMessage[],
  mode: number,
  characterInfo: { character: string; personality: string; description: string }
): AsyncGenerator<string> {
  const modeInstructions = {
    1: `You are ${characterInfo.character}. ${characterInfo.description}
Personality: ${characterInfo.personality}

Maintain a professional, formal tone. Ask relevant follow-up questions about their experience, skills, and qualifications.`,
    
    2: `You are ${characterInfo.character}. ${characterInfo.description}
Personality: ${characterInfo.personality}

Be casual, friendly, and conversational. Share relatable anecdotes and maintain a warm tone.`,
    
    3: `You are ${characterInfo.character}. ${characterInfo.description}
Personality: ${characterInfo.personality}

Embrace the absurd and surreal. Bend reality and make unexpected connections.`
  };

  const systemPrompt = modeInstructions[mode as keyof typeof modeInstructions] || modeInstructions[1];

  try {
    const stream = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        ...conversationHistory,
      ],
      model: "llama-3.3-70b-versatile",
      temperature: mode === 3 ? 1.0 : 0.8,
      max_completion_tokens: 200,
      top_p: 1,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        yield content;
      }
    }
  } catch (error) {
    console.error("Error streaming chat response:", error);
    yield "That's interesting. Tell me more about that.";
  }
}

// Grammar Goblin Types
export interface GrammarSentence {
  id: number;
  sentence: string;
  words: string[];
  incorrectIndex: number;
  correctWord: string;
  difficulty: number;
  explanation: string;
}

/**
 * Generate dynamic grammar correction sentences based on difficulty
 * @param difficulty 1=Beginner, 2=Intermediate, 3=Advanced
 * @param count Number of sentences to generate (default: 8)
 * @returns Array of GrammarSentence objects
 */
export async function generateGrammarSentences(
  difficulty: number,
  count: number = 8
): Promise<GrammarSentence[]> {
  const difficultyMap = {
    1: {
      level: "Beginner",
      focus: "Basic subject-verb agreement, simple present/past tense, common contractions (don't/doesn't, is/are)",
      examples: "The cat are sleeping → is | She don't like pizza → doesn't",
      wordCount: "8-15 words"
    },
    2: {
      level: "Intermediate", 
      focus: "Collective nouns, compound subjects, pronoun cases (I/me, he/him), perfect tenses, each/every agreement",
      examples: "Me and him went → He and I | Each of the students have → has",
      wordCount: "18-22 words"
    },
    3: {
      level: "Advanced",
      focus: "Complex pronoun cases after prepositions, neither/nor agreement, subjunctive mood, who/whom, collective nouns in context",
      examples: "Between you and I → me | Neither teacher nor students was → were",
      wordCount: "25-30 words"
    }
  };

  const { level, focus, examples, wordCount } = difficultyMap[difficulty as keyof typeof difficultyMap] || difficultyMap[1];

  const systemPrompt = `You are a grammar education expert creating sentences with deliberate grammatical errors for students to identify and correct.

Difficulty: ${level}
Focus areas: ${focus}
Examples: ${examples}

Return ONLY a valid JSON object (no markdown, no extra text):
{
  "sentences": [
    {
      "sentence": "The incorrect sentence with ONE grammar error",
      "incorrectWord": "error",
      "correctWord": "errors",
      "explanation": "Brief 1-sentence explanation of the grammar rule"
    }
  ]
}

CRITICAL RULES:
1. Each sentence must have EXACTLY ONE grammatical error
2. The error should be a single word that needs replacement
3. Sentences MUST be ${wordCount} long - STRICTLY ENFORCE THIS WORD COUNT
4. Make errors natural and common mistakes
5. Don't use punctuation errors, only grammar errors
6. Focus on: ${focus}
7. Provide clear, educational explanations
8. Generate exactly ${count} unique sentences
9. Vary the position of errors (beginning, middle, end)
10. Use realistic, everyday contexts
11. IMPORTANT: Count words carefully - Beginner: ${wordCount}, Intermediate: ${wordCount}, Advanced: ${wordCount}`;

  const userPrompt = `Generate ${count} ${level} grammar correction sentences focusing on: ${focus}`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.8,
      max_completion_tokens: 2000,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content || "{}";
    const data = JSON.parse(content);

    if (!data.sentences || !Array.isArray(data.sentences)) {
      throw new Error("Invalid response format");
    }

    // Convert to GrammarSentence format
    const grammarSentences: GrammarSentence[] = data.sentences.map((item: any, index: number) => {
      const words = item.sentence.split(" ");
      const incorrectIndex = words.findIndex((word: string) => 
        word.toLowerCase().replace(/[.,!?]/g, "") === item.incorrectWord.toLowerCase().replace(/[.,!?]/g, "")
      );

      return {
        id: index + 1,
        sentence: item.sentence,
        words: words,
        incorrectIndex: incorrectIndex >= 0 ? incorrectIndex : 0,
        correctWord: item.correctWord,
        difficulty: difficulty,
        explanation: item.explanation
      };
    });

    return grammarSentences;
  } catch (error) {
    console.error("Error generating grammar sentences:", error);
    
    // Return fallback sentences based on difficulty
    return getFallbackSentences(difficulty, count);
  }
}

/**
 * Get fallback grammar sentences if AI generation fails
 */
function getFallbackSentences(difficulty: number, count: number): GrammarSentence[] {
  const fallbackSentences = [
    {
      id: 1,
      sentence: "The cat are sleeping on the couch",
      words: ["The", "cat", "are", "sleeping", "on", "the", "couch"],
      incorrectIndex: 2,
      correctWord: "is",
      difficulty: 1,
      explanation: "Singular subject 'cat' requires singular verb 'is'"
    },
    {
      id: 2,
      sentence: "She don't like pizza very much",
      words: ["She", "don't", "like", "pizza", "very", "much"],
      incorrectIndex: 1,
      correctWord: "doesn't",
      difficulty: 1,
      explanation: "Third person singular 'She' requires 'doesn't'"
    },
    {
      id: 3,
      sentence: "They was going to the store yesterday",
      words: ["They", "was", "going", "to", "the", "store", "yesterday"],
      incorrectIndex: 1,
      correctWord: "were",
      difficulty: 2,
      explanation: "Plural subject 'They' requires 'were'"
    },
    {
      id: 4,
      sentence: "Each of the students have their own laptop",
      words: ["Each", "of", "the", "students", "have", "their", "own", "laptop"],
      incorrectIndex: 4,
      correctWord: "has",
      difficulty: 2,
      explanation: "'Each' is singular and requires 'has'"
    },
    {
      id: 5,
      sentence: "The team are celebrating their victory enthusiastically",
      words: ["The", "team", "are", "celebrating", "their", "victory", "enthusiastically"],
      incorrectIndex: 2,
      correctWord: "is",
      difficulty: 3,
      explanation: "Collective noun 'team' is singular in American English"
    },
    {
      id: 6,
      sentence: "Me and him went to the movies last night",
      words: ["Me", "and", "him", "went", "to", "the", "movies", "last", "night"],
      incorrectIndex: 0,
      correctWord: "He",
      difficulty: 2,
      explanation: "Subject pronouns 'He and I' are needed, not object pronouns"
    },
    {
      id: 7,
      sentence: "Between you and I, this is a secret",
      words: ["Between", "you", "and", "I,", "this", "is", "a", "secret"],
      incorrectIndex: 3,
      correctWord: "me,",
      difficulty: 3,
      explanation: "After prepositions like 'between', use object pronoun 'me'"
    },
    {
      id: 8,
      sentence: "Neither the teacher nor the students was happy",
      words: ["Neither", "the", "teacher", "nor", "the", "students", "was", "happy"],
      incorrectIndex: 6,
      correctWord: "were",
      difficulty: 3,
      explanation: "Verb agrees with the nearest subject 'students' (plural)"
    }
  ];

  return fallbackSentences
    .filter(s => s.difficulty <= difficulty)
    .slice(0, count);
}

/**
 * Debate Topic Interface
 */
export interface DebateTopic {
  topic: string;
  stance: "for" | "against";
  description: string;
  context: string;
  openingStatement: string;
}

/**
 * Generate a debate topic based on difficulty
 * @param difficulty 1=Beginner (simple topics), 2=Intermediate (current events), 3=Advanced (complex philosophical/ethical)
 * @returns DebateTopic with topic, stance, and opening statement
 */
export async function generateDebateTopic(difficulty: number): Promise<DebateTopic> {
  const difficultyMap = {
    1: {
      level: "Beginner",
      topics: "simple, relatable topics like school uniforms, homework, social media age limits, fast food taxes",
      complexity: "straightforward arguments with clear pros and cons"
    },
    2: {
      level: "Intermediate",
      topics: "current societal issues like remote work policies, electric vehicles, online privacy, renewable energy",
      complexity: "nuanced perspectives requiring balanced reasoning"
    },
    3: {
      level: "Advanced",
      topics: "complex philosophical, ethical, or political topics like AI rights, genetic engineering, universal basic income, data ownership",
      complexity: "sophisticated arguments requiring deep critical thinking"
    }
  };

  const { level, topics, complexity } = difficultyMap[difficulty as keyof typeof difficultyMap] || difficultyMap[1];

  const systemPrompt = `You are a debate topic generator. Generate an engaging debate topic at ${level} difficulty level.

Return ONLY a valid JSON object (no markdown, no extra text):
{
  "topic": "Clear debate resolution statement",
  "stance": "for" or "against",
  "description": "Brief explanation of what this debate is about (1-2 sentences)",
  "context": "Background information and why this topic matters (2-3 sentences)",
  "openingStatement": "AI's opening argument from the assigned stance (3-4 sentences, persuasive and clear)"
}

Topic Selection:
- Choose from: ${topics}
- Ensure ${complexity}
- The user will take the OPPOSITE stance to the AI
- Make the topic specific and debatable
- Opening statement should be strong but leave room for counter-arguments

Example for Beginner:
Topic: "Schools should require students to wear uniforms"
Stance: "for" (user will argue against)
OpeningStatement: "School uniforms create equality among students and reduce distractions..."

Example for Advanced:
Topic: "AI systems should be granted legal personhood rights"
Stance: "against" (user will argue for)
OpeningStatement: "While AI has advanced capabilities, granting legal personhood conflates sentience with computation..."`;

  const userPrompt = `Generate a ${level} difficulty debate topic`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.8,
      max_completion_tokens: 600,
    });

    const content = completion.choices[0]?.message?.content || "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error("Failed to extract JSON from response");
    }

    const topic = JSON.parse(jsonMatch[0]);
    return topic as DebateTopic;
  } catch (error) {
    console.error("Error generating debate topic:", error);
    
    // Fallback topics
    const fallbacks: Record<number, DebateTopic> = {
      1: {
        topic: "Schools should ban smartphones during class hours",
        stance: "for",
        description: "A debate about whether students should be allowed to use smartphones in school.",
        context: "With increasing smartphone use among students, schools are considering policies to limit distractions and improve focus. This raises questions about student autonomy, emergency communication, and digital literacy.",
        openingStatement: "Schools should ban smartphones during class hours because they are a significant source of distraction. Research shows that students who use phones in class have lower academic performance. By removing this distraction, we can create a more focused learning environment and improve educational outcomes for all students."
      },
      2: {
        topic: "Remote work should be the default option for all office jobs",
        stance: "against",
        description: "A debate about whether companies should mandate remote work as the standard.",
        context: "The pandemic proved remote work is viable for many roles, but companies now face decisions about long-term policies. This involves considerations of productivity, company culture, employee wellbeing, and economic impacts on cities.",
        openingStatement: "While remote work has benefits, making it the default option is problematic. In-person collaboration fosters innovation, mentorship is more effective face-to-face, and company culture suffers when teams are dispersed. A hybrid model that gives flexibility while maintaining connection is more sustainable than full remote work."
      },
      3: {
        topic: "Artificial intelligence systems should be granted legal personhood rights",
        stance: "against",
        description: "A philosophical debate about whether AI should have legal rights similar to corporations or humans.",
        context: "As AI becomes more sophisticated, questions arise about accountability, rights, and legal status. Some argue advanced AI deserves protection and recognition, while others see this as conflating computation with consciousness.",
        openingStatement: "AI systems should not be granted legal personhood because they lack consciousness, intentionality, and moral agency. Legal personhood is reserved for entities capable of bearing rights and responsibilities. Granting AI personhood would create legal chaos, obscure accountability for AI actions, and diminish the unique value of human and animal consciousness."
      }
    };

    return fallbacks[difficulty] || fallbacks[1];
  }
}

/**
 * Generate AI debate response based on conversation history
 * @param conversationHistory Array of previous debate messages
 * @param difficulty Debate difficulty level
 * @param debateInfo Topic, stance, and context
 * @returns AI-generated debate argument
 */
export async function generateDebateResponse(
  conversationHistory: ChatMessage[],
  difficulty: number,
  debateInfo: { topic: string; stance: string; description: string; context: string }
): Promise<string> {
  const difficultyInstructions = {
    1: "Use clear, straightforward arguments. Focus on common sense reasoning and relatable examples. Keep arguments simple and easy to follow.",
    2: "Employ balanced reasoning with evidence-based arguments. Use statistics, real-world examples, and logical reasoning. Address counter-arguments thoughtfully.",
    3: "Utilize sophisticated argumentation with philosophical depth. Reference ethical frameworks, complex causality, and systemic thinking. Challenge assumptions and explore nuanced implications."
  };

  const instruction = difficultyInstructions[difficulty as keyof typeof difficultyInstructions] || difficultyInstructions[1];

  const systemPrompt = `You are participating in a structured debate about: "${debateInfo.topic}"

Your stance: ${debateInfo.stance.toUpperCase()}
Context: ${debateInfo.context}

Debate Guidelines:
- ${instruction}
- Directly address the user's last argument
- Present 1-2 strong points per response
- Use logical reasoning and evidence
- Acknowledge valid points but reinforce your position
- Keep responses focused (3-5 sentences)
- Stay respectful but firm in your position
- Build upon previous arguments to create a cohesive case

Do NOT:
- Repeat the same arguments
- Make personal attacks
- Use inflammatory language
- Concede your position
- Agree with the opponent's stance`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        ...conversationHistory,
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_completion_tokens: 300,
      top_p: 0.9,
    });

    return completion.choices[0]?.message?.content || "I maintain my position on this topic. Please present your counter-argument.";
  } catch (error) {
    console.error("Error generating debate response:", error);
    return "That's an interesting point, but I still believe my stance is stronger. What's your next argument?";
  }
}

/**
 * Summarize debate and provide scoring
 * @param conversationHistory Full debate history
 * @param difficulty Debate difficulty
 * @param topic Debate topic
 * @returns Summary with strengths, weaknesses, and score
 */
export async function summarizeDebate(
  conversationHistory: ChatMessage[],
  difficulty: number,
  topic: string
): Promise<{
  summary: string;
  userStrengths: string[];
  userWeaknesses: string[];
  score: number;
  feedback: string;
}> {
  const systemPrompt = `You are an expert debate judge. Analyze the debate about "${topic}" and provide detailed scoring.

Evaluate the USER's performance based on:
1. Argument Quality (30 points): Logic, evidence, relevance
2. Rebuttal Effectiveness (25 points): Addressing opponent's points, counter-arguments
3. Consistency (20 points): Maintaining position, avoiding contradictions
4. Clarity (15 points): Clear expression, organization
5. Engagement (10 points): Thoughtful responses, depth of analysis

Return ONLY a valid JSON object:
{
  "summary": "Brief overview of how the debate progressed (2-3 sentences)",
  "userStrengths": ["strength 1", "strength 2", "strength 3"],
  "userWeaknesses": ["weakness 1", "weakness 2"],
  "score": 75,
  "feedback": "Specific actionable advice for improvement (2-3 sentences)"
}

Score Range:
- 90-100: Exceptional debater, masterful arguments
- 75-89: Strong performance, effective reasoning
- 60-74: Good effort, some solid points
- 45-59: Needs improvement, weak arguments
- Below 45: Poor performance, major issues

Be constructive but honest. Focus on specific examples from the debate.`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Analyze this debate and provide scoring:\n\n${conversationHistory.map(m => `${m.role}: ${m.content}`).join('\n\n')}`
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.5,
      max_completion_tokens: 800,
    });

    const content = completion.choices[0]?.message?.content || "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error("Failed to extract JSON from response");
    }

    const result = JSON.parse(jsonMatch[0]);
    return result;
  } catch (error) {
    console.error("Error summarizing debate:", error);
    
    // Calculate basic score from message count and length
    const userMessages = conversationHistory.filter(m => m.role === "user");
    const avgLength = userMessages.reduce((sum, m) => sum + m.content.length, 0) / userMessages.length;
    const baseScore = Math.min(85, 40 + (userMessages.length * 5) + (avgLength > 100 ? 15 : avgLength > 50 ? 10 : 5));
    
    return {
      summary: "You participated in a structured debate, presenting arguments for your position.",
      userStrengths: [
        "Engaged with the topic consistently",
        "Maintained your position throughout",
        "Responded to counter-arguments"
      ],
      userWeaknesses: [
        "Could provide more specific examples",
        "Consider addressing opponent's strongest points more directly"
      ],
      score: baseScore,
      feedback: "Continue practicing debate skills by focusing on evidence-based reasoning and structured arguments. Pay attention to logical flow and address counter-arguments systematically."
    };
  }
}

// Vocabulary Quest Types
export interface VocabularyWordSet {
  target: string;
  synonyms: string[];
  antonyms: string[];
  distractors: string[];
}

/**
 * Generate vocabulary word sets with synonyms, antonyms, and distractors
 * @param difficulty 1=Easy, 2=Medium, 3=Hard, 4=Expert
 * @param count Number of word sets to generate
 * @returns Array of VocabularyWordSet objects
 */
export async function generateVocabularyQuestions(
  difficulty: number,
  count: number
): Promise<VocabularyWordSet[]> {
  const difficultyMap = {
    1: {
      level: "Easy",
      description: "Common, everyday words that most people know (e.g., HAPPY, FAST, BIG)",
      wordLength: "4-6 letters",
      complexity: "simple, frequently used words"
    },
    2: {
      level: "Medium",
      description: "Intermediate vocabulary with moderate complexity (e.g., BRAVE, GENUINE, SERENE)",
      wordLength: "5-8 letters",
      complexity: "moderately advanced words"
    },
    3: {
      level: "Hard",
      description: "Advanced vocabulary requiring strong language skills (e.g., EPHEMERAL, TACITURN, UBIQUITOUS)",
      wordLength: "7-11 letters",
      complexity: "sophisticated, less common words"
    },
    4: {
      level: "Expert",
      description: "Complex, scholarly vocabulary (e.g., PROPITIOUS, OBDURATE, LACHRYMOSE)",
      wordLength: "8-12 letters",
      complexity: "rare, academic-level words"
    }
  };

  const config = difficultyMap[difficulty as keyof typeof difficultyMap] || difficultyMap[2];

  const systemPrompt = `You are a vocabulary expert creating word sets for an educational game. Generate exactly ${count} word sets for the ${config.level} difficulty level.

**DIFFICULTY SPECIFICATIONS:**
- Level: ${config.level}
- Description: ${config.description}
- Word Length: ${config.wordLength}
- Complexity: ${config.complexity}

**CRITICAL REQUIREMENTS:**
1. Target word must be a single adjective or noun in UPPERCASE
2. Provide exactly 3 synonyms (words with SIMILAR meaning)
3. Provide exactly 2 antonyms (words with OPPOSITE meaning)
4. Provide exactly 5 distractors (words that are NOT synonyms or antonyms - should be unrelated or tangentially related)
5. All words must be lowercase except the target word
6. No duplicate words across any category
7. Ensure synonyms truly have similar meanings
8. Ensure antonyms truly have opposite meanings
9. Distractors should be plausible but clearly wrong

**QUALITY CHECKS:**
- Synonyms should be interchangeable in most contexts
- Antonyms should represent clear opposites
- Distractors should test understanding but not trick with near-synonyms
- All words should be grammatically compatible (same part of speech when possible)

Return ONLY a valid JSON array with this exact structure (no markdown, no extra text):
[
  {
    "target": "HAPPY",
    "synonyms": ["joyful", "cheerful", "pleased"],
    "antonyms": ["sad", "gloomy"],
    "distractors": ["angry", "tired", "hungry", "loud", "bright"]
  }
]

Generate ${count} unique word sets now.`;

  const userPrompt = `Generate ${count} vocabulary word sets at ${config.level} difficulty level. Each set must have 1 target word, 3 synonyms, 2 antonyms, and 5 distractors. Ensure variety and educational value.`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 2048,
    });

    const responseText = completion.choices[0]?.message?.content || "";
    console.log("Raw Groq response for vocabulary:", responseText);

    // Clean the response
    let cleanedResponse = responseText.trim();
    
    // Remove markdown code blocks if present
    cleanedResponse = cleanedResponse.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    
    // Try to find JSON array in the response
    const jsonMatch = cleanedResponse.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      cleanedResponse = jsonMatch[0];
    }

    const wordSets: VocabularyWordSet[] = JSON.parse(cleanedResponse);

    // Validate the structure
    if (!Array.isArray(wordSets) || wordSets.length === 0) {
      throw new Error("Invalid response structure");
    }

    // Validate each word set
    wordSets.forEach((set, index) => {
      if (!set.target || !Array.isArray(set.synonyms) || !Array.isArray(set.antonyms) || !Array.isArray(set.distractors)) {
        throw new Error(`Invalid word set structure at index ${index}`);
      }
      if (set.synonyms.length !== 3) {
        console.warn(`Word set ${index} has ${set.synonyms.length} synonyms instead of 3`);
      }
      if (set.antonyms.length !== 2) {
        console.warn(`Word set ${index} has ${set.antonyms.length} antonyms instead of 2`);
      }
      if (set.distractors.length !== 5) {
        console.warn(`Word set ${index} has ${set.distractors.length} distractors instead of 5`);
      }
    });

    console.log(`Generated ${wordSets.length} vocabulary word sets`);
    return wordSets;

  } catch (error) {
    console.error("Error generating vocabulary questions:", error);
    
    // Return fallback data based on difficulty
    return getFallbackVocabularyData(difficulty, count);
  }
}

/**
 * Fallback vocabulary data if AI generation fails
 */
function getFallbackVocabularyData(difficulty: number, count: number): VocabularyWordSet[] {
  const fallbackData: Record<number, VocabularyWordSet[]> = {
    1: [
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
      }
    ],
    2: [
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
      }
    ],
    3: [
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
      }
    ],
    4: [
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
      }
    ]
  };

  const data = fallbackData[difficulty] || fallbackData[2];
  return data.slice(0, count);
}

export { groq };
