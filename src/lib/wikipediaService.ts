// Wikipedia API Service for fetching random sentences

export interface WikipediaSentence {
  original: string;
  blankedTemplate: string;
  words: Array<{
    id: string;
    text: string;
    isPlaced: boolean;
    correctSlotId: number;
  }>;
  slots: Array<{
    id: number;
    correctWord: string;
    position: number;
  }>;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
}

// Topic categories by difficulty
const TOPICS = {
  easy: [
    'Animal',
    'Food',
    'Sport',
    'Music',
    'Color',
    'Weather',
    'Family',
    'Transport'
  ],
  medium: [
    'Science',
    'History',
    'Geography',
    'Technology',
    'Literature',
    'Art',
    'Philosophy',
    'Economics'
  ],
  hard: [
    'Quantum_mechanics',
    'Neuroscience',
    'Astrophysics',
    'Molecular_biology',
    'Artificial_intelligence',
    'Cryptography',
    'Linguistics',
    'Epistemology'
  ]
};

// Configuration for difficulty levels
const DIFFICULTY_CONFIG = {
  easy: {
    targetWords: 20,
    blanks: 6,
    minWordLength: 4,
  },
  medium: {
    targetWords: 40,
    blanks: 18,
    minWordLength: 5,
  },
  hard: {
    targetWords: 60,
    blanks: 24,
    minWordLength: 6,
  }
};

/**
 * Fetch random Wikipedia article content
 */
async function fetchWikipediaContent(topic: string): Promise<string> {
  try {
    const response = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Wikipedia API error: ${response.status}`);
    }

    const data = await response.json();
    return data.extract || '';
  } catch (error) {
    console.error('Error fetching Wikipedia content:', error);
    throw error;
  }
}

/**
 * Get random topic for difficulty level
 */
function getRandomTopic(difficulty: 'easy' | 'medium' | 'hard'): string {
  const topics = TOPICS[difficulty];
  return topics[Math.floor(Math.random() * topics.length)];
}

/**
 * Clean and tokenize text into words
 */
function tokenizeText(text: string): string[] {
  // Remove parenthetical content and references
  text = text.replace(/\([^)]*\)/g, '');
  text = text.replace(/\[[^\]]*\]/g, '');
  
  // Split into words and clean
  return text
    .split(/\s+/)
    .map(word => word.replace(/[.,;:!?"""'']/g, '').trim())
    .filter(word => word.length > 0);
}

/**
 * Extract sentence with target word count
 */
function extractSentence(
  text: string,
  targetWords: number,
  minWordLength: number
): { sentence: string; words: string[] } | null {
  // Split text into sentences
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  
  if (sentences.length === 0) return null;
  
  let bestMatch: { sentence: string; words: string[]; score: number } | null = null;
  
  // Try to combine sentences to reach target word count
  for (let i = 0; i < sentences.length; i++) {
    let combined = sentences[i];
    let words = tokenizeText(combined);
    
    // Keep adding sentences until we exceed target by too much
    for (let j = i + 1; j < sentences.length && words.length < targetWords * 1.5; j++) {
      combined += ' ' + sentences[j];
      words = tokenizeText(combined);
      
      // Calculate how close we are to target (0 = perfect, higher = worse)
      const difference = Math.abs(words.length - targetWords);
      const score = difference / targetWords;
      
      // If this is closer to our target than previous best, save it
      if (!bestMatch || score < bestMatch.score) {
        const validWords = words.filter(w => w.length >= minWordLength);
        // Make sure we have enough valid words for blanks
        if (validWords.length >= 5) {
          bestMatch = { sentence: combined.trim(), words, score };
        }
      }
    }
    
    // Also check single sentences
    if (words.length >= 10) {
      const difference = Math.abs(words.length - targetWords);
      const score = difference / targetWords;
      if (!bestMatch || score < bestMatch.score) {
        const validWords = words.filter(w => w.length >= minWordLength);
        if (validWords.length >= 5) {
          bestMatch = { sentence: combined.trim(), words, score };
        }
      }
    }
  }
  
  // Return best match if found, even if not perfect
  if (bestMatch) {
    return { sentence: bestMatch.sentence, words: bestMatch.words };
  }
  
  return null;
}

/**
 * Select words to blank out
 */
function selectBlanks(
  words: string[],
  blanksCount: number,
  minWordLength: number
): number[] {
  // Filter indices of words that are long enough and meaningful
  const candidates = words
    .map((word, index) => ({ word, index }))
    .filter(item => 
      item.word.length >= minWordLength &&
      !/^(the|and|or|but|is|are|was|were|a|an|in|on|at|to|for|of|with)$/i.test(item.word)
    )
    .map(item => item.index);
  
  if (candidates.length < blanksCount) {
    // If not enough candidates, just use all available
    return candidates.slice(0, blanksCount);
  }
  
  // Randomly select blanks, ensuring they're somewhat evenly distributed
  const selected: number[] = [];
  const step = Math.floor(candidates.length / blanksCount);
  
  for (let i = 0; i < blanksCount; i++) {
    const startIdx = i * step;
    const endIdx = Math.min(startIdx + step, candidates.length);
    const sectionCandidates = candidates.slice(startIdx, endIdx);
    
    if (sectionCandidates.length > 0) {
      const randomIdx = Math.floor(Math.random() * sectionCandidates.length);
      selected.push(sectionCandidates[randomIdx]);
    }
  }
  
  return selected.sort((a, b) => a - b);
}

/**
 * Create blanked template and word bank
 */
function createBlankTemplate(
  words: string[],
  blankIndices: number[]
): {
  template: string;
  slots: Array<{ id: number; correctWord: string; position: number }>;
  wordBank: Array<{ id: string; text: string; isPlaced: boolean; correctSlotId: number }>;
} {
  const slots: Array<{ id: number; correctWord: string; position: number }> = [];
  const wordBank: Array<{ id: string; text: string; isPlaced: boolean; correctSlotId: number }> = [];
  
  // Create template with blanks
  const templateParts: string[] = [];
  let slotId = 0;
  
  words.forEach((word, index) => {
    if (blankIndices.includes(index)) {
      slots.push({
        id: slotId,
        correctWord: word,
        position: index,
      });
      
      wordBank.push({
        id: `word-${slotId}`,
        text: word,
        isPlaced: false,
        correctSlotId: slotId,
      });
      
      templateParts.push('___');
      slotId++;
    } else {
      templateParts.push(word);
    }
  });
  
  // Shuffle word bank
  const shuffledWordBank = [...wordBank].sort(() => Math.random() - 0.5);
  
  return {
    template: templateParts.join(' '),
    slots,
    wordBank: shuffledWordBank,
  };
}

/**
 * Generate a Wikipedia-based sentence puzzle
 */
export async function generateWikipediaSentence(
  difficulty: 'easy' | 'medium' | 'hard'
): Promise<WikipediaSentence> {
  const config = DIFFICULTY_CONFIG[difficulty];
  const maxRetries = 3;
  
  // Try multiple topics if needed
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const topic = getRandomTopic(difficulty);
    
    try {
      // Fetch Wikipedia content
      const content = await fetchWikipediaContent(topic);
      
      if (!content) {
        console.warn(`No content for topic: ${topic}, trying another...`);
        continue;
      }
      
      // Extract sentence with target word count
      const extracted = extractSentence(content, config.targetWords, config.minWordLength);
      
      if (!extracted) {
        console.warn(`Could not extract sentence from: ${topic}, trying another...`);
        continue;
      }
      
      // Select which words to blank out
      const blankIndices = selectBlanks(extracted.words, config.blanks, config.minWordLength);
      
      // Create template and word bank
      const { template, slots, wordBank } = createBlankTemplate(extracted.words, blankIndices);
      
      return {
        original: extracted.sentence,
        blankedTemplate: template,
        words: wordBank,
        slots,
        difficulty,
        topic: topic.replace(/_/g, ' '),
      };
    } catch (error) {
      console.error(`Error with topic ${topic}:`, error);
      // Continue to next attempt
    }
  }
  
  // If all retries failed, throw error
  throw new Error('Could not generate suitable sentence after multiple attempts');
}

/**
 * Validate if placed words match the original sentence
 */
export function validateSentence(
  placedWords: Array<{ slotId: number; word: string }>,
  slots: Array<{ id: number; correctWord: string }>
): { isCorrect: boolean; correctCount: number; totalCount: number } {
  let correctCount = 0;
  
  placedWords.forEach(placed => {
    const slot = slots.find(s => s.id === placed.slotId);
    if (slot && slot.correctWord.toLowerCase() === placed.word.toLowerCase()) {
      correctCount++;
    }
  });
  
  return {
    isCorrect: correctCount === slots.length,
    correctCount,
    totalCount: slots.length,
  };
}
