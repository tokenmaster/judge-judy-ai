'use client';

import React, { useMemo, useState } from 'react';
import { TypewriterText, HoldToConfirmButton } from './ui';

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

// Split judge message into flavor (commentary) and actual question
function splitJudgeMessage(content: string): { flavor: string | null; question: string } {
  // Find sentences - split on sentence endings
  const sentences = content.split(/(?<=[.!?])\s+/);

  if (sentences.length <= 1) {
    return { flavor: null, question: content };
  }

  // Find question sentences (contain "?")
  const questionSentences: string[] = [];
  const flavorSentences: string[] = [];

  let foundQuestion = false;

  // Work backwards to find question sentences
  for (let i = sentences.length - 1; i >= 0; i--) {
    const sentence = sentences[i].trim();
    if (sentence.includes('?')) {
      questionSentences.unshift(sentence);
      foundQuestion = true;
    } else if (foundQuestion) {
      // Stop once we hit a non-question sentence after finding questions
      flavorSentences.push(...sentences.slice(0, i + 1));
      break;
    } else {
      // Trailing non-question goes with question (like "Tell me!")
      questionSentences.unshift(sentence);
    }
  }

  // If all sentences have questions or only questions found
  if (flavorSentences.length === 0 && questionSentences.length > 1) {
    // Split: first half is flavor, rest is question
    const splitPoint = Math.max(1, Math.floor(sentences.length / 2));
    return {
      flavor: sentences.slice(0, splitPoint).join(' '),
      question: sentences.slice(splitPoint).join(' ')
    };
  }

  return {
    flavor: flavorSentences.length > 0 ? flavorSentences.join(' ') : null,
    question: questionSentences.join(' ') || content
  };
}

export function ChatMessage({
  message,
  showCredibilityChange,
  onObjectionClick,
  canObject
}: ChatMessageProps) {
  const [flavorExpanded, setFlavorExpanded] = useState(false);

  const bubbleClass = useMemo(() => {
    if (message.party === 'judge') return 'chat-bubble-judge';
    if (message.party === 'A') return 'chat-bubble-party-a';
    return 'chat-bubble-party-b';
  }, [message.party]);

  const isJudge = message.party === 'judge';
  const isActiveQuestion = message.isActive && isJudge;

  // Split judge messages for active questions
  const { flavor, question } = useMemo(() => {
    if (isActiveQuestion) {
      return splitJudgeMessage(message.content);
    }
    return { flavor: null, question: message.content };
  }, [message.content, isActiveQuestion]);

  // For active judge questions, use special question card layout
  if (isActiveQuestion) {
    return (
      <div className="chat-question-wrapper">
        {/* Name header */}
        <div className="chat-bubble chat-bubble-judge mb-1">
          <div className="chat-name">
            <span className="mr-1">&#9878;</span>
            <span>{message.partyName}</span>
            {message.round !== undefined && (
              <span className="chat-round-badge">R{message.round + 1}</span>
            )}
          </div>

          {/* Flavor text (collapsible) */}
          {flavor && (
            <div
              className={`chat-flavor ${!flavorExpanded ? 'chat-flavor-collapsed' : ''}`}
              onClick={() => setFlavorExpanded(!flavorExpanded)}
            >
              <span>&ldquo;{flavor}&rdquo;</span>
              <div className="chat-flavor-toggle">
                {flavorExpanded ? '▲ less' : '▼ more'}
              </div>
            </div>
          )}
        </div>

        {/* Question Card - focal element */}
        <div className="chat-question-card">
          <div className="chat-content font-bold">
            <TypewriterText text={question} />
          </div>

          {/* Objection button - small, hold to confirm */}
          {canObject && onObjectionClick && (
            <div className="mt-3">
              <HoldToConfirmButton
                label="⚠ OBJECT (1)"
                holdDuration={700}
                onConfirm={onObjectionClick}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Standard message layout for non-active messages
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
        <span>&ldquo;{message.content}&rdquo;</span>
      </div>

      {/* Credibility change badge */}
      {showCredibilityChange && message.credibilityChange !== undefined && message.credibilityChange !== 0 && (
        <div className={`chat-cred-change ${message.credibilityChange > 0 ? 'chat-cred-positive' : 'chat-cred-negative'}`}>
          {message.credibilityChange > 0 ? '+' : ''}{message.credibilityChange} CRED
        </div>
      )}
    </div>
  );
}
