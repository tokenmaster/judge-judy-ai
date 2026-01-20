'use client';

import React, { useRef, useEffect, useState } from 'react';

// Answer type scaffolding
type AnswerType = 'evidence' | 'yesno' | 'concession' | 'deflection';

const ANSWER_TYPES: { id: AnswerType; label: string; icon: string; placeholder: string; warning?: boolean }[] = [
  { id: 'evidence', label: 'Evidence', icon: '📋', placeholder: 'State what you observed / what supports your claim.' },
  { id: 'yesno', label: 'Yes/No', icon: '✓', placeholder: 'Answer Yes or No, then one sentence.' },
  { id: 'concession', label: 'Concession', icon: '🤝', placeholder: 'State the exception or limit.' },
  { id: 'deflection', label: 'Deflection', icon: '⚠', placeholder: 'Not recommended.', warning: true }
];

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  partyColor: 'blue' | 'red';
  partyName: string;
  disabled?: boolean;
  isLoading?: boolean;
  showScaffolding?: boolean;
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  placeholder = 'Type your response...',
  partyColor,
  disabled,
  isLoading,
  showScaffolding = false
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selectedType, setSelectedType] = useState<AnswerType | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const accentColor = partyColor === 'blue' ? '#3b82f6' : '#ef4444';

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && value.trim()) {
      e.preventDefault();
      onSubmit();
    }
  };

  const canSubmit = value.trim() && !disabled && !isLoading;

  const activePlaceholder = selectedType
    ? ANSWER_TYPES.find(t => t.id === selectedType)?.placeholder || placeholder
    : placeholder;

  return (
    <div className="space-y-2">
      {/* "Need help?" toggle - hidden chips by default */}
      {showScaffolding && !showHelp && (
        <button
          onClick={() => setShowHelp(true)}
          className="text-[10px] text-gray-500 hover:text-gray-400 transition-colors"
        >
          💡 Need help answering?
        </button>
      )}

      {/* Answer Type Chips - only shown when help is toggled */}
      {showScaffolding && showHelp && (
        <div className="space-y-1">
          <div className="flex flex-wrap gap-1">
            {ANSWER_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(selectedType === type.id ? null : type.id)}
                className={`px-2 py-1 text-[8px] sm:text-[10px] border transition-all
                  ${selectedType === type.id
                    ? type.warning
                      ? 'bg-orange-900/50 border-orange-500 text-orange-300'
                      : 'bg-[#2a4a70] border-[#4a7ab0] text-white'
                    : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-500'
                  }
                  ${type.warning ? 'opacity-70' : ''}
                `}
              >
                <span className="mr-1">{type.icon}</span>
                {type.label}
                {type.warning && <span className="ml-1 text-orange-400">⚠</span>}
              </button>
            ))}
          </div>
          <button
            onClick={() => { setShowHelp(false); setSelectedType(null); }}
            className="text-[9px] text-gray-600 hover:text-gray-500"
          >
            ✕ Hide tips
          </button>
        </div>
      )}

      {/* Input with send button */}
      <div className="flex items-end gap-2 p-2 bg-gray-900 rounded-full border border-gray-700">
        <textarea
          ref={textareaRef}
          placeholder={activePlaceholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={disabled || isLoading}
          className="flex-1 bg-transparent text-white text-sm resize-none outline-none px-3 py-1.5 max-h-[120px] placeholder-gray-500"
          style={{ color: 'white' }}
        />
        <button
          onClick={onSubmit}
          disabled={!canSubmit}
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all"
          style={{
            backgroundColor: canSubmit ? accentColor : '#374151',
            opacity: canSubmit ? 1 : 0.5
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="white"
            className="w-4 h-4"
          >
            <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
