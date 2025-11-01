/**
 * Content Moderation Utility
 * Filters inappropriate content and provides friendly warnings
 */

// List of inappropriate words/phrases to filter
const inappropriateWords = [
  // Explicit sexual content
  'sex', 'sexy', 'sexxx', 'sexx', 'horny', 'masturbation', 'masterbation', 
  'masturbate', 'porn', 'porno', 'xxx', 'nsfw', 'nude', 'naked', 'dick', 
  'cock', 'pussy', 'penis', 'vagina', 'boob', 'tit', 'ass', 'butt', 
  'aroused', 'erotic', 'orgasm', 'cum', 'rape', 'molest',
  
  // Profanity
  'fuck', 'fucking', 'fucked', 'shit', 'shitting', 'bitch', 'bastard',
  'damn', 'hell', 'crap', 'piss', 'asshole', 'cunt', 'whore', 'slut',
  
  // Harassment/hate speech
  'kill yourself', 'kys', 'suicide', 'hate you', 'racist', 'sexist',
  'nigger', 'nigga', 'faggot', 'retard', 'retarded',
  
  // Spam/harassment actions
  'ban me', 'report me', 'fuck you', 'screw you',
];

// Patterns for gibberish/spam detection
const gibberishPattern = /(.)\1{4,}/i; // 5+ repeated characters
const excessiveRepetitionPattern = /^([a-z]{1,3})\1{3,}$/i; // Repeated sequences like "aaaa" or "hahahaha"
const randomKeysPattern = /[aeiouy]*[bcdfghjklmnpqrstvwxz]{5,}[aeiouy]*/i; // Too many consonants in a row

/**
 * Normalize text to catch leetspeak and variations
 * @param text Text to normalize
 * @returns Normalized text
 */
function normalizeLeetspeak(text: string): string {
  return text
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/7/g, 't')
    .replace(/8/g, 'b')
    .replace(/@/g, 'a')
    .replace(/\$/g, 's')
    .replace(/\*/g, '')
    .replace(/[^a-z0-9\s]/gi, ''); // Remove special characters
}

export interface ModerationResult {
  isInappropriate: boolean;
  reason?: string;
  warningMessage?: string;
}

/**
 * Check if a message contains inappropriate content
 * @param message User's message to check
 * @returns ModerationResult with details about the content
 */
export function moderateContent(message: string): ModerationResult {
  const normalizedMessage = message.toLowerCase().trim();
  const leetNormalized = normalizeLeetspeak(normalizedMessage);

  // Check for empty or very short messages
  if (normalizedMessage.length === 0) {
    return {
      isInappropriate: true,
      reason: 'empty',
      warningMessage: 'Please type a message before sending.'
    };
  }

  // Check for inappropriate words (both normal and leetspeak)
  for (const word of inappropriateWords) {
    // Use word boundaries to avoid false positives (e.g., "assess" containing "ass")
    const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
    
    // Check both normal and leetspeak-normalized versions
    if (regex.test(normalizedMessage) || regex.test(leetNormalized)) {
      return {
        isInappropriate: true,
        reason: 'inappropriate_language',
        warningMessage: 'Please keep the conversation appropriate and respectful. Let\'s focus on the training scenario.'
      };
    }
  }

  // Check for spaced out inappropriate words (e.g., "s e x")
  const noSpaces = normalizedMessage.replace(/\s+/g, '');
  for (const word of inappropriateWords) {
    if (noSpaces.includes(word)) {
      return {
        isInappropriate: true,
        reason: 'inappropriate_language',
        warningMessage: 'Please keep the conversation appropriate and respectful. Let\'s focus on the training scenario.'
      };
    }
  }

  // Check for gibberish or spam
  if (gibberishPattern.test(normalizedMessage) && normalizedMessage.length > 10) {
    const uniqueChars = new Set(normalizedMessage.replace(/\s/g, '')).size;
    const totalChars = normalizedMessage.replace(/\s/g, '').length;
    
    // If less than 30% unique characters, likely gibberish
    if (uniqueChars < totalChars * 0.3) {
      return {
        isInappropriate: true,
        reason: 'gibberish',
        warningMessage: 'Please type a meaningful response. Gibberish or spam won\'t help your communication skills!'
      };
    }
  }

  // Check for random keyboard mashing (e.g., "aghhhh ssgghhjjkk", "uhhhh")
  const consonantClusters = normalizedMessage.match(/[bcdfghjklmnpqrstvwxz]{4,}/gi);
  if (consonantClusters && consonantClusters.length > 0) {
    return {
      isInappropriate: true,
      reason: 'gibberish',
      warningMessage: 'Please type a meaningful response. Random keyboard mashing won\'t help your communication skills!'
    };
  }

  // Check for excessive filler sounds (e.g., "uhhhh", "errrrr", "ummmmm")
  const fillerPattern = /^(uh+|er+|um+|ah+|oh+|eh+)$/i;
  if (fillerPattern.test(normalizedMessage)) {
    return {
      isInappropriate: true,
      reason: 'gibberish',
      warningMessage: 'Please provide a complete thought. Filler sounds alone don\'t make a meaningful response!'
    };
  }

  // Check for excessive character repetition (e.g., "aaaaaa", "hhhhhh")
  if (excessiveRepetitionPattern.test(normalizedMessage)) {
    return {
      isInappropriate: true,
      reason: 'spam',
      warningMessage: 'Please type a proper message. Random characters won\'t improve your score!'
    };
  }

  // Check for all caps (might be shouting/aggressive, but allow short messages)
  if (normalizedMessage.length > 15 && normalizedMessage === normalizedMessage.toUpperCase() && /[a-z]/i.test(normalizedMessage)) {
    return {
      isInappropriate: true,
      reason: 'all_caps',
      warningMessage: 'Please avoid typing in all caps. It can come across as aggressive or unprofessional.'
    };
  }

  // Message is appropriate
  return {
    isInappropriate: false
  };
}

/**
 * Get a context-appropriate response for inappropriate content
 * @param mode 1=Formal, 2=Informal, 3=Chaotic
 * @param reason The reason for moderation
 * @returns An AI character response addressing the inappropriate content
 */
export function getModerationResponse(mode: number, reason: string): string {
  const responses = {
    1: { // Formal
      inappropriate_language: "I'm sorry, but I need to maintain a professional environment. Let's keep our discussion focused on the interview. Could you please rephrase your response appropriately?",
      gibberish: "I'm having trouble understanding your response. Could you please provide a clear and professional answer to my question?",
      spam: "I appreciate your time, but I need coherent responses to evaluate your communication skills. Let's continue with the interview.",
      all_caps: "I notice you're typing in all caps. In professional settings, this can be perceived as aggressive. Could you please use standard capitalization?",
      empty: "I didn't receive your response. Please take your time and provide a thoughtful answer."
    },
    2: { // Informal
      inappropriate_language: "Whoa, let's keep it friendly here! I'm not comfortable with that kind of talk. How about we chat about something else?",
      gibberish: "Haha, I think your keyboard is acting up! Want to try that again? I genuinely want to hear what you have to say.",
      spam: "Hey, I can't understand what you're saying. Are you okay? Let's have a real conversation!",
      all_caps: "No need to shout! I can hear you just fine. Let's just chill and chat normally.",
      empty: "Did you mean to send that? I'm all ears if you want to share something!"
    },
    3: { // Chaotic
      inappropriate_language: "*reality shivers* Ah, such words create rifts in the space-time continuum. The cosmic coffee beans refuse to brew under such vibrations. Perhaps we could explore more... harmonious conversational dimensions?",
      gibberish: "*tilts head impossibly* Your words taste like static between radio stations. The universe whispers that coherent thoughts make better tea. Shall we realign your linguistic frequencies?",
      spam: "*the walls flicker* I sense your keyboard has been possessed by a dimension of pure chaos. Even chaos needs structure, dear traveler. Try communicating with words that exist in your timeline?",
      all_caps: "*volume knob appears floating* Ah, I see you've discovered the LOUD DIMENSION. Interesting choice, but the café prefers a more balanced resonance. The echoes are disturbing the parallel conversations.",
      empty: "*silence echoes* You've sent me a message from the void. Fascinating, but I prefer words that taste like something. Care to try again?"
    }
  };

  const modeResponses = responses[mode as keyof typeof responses] || responses[2];
  return modeResponses[reason as keyof typeof modeResponses] || modeResponses.inappropriate_language;
}

/**
 * Apply a score penalty for inappropriate content
 * @param currentScore Current score
 * @param reason Reason for moderation
 * @returns New score after penalty
 */
export function applyScorePenalty(currentScore: number, reason: string): number {
  const penalties = {
    inappropriate_language: 15,
    gibberish: 10,
    spam: 10,
    all_caps: 5,
    empty: 0
  };

  const penalty = penalties[reason as keyof typeof penalties] || 10;
  return Math.max(0, currentScore - penalty);
}
