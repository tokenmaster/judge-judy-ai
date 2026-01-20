'use client';

import React, { useMemo } from 'react';
import { TypewriterText } from './ui';

export interface ChatMessageData {
  id: string;
  type: 'opening_statement' | 'judge_question' | 'party_response';
  party: 'A' | 'B' | 'judge';
  partyName: string;
  content: string;
  isActive?: boolean;
  credibilityChange?: number;
  round?: number;
}

interface ChatMessageProps {
  message: ChatMessageData;
  showCredibilityChange?: boolean;
  onObjectionClick?: () => void;
  canObject?: boolean;
}

export function ChatMessage({
  message,
  showCredibilityChange,
  onObjectionClick,
  canObject
}: ChatMessageProps) {
  const bubbleClass = useMemo(() => {
    if (message.party === 'judge') return 'chat-bubble-judge';
    if (message.party === 'A') return 'chat-bubble-party-a';
    return 'chat-bubble-party-b';
  }, [message.party]);

  const isJudge = message.party === 'judge';

  return (
    <div className={`chat-bubble ${bubbleClass} ${message.isActive ? 'chat-bubble-active' : ''}`}>
      {/* Opening statement badge */}
      {message.type === 'opening_statement' && (
        <div className="chat-opening-badge">OPENING STATEMENT</div>
      )}

      {/* Name header */}
      <div className="chat-name">
        {isJudge && <span className="mr-1">&#9878;</span>}
        <span>{message.partyName}</span>
        {message.round !== undefined && message.type !== 'opening_statement' && (
          <span className="chat-round-badge">R{message.round + 1}</span>
        )}
      </div>

      {/* Content */}
      <div className="chat-content">
        {message.isActive && isJudge ? (
          <TypewriterText text={message.content} />
        ) : (
          <span>&ldquo;{message.content}&rdquo;</span>
        )}
      </div>

      {/* Credibility change badge */}
      {showCredibilityChange && message.credibilityChange !== undefined && message.credibilityChange !== 0 && (
        <div className={`chat-cred-change ${message.credibilityChange > 0 ? 'chat-cred-positive' : 'chat-cred-negative'}`}>
          {message.credibilityChange > 0 ? '+' : ''}{message.credibilityChange} CRED
        </div>
      )}

      {/* Inline objection button for active judge questions - small tag style */}
      {canObject && message.isActive && isJudge && onObjectionClick && (
        <button
          onClick={onObjectionClick}
          className="mt-2 px-2 py-0.5 text-[8px] sm:text-[10px] bg-red-800 hover:bg-red-700 border border-red-600 text-red-200 uppercase tracking-wider"
        >
          &#9888; Object
        </button>
      )}
    </div>
  );
}
