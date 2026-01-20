'use client';

import React from 'react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  partyColor: 'blue' | 'red';
  partyName: string;
  disabled?: boolean;
  isLoading?: boolean;
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  placeholder = 'Type your answer...',
  partyColor,
  partyName,
  disabled,
  isLoading
}: ChatInputProps) {
  const borderClass = partyColor === 'blue' ? 'border-blue-600' : 'border-red-600';
  const textClass = partyColor === 'blue' ? 'text-blue-400' : 'text-red-400';

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && value.trim()) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className={`tv-card p-3 sm:p-4 border-2 ${borderClass}`}>
      <div className="flex items-center gap-2 mb-2 sm:mb-3">
        <span className={`font-bold text-sm sm:text-base ${textClass}`}>{partyName}</span>
        <span className="text-gray-400 text-xs sm:text-sm">— your response</span>
      </div>

      <textarea
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={3}
        disabled={disabled || isLoading}
        className={`w-full tv-input text-white resize-none text-sm sm:text-base ${borderClass}`}
        style={{ color: 'white' }}
      />

      <div className="flex justify-between items-center mt-2 sm:mt-3">
        <div className="text-[10px] sm:text-xs text-gray-500">
          {value.length} chars
          {value.length > 0 && value.length < 20 && (
            <span className="text-yellow-500 ml-2">Add more detail</span>
          )}
        </div>

        <button
          onClick={onSubmit}
          disabled={!value.trim() || disabled || isLoading}
          className="tv-button py-2 px-4 sm:px-6 text-sm sm:text-base"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin">&#8987;</span> SENDING...
            </span>
          ) : (
            'SUBMIT'
          )}
        </button>
      </div>
    </div>
  );
}
