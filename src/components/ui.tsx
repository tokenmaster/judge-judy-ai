'use client';

import React from 'react';
import { getCredibilityLabel, getCredibilityColor, OBJECTION_TYPES } from '@/lib/constants';

// Stakes Badge Component
export function StakesBadge({ stakes }: { stakes: string }) {
  if (!stakes) return null;
  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-6">
      <div className="flex items-center gap-2">
        <span className="text-amber-500">🏆</span>
        <span className="text-amber-200 font-medium">Stakes:</span>
        <span className="text-white">{stakes}</span>
      </div>
    </div>
  );
}

// Credibility Bar Component
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
    return 'bg-red-500';
  };

  const getLabel = (score: number) => {
    if (score >= 80) return 'Very Credible';
    if (score >= 60) return 'Credible';
    if (score >= 40) return 'Questionable';
    if (score >= 20) return 'Low Credibility';
    return 'Not Credible';
  };
  
  return (
    <div className="bg-slate-800 rounded-lg p-4 mb-6">
      <div className="text-slate-400 text-sm mb-3 font-medium">CREDIBILITY METER</div>
      
      <div className="space-y-3">
        {/* Party A */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-blue-400 font-medium">{partyA}</span>
            <span className="text-slate-300">
              {credibilityA}% - {getLabel(credibilityA)}
              {lastA && (
                <span className={lastA.change >= 0 ? 'text-green-400 ml-2' : 'text-red-400 ml-2'}>
                  {lastA.change >= 0 ? '+' : ''}{lastA.change}
                </span>
              )}
            </span>
          </div>
          <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className={`h-full ${getBarColor(credibilityA)} transition-all duration-500`}
              style={{ width: `${credibilityA}%` }}
            />
          </div>
          {lastA?.flagged && (
            <div className="text-red-400 text-xs mt-1">⚠️ {lastA.flagged}</div>
          )}
        </div>
        
        {/* Party B */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-red-400 font-medium">{partyB}</span>
            <span className="text-slate-300">
              {credibilityB}% - {getLabel(credibilityB)}
              {lastB && (
                <span className={lastB.change >= 0 ? 'text-green-400 ml-2' : 'text-red-400 ml-2'}>
                  {lastB.change >= 0 ? '+' : ''}{lastB.change}
                </span>
              )}
            </span>
          </div>
          <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className={`h-full ${getBarColor(credibilityB)} transition-all duration-500`}
              style={{ width: `${credibilityB}%` }}
            />
          </div>
          {lastB?.flagged && (
            <div className="text-red-400 text-xs mt-1">⚠️ {lastB.flagged}</div>
          )}
        </div>
      </div>
    </div>
  );
}

// Transcript Component
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
        className="w-full text-left text-slate-400 hover:text-white text-sm flex items-center gap-2"
      >
        <span>{isOpen ? '▼' : '▶'}</span>
        <span>Case Transcript ({responses.length} responses)</span>
      </button>
      
      {isOpen && (
        <div className="mt-3 bg-slate-800/50 rounded-lg p-4 max-h-64 overflow-y-auto">
          {/* Opening Statements */}
          <div className="mb-4">
            <div className="text-amber-500 text-xs font-medium mb-2">OPENING STATEMENTS</div>
            <div className="text-sm mb-2">
              <span className="text-blue-400 font-medium">{caseData.partyA}:</span>
              <span className="text-slate-300 ml-2">"{caseData.statementA}"</span>
            </div>
            <div className="text-sm">
              <span className="text-red-400 font-medium">{caseData.partyB}:</span>
              <span className="text-slate-300 ml-2">"{caseData.statementB}"</span>
            </div>
          </div>
          
          {/* Responses */}
          {responses.map((r, i) => (
            <div key={i} className="mb-3 pb-3 border-b border-slate-700 last:border-0">
              <div className="text-amber-500 text-xs mb-1">Q: {r.question}</div>
              <div className="text-sm">
                <span className={`font-medium ${r.party === 'A' ? 'text-blue-400' : 'text-red-400'}`}>
                  {r.party === 'A' ? caseData.partyA : caseData.partyB}:
                </span>
                <span className="text-slate-300 ml-2">"{r.answer}"</span>
              </div>
            </div>
          ))}
          
          {responses.length === 0 && (
            <div className="text-slate-500 text-sm">No testimony yet.</div>
          )}
        </div>
      )}
    </div>
  );
}

// Objection Modal Component
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
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full">
        <div className="text-2xl mb-2">⚠️ OBJECTION!</div>
        <div className="text-slate-400 text-sm mb-4">
          {objectorName} objects to {isQuestionObjection ? "the judge's question" : `${targetName}'s statement`}
        </div>
        
        {objectionTarget && (
          <div className="bg-slate-700/50 rounded-lg p-3 mb-4 text-sm text-slate-300 italic">
            "{objectionTarget}"
          </div>
        )}
        
        <div className="mb-4">
          <div className="text-slate-300 text-sm mb-2">Grounds for objection:</div>
          <div className="space-y-2">
            {availableTypes.map(type => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedType === type.id 
                    ? 'bg-red-500/20 border-red-500 text-white' 
                    : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-slate-500'
                }`}
              >
                <div className="font-medium">{type.label}</div>
                <div className="text-xs text-slate-400">{type.desc}</div>
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
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white text-sm"
          />
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedType}
            className="flex-1 bg-red-500 hover:bg-red-400 disabled:bg-slate-700 disabled:text-slate-500 text-white py-2 rounded-lg font-bold"
          >
            Object!
          </button>
        </div>
      </div>
    </div>
  );
}

// Thinking Emoji Component
export function ThinkingEmoji({ emoji }: { emoji: string }) {
  return (
    <span className="inline-block animate-bounce text-2xl">{emoji}</span>
  );
}

// Objection Ruling Display
export function ObjectionRuling({
  ruling,
  onContinue
}: {
  ruling: {
    sustained: boolean;
    reason: string;
    objector: string;
    type: string;
  };
  onContinue: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full text-center">
        <div className={`text-4xl mb-4 ${ruling.sustained ? 'text-green-500' : 'text-red-500'}`}>
          {ruling.sustained ? '✅' : '❌'}
        </div>
        <div className={`text-2xl font-bold mb-2 ${ruling.sustained ? 'text-green-400' : 'text-red-400'}`}>
          {ruling.sustained ? 'SUSTAINED!' : 'OVERRULED!'}
        </div>
        <div className="text-slate-300 mb-4">{ruling.reason}</div>
        {ruling.sustained && (
          <div className="text-amber-400 text-sm mb-4">
            -10 credibility penalty applied
          </div>
        )}
        <button
          onClick={onContinue}
          className="bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 px-8 rounded-lg"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

// Snap Judgment Display
export function SnapJudgmentDisplay({
  judgment,
  onContinue
}: {
  judgment: {
    winner: string;
    reason: string;
  };
  onContinue: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-lg p-8 max-w-md w-full text-center">
        <div className="text-5xl mb-4">🔨</div>
        <div className="text-red-500 text-xl font-bold mb-2">SNAP JUDGMENT!</div>
        <div className="text-amber-400 text-lg mb-4">The judge has seen enough!</div>
        <div className="text-white text-xl mb-2">{judgment.winner} WINS!</div>
        <div className="text-slate-300 mb-6 italic">"{judgment.reason}"</div>
        <button
          onClick={onContinue}
          className="bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 px-8 rounded-lg"
        >
          See Full Verdict
        </button>
      </div>
    </div>
  );
}

// Loading Overlay
export function LoadingOverlay({
  emoji,
  message
}: {
  emoji: string;
  message: string;
}) {
  return (
    <div className="bg-slate-800/50 rounded-lg p-6 text-center">
      <ThinkingEmoji emoji={emoji} />
      <div className="text-slate-400 mt-2">{message}</div>
    </div>
  );
}

// Chat-style Transcript for cross-examination
export function ChatTranscript({
  caseData,
  responses,
  currentQuestion,
  judgeName,
  isLoading,
  loadingMessage,
  loadingEmoji
}: {
  caseData: any;
  responses: any[];
  currentQuestion?: string;
  judgeName: string;
  isLoading?: boolean;
  loadingMessage?: string;
  loadingEmoji?: string;
}) {
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [responses, currentQuestion, isLoading]);

  return (
    <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 flex flex-col" style={{ height: '400px' }}>
      {/* Chat header */}
      <div className="bg-slate-800 px-4 py-3 rounded-t-xl border-b border-slate-700/50">
        <div className="text-slate-400 text-sm font-medium">📜 Case Transcript</div>
      </div>

      {/* Chat messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Opening statements section */}
        <div className="text-center">
          <span className="bg-slate-700/50 text-slate-400 text-xs px-3 py-1 rounded-full">
            OPENING STATEMENTS
          </span>
        </div>

        {/* Party A statement */}
        <div className="flex flex-col items-start">
          <span className="text-blue-400 text-xs font-medium mb-1 ml-1">{caseData.partyA}</span>
          <div className="bg-blue-500/20 border border-blue-500/30 rounded-2xl rounded-tl-sm px-4 py-2 max-w-[85%]">
            <span className="text-slate-200 text-sm">{caseData.statementA}</span>
          </div>
        </div>

        {/* Party B statement */}
        <div className="flex flex-col items-end">
          <span className="text-red-400 text-xs font-medium mb-1 mr-1">{caseData.partyB}</span>
          <div className="bg-red-500/20 border border-red-500/30 rounded-2xl rounded-tr-sm px-4 py-2 max-w-[85%]">
            <span className="text-slate-200 text-sm">{caseData.statementB}</span>
          </div>
        </div>

        {/* Cross-examination divider */}
        {(responses.length > 0 || currentQuestion) && (
          <div className="text-center py-2">
            <span className="bg-amber-500/20 text-amber-400 text-xs px-3 py-1 rounded-full">
              ⚖️ CROSS-EXAMINATION
            </span>
          </div>
        )}

        {/* Previous Q&A */}
        {responses.map((r, i) => (
          <React.Fragment key={i}>
            {/* Judge question */}
            <div className="flex flex-col items-start">
              <span className="text-amber-400 text-xs font-medium mb-1 ml-1">⚖️ {judgeName}</span>
              <div className="bg-amber-500/20 border border-amber-500/30 rounded-2xl rounded-tl-sm px-4 py-2 max-w-[85%]">
                <span className="text-white text-sm">{r.question}</span>
              </div>
            </div>

            {/* Party response */}
            <div className={`flex flex-col ${r.party === 'A' ? 'items-start' : 'items-end'}`}>
              <span className={`text-xs font-medium mb-1 ${r.party === 'A' ? 'text-blue-400 ml-1' : 'text-red-400 mr-1'}`}>
                {r.party === 'A' ? caseData.partyA : caseData.partyB}
              </span>
              <div className={`rounded-2xl px-4 py-2 max-w-[85%] ${
                r.party === 'A'
                  ? 'bg-blue-500/20 border border-blue-500/30 rounded-tl-sm'
                  : 'bg-red-500/20 border border-red-500/30 rounded-tr-sm'
              }`}>
                <span className="text-slate-200 text-sm">{r.answer}</span>
              </div>
            </div>
          </React.Fragment>
        ))}

        {/* Current question */}
        {currentQuestion && !isLoading && (
          <div className="flex flex-col items-start">
            <span className="text-amber-400 text-xs font-medium mb-1 ml-1">⚖️ {judgeName}</span>
            <div className="bg-amber-500/20 border border-amber-500/30 rounded-2xl rounded-tl-sm px-4 py-2 max-w-[85%]">
              <span className="text-white text-sm">{currentQuestion}</span>
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex flex-col items-start">
            <span className="text-amber-400 text-xs font-medium mb-1 ml-1">⚖️ {judgeName}</span>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-lg animate-bounce">{loadingEmoji || '🤔'}</span>
                <span className="text-slate-400 text-sm">{loadingMessage || 'Thinking...'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={chatEndRef} />
      </div>
    </div>
  );
}
