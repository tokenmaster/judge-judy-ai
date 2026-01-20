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
    <div className={`tv-card p-2 sm:p-3 border-2 ${borderClass}`}>
      <div className="flex items-center gap-2 mb-1 sm:mb-2">
        <span className={`font-bold text-xs sm:text-sm ${textClass}`}>{partyName}</span>
        <span className="text-gray-400 text-[10px] sm:text-xs">— respond</span>
      </div>

      <textarea
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={2}
        disabled={disabled || isLoading}
        className={`w-full tv-input text-white resize-none text-xs sm:text-sm p-2 ${borderClass}`}
        style={{ color: 'white' }}
      />

      <div className="flex justify-between items-center mt-1 sm:mt-2">
        <div className="text-[8px] sm:text-[10px] text-gray-500">
          {value.length} chars
        </div>

        <button
          onClick={onSubmit}
          disabled={!value.trim() || disabled || isLoading}
          className="tv-button py-1 px-3 sm:px-4 text-xs sm:text-sm"
        >
          {isLoading ? 'SENDING...' : 'SUBMIT'}
        </button>
      </div>
    </div>
  );
}
