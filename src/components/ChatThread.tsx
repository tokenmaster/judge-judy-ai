'use client';

import React, { useRef, useEffect, useMemo } from 'react';
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
  isWaiting
}: ChatThreadProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Build messages array
  const messages = useMemo(
    () => buildChatMessages(caseData, responses, currentQuestion, examTarget),
    [caseData, responses, currentQuestion, examTarget]
  );

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOtherTyping]);

  return (
    <div className="chat-thread" ref={scrollRef}>
      {/* Section header */}
      <div className="text-center mb-4">
        <div className="pixel-badge pixel-badge-gold inline-block text-[8px] sm:text-[10px]">
          CASE PROCEEDINGS
        </div>
      </div>

      {/* Message list */}
      {messages.map((message) => (
        <ChatMessage
          key={message.id}
          message={message}
          showCredibilityChange={message.type === 'party_response'}
          onObjectionClick={onObjectionClick}
          canObject={canObject}
        />
      ))}

      {/* Typing indicator */}
      {isOtherTyping && (
        <div className="chat-typing-indicator">
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
      {isWaiting && !isOtherTyping && currentQuestion && (
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
