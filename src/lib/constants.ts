// Judge GIFs - mapped by judge and situation
export const JUDGE_GIFS = {
  joody: {
    intro: 'https://media.giphy.com/media/Rhhr8D5mKSX7O/giphy.gif', // Judge Joody "BALONEY!"
    waiting: 'https://media.giphy.com/media/l0HlPwMAzh13pcZ20/giphy.gif', // Judge Joody impatient
    thinking: 'https://media.giphy.com/media/26gspjl5bxzhSdJtK/giphy.gif', // Judge Joody thinking
    winner: 'https://media.giphy.com/media/3o7TKnO6Wve6502iJ2/giphy.gif', // Judge Joody approving
    loser: 'https://media.giphy.com/media/5xtDarmwsuR9sDRObyU/giphy.gif', // Judge Joody pointing
    objection: 'https://media.giphy.com/media/ftdF4ZkueWGHBYc4b5/giphy.gif', // Judge Joody objection face
    sustained: 'https://media.giphy.com/media/WrJ8x0niiblWEoo7hE/giphy.gif', // Stern approval
    overruled: 'https://media.giphy.com/media/l4FGuhL4U2WyjdkaY/giphy.gif', // Dismissive wave
    appeal: 'https://media.giphy.com/media/3oKIPlifLxdigaD2Y8/giphy.gif', // Really? face
    snapJudgment: 'https://media.giphy.com/media/26n6WywJyh39n1pBu/giphy.gif', // Gavel slam
  },
  fair: {
    intro: 'https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif', // Wise nod
    waiting: 'https://media.giphy.com/media/QBd2kLB5qDmysEXre9/giphy.gif', // Patient waiting
    thinking: 'https://media.giphy.com/media/d3mlE7uhX8KFgEmY/giphy.gif', // Thinking deeply
    winner: 'https://media.giphy.com/media/l0MYJnJQ4EiYLxvQ4/giphy.gif', // Approving nod
    loser: 'https://media.giphy.com/media/13d2jHlSlxklVe/giphy.gif', // Disappointed head shake
    objection: 'https://media.giphy.com/media/3o7btT1T9qpQZWhNlK/giphy.gif', // Considering objection
    sustained: 'https://media.giphy.com/media/UI1qLkl9hekmoJlSN4/giphy.gif', // Thoughtful agreement
    overruled: 'https://media.giphy.com/media/3o6ZtpWvwnhf34Oj0A/giphy.gif', // Gentle denial
    appeal: 'https://media.giphy.com/media/CaiVJuZGvR8HK/giphy.gif', // Listening carefully
    snapJudgment: 'https://media.giphy.com/media/3o7TKF1fSIs1R19B8k/giphy.gif', // Decisive moment
  },
  chaos: {
    intro: 'https://media.giphy.com/media/l0MYGb1LuZ3n7dRnO/giphy.gif', // Dramatic gasp
    waiting: 'https://media.giphy.com/media/tyqcJoNjNv0Fq/giphy.gif', // Popcorn eating
    thinking: 'https://media.giphy.com/media/3o7TKTDn976rzVgky4/giphy.gif', // Dramatic thinking
    winner: 'https://media.giphy.com/media/l46CyJmS9KUbokzsI/giphy.gif', // Mind blown celebration
    loser: 'https://media.giphy.com/media/l41YtZOb9EUABnuqA/giphy.gif', // Oh no drama
    objection: 'https://media.giphy.com/media/3o7TKSxdQJIoiRXHl6/giphy.gif', // Dramatic gasp
    sustained: 'https://media.giphy.com/media/l0MYryZTmQgvHI5kA/giphy.gif', // Yes yes yes
    overruled: 'https://media.giphy.com/media/d10dMmzqCYqQ0/giphy.gif', // No way
    appeal: 'https://media.giphy.com/media/l0IylOPCNkiqOgMyA/giphy.gif', // Oh really?
    snapJudgment: 'https://media.giphy.com/media/3o7TKwmnDgQb5jemjK/giphy.gif', // Dramatic decision
  },
  bro: {
    intro: 'https://media.giphy.com/media/l4q8cJzGdR9J8w3hS/giphy.gif', // Chill bro nod
    waiting: 'https://media.giphy.com/media/QMHoU66sBXqqLqYvGO/giphy.gif', // Waiting chill
    thinking: 'https://media.giphy.com/media/a5viI92PAF89q/giphy.gif', // Bro thinking
    winner: 'https://media.giphy.com/media/3oEjHV0z8S7WM4MwnK/giphy.gif', // Fist bump celebration
    loser: 'https://media.giphy.com/media/hEc4k5pN17GZq/giphy.gif', // Disappointed bro
    objection: 'https://media.giphy.com/media/l1J9FiGxR61OcF2mI/giphy.gif', // Whoa bro
    sustained: 'https://media.giphy.com/media/3oEjHYibHwRL7mrNyo/giphy.gif', // Respect nod
    overruled: 'https://media.giphy.com/media/3o7TKwBctlbGwHnsek/giphy.gif', // Nah bro
    appeal: 'https://media.giphy.com/media/6ra84Uso2hoir3YCgb/giphy.gif', // Okay let's hear it
    snapJudgment: 'https://media.giphy.com/media/l0HlvtIPzPdt2usKs/giphy.gif', // That's it bro
  }
};

// Category-specific GIFs for different dispute types
export const CATEGORY_GIFS = {
  roommates: {
    dispute: [
      'https://media.giphy.com/media/l0MYGtCMbPHYVlsf6/giphy.gif', // Roommate drama
      'https://media.giphy.com/media/3o7TKSx0g7RqRniGFG/giphy.gif', // Cleaning argument
      'https://media.giphy.com/media/l378bu6ZYmzS6nBrW/giphy.gif', // Dishes fight
      'https://media.giphy.com/media/cEYFeE4wJ6jdDVBiiIM/giphy.gif', // Passive aggressive
    ],
    winner: [
      'https://media.giphy.com/media/xUPGcJ9uOAL2h5wOf6/giphy.gif', // Finally some peace
      'https://media.giphy.com/media/l3vR16pONsV8cKkWk/giphy.gif', // Victory at home
    ],
    loser: [
      'https://media.giphy.com/media/l2JhtKtDWYNKdRpoA/giphy.gif', // Time to clean
      'https://media.giphy.com/media/NTur7XlVDUdqM/giphy.gif', // Defeated roommate
    ]
  },
  friends: {
    dispute: [
      'https://media.giphy.com/media/3ohzdMDbNXvnWdeOZi/giphy.gif', // Friend drama
      'https://media.giphy.com/media/xUPGcx4qh3aEPkMc1O/giphy.gif', // Betrayal
      'https://media.giphy.com/media/xT0GqssRweIhlz209i/giphy.gif', // Friend argument
      'https://media.giphy.com/media/l4FGni1RBAR2OWsGk/giphy.gif', // Friendship tested
    ],
    winner: [
      'https://media.giphy.com/media/l1ughbsd9qXz2s9SE/giphy.gif', // Best friends win
      'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif', // Friendship prevails
    ],
    loser: [
      'https://media.giphy.com/media/3og0INyCmHlNylks9O/giphy.gif', // Apologizing friend
      'https://media.giphy.com/media/8abAbOrQ9rvLG/giphy.gif', // Sad friendship
    ]
  },
  couples: {
    dispute: [
      'https://media.giphy.com/media/xTiTnzT5sqaArNkI9i/giphy.gif', // Couple argument
      'https://media.giphy.com/media/l4FGrYKtP0pBGpBAY/giphy.gif', // Relationship drama
      'https://media.giphy.com/media/JRhS6WoswF8FxE0g2R/giphy.gif', // Silent treatment
      'https://media.giphy.com/media/xT9DPJVjlYHwWsZRxm/giphy.gif', // Couple fight
    ],
    winner: [
      'https://media.giphy.com/media/l0HlPwMAzh13pcZ20/giphy.gif', // Vindicated partner
      'https://media.giphy.com/media/chzz1FQgqhytWRWbp3/giphy.gif', // Relationship victory
    ],
    loser: [
      'https://media.giphy.com/media/2rtQMJvhzOnRe/giphy.gif', // In the doghouse
      'https://media.giphy.com/media/xT5LMWNFkMa8M0sMaQ/giphy.gif', // Apologizing to partner
    ]
  },
  money: {
    dispute: [
      'https://media.giphy.com/media/67ThRZlYBvibtdF9JH/giphy.gif', // Money argument
      'https://media.giphy.com/media/l0HlNQ03J5JxX6lva/giphy.gif', // Show me the money
      'https://media.giphy.com/media/GjB41rKHBnOkE/giphy.gif', // Money drama
      'https://media.giphy.com/media/l3vRfNA1p0rvhMSvS/giphy.gif', // Payment dispute
    ],
    winner: [
      'https://media.giphy.com/media/MFsqcBSoOKPbjtmvWz/giphy.gif', // Getting paid
      'https://media.giphy.com/media/3o6gDWzmAzrpi5DQU8/giphy.gif', // Money victory
    ],
    loser: [
      'https://media.giphy.com/media/YJjvTqoRFgZaM/giphy.gif', // Paying up
      'https://media.giphy.com/media/l1KVaj5UcbHwrBMqI/giphy.gif', // Empty wallet
    ]
  },
  family: {
    dispute: [
      'https://media.giphy.com/media/l0HlPystfePnAI3G8/giphy.gif', // Family drama
      'https://media.giphy.com/media/xT5LMUnO4g3yiRNuNy/giphy.gif', // Holiday argument
      'https://media.giphy.com/media/3o7TKF5DnsSLv4zVBu/giphy.gif', // Family tension
      'https://media.giphy.com/media/26ybwvTX4DTkwst6U/giphy.gif', // Sibling rivalry
    ],
    winner: [
      'https://media.giphy.com/media/xT9DPr4VjeCgeiLoMo/giphy.gif', // Family victory
      'https://media.giphy.com/media/26BRDvCpnNcMJxoLC/giphy.gif', // I was right
    ],
    loser: [
      'https://media.giphy.com/media/3o7TKxZzyBk4IlS7Is/giphy.gif', // Family defeat
      'https://media.giphy.com/media/l0MYy7QpDDVGVfAAw/giphy.gif', // Apologizing to family
    ]
  },
  work: {
    dispute: [
      'https://media.giphy.com/media/lPF1CyJXXcTZmUrP2J/giphy.gif', // Office drama
      'https://media.giphy.com/media/l4JyOCNEfXvVYEqB2/giphy.gif', // Work argument
      'https://media.giphy.com/media/xT5LMUPL7RWDzANr6o/giphy.gif', // Coworker conflict
      'https://media.giphy.com/media/GfAD7Bl016Gfm/giphy.gif', // Office tension
    ],
    winner: [
      'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif', // Office victory
      'https://media.giphy.com/media/YnBntKOgnUSBkV7bQH/giphy.gif', // Professional win
    ],
    loser: [
      'https://media.giphy.com/media/14ut8PhnIwzros/giphy.gif', // Work defeat
      'https://media.giphy.com/media/l4FGGafcOHmrlQxG0/giphy.gif', // Professional loss
    ]
  }
};

// Situation-specific GIFs for game moments
export const SITUATION_GIFS = {
  // Cross-examination moments
  gotcha: [
    'https://media.giphy.com/media/6ra84Uso2hoir3YCgb/giphy.gif', // Caught in a lie
    'https://media.giphy.com/media/3o7TKnO6Wve6502iJ2/giphy.gif', // Got you
    'https://media.giphy.com/media/l0HlvtIPzPdt2usKs/giphy.gif', // Exposed
    'https://media.giphy.com/media/l46CyJmS9KUbokzsI/giphy.gif', // Mind blown
  ],
  evasive: [
    'https://media.giphy.com/media/sRMPFaVQLGSw8/giphy.gif', // Dodging the question
    'https://media.giphy.com/media/l0MYP6WAFfaR7Wp8Y/giphy.gif', // Not answering
    'https://media.giphy.com/media/3oKIPCwlPndNfosMBa/giphy.gif', // Avoiding
    'https://media.giphy.com/media/3o7ZeQBhbVGnELP4bK/giphy.gif', // Suspicious
  ],
  honest: [
    'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif', // Telling the truth
    'https://media.giphy.com/media/l4JyOCNEfXvVYEqB2/giphy.gif', // Honest moment
    'https://media.giphy.com/media/xT9DPJVjlYHwWsZRxm/giphy.gif', // Sincere
  ],
  contradiction: [
    'https://media.giphy.com/media/l3q2K5jinAlChoCLS/giphy.gif', // Wait what?
    'https://media.giphy.com/media/l41YtZOb9EUABnuqA/giphy.gif', // That doesn't match
    'https://media.giphy.com/media/3o7TKTDn976rzVgky4/giphy.gif', // Contradiction detected
  ],

  // Objection moments
  objectionRaised: [
    'https://media.giphy.com/media/2UvAUplPi4ESnKa3W0/giphy.gif', // Objection!
    'https://media.giphy.com/media/ftdF4ZkueWGHBYc4b5/giphy.gif', // Hold it!
    'https://media.giphy.com/media/3o7TKSxdQJIoiRXHl6/giphy.gif', // Stop right there
  ],

  // Appeal moments
  appealFiled: [
    'https://media.giphy.com/media/l4FGuhL4U2WyjdkaY/giphy.gif', // Trying again
    'https://media.giphy.com/media/3oKIPlifLxdigaD2Y8/giphy.gif', // One more chance
    'https://media.giphy.com/media/l0IylOPCNkiqOgMyA/giphy.gif', // Hear me out
  ],
  appealGranted: [
    'https://media.giphy.com/media/l0MYryZTmQgvHI5kA/giphy.gif', // Reversal!
    'https://media.giphy.com/media/26u4cqiYI30juCOGY/giphy.gif', // Comeback
    'https://media.giphy.com/media/l0MYJnJQ4EiYLxvQ4/giphy.gif', // Victory from defeat
  ],
  appealDenied: [
    'https://media.giphy.com/media/13d2jHlSlxklVe/giphy.gif', // Nice try
    'https://media.giphy.com/media/d10dMmzqCYqQ0/giphy.gif', // Nope
    'https://media.giphy.com/media/hEc4k5pN17GZq/giphy.gif', // Denied
  ],

  // Verdict moments
  deliberating: [
    'https://media.giphy.com/media/d3mlE7uhX8KFgEmY/giphy.gif', // Deep thought
    'https://media.giphy.com/media/a5viI92PAF89q/giphy.gif', // Considering
    'https://media.giphy.com/media/3o7TKTDn976rzVgky4/giphy.gif', // Dramatic pause
  ],
  verdictReady: [
    'https://media.giphy.com/media/26n6WywJyh39n1pBu/giphy.gif', // Gavel time
    'https://media.giphy.com/media/3o7TKF1fSIs1R19B8k/giphy.gif', // Decision made
    'https://media.giphy.com/media/l0HlvtIPzPdt2usKs/giphy.gif', // Here it comes
  ],

  // Dramatic moments
  dramatic: [
    'https://media.giphy.com/media/l0MYGb1LuZ3n7dRnO/giphy.gif', // Gasp
    'https://media.giphy.com/media/3o7TKwmnDgQb5jemjK/giphy.gif', // Drama
    'https://media.giphy.com/media/l46CyJmS9KUbokzsI/giphy.gif', // Shock
    'https://media.giphy.com/media/tyqcJoNjNv0Fq/giphy.gif', // Popcorn moment
  ],
  celebration: [
    'https://media.giphy.com/media/3oEjHV0z8S7WM4MwnK/giphy.gif', // Fist bump
    'https://media.giphy.com/media/l0MYJnJQ4EiYLxvQ4/giphy.gif', // Victory
    'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif', // Celebrate
    'https://media.giphy.com/media/xUPGcJ9uOAL2h5wOf6/giphy.gif', // Winner dance
  ],
  defeat: [
    'https://media.giphy.com/media/hEc4k5pN17GZq/giphy.gif', // Sad
    'https://media.giphy.com/media/13d2jHlSlxklVe/giphy.gif', // Disappointed
    'https://media.giphy.com/media/NTur7XlVDUdqM/giphy.gif', // Defeated
    'https://media.giphy.com/media/2rtQMJvhzOnRe/giphy.gif', // Loss
  ]
};

// Helper function to get a random GIF from an array
export const getRandomGif = (gifs: string[]): string => {
  return gifs[Math.floor(Math.random() * gifs.length)];
};

// Helper function to get category-specific GIF
export const getCategoryGif = (category: string, type: 'dispute' | 'winner' | 'loser'): string => {
  const categoryGifs = CATEGORY_GIFS[category as keyof typeof CATEGORY_GIFS];
  if (categoryGifs && categoryGifs[type]) {
    return getRandomGif(categoryGifs[type]);
  }
  // Fallback to a general dramatic GIF
  return getRandomGif(SITUATION_GIFS.dramatic);
};

// Helper function to get situation-specific GIF
export const getSituationGif = (situation: keyof typeof SITUATION_GIFS): string => {
  return getRandomGif(SITUATION_GIFS[situation]);
};

// Judge Personalities
export const JUDGE_PERSONALITIES = {
  joody: {
    name: "Judge Joody",
    tagline: "Sharp-tongued and no-nonsense",
    style: "You are Judge Joody - sharp, witty, and you don't suffer fools. You cut through BS immediately, use devastating one-liners, and show visible frustration at stupidity. You interrupt when you've heard enough. Your humor is biting. You say things like 'BALONEY!', 'Don't pee on my leg and tell me it's raining', and 'I'm speaking!'",
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
