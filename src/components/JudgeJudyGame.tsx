'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase, generateRoomCode, getSessionId } from '@/lib/supabase';
import { 
  JUDGE_PERSONALITIES, 
  CATEGORIES, 
  SUGGESTED_STAKES,
  getRandomLoadingState 
} from '@/lib/constants';
import {
  generateMainQuestion,
  generateAIFollowUp,
  evaluateCredibility,
  checkForSnapJudgment,
  ruleOnObjection,
  generateAIVerdict
} from '@/lib/ai';
import {
  StakesBadge,
  CredibilityBar,
  Transcript,
  ObjectionModal,
  ObjectionRuling,
  SnapJudgmentDisplay,
  LoadingOverlay,
  ThinkingEmoji
} from './ui';

export default function JudgeJudyGame({ initialRoomCode }: { initialRoomCode?: string | null }) {
  // Core state
  const [phase, setPhase] = useState('home');
  const [caseData, setCaseData] = useState({
    title: '', category: '', judge: 'judy',
    partyA: '', partyB: '',
    statementA: '', statementB: '',
    stakes: ''
  });
  const [currentParty, setCurrentParty] = useState('A');
  const [examRound, setExamRound] = useState(0);
  const [examTarget, setExamTarget] = useState('A');
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [currentResponse, setCurrentResponse] = useState('');
  const [responses, setResponses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [loadingEmoji, setLoadingEmoji] = useState('🤔');

  // Multiplayer state
  const [sessionId] = useState(() => getSessionId());
  const [roomCode, setRoomCode] = useState('');
  const [caseId, setCaseId] = useState<string | null>(null);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [otherPlayerJoined, setOtherPlayerJoined] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);

  // Game state
  const [verdict, setVerdict] = useState<any>(null);
  const [verdictAccepted, setVerdictAccepted] = useState<boolean | null>(null);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [credibilityA, setCredibilityA] = useState(50);
  const [credibilityB, setCredibilityB] = useState(50);
  const [credibilityHistory, setCredibilityHistory] = useState<any[]>([]);
  const [clarificationCount, setClarificationCount] = useState(0);
  const [isClarifying, setIsClarifying] = useState(false);

  // Objection state
  const [objections, setObjections] = useState<any[]>([]);
  const [objectionsUsed, setObjectionsUsed] = useState({ A: false, B: false });
  const [showObjectionModal, setShowObjectionModal] = useState(false);
  const [currentObjectionRuling, setCurrentObjectionRuling] = useState<any>(null);
  const [objectionWindow, setObjectionWindow] = useState<any>(null);
  const [canObjectToQuestion, setCanObjectToQuestion] = useState(false);

  // Snap judgment state
  const [snapJudgment, setSnapJudgment] = useState<any>(null);
  const [showSnapJudgment, setShowSnapJudgment] = useState(false);

  // Track response IDs to prevent duplicates
  const processedResponseIds = useRef<Set<string>>(new Set());

  // Track if we're currently generating a question to prevent loops
  const isGeneratingQuestion = useRef(false);
  // Track which target the current question is for
  const questionTargetRef = useRef<string | null>(null);
  // Store subscription cleanup function
  const subscriptionCleanup = useRef<(() => void) | null>(null);
  // Typing indicator refs
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const broadcastChannelRef = useRef<any>(null);
  const lastTypingBroadcast = useRef<number>(0);
  // Timestamp of last question generation to prevent rapid re-triggers
  const lastQuestionGenTime = useRef<number>(0);
  // Minimum time (ms) between question generations
  const QUESTION_GEN_COOLDOWN = 3000;
  // Track if we're in the middle of processing a response submission
  const isProcessingResponse = useRef(false);
  // Ref to always have the latest handleCaseUpdate (fixes stale closure in subscription)
  const handleCaseUpdateRef = useRef<(updatedCase: any) => void>(() => {});
  // Ref for myRole to fix stale closure in typing indicator
  const myRoleRef = useRef<string | null>(null);

  const MAX_CLARIFICATIONS = 1;

// Keep myRoleRef in sync with myRole state
useEffect(() => {
  myRoleRef.current = myRole;
}, [myRole]);

// Auto-join if room code is in URL
useEffect(() => {
  if (initialRoomCode && !isMultiplayer && phase === 'home') {
    setJoinCode(initialRoomCode);
    setPhase('join');
  }
}, [initialRoomCode]);

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      if (subscriptionCleanup.current) {
        subscriptionCleanup.current();
        subscriptionCleanup.current = null;
      }
    };
  }, []);

  const setLoadingState = (type: 'question' | 'credibility' | 'snapJudgment' | 'followUp' | 'verdict' | 'objection') => {
    const state = getRandomLoadingState(type);
    setLoadingMessage(state.message);
    setLoadingEmoji(state.emoji);
  };

  // Party references
  const watchingParty = examTarget === 'A' ? 'B' : 'A';
  const watchingName = watchingParty === 'A' ? caseData.partyA : caseData.partyB;
  const targetName = examTarget === 'A' ? caseData.partyA : caseData.partyB;

  // Broadcast typing status (throttled to max once per 500ms)
  const broadcastTyping = () => {
    if (!isMultiplayer || !broadcastChannelRef.current) return;

    const now = Date.now();
    if (now - lastTypingBroadcast.current < 500) return;
    lastTypingBroadcast.current = now;

    broadcastChannelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        party: myRole,
        name: myRole === 'A' ? caseData.partyA : caseData.partyB
      }
    });
  };

  // Handle typing input with broadcast
  const handleTypingInput = (value: string, setter: (v: string) => void) => {
    setter(value);
    broadcastTyping();
  };

  // ========== MULTIPLAYER FUNCTIONS ==========

  const createCase = async () => {
    const newRoomCode = generateRoomCode();

    const { data, error } = await supabase
      .from('cases')
      .insert({
        room_code: newRoomCode,
        title: caseData.title,
        category: caseData.category,
        judge: caseData.judge,
        stakes: caseData.stakes,
        party_a_name: caseData.partyA,
        party_b_name: caseData.partyB,
        party_a_session: sessionId,
        phase: 'waiting',
        current_turn: 'A',
        credibility_a: 50,
        credibility_b: 50
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating case:', error);
      return null;
    }

    return data;
  };

  const handleJoinCase = async () => {
    setIsLoading(true);
    setJoinError('');

    const { data: caseRecord, error } = await supabase
      .from('cases')
      .select('*')
      .eq('room_code', joinCode)
      .single();

    if (error || !caseRecord) {
      setJoinError('Case not found. Check the room code and try again.');
      setIsLoading(false);
      return;
    }

    if (caseRecord.party_b_session && caseRecord.party_b_session !== sessionId) {
      setJoinError('This case already has two parties.');
      setIsLoading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from('cases')
      .update({ party_b_session: sessionId, phase: 'statements' })
      .eq('id', caseRecord.id);

    if (updateError) {
      setJoinError('Failed to join case. Try again.');
      setIsLoading(false);
      return;
    }

    // Fetch existing responses
    const { data: existingResponses } = await supabase
      .from('responses')
      .select('*')
      .eq('case_id', caseRecord.id)
      .order('created_at', { ascending: true });

    if (existingResponses) {
      setResponses(existingResponses);
      existingResponses.forEach((r: any) => processedResponseIds.current.add(r.id));
    }

    setCaseId(caseRecord.id);
    setRoomCode(caseRecord.room_code);
    setMyRole('B');
    setIsMultiplayer(true);
    setCaseData({
      title: caseRecord.title,
      category: caseRecord.category,
      judge: caseRecord.judge,
      stakes: caseRecord.stakes,
      partyA: caseRecord.party_a_name,
      partyB: caseRecord.party_b_name,
      statementA: caseRecord.statement_a || '',
      statementB: caseRecord.statement_b || ''
    });
    setCredibilityA(caseRecord.credibility_a || 50);
    setCredibilityB(caseRecord.credibility_b || 50);
    setPhase('statements');
    setCurrentParty('A');
    setIsLoading(false);

    subscribeToCase(caseRecord.id);
  };

  const handleCreateCase = async () => {
    setIsLoading(true);
    const newCase = await createCase();

    if (newCase) {
      setCaseId(newCase.id);
      setRoomCode(newCase.room_code);
      setMyRole('A');
      setIsMultiplayer(true);
      setPhase('waiting-room');
      subscribeToCase(newCase.id);
    }

    setIsLoading(false);
  };

  const subscribeToCase = (caseIdToSubscribe: string) => {
    // Clean up any existing subscription first
    if (subscriptionCleanup.current) {
      subscriptionCleanup.current();
      subscriptionCleanup.current = null;
    }

    const channel = supabase
      .channel(`case:${caseIdToSubscribe}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cases',
          filter: `id=eq.${caseIdToSubscribe}`
        },
        (payload: any) => {
          console.log('Case updated:', payload);
          // Use ref to always call latest version (fixes stale closure)
          handleCaseUpdateRef.current(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'responses',
          filter: `case_id=eq.${caseIdToSubscribe}`
        },
        (payload: any) => {
          console.log('New response from subscription:', payload);
          // Only add if we haven't already processed this response
          if (payload.new && payload.new.id && !processedResponseIds.current.has(payload.new.id)) {
            processedResponseIds.current.add(payload.new.id);
            setResponses(prev => [...prev, payload.new]);
          }
        }
      )
      .subscribe();

    // Set up broadcast channel for typing indicator
    const typingChannel = supabase
      .channel(`typing:${caseIdToSubscribe}`)
      .on('broadcast', { event: 'typing' }, (payload: any) => {
        // Only show typing indicator if it's from the other player
        // Use ref to get current myRole (fixes stale closure)
        if (payload.payload?.party !== myRoleRef.current) {
          setIsOtherTyping(true);

          // Clear any existing timeout
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }

          // Hide typing indicator after 2 seconds of no typing
          typingTimeoutRef.current = setTimeout(() => {
            setIsOtherTyping(false);
          }, 2000);
        }
      })
      .subscribe();

    // Store the broadcast channel ref for sending typing events
    broadcastChannelRef.current = typingChannel;

    // Store the cleanup function
    subscriptionCleanup.current = () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(typingChannel);
      broadcastChannelRef.current = null;
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  };

  const handleCaseUpdate = (updatedCase: any) => {
    if (!updatedCase) return;

    const newRound = updatedCase.exam_round || 0;
    const newTarget = updatedCase.exam_target || 'A';
    const newQuestion = updatedCase.current_question || '';
    const newPhase = updatedCase.phase || phase;
    const newQuestionKey = `${newRound}-${newTarget}`;

    console.log('[CaseUpdate] Received update:', {
      newRound,
      newTarget,
      newQuestion: newQuestion ? newQuestion.substring(0, 30) + '...' : 'none',
      newPhase,
      myRole,
      isGenerating: isGeneratingQuestion.current,
      questionTargetRef: questionTargetRef.current
    });

    setCaseData(prev => ({
      ...prev,
      statementA: updatedCase.statement_a || prev.statementA,
      statementB: updatedCase.statement_b || prev.statementB
    }));

    // Only update credibility from database if we're NOT the one who just changed it
    if (myRole !== examTarget) {
      if (updatedCase.credibility_a !== undefined && updatedCase.credibility_a !== null) {
        setCredibilityA(updatedCase.credibility_a);
      }
      if (updatedCase.credibility_b !== undefined && updatedCase.credibility_b !== null) {
        setCredibilityB(updatedCase.credibility_b);
      }
    }

    setExamRound(newRound);
    setExamTarget(newTarget);

    // Handle question updates
    console.log('[CaseUpdate] Question check:', {
      isGenerating: isGeneratingQuestion.current,
      newQuestion: !!newQuestion,
      newPhase,
      myRole,
      newTarget,
      myRoleMatchesTarget: myRole === newTarget,
      questionTargetRef: questionTargetRef.current,
      newQuestionKey
    });

    if (isGeneratingQuestion.current) {
      console.log('[CaseUpdate] Skip - currently generating');
    } else if (newQuestion) {
      // We received a question from the database
      console.log('[CaseUpdate] Received question from DB');
      setCurrentQuestion(newQuestion);
      questionTargetRef.current = newQuestionKey;
      lastQuestionGenTime.current = Date.now();
      setCanObjectToQuestion(true);
      setObjectionWindow({ type: 'question', content: newQuestion, targetParty: newTarget });
    } else if (newPhase === 'crossExam' && myRole === newTarget) {
      // No question, it's crossExam, and it's OUR turn to generate
      // Check if we already generated for this slot
      if (questionTargetRef.current !== newQuestionKey && !isGeneratingQuestion.current) {
        console.log('[CaseUpdate] Our turn to generate question for', newQuestionKey);
        // Small delay to let state settle before generating
        setTimeout(() => {
          console.log('[CaseUpdate] Timeout fired, checking again:', {
            isGenerating: isGeneratingQuestion.current,
            questionTargetRef: questionTargetRef.current,
            newQuestionKey
          });
          if (!isGeneratingQuestion.current && questionTargetRef.current !== newQuestionKey) {
            generateNewQuestion(newTarget, newRound);
          } else {
            console.log('[CaseUpdate] Skipped generation in timeout');
          }
        }, 100);
      } else {
        console.log('[CaseUpdate] Already generated for this slot or currently generating');
      }
    } else {
      console.log('[CaseUpdate] Not our turn or not crossExam phase');
    }

    setObjectionsUsed({
      A: updatedCase.objections_used_a || false,
      B: updatedCase.objections_used_b || false
    });

    if (updatedCase.party_b_session && !otherPlayerJoined) {
      setOtherPlayerJoined(true);
      if (phase === 'waiting-room' && myRole === 'A') {
        setPhase('statements');
        setCurrentParty('A');
      }
    }

    if (newPhase && newPhase !== phase && newPhase !== 'waiting') {
      console.log('[CaseUpdate] Phase change from', phase, 'to', newPhase);
      setPhase(newPhase);
    }

    if (newPhase === 'statements') {
      setCurrentParty(updatedCase.current_turn);
    }

    // Handle verdict updates from other player
    if (updatedCase.verdict) {
      // Check if this is a FULL verdict (has winnerName and reasoning) vs just a snap judgment notification
      const isFullVerdict = updatedCase.verdict.winnerName && updatedCase.verdict.reasoning;

      if (isFullVerdict) {
        // This is a complete verdict - set it directly
        console.log('[CaseUpdate] Received full verdict from other player');
        setVerdict(updatedCase.verdict);
        setShowSnapJudgment(false); // Hide snap judgment if showing
      } else if (updatedCase.verdict.isSnapJudgment && !showSnapJudgment) {
        // This is just a snap judgment notification (no full verdict yet)
        console.log('[CaseUpdate] Received snap judgment notification from other player');
        setSnapJudgment(updatedCase.verdict);
        setShowSnapJudgment(true);
      }
    }
  };

  // Keep ref updated so subscription always calls latest version
  handleCaseUpdateRef.current = handleCaseUpdate;

  const updateCase = async (updates: any) => {
    if (!caseId) return;

    const { error } = await supabase
      .from('cases')
      .update(updates)
      .eq('id', caseId);

    if (error) {
      console.error('Error updating case:', error);
    }
  };

  const addResponse = async (responseData: any) => {
    if (!caseId) return null;

    const { data, error } = await supabase
      .from('responses')
      .insert({ case_id: caseId, ...responseData })
      .select()
      .single();

    if (error) {
      console.error('Error adding response:', error);
      return null;
    }

    // Mark this response as processed so we don't duplicate from subscription
    if (data && data.id) {
      processedResponseIds.current.add(data.id);
    }

    return data;
  };

  // ========== GAME LOGIC ==========

  const handleObjectionSubmit = async (objectionData: any) => {
    setShowObjectionModal(false);
    setIsLoading(true);
    setLoadingState('objection');

    const isQuestionObjection = objectionData.isQuestionObjection;
    const objectorParty = isQuestionObjection ? examTarget : watchingParty;
    const objectorName = objectorParty === 'A' ? caseData.partyA : caseData.partyB;

    const objection = {
      objector: objectorName,
      target: isQuestionObjection ? 'Judge' : targetName,
      type: objectionData.type,
      reason: objectionData.reason,
      isQuestionObjection
    };

    const contentToJudge = isQuestionObjection ? currentQuestion : (objectionWindow?.content || currentResponse);

    const ruling = await ruleOnObjection(
      caseData.judge,
      caseData,
      responses,
      objection,
      contentToJudge,
      objections
    );

    const fullObjection = { ...objection, ...ruling };
    setObjections(prev => [...prev, fullObjection]);
    setObjectionsUsed(prev => ({ ...prev, [objectorParty]: true }));

    if (ruling.sustained && !isQuestionObjection) {
      if (objectorParty === 'A') {
        setCredibilityB(prev => Math.max(5, prev - 10));
      } else {
        setCredibilityA(prev => Math.max(5, prev - 10));
      }
    }

    setCurrentObjectionRuling({ ...ruling, objector: objectorName, type: objection.type });
    setIsLoading(false);
    setCanObjectToQuestion(false);
    setObjectionWindow(null);

    if (isMultiplayer) {
      await updateCase({
        [`objections_used_${objectorParty.toLowerCase()}`]: true,
        credibility_a: objectorParty === 'B' && ruling.sustained ? Math.max(5, credibilityA - 10) : credibilityA,
        credibility_b: objectorParty === 'A' && ruling.sustained ? Math.max(5, credibilityB - 10) : credibilityB
      });
    }
  };

  const handleObjectionRulingContinue = () => {
    const ruling = currentObjectionRuling;
    setCurrentObjectionRuling(null);

    if (ruling?.sustained && objectionWindow?.type === 'question') {
      setCurrentQuestion('');
    }
  };

  // Function to generate a new question - called explicitly, not via useEffect
  const generateNewQuestion = async (targetParty: string, round: number) => {
    const now = Date.now();

    // Skip if already generating
    if (isGeneratingQuestion.current) {
      console.log('[QuestionGen] Already generating, skipping');
      return;
    }

    // Skip if within cooldown period (prevents rapid re-triggers from subscriptions)
    if (now - lastQuestionGenTime.current < QUESTION_GEN_COOLDOWN) {
      console.log('[QuestionGen] Within cooldown period, skipping. Time since last:', now - lastQuestionGenTime.current, 'ms');
      return;
    }

    const questionKey = `${round}-${targetParty}`;

    // Skip if we already generated for this slot
    if (questionTargetRef.current === questionKey) {
      console.log('[QuestionGen] Already generated for', questionKey, 'skipping');
      return;
    }

    console.log('[QuestionGen] Starting generation for', questionKey);

    // Set all locks BEFORE any async operation
    isGeneratingQuestion.current = true;
    lastQuestionGenTime.current = now;
    questionTargetRef.current = questionKey; // Set this early to prevent race conditions

    setIsLoading(true);
    setLoadingState('question');
    setCanObjectToQuestion(false);

    try {
      console.log('[QuestionGen] Calling AI...');
      const question = await generateMainQuestion(
        caseData.judge, caseData, responses, round, targetParty, objections
      );

      // After AI returns, check if we're still the active generation
      if (questionTargetRef.current !== questionKey) {
        console.log('[QuestionGen] Generation superseded, discarding result');
        return;
      }

      const finalQuestion = question || `${targetParty === 'A' ? caseData.partyA : caseData.partyB}, can you explain your side of what happened?`;

      console.log('[QuestionGen] Generated:', finalQuestion.substring(0, 50) + '...');

      setCurrentQuestion(finalQuestion);
      setClarificationCount(0);
      setCanObjectToQuestion(true);
      setObjectionWindow({ type: 'question', content: finalQuestion, targetParty });

      if (isMultiplayer) {
        console.log('[QuestionGen] Saving to database...');
        await updateCase({ current_question: finalQuestion });
        console.log('[QuestionGen] Saved to database');
      }
    } catch (error) {
      console.error('[QuestionGen] Failed:', error);
      const fallbackQuestion = `${targetParty === 'A' ? caseData.partyA : caseData.partyB}, please explain your version of events.`;
      setCurrentQuestion(fallbackQuestion);
      setCanObjectToQuestion(true);
    } finally {
      isGeneratingQuestion.current = false;
      setIsLoading(false);
      console.log('[QuestionGen] Complete for', questionKey);
    }
  };

  // Question generation is now called EXPLICITLY, not via useEffect
  // This prevents race conditions from multiple state changes triggering generation
  // Generation is called from:
  // 1. handleStatementSubmit - when entering crossExam phase
  // 2. handleResponseSubmit - after transitioning to next party (if not going to verdict)
  // 3. handleCaseUpdate - when we become the examTarget in multiplayer

  // Generate verdict
  useEffect(() => {
    if (phase === 'verdict' && !verdict) {
      setIsLoading(true);
      setLoadingState('verdict');

      generateAIVerdict(caseData.judge, caseData, responses, credibilityA, credibilityB, objections)
        .then(async (v) => {
          setVerdict(v);

          if (isMultiplayer) {
            await updateCase({ verdict: v });
          }
        })
        .catch((error) => {
          console.error('Failed to generate verdict:', error);
          // Set a fallback verdict so the UI doesn't get stuck
          setVerdict({
            winner: credibilityA >= credibilityB ? 'A' : 'B',
            winnerName: credibilityA >= credibilityB ? caseData.partyA : caseData.partyB,
            loserName: credibilityA >= credibilityB ? caseData.partyB : caseData.partyA,
            summary: 'The judge has reached a decision based on the evidence presented.',
            reasoning: 'Based on the credibility scores and testimony provided.',
            quotes: [],
            credibilityImpact: 'Credibility was a determining factor.'
          });
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [phase]);

const handleResponseSubmit = async () => {
  // Set processing flag to prevent useEffect from triggering during transition
  isProcessingResponse.current = true;
  console.log('[ResponseSubmit] Started processing');

  const savedResponse = currentResponse; // Save it before clearing
  setCurrentResponse(''); // Clear immediately

  const newResponse = {
    round: examRound,
    party: examTarget,
    party_name: examTarget === 'A' ? caseData.partyA : caseData.partyB,
    question: currentQuestion,
    answer: savedResponse,
    is_clarification: isClarifying
  };

    // Add to local state first
    const updatedResponses = [...responses, newResponse];
    setResponses(updatedResponses);

    // Save to database (this will mark it as processed to avoid duplicates)
    if (isMultiplayer) {
      await addResponse(newResponse);
    }

    setCanObjectToQuestion(false);
    setObjectionWindow(null);

    setIsLoading(true);
    setLoadingState('credibility');

    // Wrap AI calls in try-catch to ensure we always progress
    let newCredA = credibilityA;
    let newCredB = credibilityB;

    try {
      const currentCred = examTarget === 'A' ? credibilityA : credibilityB;
      const credEval = await evaluateCredibility(
        caseData, updatedResponses, examTarget, savedResponse, currentQuestion, currentCred
      );

      // Use fallback values if credEval is malformed
      const credChange = credEval?.newCredibility ?? currentCred;
      newCredA = examTarget === 'A' ? credChange : credibilityA;
      newCredB = examTarget === 'B' ? credChange : credibilityB;

      if (examTarget === 'A') {
        setCredibilityA(credChange);
      } else {
        setCredibilityB(credChange);
      }

      setCredibilityHistory(prev => [...prev, {
        party: examTarget,
        name: newResponse.party_name,
        response: savedResponse.substring(0, 50) + '...',
        change: credEval?.change ?? 0,
        newScore: credChange,
        analysis: credEval?.analysis ?? 'Response recorded.',
        flagged: credEval?.flagged ?? null
      }]);
    } catch (error) {
      console.error('Credibility evaluation failed:', error);
      // Continue with unchanged credibility
    }

    // Check for snap judgment but don't let it block progression
    try {
      setLoadingState('snapJudgment');
      const snapCheck = await checkForSnapJudgment(
        caseData.judge, caseData, updatedResponses, examTarget, savedResponse, newCredA, newCredB, objections
      );

      if (snapCheck?.triggered) {
        console.log('[ResponseSubmit] Snap judgment triggered!', snapCheck);
        setSnapJudgment(snapCheck);
        setShowSnapJudgment(true);
        setIsLoading(false);
        isProcessingResponse.current = false;

        // Save snap judgment to database so other player sees it
        if (isMultiplayer) {
          await updateCase({
            phase: 'snapJudgment',
            verdict: {
              isSnapJudgment: true,
              ...snapCheck
            }
          });
        }
        return;
      }
    } catch (error) {
      console.error('Snap judgment check failed:', error);
      // Continue without snap judgment
    }

    // Calculate next state
    let nextTarget = examTarget;
    let nextRound = examRound;
    let nextPhase = 'crossExam';

    if (examTarget === 'A') {
      nextTarget = 'B';
    } else if (examRound < 2) {
      nextRound = examRound + 1;
      nextTarget = 'A';
    } else {
      nextPhase = 'verdict';
    }

    console.log('[ResponseSubmit] Transitioning from', examTarget, 'round', examRound, 'to', nextTarget, 'round', nextRound, 'phase', nextPhase);

    // Update database first (in multiplayer)
    if (isMultiplayer) {
      await updateCase({
        credibility_a: newCredA,
        credibility_b: newCredB,
        exam_round: nextRound,
        exam_target: nextTarget,
        current_question: '',
        phase: nextPhase
      });
    }

    // Update local state
    setIsLoading(false);
    setCurrentResponse('');
    setCurrentQuestion('');
    setIsClarifying(false);
    setClarificationCount(0);
    questionTargetRef.current = null;

    // Update exam state
    setExamRound(nextRound);
    setExamTarget(nextTarget);

    if (nextPhase === 'verdict') {
      console.log('[ResponseSubmit] Moving to verdict phase');
      setPhase('verdict');
    } else {
      // Generate next question
      if (isMultiplayer) {
        // In multiplayer, the new examTarget player generates via subscription
        // We just need to clear our state - they will generate
        console.log('[ResponseSubmit] Multiplayer - other player will generate');
      } else {
        // In single player, we generate the next question immediately
        console.log('[ResponseSubmit] Single player - generating next question');
        // Small delay to let state settle
        setTimeout(() => {
          generateNewQuestion(nextTarget, nextRound);
        }, 100);
      }
    }

    // Clear processing flag after a delay
    setTimeout(() => {
      isProcessingResponse.current = false;
      console.log('[ResponseSubmit] Finished processing');
    }, 500);
  };

  const handleStatementSubmit = async () => {
    if (isMultiplayer) {
      const isPartyA = currentParty === 'A';
      const updates = isPartyA
        ? { statement_a: caseData.statementA, current_turn: 'B' }
        : { statement_b: caseData.statementB, phase: 'crossExam', current_turn: 'A', exam_target: 'A' };

      await updateCase(updates);

      if (!isPartyA) {
        setPhase('crossExam');
        // In multiplayer, Party A generates the first question (via subscription update)
        // Party B just waits
      }
    } else {
      // Single player mode
      if (currentParty === 'A') {
        setCurrentParty('B');
      } else {
        setPhase('crossExam');
        // Generate first question immediately in single player
        console.log('[StatementSubmit] Entering crossExam, generating first question');
        generateNewQuestion('A', 0);
      }
    }
  };

  const resetCase = () => {
    setPhase('home');
    setCaseData({ title: '', category: '', judge: 'judy', partyA: '', partyB: '', statementA: '', statementB: '', stakes: '' });
    setCurrentParty('A');
    setExamRound(0);
    setExamTarget('A');
    setCurrentQuestion('');
    setCurrentResponse('');
    setResponses([]);
    setVerdict(null);
    setVerdictAccepted(null);
    setTranscriptOpen(false);
    setCredibilityA(50);
    setCredibilityB(50);
    setClarificationCount(0);
    setIsClarifying(false);
    setObjections([]);
    setObjectionsUsed({ A: false, B: false });
    setShowObjectionModal(false);
    setCurrentObjectionRuling(null);
    setSnapJudgment(null);
    setShowSnapJudgment(false);
    setCredibilityHistory([]);
    setObjectionWindow(null);
    setCanObjectToQuestion(false);
    setRoomCode('');
    setCaseId(null);
    setMyRole(null);
    setJoinCode('');
    setJoinError('');
    setIsMultiplayer(false);
    setOtherPlayerJoined(false);
    setIsOtherTyping(false);
    processedResponseIds.current.clear();
    isGeneratingQuestion.current = false;
    questionTargetRef.current = null;
    lastTypingBroadcast.current = 0;
    lastQuestionGenTime.current = 0;
    isProcessingResponse.current = false;
    // Clean up subscription
    if (subscriptionCleanup.current) {
      subscriptionCleanup.current();
      subscriptionCleanup.current = null;
    }
  };

  // ========== RENDER ==========

  // OBJECTION MODAL - Show immediately when triggered, regardless of phase
  if (showObjectionModal) {
    return (
      <ObjectionModal
        isOpen={showObjectionModal}
        onClose={() => {
          setShowObjectionModal(false);
          setObjectionWindow(null);
        }}
        onSubmit={handleObjectionSubmit}
        objectorName={targetName}
        targetName="Judge"
        isQuestionObjection={objectionWindow?.type === 'question'}
        objectionTarget={objectionWindow?.content}
      />
    );
  }

  // OBJECTION RULING - Show immediately when there's a ruling
  if (currentObjectionRuling) {
    return (
      <ObjectionRuling ruling={currentObjectionRuling} onContinue={handleObjectionRulingContinue} />
    );
  }

  // SNAP JUDGMENT - Show immediately when triggered, regardless of phase
  if (showSnapJudgment && snapJudgment) {
    return (
      <SnapJudgmentDisplay
        judgment={snapJudgment}
        onContinue={async () => {
          setShowSnapJudgment(false);
          setIsLoading(true);
          setLoadingState('verdict');
          setPhase('verdict');

          try {
            // Generate a FULL AI verdict (not just snap judgment summary)
            const fullVerdict = await generateAIVerdict(
              caseData.judge,
              caseData,
              responses,
              credibilityA,
              credibilityB,
              objections
            );

            // Mark it as originating from snap judgment
            const verdictWithSnapFlag = {
              ...fullVerdict,
              isSnapJudgment: true,
              snapReason: snapJudgment.reason
            };

            setVerdict(verdictWithSnapFlag);

            // Update database in multiplayer
            if (isMultiplayer) {
              await updateCase({
                phase: 'verdict',
                verdict: verdictWithSnapFlag
              });
            }
          } catch (error) {
            console.error('Failed to generate verdict after snap judgment:', error);
            // Fallback to simplified verdict if AI fails
            const fallbackVerdict = {
              winner: snapJudgment.winner === caseData.partyA ? 'A' : 'B',
              winnerName: snapJudgment.winner,
              loserName: snapJudgment.winner === caseData.partyA ? caseData.partyB : caseData.partyA,
              summary: snapJudgment.reason || 'Case decided by snap judgment.',
              reasoning: `Snap judgment: ${snapJudgment.reason}`,
              quotes: [],
              credibilityImpact: 'Credibility difference led to early judgment.',
              isSnapJudgment: true
            };
            setVerdict(fallbackVerdict);

            if (isMultiplayer) {
              await updateCase({
                phase: 'verdict',
                verdict: fallbackVerdict
              });
            }
          } finally {
            setIsLoading(false);
          }
        }}
      />
    );
  }

  // HOME
  if (phase === 'home') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="text-6xl mb-4">⚖️</div>
          <h1 className="text-4xl font-bold text-white mb-2">Judge Judy AI</h1>
          <p className="text-slate-400 mb-8">Settle disputes. Real stakes. No lawyers.</p>

          <div className="space-y-3 mb-6">
            <button
              onClick={() => setPhase('create')}
              className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-4 px-8 rounded-lg text-lg"
            >
              🆕 Create New Case
            </button>
            <button
              onClick={() => setPhase('join')}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-4 px-8 rounded-lg text-lg"
            >
              🔗 Join Existing Case
            </button>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-4 mb-6">
            <div className="text-slate-400 text-sm">
              <span className="text-amber-400">✨ Multiplayer:</span> Create a case and share the room code with the other party!
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div className="bg-slate-800 rounded-lg p-3"><div className="text-xl mb-1">📝</div><div className="text-slate-400 text-xs">Present</div></div>
            <div className="bg-slate-800 rounded-lg p-3"><div className="text-xl mb-1">🔥</div><div className="text-slate-400 text-xs">Grilled</div></div>
            <div className="bg-slate-800 rounded-lg p-3"><div className="text-xl mb-1">⚠️</div><div className="text-slate-400 text-xs">Object</div></div>
            <div className="bg-slate-800 rounded-lg p-3"><div className="text-xl mb-1">🏆</div><div className="text-slate-400 text-xs">Win</div></div>
          </div>
        </div>
      </div>
    );
  }

  // JOIN
  if (phase === 'join') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <button onClick={() => setPhase('home')} className="text-slate-400 hover:text-white mb-6">← Back</button>

          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🔗</div>
            <h2 className="text-2xl font-bold text-white mb-2">Join a Case</h2>
            <p className="text-slate-400">Enter the room code shared by the other party</p>
          </div>

          <div className="mb-6">
            <label className="block text-slate-300 mb-2 text-center">Room Code</label>
            <input
              type="text"
              placeholder="e.g., JUDY7X"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-4 text-white text-center text-2xl tracking-widest uppercase"
            />
          </div>

          {joinError && (
            <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 mb-4 text-center text-red-400">
              {joinError}
            </div>
          )}

          <button
            onClick={handleJoinCase}
            disabled={joinCode.length !== 6 || isLoading}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-slate-700 disabled:text-slate-500 text-black font-bold py-4 rounded-lg text-lg"
          >
            {isLoading ? 'Joining...' : 'Join Case →'}
          </button>
        </div>
      </div>
    );
  }

  // CREATE
  if (phase === 'create') {
    return (
      <div className="min-h-screen bg-slate-900 p-4">
        <div className="max-w-lg mx-auto">
          <button onClick={() => setPhase('home')} className="text-slate-400 hover:text-white mb-6">← Back</button>
          <h2 className="text-2xl font-bold text-white mb-6">File a New Case</h2>

          <div className="mb-4">
            <label className="block text-slate-300 mb-2">What's the dispute?</label>
            <input type="text" placeholder="e.g., Who ate my leftover pizza" value={caseData.title} onChange={(e) => setCaseData({...caseData, title: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white" />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div><label className="block text-slate-300 mb-2">Party A (You)</label><input type="text" placeholder="Your name" value={caseData.partyA} onChange={(e) => setCaseData({...caseData, partyA: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white" /></div>
            <div><label className="block text-slate-300 mb-2">Party B (Opponent)</label><input type="text" placeholder="Their name" value={caseData.partyB} onChange={(e) => setCaseData({...caseData, partyB: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white" /></div>
          </div>

          <div className="mb-4">
            <label className="block text-slate-300 mb-2">🏆 What's at stake?</label>
            <input type="text" placeholder="e.g., Loser buys dinner" value={caseData.stakes} onChange={(e) => setCaseData({...caseData, stakes: e.target.value})} className="w-full bg-slate-800 border border-amber-500/50 rounded-lg px-4 py-3 text-white" />
            <div className="flex flex-wrap gap-2 mt-3">
              {SUGGESTED_STAKES.map((stake, i) => (
                <button key={i} onClick={() => setCaseData({...caseData, stakes: stake})} className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-400 px-3 py-1 rounded-full border border-slate-700">{stake}</button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-slate-300 mb-2">Category</label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map(cat => (<button key={cat.id} onClick={() => setCaseData({...caseData, category: cat.id})} className={`p-3 rounded-lg border text-left ${caseData.category === cat.id ? 'bg-amber-500/20 border-amber-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>{cat.label}</button>))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-slate-300 mb-2">Choose Your Judge</label>
            <div className="space-y-2">
              {Object.entries(JUDGE_PERSONALITIES).map(([id, judge]) => (<button key={id} onClick={() => setCaseData({...caseData, judge: id})} className={`w-full p-4 rounded-lg border text-left ${caseData.judge === id ? 'bg-amber-500/20 border-amber-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300'}`}><div className="font-bold">{judge.name}</div><div className="text-sm text-slate-400">{judge.tagline}</div></button>))}
            </div>
          </div>

          <button
            onClick={handleCreateCase}
            disabled={!caseData.title || !caseData.category || !caseData.partyA || !caseData.partyB || !caseData.stakes || isLoading}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-slate-700 disabled:text-slate-500 text-black font-bold py-4 rounded-lg"
          >
            {isLoading ? 'Creating...' : 'Create Case & Get Room Code →'}
          </button>
        </div>
      </div>
    );
  }

  // WAITING ROOM
  if (phase === 'waiting-room') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="text-5xl mb-4">🔗</div>
          <h2 className="text-2xl font-bold text-white mb-2">Share This Code</h2>
          <p className="text-slate-400 mb-6">Send this code to {caseData.partyB} so they can join</p>

          <div className="bg-slate-800 rounded-lg p-6 mb-6">
            <div className="text-slate-400 text-sm mb-2">ROOM CODE</div>
            <div className="text-5xl font-bold text-amber-400 tracking-widest mb-4">{roomCode}</div>
            <div className="space-y-3">
              <button
                onClick={() => navigator.clipboard.writeText(roomCode)}
                className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm w-full"
              >
                📋 Copy Code
              </button>
              <button
                onClick={() => {
                  const shareUrl = `${window.location.origin}?room=${roomCode}`;
                  navigator.clipboard.writeText(shareUrl);
                }}
                className="bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 rounded-lg text-sm font-bold w-full"
              >
                🔗 Copy Share Link
              </button>
            </div>
            
            <div className="mt-4 text-slate-500 text-xs break-all">
              {typeof window !== 'undefined' && `${window.location.origin}?room=${roomCode}`}
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center gap-3">
              <div className="animate-pulse text-2xl">⏳</div>
              <div className="text-slate-300">Waiting for {caseData.partyB} to join...</div>
            </div>
          </div>

          <div className="text-slate-500 text-sm">
            Case: "{caseData.title}"<br/>
            You are: <span className="text-blue-400">{caseData.partyA}</span> (Party A)
          </div>

          <button onClick={resetCase} className="mt-6 text-slate-500 hover:text-slate-300 text-sm">Cancel</button>
        </div>
      </div>
    );
  }

  // STATEMENTS
  if (phase === 'statements') {
    const isMyTurn = isMultiplayer ? (myRole === currentParty) : true;
    const isPartyA = currentParty === 'A';
    const currentName = isPartyA ? caseData.partyA : caseData.partyB;
    const currentStatement = isPartyA ? caseData.statementA : caseData.statementB;
    const handleStatementChange = (value: string) => {
      setCaseData({...caseData, [isPartyA ? 'statementA' : 'statementB']: value});
      broadcastTyping();
    };

    if (isMultiplayer && !isMyTurn) {
      const waitingForName = currentParty === 'A' ? caseData.partyA : caseData.partyB;
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <div className="bg-slate-800 rounded-lg p-4 mb-6">
              <div className="text-amber-500 text-sm font-medium">OPENING STATEMENTS</div>
              <div className="text-white font-bold text-lg">{caseData.title}</div>
              <div className="text-slate-500 text-xs mt-1">Room: {roomCode}</div>
            </div>

            {isOtherTyping ? (
              <>
                <div className="text-5xl mb-4">✍️</div>
                <h2 className="text-xl font-bold text-white mb-2">{waitingForName} is typing...</h2>
                <div className="flex justify-center gap-1 mb-6">
                  <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </>
            ) : (
              <>
                <div className="text-5xl mb-4 animate-pulse">⏳</div>
                <h2 className="text-xl font-bold text-white mb-2">Waiting for {waitingForName}</h2>
                <p className="text-slate-400 mb-6">They're writing their opening statement...</p>
              </>
            )}

            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-slate-400 text-sm">
                You are: <span className={myRole === 'A' ? 'text-blue-400' : 'text-red-400'}>{myRole === 'A' ? caseData.partyA : caseData.partyB}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-900 p-4">
        <div className="max-w-lg mx-auto">
          <div className="bg-slate-800 rounded-lg p-4 mb-6">
            <div className="text-amber-500 text-sm font-medium">OPENING STATEMENTS</div>
            <div className="text-white font-bold text-lg">{caseData.title}</div>
            {isMultiplayer && <div className="text-slate-500 text-xs mt-1">Room: {roomCode}</div>}
          </div>

          <StakesBadge stakes={caseData.stakes} />

          <div className="mb-6">
            <div className="flex gap-2">
              <div className={`flex-1 p-4 rounded-lg text-center transition-all ${isPartyA ? 'bg-blue-500/20 border-2 border-blue-500 scale-105' : caseData.statementA ? 'bg-green-500/10 border border-green-500/30' : 'bg-slate-800/50 border border-slate-700 opacity-50'}`}>
                <div className={`text-xs mb-1 ${isPartyA ? 'text-blue-400' : caseData.statementA ? 'text-green-400' : 'text-slate-500'}`}>
                  {isPartyA ? '✍️ WRITING' : caseData.statementA ? '✓ DONE' : 'WAITING'}
                </div>
                <div className={`font-bold text-lg ${isPartyA ? 'text-blue-400' : caseData.statementA ? 'text-green-400' : 'text-slate-500'}`}>{caseData.partyA}</div>
              </div>
              <div className="flex items-center text-slate-600 font-bold">vs</div>
              <div className={`flex-1 p-4 rounded-lg text-center transition-all ${!isPartyA ? 'bg-red-500/20 border-2 border-red-500 scale-105' : caseData.statementB ? 'bg-green-500/10 border border-green-500/30' : 'bg-slate-800/50 border border-slate-700 opacity-50'}`}>
                <div className={`text-xs mb-1 ${!isPartyA ? 'text-red-400' : caseData.statementB ? 'text-green-400' : 'text-slate-500'}`}>
                  {!isPartyA ? '✍️ WRITING' : caseData.statementB ? '✓ DONE' : 'WAITING'}
                </div>
                <div className={`font-bold text-lg ${!isPartyA ? 'text-red-400' : caseData.statementB ? 'text-green-400' : 'text-slate-500'}`}>{caseData.partyB}</div>
              </div>
            </div>
          </div>

          <div className={`rounded-lg border-2 p-4 mb-4 ${isPartyA ? 'border-blue-500/50 bg-blue-500/5' : 'border-red-500/50 bg-red-500/5'}`}>
            <div className="flex items-center gap-2 mb-3">
              <span className={`font-bold text-lg ${isPartyA ? 'text-blue-400' : 'text-red-400'}`}>{currentName}</span>
              <span className="text-slate-400 text-sm">— tell your side</span>
            </div>
            <textarea
              placeholder={`${currentName}, what happened? Tell the judge your version of events...`}
              value={currentStatement}
              onChange={(e) => handleStatementChange(e.target.value)}
              rows={6}
              className={`w-full bg-slate-800 border rounded-lg px-4 py-3 text-white placeholder-slate-500 resize-none ${isPartyA ? 'border-blue-500/30 focus:border-blue-500' : 'border-red-500/30 focus:border-red-500'}`}
            />
          </div>

          <button onClick={handleStatementSubmit} disabled={!currentStatement} className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-slate-700 disabled:text-slate-500 text-black font-bold py-4 rounded-lg">
            {isPartyA ? `Submit ${caseData.partyA}'s Statement → ${caseData.partyB}'s Turn` : `Submit ${caseData.partyB}'s Statement → Cross-Examination`}
          </button>
        </div>
      </div>
    );
  }

  // CROSS-EXAM
  if (phase === 'crossExam') {
    const isMyTurn = isMultiplayer ? (myRole === examTarget) : true;

if (isMultiplayer && !isMyTurn && !isLoading) {
      return (
        <div className="min-h-screen bg-slate-900 p-4">
          <div className="max-w-lg mx-auto">
            <div className="bg-slate-800 rounded-lg p-4 mb-4">
              <div className="text-amber-500 text-sm font-medium">{isClarifying ? '🔄 FOLLOW-UP' : `⚖️ ROUND ${examRound + 1} OF 3`}</div>
              <div className="text-white font-bold text-lg">{caseData.title}</div>
              <div className="text-slate-500 text-xs mt-1">Room: {roomCode}</div>
            </div>

            <CredibilityBar partyA={caseData.partyA} partyB={caseData.partyB} credibilityA={credibilityA} credibilityB={credibilityB} history={credibilityHistory} />

            <Transcript caseData={caseData} responses={responses} objections={objections} isOpen={transcriptOpen} onToggle={() => setTranscriptOpen(!transcriptOpen)} />

            {currentQuestion && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-left mb-4 mt-4">
                <div className="text-amber-500 text-sm font-medium mb-1">Judge's Question:</div>
                <div className="text-white">{currentQuestion}</div>
              </div>
            )}

            {/* Typing indicator below the question */}
            <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
              {isOtherTyping ? (
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg">✍️</span>
                  <span className="text-white font-medium">{targetName} is typing</span>
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg">⏳</span>
                  <span className="text-slate-400">Waiting for {targetName} to answer...</span>
                </div>
              )}
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-slate-400 text-sm text-center">
                You are: <span className={myRole === 'A' ? 'text-blue-400' : 'text-red-400'}>{myRole === 'A' ? caseData.partyA : caseData.partyB}</span>
                <span className="text-slate-500"> (watching)</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-900 p-4">
        <div className="max-w-lg mx-auto">
          <div className="bg-slate-800 rounded-lg p-4 mb-4">
            <div className="text-amber-500 text-sm font-medium">{isClarifying ? '🔄 FOLLOW-UP' : `⚖️ ROUND ${examRound + 1} OF 3`}</div>
            <div className="text-white font-bold text-lg">{caseData.title}</div>
            {isMultiplayer && <div className="text-slate-500 text-xs mt-1">Room: {roomCode}</div>}
          </div>

          <div className="mb-6">
            <div className="flex gap-2">
              <div className={`flex-1 p-4 rounded-lg text-center transition-all ${examTarget === 'A' ? 'bg-blue-500/20 border-2 border-blue-500 scale-105' : 'bg-slate-800/50 border border-slate-700 opacity-50'}`}>
                <div className={`text-xs mb-1 ${examTarget === 'A' ? 'text-blue-400' : 'text-slate-500'}`}>{examTarget === 'A' ? '🎤 ON THE STAND' : 'WAITING'}</div>
                <div className={`font-bold text-lg ${examTarget === 'A' ? 'text-blue-400' : 'text-slate-500'}`}>{caseData.partyA}</div>
              </div>
              <div className="flex items-center text-slate-600 font-bold">vs</div>
              <div className={`flex-1 p-4 rounded-lg text-center transition-all ${examTarget === 'B' ? 'bg-red-500/20 border-2 border-red-500 scale-105' : 'bg-slate-800/50 border border-slate-700 opacity-50'}`}>
                <div className={`text-xs mb-1 ${examTarget === 'B' ? 'text-red-400' : 'text-slate-500'}`}>{examTarget === 'B' ? '🎤 ON THE STAND' : 'WAITING'}</div>
                <div className={`font-bold text-lg ${examTarget === 'B' ? 'text-red-400' : 'text-slate-500'}`}>{caseData.partyB}</div>
              </div>
            </div>
          </div>

          <StakesBadge stakes={caseData.stakes} />
          <CredibilityBar partyA={caseData.partyA} partyB={caseData.partyB} credibilityA={credibilityA} credibilityB={credibilityB} history={credibilityHistory} />

          {isLoading ? (
            <LoadingOverlay emoji={loadingEmoji} message={loadingMessage} />
          ) : currentQuestion ? (
            <div className="space-y-4 mt-4">
              {/* Transcript above question */}
               <Transcript caseData={caseData} responses={responses} objections={objections} isOpen={transcriptOpen} onToggle={() => setTranscriptOpen(!transcriptOpen)} />
              
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                <div className="text-amber-500 text-sm font-medium mb-1">
                  {JUDGE_PERSONALITIES[caseData.judge as keyof typeof JUDGE_PERSONALITIES]?.name || 'Judge'}:
                </div>
                <div className="text-white">{currentQuestion}</div>
              </div>

              {canObjectToQuestion && !objectionsUsed[examTarget as 'A' | 'B'] && (
                <button
                  onClick={() => {
                    console.log('[Objection] Button clicked');
                    setObjectionWindow({ type: 'question', content: currentQuestion });
                    setShowObjectionModal(true);
                  }}
                  className="w-full bg-red-500/10 border border-red-500/30 text-red-400 py-2 rounded-lg text-sm hover:bg-red-500/20"
                >
                  ⚠️ {targetName}: Object to this question
                </button>
              )}

              <div className={`rounded-lg border-2 p-4 ${examTarget === 'A' ? 'border-blue-500/50 bg-blue-500/5' : 'border-red-500/50 bg-red-500/5'}`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`font-bold ${examTarget === 'A' ? 'text-blue-400' : 'text-red-400'}`}>{targetName}</span>
                  <span className="text-slate-400 text-sm">— your response</span>
                </div>
                <textarea
                  placeholder="Type your answer..."
                  value={currentResponse}
                  onChange={(e) => {
                    setCurrentResponse(e.target.value);
                    broadcastTyping();
                  }}
                  rows={4}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white resize-none"
                />
              </div>

              <button
                onClick={handleResponseSubmit}
                disabled={!currentResponse}
                className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-slate-700 disabled:text-slate-500 text-black font-bold py-4 rounded-lg"
              >
                Submit Response
              </button>
            </div>
          ) : (
            <LoadingOverlay emoji="📝" message="Preparing question..." />
          )}
        </div>
      </div>
    );
  }

  // VERDICT
  if (phase === 'verdict') {
    if (isLoading || !verdict) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="flex justify-center gap-2 mb-4">
              {['📚', '⚖️', '🤝', '📜', '🔨'].map((e, i) => (
                <span key={i} className="text-3xl animate-pulse" style={{ animationDelay: `${i * 0.2}s` }}>{e}</span>
              ))}
            </div>
            <div className="text-white text-xl mb-2">The judge is deliberating...</div>
            <div className="text-slate-400">{loadingMessage}</div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-900 p-4">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-6">
            <div className="text-5xl mb-4">⚖️</div>
            <h2 className="text-2xl font-bold text-white mb-2">THE VERDICT</h2>
            <p className="text-slate-400">{caseData.title}</p>
          </div>

          <div className="bg-gradient-to-b from-amber-500/20 to-transparent border border-amber-500/30 rounded-lg p-6 mb-6 text-center">
            <div className="text-amber-500 text-sm mb-2">WINNER</div>
            <div className="text-4xl font-bold text-white mb-2">{verdict.winnerName} 🏆</div>
            <div className="text-slate-300 italic">"{verdict.summary}"</div>
          </div>

          <div className="bg-slate-800 rounded-lg p-4 mb-6">
            <div className="text-slate-400 text-sm mb-2">JUDGE'S REASONING</div>
            <div className="text-white">{verdict.reasoning}</div>
          </div>

          {verdict.quotes?.length > 0 && (
            <div className="bg-slate-800/50 rounded-lg p-4 mb-6">
              <div className="text-slate-400 text-sm mb-2">KEY QUOTES</div>
              {verdict.quotes.map((q: string, i: number) => (
                <div key={i} className="text-slate-300 italic mb-2">"{q}"</div>
              ))}
            </div>
          )}

          <CredibilityBar partyA={caseData.partyA} partyB={caseData.partyB} credibilityA={credibilityA} credibilityB={credibilityB} history={credibilityHistory} />

          <StakesBadge stakes={caseData.stakes} />

          {verdictAccepted === null ? (
            <div className="space-y-3">
              <button onClick={() => setVerdictAccepted(true)} className="w-full bg-green-500 hover:bg-green-400 text-white font-bold py-4 rounded-lg">
                ✅ Accept Verdict
              </button>
              <button onClick={() => setVerdictAccepted(false)} className="w-full bg-red-500/20 border border-red-500 text-red-400 font-bold py-4 rounded-lg">
                ❌ Reject (No Appeal Available)
              </button>
            </div>
          ) : (
            <div className="text-center">
              <div className={`text-xl mb-4 ${verdictAccepted ? 'text-green-400' : 'text-red-400'}`}>
                {verdictAccepted ? '✅ Verdict Accepted' : '❌ Verdict Rejected'}
              </div>
              <button onClick={resetCase} className="bg-slate-700 hover:bg-slate-600 text-white px-8 py-3 rounded-lg">
                Start New Case
              </button>
            </div>
          )}

          <Transcript caseData={caseData} responses={responses} objections={objections} isOpen={transcriptOpen} onToggle={() => setTranscriptOpen(!transcriptOpen)} />
        </div>
      </div>
    );
  }

  // Modals
  return (
    <>
      {showObjectionModal && (
        <ObjectionModal
          isOpen={showObjectionModal}
          onClose={() => {
            setShowObjectionModal(false);
            setObjectionWindow(null);
          }}
          onSubmit={handleObjectionSubmit}
          objectorName={targetName}
          targetName="Judge"
          isQuestionObjection={objectionWindow?.type === 'question'}
          objectionTarget={objectionWindow?.content}
        />
      )}

      {currentObjectionRuling && (
        <ObjectionRuling ruling={currentObjectionRuling} onContinue={handleObjectionRulingContinue} />
      )}

      {showSnapJudgment && snapJudgment && (
        <SnapJudgmentDisplay
          judgment={snapJudgment}
          onContinue={() => {
            setShowSnapJudgment(false);
            setPhase('verdict');
          }}
        />
      )}

      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    </>
  );
}
