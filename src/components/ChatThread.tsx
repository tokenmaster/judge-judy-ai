'use client';

import React, { useRef, useEffect, useMemo, useState } from 'react';
import { ChatMessage, ChatMessageData } from './ChatMessage';
import { JUDGE_PERSONALITIES } from '@/lib/constants';

interface Response {
  id?: string;
  round: number;
  party: string;
  party_name: string;
  question: string;
  answer: string;
  is_clarification?: boolean;
  credibility_change?: number;
  created_at?: string;
}

interface CaseData {
  partyA: string;
  partyB: string;
  statementA: string;
  statementB: string;
  judge: string;
  title: string;
}

interface ChatThreadProps {
  caseData: CaseData;
  responses: Response[];
  currentQuestion: string | null;
  examTarget: 'A' | 'B';
  isOtherTyping: boolean;
  typingPlayerName: string;
  onObjectionClick?: () => void;
  canObject?: boolean;
  myRole?: string | null;
  isWaiting?: boolean;
  isLoading?: boolean;
  loadingMessage?: string;
  loadingEmoji?: string;
}

function getJudgeName(judgeKey: string): string {
  const judge = JUDGE_PERSONALITIES[judgeKey as keyof typeof JUDGE_PERSONALITIES];
  return judge?.name || 'Judge Joody';
}

function buildChatMessages(
  caseData: CaseData,
  responses: Response[],
  currentQuestion: string | null,
  examTarget: 'A' | 'B'
): ChatMessageData[] {
  const messages: ChatMessageData[] = [];
  const judgeName = getJudgeName(caseData.judge);

  // 1. Opening statement for Party A (as judge asking them)
  if (caseData.statementA) {
    messages.push({
      id: 'opening-judge-a',
      type: 'judge_question',
      party: 'judge',
      partyName: judgeName,
      content: `${caseData.partyA}, you filed this claim. Tell me what happened.`
    });
    messages.push({
      id: 'opening-A',
      type: 'opening_statement',
      party: 'A',
      partyName: caseData.partyA,
      content: caseData.statementA
    });
  }

  // 2. Opening statement for Party B (as judge asking them)
  if (caseData.statementB) {
    messages.push({
      id: 'opening-judge-b',
      type: 'judge_question',
      party: 'judge',
      partyName: judgeName,
      content: `${caseData.partyB}, you've heard the accusations. What do you have to say?`
    });
    messages.push({
      id: 'opening-B',
      type: 'opening_statement',
      party: 'B',
      partyName: caseData.partyB,
      content: caseData.statementB
    });
  }

  // 3. Q&A pairs from responses array
  responses.forEach((r, index) => {
    // Judge question
    messages.push({
      id: `q-${r.id || index}`,
      type: 'judge_question',
      party: 'judge',
      partyName: judgeName,
      content: r.question,
      round: r.round
    });

    // Party answer
    messages.push({
      id: `a-${r.id || index}`,
      type: 'party_response',
      party: r.party as 'A' | 'B',
      partyName: r.party_name,
      content: r.answer,
      credibilityChange: r.credibility_change,
      round: r.round
    });
  });

  // 4. Current question (if exists and not yet answered)
  if (currentQuestion) {
    messages.push({
      id: 'current-question',
      type: 'judge_question',
      party: 'judge',
      partyName: judgeName,
      content: currentQuestion,
      isActive: true
    });
  }

  return messages;
}

export function ChatThread({
  caseData,
  responses,
  currentQuestion,
  examTarget,
  isOtherTyping,
  typingPlayerName,
  onObjectionClick,
  canObject,
  myRole,
  isWaiting,
  isLoading,
  loadingMessage,
  loadingEmoji
}: ChatThreadProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Build messages array
  const messages = useMemo(
    () => buildChatMessages(caseData, responses, currentQuestion, examTarget),
    [caseData, responses, currentQuestion, examTarget]
  );

  // Separate history from current active question
  const { historyMessages, activeMessage } = useMemo(() => {
    const active = messages.find(m => m.isActive);
    const history = messages.filter(m => !m.isActive);
    return { historyMessages: history, activeMessage: active };
  }, [messages]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOtherTyping, showHistory]);

  const historyCount = historyMessages.length;

  return (
    <div className="chat-thread chat-thread-simplified" ref={scrollRef}>
      {/* Collapsed history toggle - only show if there's history */}
      {historyCount > 0 && (
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="chat-history-toggle"
        >
          {showHistory ? '▲ Hide' : '▼ Show'} {historyCount} previous exchange{historyCount !== 1 ? 's' : ''}
        </button>
      )}

      {/* Collapsed history - shown only when expanded */}
      {showHistory && historyMessages.map((message) => (
        <ChatMessage
          key={message.id}
          message={message}
          showCredibilityChange={message.type === 'party_response'}
        />
      ))}

      {/* Divider when history is shown */}
      {showHistory && historyCount > 0 && activeMessage && (
        <div className="chat-history-divider">
          <span>CURRENT QUESTION</span>
        </div>
      )}

      {/* Active question - always prominent */}
      {activeMessage && (
        <ChatMessage
          key={activeMessage.id}
          message={activeMessage}
          showCredibilityChange={false}
          onObjectionClick={onObjectionClick}
          canObject={canObject}
        />
      )}

      {/* Loading indicator - inside chat thread */}
      {isLoading && (
        <div className="chat-typing-indicator">
          <div className="flex items-center gap-2 text-yellow-500">
            <span className="text-lg">{loadingEmoji || '📝'}</span>
            <span className="text-xs pixel-text-sm">{loadingMessage || 'Loading...'}</span>
            <div className="chat-typing-dots ml-1">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      )}

      {/* Typing indicator - right aligned for party typing */}
      {isOtherTyping && !isLoading && (
        <div className="chat-typing-indicator chat-typing-right">
          <div className="flex items-center gap-2">
            <span className="text-yellow-500 text-xs">{typingPlayerName}</span>
            <div className="chat-typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      )}

      {/* Waiting state for multiplayer when opponent needs to respond */}
      {isWaiting && !isOtherTyping && !isLoading && currentQuestion && (
        <div className="chat-typing-indicator">
          <div className="flex items-center gap-2 text-gray-400 text-xs">
            <span>&#8987;</span>
            <span>Waiting for {typingPlayerName} to respond...</span>
          </div>
        </div>
      )}
    </div>
  );
}
