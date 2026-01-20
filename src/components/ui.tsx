'use client';

import React from 'react';
import { getCredibilityLabel, getCredibilityColor, OBJECTION_TYPES, JUDGE_GIFS, SITUATION_GIFS, getSituationGif } from '@/lib/constants';

// TV Frame Wrapper Component
export function TVFrame({ children, showLive = true }: { children: React.ReactNode; showLive?: boolean }) {
  return (
    <div className="relative">
      {/* TV Antennas */}
      <div className="flex justify-center gap-8 -mb-1">
        <div className="w-1 h-10 bg-gray-600 rounded-full transform -rotate-12 origin-bottom" />
        <div className="w-1 h-10 bg-gray-600 rounded-full transform rotate-12 origin-bottom" />
      </div>
      <div className="tv-screen p-6 relative z-0">
        {/* Channel Bug - Top Left */}
        <div className="absolute top-3 left-3 channel-bug z-20 text-xs">
          COURT TV
        </div>
        {showLive && (
          <div className="absolute top-3 right-3 z-20">
            <span className="live-badge">LIVE</span>
          </div>
        )}
        <div className="relative z-0 pt-4">
          {children}
        </div>
      </div>
    </div>
  );
}

// Channel Bug Component (legacy - now built into TVFrame)
export function ChannelBug({ text = "COURT TV" }: { text?: string }) {
  // Now integrated into TVFrame, this is a no-op for backwards compatibility
  return null;
}

// Progress Indicator Component - TV Chyron Style
export function ProgressIndicator({ currentPhase, compact = false }: { currentPhase: 'statements' | 'crossExam' | 'verdict'; compact?: boolean }) {
  const steps = [
    { id: 'statements', label: 'OPENING', icon: '📝' },
    { id: 'crossExam', label: 'CROSS-EXAM', icon: '⚖️' },
    { id: 'verdict', label: 'VERDICT', icon: '🔨' }
  ];

  const currentIndex = steps.findIndex(s => s.id === currentPhase);

  if (compact) {
    // Compact version - just shows current phase as a small badge
    return (
      <div className="flex items-center justify-center gap-1 mb-2">
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <React.Fragment key={step.id}>
              <div className={`flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition-all ${
                isCurrent
                  ? 'tv-gradient-gold text-black border border-yellow-300'
                  : isCompleted
                    ? 'bg-green-800/50 text-green-300 border border-green-700'
                    : 'bg-gray-800/50 text-gray-600 border border-gray-700'
              }`}>
                <span className="text-xs">{isCompleted ? '✓' : step.icon}</span>
                {isCurrent && <span>{step.label}</span>}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-3 h-0.5 ${index < currentIndex ? 'bg-green-600' : 'bg-gray-700'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-1 mb-6">
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <React.Fragment key={step.id}>
            <div className={`flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase tracking-wider transition-all ${
              isCurrent
                ? 'tv-gradient-gold text-black border-2 border-yellow-300'
                : isCompleted
                  ? 'bg-green-800 text-green-200 border-2 border-green-600'
                  : 'bg-gray-800 text-gray-500 border-2 border-gray-700'
            }`}>
              <span className="text-lg">{isCompleted ? '✓' : step.icon}</span>
              <span>{step.label}</span>
            </div>
            {index < steps.length - 1 && (
              <div className={`w-6 h-1 ${index < currentIndex ? 'bg-green-500' : 'bg-gray-700'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// Stakes Badge Component - TV Lower Third Style
export function StakesBadge({ stakes, compact = false }: { stakes: string; compact?: boolean }) {
  if (!stakes) return null;

  if (compact) {
    // Compact inline version
    return (
      <div className="flex items-center justify-center gap-2 mb-2 py-1 px-3 bg-yellow-900/30 border border-yellow-700/50 rounded text-xs">
        <span>🏆</span>
        <span className="text-yellow-500 font-bold">{stakes}</span>
      </div>
    );
  }

  return (
    <div className="lower-third mb-6 pl-6">
      <div className="flex items-center gap-3">
        <span className="text-2xl">🏆</span>
        <div>
          <div className="text-xs font-bold text-yellow-900 uppercase tracking-wider">What&apos;s At Stake</div>
          <div className="text-black font-bold text-lg">{stakes}</div>
        </div>
      </div>
    </div>
  );
}

// Credibility Bar Component - Tekken Style Health Bars
export function CredibilityBar({
  partyA,
  partyB,
  credibilityA,
  credibilityB,
  history = [],
  compact = false
}: {
  partyA: string;
  partyB: string;
  credibilityA: number;
  credibilityB: number;
  history?: any[];
  compact?: boolean;
}) {
  const lastA = history.filter(h => h.party === 'A').slice(-1)[0];
  const lastB = history.filter(h => h.party === 'B').slice(-1)[0];

  if (compact) {
    // Compact Tekken-style version
    return (
      <div className="mb-2">
        <div className="flex items-center gap-1">
          {/* Party A - Left side */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[9px] font-black text-cyan-400 uppercase tracking-wide truncate">{partyA}</span>
              <span className="text-[9px] font-bold text-white">{credibilityA}%</span>
            </div>
            <div className="h-2 bg-gray-900 rounded-sm overflow-hidden border border-gray-600 relative">
              <div
                className="absolute inset-y-0 right-0 bg-gradient-to-l from-orange-500 via-yellow-400 to-yellow-300 transition-all duration-500"
                style={{ width: `${credibilityA}%` }}
              />
            </div>
          </div>

          {/* VS divider */}
          <div className="px-1">
            <span className="text-[8px] font-black text-yellow-500">⚔</span>
          </div>

          {/* Party B - Right side */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[9px] font-bold text-white">{credibilityB}%</span>
              <span className="text-[9px] font-black text-red-400 uppercase tracking-wide truncate">{partyB}</span>
            </div>
            <div className="h-2 bg-gray-900 rounded-sm overflow-hidden border border-gray-600 relative">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-500 via-yellow-400 to-yellow-300 transition-all duration-500"
                style={{ width: `${credibilityB}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4 px-2">
      {/* Tekken-style health bar layout */}
      <div className="flex items-start gap-2">
        {/* Party A - Left side (bar depletes from right) */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-black text-cyan-400 uppercase tracking-wider truncate max-w-[80px]">{partyA}</span>
            <div className="flex items-center gap-1">
              {lastA && (
                <span className={`text-[10px] font-bold ${lastA.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {lastA.change >= 0 ? '+' : ''}{lastA.change}
                </span>
              )}
              <span className="text-sm font-black text-white">{credibilityA}%</span>
            </div>
          </div>
          {/* Health bar - depletes from right to left */}
          <div className="h-5 bg-gray-900 rounded-sm overflow-hidden border-2 border-gray-600 relative"
               style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)' }}>
            {/* Background damage indicator */}
            <div className="absolute inset-0 bg-red-900/50" />
            {/* Actual health */}
            <div
              className="absolute inset-y-0 right-0 bg-gradient-to-l from-orange-500 via-yellow-400 to-yellow-200 transition-all duration-500"
              style={{ width: `${credibilityA}%` }}
            >
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-black/20" />
              {/* Segment lines */}
              <div className="absolute inset-0 flex">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="flex-1 border-r border-black/20 last:border-0" />
                ))}
              </div>
            </div>
          </div>
          <div className="text-[8px] text-gray-500 mt-0.5 uppercase tracking-widest">Credibility</div>
        </div>

        {/* Center VS badge */}
        <div className="flex flex-col items-center justify-center pt-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-b from-yellow-500 to-orange-600 flex items-center justify-center border-2 border-yellow-300 shadow-lg">
            <span className="text-xs font-black text-black">VS</span>
          </div>
        </div>

        {/* Party B - Right side (bar depletes from left) */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1">
              <span className="text-sm font-black text-white">{credibilityB}%</span>
              {lastB && (
                <span className={`text-[10px] font-bold ${lastB.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {lastB.change >= 0 ? '+' : ''}{lastB.change}
                </span>
              )}
            </div>
            <span className="text-xs font-black text-red-400 uppercase tracking-wider truncate max-w-[80px]">{partyB}</span>
          </div>
          {/* Health bar - depletes from left to right */}
          <div className="h-5 bg-gray-900 rounded-sm overflow-hidden border-2 border-gray-600 relative"
               style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)' }}>
            {/* Background damage indicator */}
            <div className="absolute inset-0 bg-red-900/50" />
            {/* Actual health */}
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-500 via-yellow-400 to-yellow-200 transition-all duration-500"
              style={{ width: `${credibilityB}%` }}
            >
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-black/20" />
              {/* Segment lines */}
              <div className="absolute inset-0 flex">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="flex-1 border-r border-black/20 last:border-0" />
                ))}
              </div>
            </div>
          </div>
          <div className="text-[8px] text-gray-500 mt-0.5 uppercase tracking-widest text-right">Credibility</div>
        </div>
      </div>
    </div>
  );
}

// Transcript Component - TV Teleprompter Style
export function Transcript({
  caseData,
  responses,
  objections,
  isOpen,
  onToggle
}: {
  caseData: any;
  responses: any[];
  objections: any[];
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="mt-6">
      <button
        onClick={onToggle}
        className="w-full text-left text-yellow-500 hover:text-yellow-300 text-sm flex items-center gap-2 font-bold uppercase tracking-wider"
      >
        <span>{isOpen ? '▼' : '▶'}</span>
        <span>📜 Case Transcript ({responses.length} responses)</span>
      </button>

      {isOpen && (
        <div className="mt-3 tv-card p-4 max-h-64 overflow-y-auto">
          {/* Opening Statements */}
          <div className="mb-4">
            <div className="text-yellow-500 text-xs font-bold tracking-widest mb-2">OPENING STATEMENTS</div>
            <div className="text-sm mb-3 pl-3 border-l-4 border-blue-600">
              <span className="text-blue-400 font-bold">{caseData.partyA}:</span>
              <span className="text-gray-300 ml-2">&quot;{caseData.statementA}&quot;</span>
            </div>
            <div className="text-sm pl-3 border-l-4 border-red-600">
              <span className="text-red-400 font-bold">{caseData.partyB}:</span>
              <span className="text-gray-300 ml-2">&quot;{caseData.statementB}&quot;</span>
            </div>
          </div>

          {/* Responses */}
          {responses.map((r, i) => (
            <div key={i} className="mb-3 pb-3 border-b border-gray-700 last:border-0">
              <div className="text-yellow-500 text-xs mb-1 font-bold">Q: {r.question}</div>
              <div className={`text-sm pl-3 border-l-4 ${r.party === 'A' ? 'border-blue-600' : 'border-red-600'}`}>
                <span className={`font-bold ${r.party === 'A' ? 'text-blue-400' : 'text-red-400'}`}>
                  {r.party === 'A' ? caseData.partyA : caseData.partyB}:
                </span>
                <span className="text-gray-300 ml-2">&quot;{r.answer}&quot;</span>
              </div>
            </div>
          ))}

          {responses.length === 0 && (
            <div className="text-gray-500 text-sm italic">No testimony yet.</div>
          )}
        </div>
      )}
    </div>
  );
}

// Objection Modal Component - Breaking News Style
export function ObjectionModal({
  isOpen,
  onClose,
  onSubmit,
  objectorName,
  targetName,
  isQuestionObjection = false,
  objectionTarget
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { type: string; reason: string; isQuestionObjection: boolean }) => void;
  objectorName: string;
  targetName: string;
  isQuestionObjection?: boolean;
  objectionTarget?: string;
}) {
  const [selectedType, setSelectedType] = React.useState('');
  const [reason, setReason] = React.useState('');

  if (!isOpen) return null;

  const availableTypes = OBJECTION_TYPES.filter(t =>
    isQuestionObjection ? t.forJudge : !t.forJudge || t.id === 'relevance'
  );

  const handleSubmit = () => {
    if (selectedType) {
      onSubmit({ type: selectedType, reason, isQuestionObjection });
      setSelectedType('');
      setReason('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
      <div className="tv-screen p-6 max-w-md w-full">
        <div className="breaking-banner text-center text-2xl mb-4">⚠️ OBJECTION!</div>
        <div className="text-gray-300 text-sm mb-4 text-center">
          <span className="text-yellow-500 font-bold">{objectorName}</span> objects to {isQuestionObjection ? "the judge's question" : `${targetName}'s statement`}
        </div>

        {objectionTarget && (
          <div className="tv-card p-3 mb-4 text-sm text-gray-300 italic">
            &quot;{objectionTarget}&quot;
          </div>
        )}

        <div className="mb-4">
          <div className="text-yellow-500 text-xs font-bold tracking-widest mb-2">GROUNDS FOR OBJECTION:</div>
          <div className="space-y-2">
            {availableTypes.map(type => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`w-full text-left p-3 border-2 transition-all ${
                  selectedType === type.id
                    ? 'tv-gradient-red border-red-400 text-white'
                    : 'tv-card border-gray-600 text-gray-300 hover:border-gray-500'
                }`}
              >
                <div className="font-bold uppercase">{type.label}</div>
                <div className="text-xs text-gray-400">{type.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Brief reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full tv-input text-sm text-white"
            style={{ color: 'white' }}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 tv-button bg-gray-700 border-gray-600 text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedType}
            className="flex-1 tv-button tv-button-red disabled:opacity-50"
          >
            OBJECT!
          </button>
        </div>
      </div>
    </div>
  );
}

// Thinking Emoji Component
export function ThinkingEmoji({ emoji }: { emoji: string }) {
  return (
    <span className="inline-block animate-bounce text-4xl">{emoji}</span>
  );
}

// Objection Ruling Display - Dramatic TV Reveal
export function ObjectionRuling({
  ruling,
  onContinue,
  judgeId = 'joody'
}: {
  ruling: {
    sustained: boolean;
    reason: string;
    objector: string;
    type: string;
  };
  onContinue: () => void;
  judgeId?: string;
}) {
  const judgeGifs = JUDGE_GIFS[judgeId as keyof typeof JUDGE_GIFS] || JUDGE_GIFS.joody;
  const gifUrl = ruling.sustained ? judgeGifs.sustained : judgeGifs.overruled;

  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50">
      <div className="tv-screen p-8 max-w-md w-full text-center">
        {/* Judge reaction GIF */}
        <div className="w-28 h-28 mx-auto rounded-lg overflow-hidden border-4 border-yellow-600 mb-4">
          <img
            src={gifUrl}
            alt="Judge's reaction"
            className="w-full h-full object-contain"
          />
        </div>
        <div className={`text-4xl font-black mb-4 tracking-wider ${ruling.sustained ? 'text-green-400' : 'text-red-500'}`}
             style={{ textShadow: ruling.sustained ? '0 0 20px rgba(74,222,128,0.5)' : '0 0 20px rgba(239,68,68,0.5)' }}>
          {ruling.sustained ? 'SUSTAINED!' : 'OVERRULED!'}
        </div>
        <div className="tv-card p-4 mb-4">
          <div className="text-gray-300">{ruling.reason}</div>
        </div>
        {ruling.sustained && (
          <div className="text-red-400 text-sm mb-4 font-bold">
            ⚠️ -10 CREDIBILITY PENALTY
          </div>
        )}
        <button
          onClick={onContinue}
          className="tv-button text-lg px-8"
        >
          CONTINUE →
        </button>
      </div>
    </div>
  );
}

// Snap Judgment Display - Maximum Drama
export function SnapJudgmentDisplay({
  judgment,
  onContinue,
  judgeId = 'joody'
}: {
  judgment: {
    winner: string;
    reason: string;
  };
  onContinue: () => void;
  judgeId?: string;
}) {
  const judgeGifs = JUDGE_GIFS[judgeId as keyof typeof JUDGE_GIFS] || JUDGE_GIFS.joody;

  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50">
      <div className="tv-screen p-8 max-w-md w-full text-center">
        <div className="breaking-banner text-xl mb-4">🚨 BREAKING 🚨</div>
        {/* Judge snap judgment GIF */}
        <div className="w-32 h-32 mx-auto rounded-lg overflow-hidden border-4 border-red-500 mb-4">
          <img
            src={judgeGifs.snapJudgment}
            alt="Judge's snap judgment"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="text-red-500 text-3xl font-black mb-2 tracking-wider"
             style={{ textShadow: '0 0 20px rgba(239,68,68,0.5)' }}>
          SNAP JUDGMENT!
        </div>
        <div className="text-yellow-500 text-lg mb-4 font-bold">The judge has seen enough!</div>
        <div className="tv-gradient-gold p-4 mb-4 winner-glow">
          <div className="text-black text-2xl font-black">{judgment.winner} WINS! 🏆</div>
        </div>
        <div className="tv-card p-4 mb-6">
          <div className="text-gray-300 italic">&quot;{judgment.reason}&quot;</div>
        </div>
        <button
          onClick={onContinue}
          className="tv-button text-lg px-8"
        >
          SEE FULL VERDICT →
        </button>
      </div>
    </div>
  );
}

// Loading Overlay - TV Please Stand By
export function LoadingOverlay({
  emoji,
  message
}: {
  emoji: string;
  message: string;
}) {
  return (
    <div className="tv-card p-8 text-center">
      <ThinkingEmoji emoji={emoji} />
      <div className="text-yellow-500 mt-4 font-bold uppercase tracking-wider">{message}</div>
      <div className="flex justify-center gap-1 mt-3">
        <span className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
        <span className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
        <span className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
      </div>
    </div>
  );
}

// Party Name Plate - Lower Third Style
export function PartyNamePlate({
  name,
  party,
  status
}: {
  name: string;
  party: 'A' | 'B';
  status: 'active' | 'done' | 'waiting';
}) {
  const isBlue = party === 'A';

  return (
    <div className={`lower-third ${isBlue ? 'lower-third-blue' : 'lower-third-red'} pl-5`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-black font-bold">{name}</div>
          <div className="text-xs text-yellow-900 uppercase tracking-wider">
            {status === 'active' ? '🎤 ON THE STAND' : status === 'done' ? '✓ TESTIMONY COMPLETE' : 'WAITING'}
          </div>
        </div>
        {status === 'active' && (
          <span className="on-air-badge text-xs">ON AIR</span>
        )}
      </div>
    </div>
  );
}

// Round purposes for display
const ROUND_NAMES: { [key: number]: { name: string; goal: string } } = {
  1: { name: 'Clarification', goal: 'Defining claims & assumptions' },
  2: { name: 'Justification', goal: 'Testing evidence & reasoning' },
  3: { name: 'Stress Test', goal: 'Exposing weaknesses & tradeoffs' }
};

// Round Indicator - Sports Style with Purpose
export function RoundIndicator({ round, totalRounds }: { round: number; totalRounds: number }) {
  const roundInfo = ROUND_NAMES[round] || { name: 'Cross-Exam', goal: '' };

  return (
    <div className="tv-stat-box inline-block px-4 py-2">
      <div className="text-xs text-gray-400 font-bold tracking-widest">ROUND {round} OF {totalRounds}</div>
      <div className="text-yellow-500 font-black text-lg">{roundInfo.name}</div>
      {roundInfo.goal && (
        <div className="text-[10px] text-gray-500 mt-0.5">{roundInfo.goal}</div>
      )}
    </div>
  );
}

// Typewriter Text Component - Types out text word by word rapidly
export function TypewriterText({
  text,
  className = '',
  onComplete
}: {
  text: string;
  className?: string;
  onComplete?: () => void;
}) {
  const [displayedWords, setDisplayedWords] = React.useState<string[]>([]);
  const [isComplete, setIsComplete] = React.useState(false);
  const words = React.useMemo(() => text.split(' '), [text]);

  // Fast typing - 50ms per word
  const msPerWord = 50;

  React.useEffect(() => {
    // Reset when text changes
    setDisplayedWords([]);
    setIsComplete(false);

    if (!text) return;

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < words.length) {
        setDisplayedWords(prev => [...prev, words[currentIndex]]);
        currentIndex++;
      } else {
        clearInterval(interval);
        setIsComplete(true);
        onComplete?.();
      }
    }, msPerWord);

    return () => clearInterval(interval);
  }, [text, words, onComplete]);

  return (
    <span className={className}>
      {displayedWords.join(' ')}
      {!isComplete && <span className="animate-pulse">▊</span>}
    </span>
  );
}
