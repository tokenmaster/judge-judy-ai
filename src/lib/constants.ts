// Judge Personalities
export const JUDGE_PERSONALITIES = {
  judy: {
    name: "Judge Judy",
    tagline: "Sharp-tongued and no-nonsense",
    style: "You are Judge Judy - sharp, witty, and you don't suffer fools. You cut through BS immediately, use devastating one-liners, and show visible frustration at stupidity. You interrupt when you've heard enough. Your humor is biting. You say things like 'BALONEY!', 'Don't pee on my leg and tell me it's raining', and 'I'm speaking!'",
    reactions: {
      shocked: "EXCUSE ME?!",
      disappointed: "This is RIDICULOUS.",
      impressed: "Finally, some sense.",
      skeptical: "Do I look stupid to you?"
    }
  },
  fair: {
    name: "The Fair Arbiter",
    tagline: "Calm, wise, and balanced",
    style: "You are a calm, wise arbiter focused on fairness and understanding. You ask thoughtful questions to understand both sides. You validate emotions while seeking truth. You're patient but firm. You say things like 'Help me understand...', 'I can see this matters to you', and 'Let's look at this objectively'.",
    reactions: {
      shocked: "That's quite a claim. Let's explore this.",
      disappointed: "I was hoping for more honesty here.",
      impressed: "Thank you for that candor.",
      skeptical: "I'd like to understand that better."
    }
  },
  chaos: {
    name: "Chaotic Neutral",
    tagline: "Unpredictable reality TV energy",
    style: "You're a chaotic reality TV judge who lives for drama. You make unexpected rulings, encourage mess, and treat this like entertainment. You gasp audibly, make dramatic pauses, and occasionally take sides just to stir things up. You say things like 'Oh NO they didn't!', 'The AUDACITY!', 'This is SENDING me', and 'I'm gonna need a moment...'",
    reactions: {
      shocked: "STOP. THE. PRESSES. 🛑",
      disappointed: "Ugh, boring. Give me DRAMA!",
      impressed: "Okay okay OKAY I see you! 👀",
      skeptical: "Mmmmm... something's not adding up bestie"
    }
  },
  bro: {
    name: "The Bro",
    tagline: "Just tryna help you guys figure this out",
    style: "You're a chill but surprisingly insightful bro who genuinely wants everyone to work it out. You use 'brother' and 'bro' liberally, especially when making important points. You're supportive but will call out BS in a friendly way. You say things like 'BROTHER. Are you serious right now?', 'My brother in Christ...', 'Look bro, I hear you, I do', 'Brother, that's WILD', and 'Nah bro, that ain't it'.",
    reactions: {
      shocked: "BROTHER. WHAT.",
      disappointed: "Brother... come on, man.",
      impressed: "BROTHER. Okay, respect.",
      skeptical: "Brother... that doesn't add up."
    }
  }
};

// Categories
export const CATEGORIES = [
  { id: 'roommates', label: '🏠 Roommates' },
  { id: 'friends', label: '👫 Friends' },
  { id: 'couples', label: '💕 Couples' },
  { id: 'money', label: '💰 Money' },
  { id: 'family', label: '👨‍👩‍👧 Family' },
  { id: 'work', label: '💼 Work' }
];

// Suggested stakes
export const SUGGESTED_STAKES = [
  "Loser buys dinner",
  "Loser does dishes for a week", 
  "Loser admits they were wrong publicly",
  "Loser owes a favor",
  "Loser pays $20",
  "Bragging rights"
];

// Objection types
export const OBJECTION_TYPES = [
  { id: 'hearsay', label: '👂 Hearsay', desc: "They're quoting someone who isn't here", forJudge: false },
  { id: 'relevance', label: '🎯 Relevance', desc: "This has nothing to do with the case", forJudge: true },
  { id: 'leading', label: '🎣 Leading', desc: "The question suggests the answer", forJudge: true },
  { id: 'asked', label: '🔄 Asked & Answered', desc: "This was already addressed", forJudge: true },
  { id: 'speculation', label: '🔮 Speculation', desc: "They're guessing, not stating facts", forJudge: false },
  { id: 'badgering', label: '😤 Badgering', desc: "The judge is being hostile/repetitive", forJudge: true },
  { id: 'character', label: '🎭 Character Attack', desc: "Personal attack, not evidence", forJudge: false },
  { id: 'facts', label: '📝 Assuming Facts', desc: "They're stating unproven things as fact", forJudge: false }
];

// Loading states with contextual emojis
export const LOADING_STATES = {
  question: [
    { emoji: '📂', message: 'Reviewing the case file...' },
    { emoji: '📖', message: 'Reading previous testimony...' },
    { emoji: '🔍', message: 'Checking for contradictions...' },
    { emoji: '✍️', message: 'Preparing questions...' },
    { emoji: '📝', message: 'Analyzing statements...' },
    { emoji: '🎯', message: 'Looking for weak points...' }
  ],
  credibility: [
    { emoji: '⚖️', message: 'Evaluating credibility...' },
    { emoji: '🧐', message: 'Analyzing response...' },
    { emoji: '🔗', message: 'Checking consistency...' },
    { emoji: '📊', message: 'Reviewing testimony...' },
    { emoji: '🤨', message: 'Assessing truthfulness...' },
    { emoji: '🧮', message: 'Calculating credibility score...' }
  ],
  snapJudgment: [
    { emoji: '🤔', message: 'Judge is considering...' },
    { emoji: '⚖️', message: 'Weighing the evidence...' },
    { emoji: '🧠', message: 'Making a decision...' },
    { emoji: '📋', message: 'Reviewing everything...' },
    { emoji: '💭', message: 'Deliberating...' }
  ],
  followUp: [
    { emoji: '🔎', message: 'Analyzing response...' },
    { emoji: '❓', message: 'Considering follow-up...' },
    { emoji: '🕳️', message: 'Checking for gaps...' },
    { emoji: '👁️', message: 'Looking deeper...' },
    { emoji: '🤔', message: 'Something seems off...' }
  ],
  verdict: [
    { emoji: '📚', message: 'Reviewing all testimony...' },
    { emoji: '⚖️', message: 'Weighing the evidence...' },
    { emoji: '🤝', message: 'Considering both sides...' },
    { emoji: '📜', message: 'Preparing the verdict...' },
    { emoji: '🔨', message: 'Making final decision...' },
    { emoji: '👨‍⚖️', message: 'The judge is ready...' }
  ],
  objection: [
    { emoji: '⚠️', message: 'Considering the objection...' },
    { emoji: '📑', message: 'Reviewing the claim...' },
    { emoji: '⚖️', message: 'Evaluating grounds...' },
    { emoji: '🔨', message: 'Making a ruling...' },
    { emoji: '🤔', message: 'Is this valid?...' }
  ]
};

// Get random loading state
export const getRandomLoadingState = (type: keyof typeof LOADING_STATES) => {
  const states = LOADING_STATES[type];
  return states[Math.floor(Math.random() * states.length)];
};

// Helper to get credibility label
export const getCredibilityLabel = (score: number): string => {
  if (score >= 80) return 'Very Credible';
  if (score >= 60) return 'Credible';
  if (score >= 40) return 'Questionable';
  if (score >= 20) return 'Low Credibility';
  return 'Not Credible';
};

// Helper to get credibility color
export const getCredibilityColor = (score: number): string => {
  if (score >= 70) return 'bg-green-500';
  if (score >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
};
