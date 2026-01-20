'use client';

import React from 'react';
import { getCredibilityLabel, getCredibilityColor, OBJECTION_TYPES, JUDGE_GIFS, SITUATION_GIFS, getSituationGif } from '@/lib/constants';

// TV Frame Wrapper Component - Pixel Art Style
export function TVFrame({ children, showLive = true }: { children: React.ReactNode; showLive?: boolean }) {
  return (
    <div className="relative">
      {/* Pixel TV Antennas */}
      <div className="flex justify-center gap-8 -mb-1">
        <div className="w-2 h-10 bg-[#4a4a4a] transform -rotate-12 origin-bottom" />
        <div className="w-2 h-10 bg-[#4a4a4a] transform rotate-12 origin-bottom" />
      </div>
      <div className="pixel-tv-frame p-2">
        <div className="pixel-screen p-4 md:p-6 relative">
          {/* Channel Bug - Top Left - Pixel Style */}
          <div className="absolute top-2 left-2 pixel-badge pixel-badge-gold z-20">
            COURT TV
          </div>
          {showLive && (
            <div className="absolute top-2 right-2 z-20">
              <span className="pixel-badge pixel-badge-live">LIVE</span>
            </div>
          )}
          <div className="relative z-0 pt-6">
            {children}
          </div>
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

// Progress Indicator Component - Pixel Art Style
export function ProgressIndicator({ currentPhase, compact = false }: { currentPhase: 'statements' | 'crossExam' | 'verdict'; compact?: boolean }) {
  const steps = [
    { id: 'statements', label: 'OPENING', icon: '📝' },
    { id: 'crossExam', label: 'CROSS-EXAM', icon: '⚖️' },
    { id: 'verdict', label: 'VERDICT', icon: '🔨' }
  ];

  const currentIndex = steps.findIndex(s => s.id === currentPhase);

  if (compact) {
    // Compact pixel version
    return (
      <div className="flex items-center justify-center gap-1 mb-2">
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <React.Fragment key={step.id}>
              <div className={`flex items-center gap-1 px-2 py-1 transition-all ${
                isCurrent
                  ? 'pixel-badge pixel-badge-gold'
                  : isCompleted
                    ? 'pixel-badge bg-[#228b22] border-[#165016] text-white'
                    : 'pixel-badge bg-[#2a2a2a] border-[#4a4a4a] text-gray-600'
              }`}>
                <span className="text-xs">{isCompleted ? '✓' : step.icon}</span>
                {isCurrent && <span>{step.label}</span>}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-3 h-1 ${index < currentIndex ? 'bg-[#228b22]' : 'bg-[#4a4a4a]'}`} />
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
            <div className={`flex items-center gap-2 px-3 py-2 border-4 transition-all ${
              isCurrent
                ? 'bg-[#daa520] border-[#8b6914] text-[#3d2314] pixel-text text-[10px]'
                : isCompleted
                  ? 'bg-[#228b22] border-[#165016] text-white pixel-text text-[10px]'
                  : 'bg-[#2a2a2a] border-[#4a4a4a] text-gray-500 pixel-text text-[10px]'
            }`}>
              <span className="text-sm">{isCompleted ? '✓' : step.icon}</span>
              <span>{step.label}</span>
            </div>
            {index < steps.length - 1 && (
              <div className={`w-4 h-1 ${index < currentIndex ? 'bg-[#228b22]' : 'bg-[#4a4a4a]'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// Stakes Badge Component - Pixel Art Style
export function StakesBadge({ stakes, compact = false }: { stakes: string; compact?: boolean }) {
  if (!stakes) return null;

  if (compact) {
    // Compact pixel version
    return (
      <div className="flex items-center justify-center gap-2 mb-2 py-1 px-3 bg-[#8b6914]/30 border-2 border-[#daa520] text-xs">
        <span>🏆</span>
        <span className="pixel-text-sm text-[#daa520]">{stakes}</span>
      </div>
    );
  }

  return (
    <div className="pixel-card mb-4 p-3 border-l-8 border-l-[#daa520]">
      <div className="flex items-center gap-3">
        <span className="text-2xl">🏆</span>
        <div>
          <div className="pixel-text-sm text-[#daa520]">STAKES</div>
          <div className="pixel-text text-sm text-white mt-1">{stakes}</div>
        </div>
      </div>
    </div>
  );
}

// Combined Credibility & Turn Indicator - Pixel Art Style
export function CredibilityBar({
  partyA,
  partyB,
  credibilityA,
  credibilityB,
  history = [],
  compact = false,
  activeParty
}: {
  partyA: string;
  partyB: string;
  credibilityA: number;
  credibilityB: number;
  history?: any[];
  compact?: boolean;
  activeParty?: 'A' | 'B' | null;
}) {
  const lastA = history.filter(h => h.party === 'A').slice(-1)[0];
  const lastB = history.filter(h => h.party === 'B').slice(-1)[0];
  const isAActive = activeParty === 'A';
  const isBActive = activeParty === 'B';

  // Calculate filled segments (10 segments = 100%)
  const segmentsA = Math.ceil(credibilityA / 10);
  const segmentsB = Math.ceil(credibilityB / 10);

  // Pixel Health Bar Segments Component
  const PixelHealthBar = ({ segments, party, reverse = false }: { segments: number; party: 'A' | 'B'; reverse?: boolean }) => {
    const segmentArray = [...Array(10)].map((_, i) => {
      const segmentIndex = reverse ? 9 - i : i;
      const isFilled = segmentIndex < segments;
      return (
        <div
          key={i}
          className={`flex-1 h-full border-r-2 border-[#1a1a1a] last:border-0 transition-colors ${
            isFilled
              ? party === 'A' ? 'bg-[#4a7ab0]' : 'bg-[#b22222]'
              : 'bg-[#2a2a2a]'
          }`}
        />
      );
    });
    return <>{segmentArray}</>;
  };

  if (compact) {
    // Compact pixel version
    return (
      <div className="mb-2 pixel-card p-2">
        <div className="flex items-center gap-2">
          {/* Party A - Left side */}
          <div className={`flex-1 p-1.5 ${isAActive ? 'bg-[#1e3a5f]/50 border-2 border-[#4a7ab0]' : ''}`}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1">
                {isAActive && <span className="pixel-badge pixel-badge-live text-[6px]">ON AIR</span>}
                <span className={`pixel-text-sm truncate ${isAActive ? 'text-[#4a7ab0]' : 'text-gray-500'}`}>{partyA}</span>
              </div>
              <span className="pixel-text-sm text-white">{credibilityA}%</span>
            </div>
            <div className="pixel-health-bar h-3">
              <PixelHealthBar segments={segmentsA} party="A" />
            </div>
          </div>

          {/* VS divider - Pixel style */}
          <div className="pixel-vs text-[8px] px-2 py-1 flex-shrink-0">VS</div>

          {/* Party B - Right side */}
          <div className={`flex-1 p-1.5 ${isBActive ? 'bg-[#8b0000]/30 border-2 border-[#b22222]' : ''}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="pixel-text-sm text-white">{credibilityB}%</span>
              <div className="flex items-center gap-1">
                <span className={`pixel-text-sm truncate ${isBActive ? 'text-[#b22222]' : 'text-gray-500'}`}>{partyB}</span>
                {isBActive && <span className="pixel-badge pixel-badge-live text-[6px]">ON AIR</span>}
              </div>
            </div>
            <div className="pixel-health-bar h-3">
              <PixelHealthBar segments={segmentsB} party="B" reverse />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      {/* Combined Turn + Credibility Panel - Pixel Style */}
      <div className="pixel-card p-3">
        <div className="flex items-stretch gap-3">
          {/* Party A - Left side */}
          <div className={`flex-1 p-2 transition-all ${isAActive ? 'bg-[#1e3a5f]/50 border-4 border-[#4a7ab0]' : 'bg-[#2a2a2a] border-2 border-[#4a4a4a]'}`}>
            {/* Name row with ON AIR */}
            <div className="flex items-center justify-between mb-2">
              <span className={`pixel-text text-xs truncate ${isAActive ? 'text-[#4a7ab0]' : 'text-gray-500'}`}>{partyA}</span>
              {isAActive && (
                <span className="pixel-badge pixel-badge-live">ON AIR</span>
              )}
              {!isAActive && activeParty && (
                <span className="pixel-text-sm text-gray-600">WAIT</span>
              )}
            </div>

            {/* Credibility percentage */}
            <div className="flex items-center justify-between mb-2">
              <span className="pixel-text-sm text-gray-500">HP</span>
              <div className="flex items-center gap-2">
                {lastA && (
                  <span className={`pixel-text-sm ${lastA.change >= 0 ? 'text-[#228b22]' : 'text-[#b22222]'}`}>
                    {lastA.change >= 0 ? '+' : ''}{lastA.change}
                  </span>
                )}
                <span className="pixel-text text-sm text-white">{credibilityA}%</span>
              </div>
            </div>

            {/* Pixel Health bar - segmented */}
            <div className="pixel-health-bar">
              <PixelHealthBar segments={segmentsA} party="A" />
            </div>
          </div>

          {/* Center VS badge - Pixel style */}
          <div className="flex flex-col items-center justify-center">
            <div className="pixel-vs">VS</div>
          </div>

          {/* Party B - Right side */}
          <div className={`flex-1 p-2 transition-all ${isBActive ? 'bg-[#8b0000]/30 border-4 border-[#b22222]' : 'bg-[#2a2a2a] border-2 border-[#4a4a4a]'}`}>
            {/* Name row with ON AIR */}
            <div className="flex items-center justify-between mb-2">
              {!isBActive && activeParty && (
                <span className="pixel-text-sm text-gray-600">WAIT</span>
              )}
              {isBActive && (
                <span className="pixel-badge pixel-badge-live">ON AIR</span>
              )}
              <span className={`pixel-text text-xs truncate ${isBActive ? 'text-[#b22222]' : 'text-gray-500'}`}>{partyB}</span>
            </div>

            {/* Credibility percentage */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="pixel-text text-sm text-white">{credibilityB}%</span>
                {lastB && (
                  <span className={`pixel-text-sm ${lastB.change >= 0 ? 'text-[#228b22]' : 'text-[#b22222]'}`}>
                    {lastB.change >= 0 ? '+' : ''}{lastB.change}
                  </span>
                )}
              </div>
              <span className="pixel-text-sm text-gray-500">HP</span>
            </div>

            {/* Pixel Health bar - segmented, depletes from right */}
            <div className="pixel-health-bar">
              <PixelHealthBar segments={segmentsB} party="B" reverse />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Mini Status Bar - Compact single-row status for simplified cross-exam
export function MiniStatusBar({
  round,
  totalRounds,
  partyA,
  partyB,
  activeParty
}: {
  round: number;
  totalRounds: number;
  partyA: string;
  partyB: string;
  activeParty: 'A' | 'B';
}) {
  const activeName = activeParty === 'A' ? partyA : partyB;

  return (
    <div className="flex items-center justify-between px-3 py-2 bg-[#1a1a1a] border-b-2 border-[#333] mb-3">
      <span className="pixel-text-sm text-gray-500">R{round}/{totalRounds}</span>
      <div className="flex items-center gap-2 text-xs">
        <span className={`truncate max-w-[60px] ${activeParty === 'A' ? 'text-[#4a7ab0] font-bold' : 'text-gray-500'}`}>
          {partyA}
        </span>
        <span className="text-gray-600">vs</span>
        <span className={`truncate max-w-[60px] ${activeParty === 'B' ? 'text-[#b22222] font-bold' : 'text-gray-500'}`}>
          {partyB}
        </span>
      </div>
      <span className="pixel-badge pixel-badge-live text-[6px]">
        {activeName.split(' ')[0]} ON AIR
      </span>
    </div>
  );
}

// Tilt Bar - Visual credibility indicator without numbers
function getTiltLabel(credA: number, credB: number): string {
  const diff = Math.abs(credA - credB);
  if (diff <= 10) return 'Leaning Neutral';
  if (diff <= 25) return 'Judge Skeptical';
  return 'Shifting';
}

export function TiltBar({
  partyA,
  partyB,
  credibilityA,
  credibilityB,
  activeParty
}: {
  partyA: string;
  partyB: string;
  credibilityA: number;
  credibilityB: number;
  activeParty?: 'A' | 'B' | null;
}) {
  const label = getTiltLabel(credibilityA, credibilityB);
  const isAActive = activeParty === 'A';
  const isBActive = activeParty === 'B';

  // Calculate tilt: positive = toward A, negative = toward B
  const diff = credibilityA - credibilityB;
  // Map to 0-100 scale where 50 is center
  const indicatorPosition = 50 + (diff / 4); // Divide by 4 to moderate the swing
  const clampedPosition = Math.max(10, Math.min(90, indicatorPosition));

  return (
    <div className="mb-4 pixel-card p-3">
      {/* Party names row */}
      <div className="flex justify-between mb-2">
        <div className={`flex items-center gap-2 ${isAActive ? 'text-[#4a7ab0]' : 'text-gray-500'}`}>
          {isAActive && <span className="pixel-badge pixel-badge-live text-[6px]">ON AIR</span>}
          <span className="pixel-text-sm truncate max-w-[100px]">{partyA}</span>
        </div>
        <div className={`flex items-center gap-2 ${isBActive ? 'text-[#b22222]' : 'text-gray-500'}`}>
          <span className="pixel-text-sm truncate max-w-[100px]">{partyB}</span>
          {isBActive && <span className="pixel-badge pixel-badge-live text-[6px]">ON AIR</span>}
        </div>
      </div>

      {/* Tilt bar */}
      <div className="relative h-6 bg-gradient-to-r from-[#1e3a5f] via-[#2a2a2a] to-[#4a1515] border-2 border-[#4a4a4a]">
        {/* Center line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-[#daa520] opacity-50"></div>

        {/* Tilt indicator */}
        <div
          className="absolute top-0 bottom-0 w-3 bg-[#daa520] transition-all duration-500"
          style={{ left: `calc(${clampedPosition}% - 6px)` }}
        >
          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[6px] border-transparent border-b-[#daa520]"></div>
        </div>
      </div>

      {/* Status label */}
      <div className="text-center mt-2">
        <span className="pixel-text-sm text-[#daa520]">{label}</span>
      </div>
    </div>
  );
}

// Collapsible Opening Statements
export function CollapsibleOpeningStatements({
  partyA,
  partyB,
  statementA,
  statementB,
  isExpanded,
  onToggle
}: {
  partyA: string;
  partyB: string;
  statementA: string;
  statementB: string;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="pixel-card p-2 mb-2">
      <button
        onClick={onToggle}
        className="w-full text-left flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <span className="text-yellow-500">📜</span>
          <span className="pixel-text-sm text-gray-400">OPENING STATEMENTS</span>
        </div>
        <span className="text-gray-500 text-xs">{isExpanded ? '▼' : '▶'}</span>
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-2 text-xs">
          <div className="pl-3 border-l-2 border-blue-500">
            <span className="text-blue-400 font-bold">{partyA}:</span>
            <span className="text-gray-300 ml-1">&quot;{statementA}&quot;</span>
          </div>
          <div className="pl-3 border-l-2 border-red-500">
            <span className="text-red-400 font-bold">{partyB}:</span>
            <span className="text-gray-300 ml-1">&quot;{statementB}&quot;</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Collapsible Stakes
export function CollapsibleStakes({
  stakes,
  isExpanded,
  onToggle
}: {
  stakes: string;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  if (!stakes) return null;

  return (
    <button
      onClick={onToggle}
      className="w-full pixel-card p-2 mb-2 text-left flex items-center gap-2"
    >
      <span>🏆</span>
      <span className="pixel-text-sm text-[#daa520] flex-1 truncate">
        {isExpanded ? stakes : 'Stakes'}
      </span>
      <span className="text-gray-500 text-xs">{isExpanded ? '▼' : '▶'}</span>
    </button>
  );
}

// Hold to Confirm Button for objections
export function HoldToConfirmButton({
  label,
  holdDuration = 700,
  onConfirm,
  className = ''
}: {
  label: string;
  holdDuration?: number;
  onConfirm: () => void;
  className?: string;
}) {
  const [isHolding, setIsHolding] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = React.useRef<number>(0);

  const startHold = () => {
    setIsHolding(true);
    startTimeRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const newProgress = Math.min(100, (elapsed / holdDuration) * 100);
      setProgress(newProgress);

      if (elapsed >= holdDuration) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        onConfirm();
        setIsHolding(false);
        setProgress(0);
      }
    }, 16);
  };

  const cancelHold = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setIsHolding(false);
    setProgress(0);
  };

  return (
    <button
      onMouseDown={startHold}
      onMouseUp={cancelHold}
      onMouseLeave={cancelHold}
      onTouchStart={startHold}
      onTouchEnd={cancelHold}
      className={`relative overflow-hidden px-2 py-1 text-[8px] sm:text-[10px]
        bg-red-900/50 hover:bg-red-800/50 border border-red-700 text-red-300
        uppercase tracking-wider select-none ${className}`}
    >
      {/* Progress fill */}
      <div
        className="absolute inset-0 bg-red-600/50 transition-none"
        style={{ width: `${progress}%` }}
      />
      <span className="relative z-10">{label}</span>
    </button>
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

// Loading Overlay - Pixel Art Style
export function LoadingOverlay({
  emoji,
  message
}: {
  emoji: string;
  message: string;
}) {
  return (
    <div className="pixel-card p-8 text-center">
      <ThinkingEmoji emoji={emoji} />
      <div className="pixel-text text-xs text-[#daa520] mt-4">{message}</div>
      <div className="flex justify-center gap-2 mt-3">
        <span className="w-3 h-3 bg-[#daa520] animate-bounce" style={{ animationDelay: '0ms' }}></span>
        <span className="w-3 h-3 bg-[#daa520] animate-bounce" style={{ animationDelay: '150ms' }}></span>
        <span className="w-3 h-3 bg-[#daa520] animate-bounce" style={{ animationDelay: '300ms' }}></span>
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
  1: { name: 'Fact Lock', goal: 'Defining claims & assumptions' },
  2: { name: 'Rule Test', goal: 'Testing evidence & reasoning' },
  3: { name: 'Stress Test', goal: 'Exposing weaknesses & tradeoffs' }
};

// Round Indicator - Pixel Art Style
export function RoundIndicator({ round, totalRounds }: { round: number; totalRounds: number }) {
  const roundInfo = ROUND_NAMES[round] || { name: 'Cross-Exam', goal: '' };

  return (
    <div className="pixel-card inline-block px-4 py-2 border-2 border-[#daa520]">
      <div className="pixel-text-sm text-gray-400">ROUND {round}/{totalRounds}</div>
      <div className="pixel-text text-sm text-[#daa520] mt-1">{roundInfo.name}</div>
      {roundInfo.goal && (
        <div className="pixel-text-sm text-gray-500 mt-1">{roundInfo.goal}</div>
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
