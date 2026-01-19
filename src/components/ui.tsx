'use client';

import React from 'react';
import { getCredibilityLabel, getCredibilityColor, OBJECTION_TYPES, JUDGE_GIFS, SITUATION_GIFS, getSituationGif } from '@/lib/constants';

// TV Frame Wrapper Component
export function TVFrame({ children, showLive = true }: { children: React.ReactNode; showLive?: boolean }) {
  return (
    <div className="tv-screen p-6 relative z-0">
      {showLive && (
        <div className="absolute top-3 right-3 z-20">
          <span className="live-badge">LIVE</span>
        </div>
      )}
      <div className="relative z-0">
        {children}
      </div>
    </div>
  );
}

// Channel Bug Component
export function ChannelBug({ text = "COURT TV" }: { text?: string }) {
  return (
    <div className="absolute bottom-3 right-3 channel-bug z-20">
      {text}
    </div>
  );
}

// Progress Indicator Component - TV Chyron Style
export function ProgressIndicator({ currentPhase }: { currentPhase: 'statements' | 'crossExam' | 'verdict' }) {
  const steps = [
    { id: 'statements', label: 'OPENING', icon: '📝' },
    { id: 'crossExam', label: 'CROSS-EXAM', icon: '⚖️' },
    { id: 'verdict', label: 'VERDICT', icon: '🔨' }
  ];

  const currentIndex = steps.findIndex(s => s.id === currentPhase);

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
export function StakesBadge({ stakes }: { stakes: string }) {
  if (!stakes) return null;
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

// Credibility Bar Component - TV Score Display
export function CredibilityBar({
  partyA,
  partyB,
  credibilityA,
  credibilityB,
  history = []
}: {
  partyA: string;
  partyB: string;
  credibilityA: number;
  credibilityB: number;
  history?: any[];
}) {
  const lastA = history.filter(h => h.party === 'A').slice(-1)[0];
  const lastB = history.filter(h => h.party === 'B').slice(-1)[0];

  const getBarColor = (score: number) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-600';
  };

  const getLabel = (score: number) => {
    if (score >= 80) return 'VERY CREDIBLE';
    if (score >= 60) return 'CREDIBLE';
    if (score >= 40) return 'QUESTIONABLE';
    if (score >= 20) return 'LOW';
    return 'NOT CREDIBLE';
  };

  return (
    <div className="tv-card p-4 mb-6">
      <div className="text-center mb-4">
        <span className="text-xs font-bold tracking-widest text-yellow-500 uppercase">Credibility Meter</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Party A */}
        <div className="text-center">
          <div className="lower-third lower-third-blue mb-3 py-2 pl-5">
            <div className="text-black font-bold text-sm truncate">{partyA}</div>
          </div>
          <div className="tv-stat-box">
            <div className="tv-stat-value">{credibilityA}%</div>
            <div className="text-xs text-gray-400 font-bold">{getLabel(credibilityA)}</div>
            {lastA && (
              <div className={`text-sm font-bold mt-1 ${lastA.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {lastA.change >= 0 ? '+' : ''}{lastA.change}
              </div>
            )}
          </div>
          <div className="h-3 bg-gray-900 mt-2 border border-gray-700">
            <div
              className={`h-full ${getBarColor(credibilityA)} transition-all duration-500`}
              style={{ width: `${credibilityA}%` }}
            />
          </div>
          {lastA?.flagged && (
            <div className="text-red-400 text-xs mt-2 font-bold">⚠️ {lastA.flagged}</div>
          )}
        </div>

        {/* Party B */}
        <div className="text-center">
          <div className="lower-third lower-third-red mb-3 py-2 pl-5">
            <div className="text-black font-bold text-sm truncate">{partyB}</div>
          </div>
          <div className="tv-stat-box">
            <div className="tv-stat-value">{credibilityB}%</div>
            <div className="text-xs text-gray-400 font-bold">{getLabel(credibilityB)}</div>
            {lastB && (
              <div className={`text-sm font-bold mt-1 ${lastB.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {lastB.change >= 0 ? '+' : ''}{lastB.change}
              </div>
            )}
          </div>
          <div className="h-3 bg-gray-900 mt-2 border border-gray-700">
            <div
              className={`h-full ${getBarColor(credibilityB)} transition-all duration-500`}
              style={{ width: `${credibilityB}%` }}
            />
          </div>
          {lastB?.flagged && (
            <div className="text-red-400 text-xs mt-2 font-bold">⚠️ {lastB.flagged}</div>
          )}
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
  judgeId = 'judy'
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
  const judgeGifs = JUDGE_GIFS[judgeId as keyof typeof JUDGE_GIFS] || JUDGE_GIFS.judy;
  const gifUrl = ruling.sustained ? judgeGifs.sustained : judgeGifs.overruled;

  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50">
      <div className="tv-screen p-8 max-w-md w-full text-center">
        {/* Judge reaction GIF */}
        <div className="w-28 h-28 mx-auto rounded-lg overflow-hidden border-4 border-yellow-600 mb-4">
          <img
            src={gifUrl}
            alt="Judge's reaction"
            className="w-full h-full object-cover"
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
  judgeId = 'judy'
}: {
  judgment: {
    winner: string;
    reason: string;
  };
  onContinue: () => void;
  judgeId?: string;
}) {
  const judgeGifs = JUDGE_GIFS[judgeId as keyof typeof JUDGE_GIFS] || JUDGE_GIFS.judy;

  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50">
      <div className="tv-screen p-8 max-w-md w-full text-center">
        <div className="breaking-banner text-xl mb-4">🚨 BREAKING 🚨</div>
        {/* Judge snap judgment GIF */}
        <div className="w-32 h-32 mx-auto rounded-lg overflow-hidden border-4 border-red-500 mb-4">
          <img
            src={judgeGifs.snapJudgment}
            alt="Judge's snap judgment"
            className="w-full h-full object-cover"
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

// Round Indicator - Sports Style
export function RoundIndicator({ round, totalRounds }: { round: number; totalRounds: number }) {
  return (
    <div className="tv-stat-box inline-block px-4 py-2">
      <div className="text-xs text-gray-400 font-bold tracking-widest">ROUND</div>
      <div className="text-yellow-500 font-black text-2xl">{round} <span className="text-gray-500 text-lg">OF {totalRounds}</span></div>
    </div>
  );
}
