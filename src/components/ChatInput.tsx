'use client';

import React, { useRef, useEffect } from 'react';

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
  placeholder = 'Type your response...',
  partyColor,
  disabled,
  isLoading
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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

  return (
    <div className="flex items-end gap-2 p-2 bg-gray-900 rounded-full border border-gray-700">
      <textarea
        ref={textareaRef}
        placeholder={placeholder}
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
  );
}
