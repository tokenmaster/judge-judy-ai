'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase, generateRoomCode, getSessionId, getStats, incrementCasesFiled, incrementVerdictsAccepted, incrementVerdictsRejected, Stats, getCompletedCases, Case } from '@/lib/supabase';
import {
  JUDGE_PERSONALITIES,
  JUDGE_GIFS,
  CATEGORIES,
  SUGGESTED_STAKES,
  getRandomLoadingState,
  CATEGORY_GIFS,
  SITUATION_GIFS,
  getRandomGif,
  getCategoryGif,
  getSituationGif
} from '@/lib/constants';
import {
  generateMainQuestion,
  generateAIFollowUp,
  evaluateCredibility,
  checkForSnapJudgment,
  ruleOnObjection,
  generateAIVerdict,
  evaluateAppeal
} from '@/lib/ai';
import {
  ProgressIndicator,
  StakesBadge,
  CredibilityBar,
  Transcript,
  ObjectionModal,
  ObjectionRuling,
  SnapJudgmentDisplay,
  LoadingOverlay,
  ThinkingEmoji,
  TVFrame,
  ChannelBug,
  PartyNamePlate,
  RoundIndicator,
  TypewriterText
} from './ui';

export default function JudgeJudyGame({ initialRoomCode }: { initialRoomCode?: string | null }) {
  // Core state
  const [phase, setPhase] = useState('home');
  const [caseData, setCaseData] = useState({
    title: '', category: '', judge: 'joody',
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
  const [joinPreview, setJoinPreview] = useState<{ title: string; partyA: string; partyB: string; stakes: string } | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [otherPlayerJoined, setOtherPlayerJoined] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);

  // Game state
  const [verdict, setVerdict] = useState<any>(null);
  const [verdictAccepted, setVerdictAccepted] = useState<boolean | null>(null);
  const [transcriptOpen, setTranscriptOpen] = useState(false);

  // Appeal state
  const [showAppealForm, setShowAppealForm] = useState(false);
  const [appealArgument, setAppealArgument] = useState('');
  const [appealResult, setAppealResult] = useState<any>(null);
  const [isAppealing, setIsAppealing] = useState(false);
  const [appealAcknowledged, setAppealAcknowledged] = useState(false);
  const [credibilityA, setCredibilityA] = useState(100);
  const [credibilityB, setCredibilityB] = useState(100);
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

  // Stats state
  const [homeTab, setHomeTab] = useState<'main' | 'stats'>('main');
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Past verdicts state
  const [pastCases, setPastCases] = useState<Case[]>([]);
  const [pastCasesLoading, setPastCasesLoading] = useState(false);
  const [selectedPastCase, setSelectedPastCase] = useState<Case | null>(null);

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

// Fetch stats when on stats tab
const [statsError, setStatsError] = useState(false);

useEffect(() => {
  if (homeTab === 'stats' && !stats && !statsLoading && !statsError) {
    setStatsLoading(true);
    getStats()
      .then((data) => {
        setStats(data);
        setStatsLoading(false);
        if (!data) setStatsError(true);
      })
      .catch(() => {
        setStatsLoading(false);
        setStatsError(true);
      });
  }
}, [homeTab, stats, statsLoading, statsError]);

// Fetch past cases when on stats tab
useEffect(() => {
  if (homeTab === 'stats' && pastCases.length === 0 && !pastCasesLoading) {
    setPastCasesLoading(true);
    getCompletedCases(20)
      .then((data) => {
        setPastCases(data);
        setPastCasesLoading(false);
      })
      .catch(() => {
        setPastCasesLoading(false);
      });
  }
}, [homeTab, pastCases.length, pastCasesLoading]);

// Save session to sessionStorage when case changes
const saveSession = (caseIdToSave: string, role: string) => {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('judge_judy_case', JSON.stringify({ caseId: caseIdToSave, myRole: role }));
  }
};

const clearSession = () => {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('judge_judy_case');
  }
};

// Restore session on mount (handles page refresh)
useEffect(() => {
  const restoreSession = async () => {
    if (typeof window === 'undefined') return;

    const savedSession = sessionStorage.getItem('judge_judy_case');
    if (!savedSession) return;

    try {
      const { caseId: savedCaseId, myRole: savedRole } = JSON.parse(savedSession);
      if (!savedCaseId || !savedRole) return;

      // Fetch the case from database
      const { data: caseRecord, error } = await supabase
        .from('cases')
        .select('*')
        .eq('id', savedCaseId)
        .single();

      if (error || !caseRecord) {
        // Case no longer exists, clear session
        clearSession();
        return;
      }

      // Verify this session is still part of this case
      const isPartyA = caseRecord.party_a_session === sessionId;
      const isPartyB = caseRecord.party_b_session === sessionId;

      if (!isPartyA && !isPartyB) {
        // Session is no longer valid for this case
        clearSession();
        return;
      }

      // Fetch existing responses
      const { data: existingResponses } = await supabase
        .from('responses')
        .select('*')
        .eq('case_id', savedCaseId)
        .order('created_at', { ascending: true });

      if (existingResponses) {
        setResponses(existingResponses);
        existingResponses.forEach((r: any) => processedResponseIds.current.add(r.id));
      }

      // Restore all state from the case
      setCaseId(savedCaseId);
      setRoomCode(caseRecord.room_code);
      setMyRole(isPartyA ? 'A' : 'B');
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
      setCredibilityA(caseRecord.credibility_a ?? 100);
      setCredibilityB(caseRecord.credibility_b ?? 100);
      setExamRound(caseRecord.exam_round || 0);
      setExamTarget(caseRecord.exam_target || 'A');
      setCurrentQuestion(caseRecord.current_question || '');
      setObjectionsUsed({
        A: caseRecord.objections_used_a || false,
        B: caseRecord.objections_used_b || false
      });
      setOtherPlayerJoined(!!caseRecord.party_b_session);

      // Set phase based on case state
      if (caseRecord.verdict) {
        setVerdict(caseRecord.verdict);
        setPhase('verdict');
      } else if (caseRecord.phase) {
        setPhase(caseRecord.phase);
      }

      // Subscribe to updates
      subscribeToCase(savedCaseId);

      console.log('[Session] Restored session for case', savedCaseId, 'as', isPartyA ? 'A' : 'B');
    } catch (e) {
      console.error('[Session] Failed to restore session:', e);
      clearSession();
    }
  };

  restoreSession();
}, []);

// Auto-join if room code is in URL (but not if we have a saved session)
useEffect(() => {
  const checkRoomCode = async () => {
    if (initialRoomCode && !isMultiplayer && phase === 'home') {
      // Check if we already have a session being restored
      const savedSession = typeof window !== 'undefined' ? sessionStorage.getItem('judge_judy_case') : null;
      if (savedSession) return;

      // Fetch the case to check if it has a verdict
      const { data: caseRecord, error } = await supabase
        .from('cases')
        .select('*')
        .eq('room_code', initialRoomCode)
        .single();

      if (error || !caseRecord) {
        // Case not found, go to join screen to show error
        setJoinCode(initialRoomCode);
        setPhase('join');
        return;
      }

      // If case has a verdict, show verdict screen directly (read-only)
      if (caseRecord.verdict) {
        // Fetch responses for transcript
        const { data: caseResponses } = await supabase
          .from('responses')
          .select('*')
          .eq('case_id', caseRecord.id)
          .order('created_at', { ascending: true });

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
        setCredibilityA(caseRecord.credibility_a ?? 100);
        setCredibilityB(caseRecord.credibility_b ?? 100);
        setVerdict(caseRecord.verdict);
        setVerdictAccepted(true); // Show as already accepted for shared view
        setRoomCode(caseRecord.room_code);
        if (caseResponses) setResponses(caseResponses);
        setPhase('verdict');
        return;
      }

      // Otherwise, go to join screen
      setJoinCode(initialRoomCode);
      setPhase('join');
    }
  };

  checkRoomCode();
}, [initialRoomCode]);

// Fetch case preview when join code is complete
useEffect(() => {
  const fetchPreview = async () => {
    if (joinCode.length !== 6) {
      setJoinPreview(null);
      setJoinError('');
      return;
    }

    setIsLoadingPreview(true);
    setJoinError('');

    const { data: caseRecord, error } = await supabase
      .from('cases')
      .select('title, party_a_name, party_b_name, stakes, party_b_session')
      .eq('room_code', joinCode)
      .single();

    setIsLoadingPreview(false);

    if (error || !caseRecord) {
      setJoinPreview(null);
      setJoinError('Case not found. Check the room code.');
      return;
    }

    if (caseRecord.party_b_session) {
      setJoinPreview(null);
      setJoinError('This case already has two parties.');
      return;
    }

    setJoinPreview({
      title: caseRecord.title,
      partyA: caseRecord.party_a_name,
      partyB: caseRecord.party_b_name,
      stakes: caseRecord.stakes
    });
  };

  fetchPreview();
}, [joinCode]);

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
        credibility_a: 100,
        credibility_b: 100
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating case:', error);
      return null;
    }

    // Increment stats
    incrementCasesFiled();

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
    setCredibilityA(caseRecord.credibility_a ?? 100);
    setCredibilityB(caseRecord.credibility_b ?? 100);
    setPhase('statements');
    setCurrentParty('A');
    setIsLoading(false);

    subscribeToCase(caseRecord.id);
    saveSession(caseRecord.id, 'B');
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
      saveSession(newCase.id, 'A');
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

    // Handle question updates - use myRoleRef to avoid stale closure
    const currentRole = myRoleRef.current;

    console.log('[CaseUpdate] Question check:', {
      isGenerating: isGeneratingQuestion.current,
      newQuestion: !!newQuestion,
      newPhase,
      currentRole,
      newTarget,
      roleMatchesTarget: currentRole === newTarget,
      questionTargetRef: questionTargetRef.current,
      newQuestionKey
    });

    if (newQuestion) {
      // We received a question from the database - ALWAYS use DB question
      console.log('[CaseUpdate] Received question from DB, using it');
      setCurrentQuestion(newQuestion);
      questionTargetRef.current = newQuestionKey;
      lastQuestionGenTime.current = Date.now();
      setCanObjectToQuestion(true);
      setObjectionWindow({ type: 'question', content: newQuestion, targetParty: newTarget });
    } else if (newPhase === 'crossExam' && currentRole !== newTarget && !isGeneratingQuestion.current) {
      // No question yet, it's crossExam, and WE are the EXAMINER (our turn to generate questions)
      // Only the examiner (non-target) player generates - the target player waits for DB
      if (questionTargetRef.current !== newQuestionKey) {
        console.log('[CaseUpdate] Our turn to generate question for', newQuestionKey);
        // Small delay to let state settle before generating
        setTimeout(() => {
          // Double-check all conditions after delay
          const stillOurTurn = myRoleRef.current !== newTarget;
          const noQuestionYet = !currentQuestion; // Check current state

          console.log('[CaseUpdate] Timeout fired:', {
            isGenerating: isGeneratingQuestion.current,
            questionTargetRef: questionTargetRef.current,
            newQuestionKey,
            stillOurTurn,
            noQuestionYet
          });

          if (!isGeneratingQuestion.current &&
              questionTargetRef.current !== newQuestionKey &&
              stillOurTurn) {
            generateNewQuestion(newTarget, newRound);
          } else {
            console.log('[CaseUpdate] Skipped generation in timeout - conditions changed');
          }
        }, 150); // Slightly longer delay to let DB sync
      } else {
        console.log('[CaseUpdate] Already generated for this slot');
      }
    } else if (newPhase === 'crossExam' && currentRole !== newTarget) {
      // We're the spectator - we should wait for the question from DB
      console.log('[CaseUpdate] Spectator waiting for question from DB');
    } else {
      console.log('[CaseUpdate] Not crossExam phase or not ready');
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

    // CRITICAL: In multiplayer, only the examTarget player generates
    // This prevents both players from generating different questions
    if (isMultiplayer && myRoleRef.current !== targetParty) {
      console.log('[QuestionGen] Not my turn to generate (myRole:', myRoleRef.current, 'target:', targetParty, ')');
      return;
    }

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

    console.log('[QuestionGen] Starting generation for', questionKey, '(I am', myRoleRef.current, ')');

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
    clearSession();
    setPhase('home');
    setCaseData({ title: '', category: '', judge: 'joody', partyA: '', partyB: '', statementA: '', statementB: '', stakes: '' });
    setCurrentParty('A');
    setExamRound(0);
    setExamTarget('A');
    setCurrentQuestion('');
    setCurrentResponse('');
    setResponses([]);
    setVerdict(null);
    setVerdictAccepted(null);
    setTranscriptOpen(false);
    setShowAppealForm(false);
    setAppealArgument('');
    setAppealResult(null);
    setIsAppealing(false);
    setAppealAcknowledged(false);
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

  // Share verdict function
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied' | 'shared'>('idle');

  const generateShareText = () => {
    if (!verdict) return '';
    const judge = JUDGE_PERSONALITIES[caseData.judge as keyof typeof JUDGE_PERSONALITIES];
    return `⚖️ JUDGE JOODY AI VERDICT ⚖️

📋 Case: ${caseData.title}
👥 ${caseData.partyA} vs ${caseData.partyB}
👨‍⚖️ Judge: ${judge?.name || 'Judge Joody'}

🏆 WINNER: ${verdict.winnerName}

"${verdict.summary}"

${caseData.stakes ? `🎯 Stakes: ${caseData.stakes}` : ''}

Settle YOUR disputes at judgejoody.ai`;
  };

  const handleShare = async () => {
    const shareText = generateShareText();

    // Try native share first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Judge Joody AI Verdict',
          text: shareText,
        });
        setShareStatus('shared');
        setTimeout(() => setShareStatus('idle'), 2000);
        return;
      } catch (err) {
        // User cancelled or share failed, fall through to clipboard
      }
    }

    // Fallback to clipboard
    try {
      await navigator.clipboard.writeText(shareText);
      setShareStatus('copied');
      setTimeout(() => setShareStatus('idle'), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Handle appeal submission
  const handleAppealSubmit = async () => {
    if (!appealArgument.trim() || !verdict) return;

    setIsAppealing(true);

    try {
      const result = await evaluateAppeal(
        caseData.judge,
        caseData,
        verdict,
        appealArgument,
        responses,
        credibilityA,
        credibilityB
      );

      setAppealResult(result);

      // If verdict was reversed, update the verdict
      if (!result.upheld && result.newWinnerName) {
        setVerdict({
          ...verdict,
          winner: result.newWinner,
          winnerName: result.newWinnerName,
          loserName: result.newWinner === 'A' ? caseData.partyB : caseData.partyA,
          summary: `APPEAL GRANTED: ${result.newWinnerName} is now the winner!`,
          reasoning: result.ruling
        });
      }

      setShowAppealForm(false);
      setVerdictAccepted(result.upheld ? false : true); // If upheld, they lost appeal; if reversed, they won
    } catch (error) {
      console.error('Appeal failed:', error);
    } finally {
      setIsAppealing(false);
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
      <ObjectionRuling ruling={currentObjectionRuling} onContinue={handleObjectionRulingContinue} judgeId={caseData.judge} />
    );
  }

  // SNAP JUDGMENT - Show immediately when triggered, regardless of phase
  if (showSnapJudgment && snapJudgment) {
    return (
      <SnapJudgmentDisplay
        judgment={snapJudgment}
        judgeId={caseData.judge}
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

  // VIEW PAST VERDICT (must be before HOME check so it can render from stats tab)
  if (selectedPastCase) {
    const pastVerdict = selectedPastCase.verdict;
    const pastJudge = JUDGE_PERSONALITIES[selectedPastCase.judge as keyof typeof JUDGE_PERSONALITIES];
    const pastJudgeGifs = JUDGE_GIFS[selectedPastCase.judge as keyof typeof JUDGE_GIFS] || JUDGE_GIFS.joody;

    return (
      <div className="min-h-screen p-2 sm:p-4 md:p-6">
        <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl mx-auto">
          <TVFrame>
            <button
              onClick={() => setSelectedPastCase(null)}
              className="text-yellow-500 hover:text-yellow-300 mb-4 font-bold text-sm"
            >
              ← BACK TO STATS
            </button>

            <div className="text-center mb-4 sm:mb-6">
              <div className="text-3xl sm:text-4xl md:text-5xl mb-2">📜</div>
              <h2 className="tv-title text-lg sm:text-xl md:text-2xl mb-1">CASE VERDICT</h2>
              <p className="text-gray-400 text-xs sm:text-sm">{selectedPastCase.title}</p>
            </div>

            {/* Case Info */}
            <div className="tv-card p-3 sm:p-4 mb-4">
              <div className="flex items-center justify-center gap-2 sm:gap-4 mb-3">
                <div className="text-center flex-1">
                  <div className="text-blue-400 font-bold text-sm sm:text-base">{selectedPastCase.party_a_name}</div>
                  <div className="text-[10px] text-gray-500">Plaintiff</div>
                </div>
                <div className="text-yellow-500 font-bold text-lg">VS</div>
                <div className="text-center flex-1">
                  <div className="text-red-400 font-bold text-sm sm:text-base">{selectedPastCase.party_b_name}</div>
                  <div className="text-[10px] text-gray-500">Defendant</div>
                </div>
              </div>
              <div className="text-center text-gray-400 text-xs">
                ⚖️ Judge: {pastJudge?.name || 'Judge Joody'}
              </div>
            </div>

            {/* Winner Announcement */}
            <div className="tv-gradient-gold p-3 sm:p-4 md:p-6 mb-4 text-center winner-glow">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden border-3 border-yellow-700 flex-shrink-0">
                  <img
                    src={pastJudgeGifs.winner}
                    alt="Judge's reaction"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <div className="text-yellow-900 text-[10px] sm:text-xs font-bold tracking-widest mb-1">WINNER</div>
                  <div className="text-xl sm:text-2xl md:text-3xl font-black text-black mb-1">{pastVerdict?.winnerName} 🏆</div>
                  <div className="text-yellow-900 italic text-xs sm:text-sm">&quot;{pastVerdict?.summary}&quot;</div>
                </div>
              </div>
            </div>

            {/* Reasoning */}
            <div className="tv-card p-3 sm:p-4 mb-4">
              <div className="text-yellow-500 text-[10px] sm:text-xs font-bold tracking-widest mb-2">JUDGE&apos;S REASONING</div>
              <div className="text-white text-xs sm:text-sm">{pastVerdict?.reasoning}</div>
            </div>

            {/* Key Quotes */}
            {pastVerdict?.quotes?.length > 0 && (
              <div className="tv-card p-3 sm:p-4 mb-4">
                <div className="text-yellow-500 text-[10px] sm:text-xs font-bold tracking-widest mb-2">KEY QUOTES</div>
                {pastVerdict.quotes.map((q: string, i: number) => (
                  <div key={i} className="text-gray-300 italic text-xs sm:text-sm mb-2 pl-3 border-l-2 border-yellow-600">&quot;{q}&quot;</div>
                ))}
              </div>
            )}

            {/* Credibility Scores */}
            <div className="tv-card p-3 sm:p-4 mb-4">
              <div className="text-yellow-500 text-[10px] sm:text-xs font-bold tracking-widest mb-2">FINAL CREDIBILITY</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center">
                  <div className="text-blue-400 font-bold text-xs sm:text-sm">{selectedPastCase.party_a_name}</div>
                  <div className="text-lg sm:text-xl font-black text-white">{selectedPastCase.credibility_a}%</div>
                </div>
                <div className="text-center">
                  <div className="text-red-400 font-bold text-xs sm:text-sm">{selectedPastCase.party_b_name}</div>
                  <div className="text-lg sm:text-xl font-black text-white">{selectedPastCase.credibility_b}%</div>
                </div>
              </div>
            </div>

            {/* Stakes */}
            {selectedPastCase.stakes && (
              <div className="tv-gradient-gold p-2 sm:p-3 mb-4 text-center">
                <div className="text-yellow-900 text-[10px] sm:text-xs font-bold tracking-widest">🏆 STAKES</div>
                <div className="text-black font-bold text-sm">{selectedPastCase.stakes}</div>
              </div>
            )}

            <button
              onClick={() => setSelectedPastCase(null)}
              className="w-full tv-button py-3 text-sm sm:text-base"
            >
              ← BACK TO STATS
            </button>

            <ChannelBug text="COURT TV" />
          </TVFrame>
        </div>
      </div>
    );
  }

  // HOME
  if (phase === 'home') {
    return (
      <div className="min-h-screen flex items-center justify-center p-2 sm:p-4 md:p-6 lg:p-8">
        <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl">
          <TVFrame>
            <div className="p-1 sm:p-2 md:p-4 lg:p-6">
              {/* Tab Navigation */}
              <div className="flex mb-4 sm:mb-6 border-b-2 border-yellow-600">
                <button
                  onClick={() => setHomeTab('main')}
                  className={`flex-1 py-2 sm:py-3 text-xs sm:text-sm md:text-base font-bold tracking-wider transition-colors ${
                    homeTab === 'main'
                      ? 'text-yellow-500 border-b-2 border-yellow-500 -mb-[2px]'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  ⚖️ PLAY
                </button>
                <button
                  onClick={() => setHomeTab('stats')}
                  className={`flex-1 py-2 sm:py-3 text-xs sm:text-sm md:text-base font-bold tracking-wider transition-colors ${
                    homeTab === 'stats'
                      ? 'text-yellow-500 border-b-2 border-yellow-500 -mb-[2px]'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  📊 STATS
                </button>
              </div>

              {homeTab === 'main' ? (
                <div className="text-center">
                  <div className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl mb-3 md:mb-6">⚖️</div>
                  <h1 className="tv-title text-xl sm:text-2xl md:text-4xl lg:text-5xl mb-2 md:mb-4">Judge Joody AI</h1>
                  <p className="tv-subtitle text-xs sm:text-sm md:text-lg lg:text-xl mb-4 sm:mb-6 md:mb-8">Settle disputes. Real stakes. No lawyers.</p>

                  <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6 md:mb-8">
                    <button
                      onClick={() => setPhase('create')}
                      className="w-full tv-button text-sm sm:text-base md:text-lg py-3 sm:py-4 md:py-5"
                    >
                      🆕 CREATE NEW CASE
                    </button>
                    <button
                      onClick={() => setPhase('join')}
                      className="w-full tv-button bg-gray-700 border-gray-600 text-white text-sm sm:text-base md:text-lg py-2 sm:py-3"
                    >
                      🔗 JOIN EXISTING CASE
                    </button>
                  </div>

                  <div className="tv-card p-2 sm:p-3 md:p-4 mb-4 sm:mb-6 md:mb-8">
                    <div className="text-gray-300 text-xs sm:text-sm">
                      <span className="text-yellow-500 font-bold">✨ MULTIPLAYER:</span> Create a case and share the room code!
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-1 sm:gap-2 md:gap-3">
                    <div className="tv-card p-1.5 sm:p-2 md:p-4 text-center"><div className="text-lg sm:text-xl md:text-3xl mb-1">📝</div><div className="text-yellow-500 text-[8px] sm:text-[10px] md:text-xs font-bold">PRESENT</div></div>
                    <div className="tv-card p-1.5 sm:p-2 md:p-4 text-center"><div className="text-lg sm:text-xl md:text-3xl mb-1">🔥</div><div className="text-yellow-500 text-[8px] sm:text-[10px] md:text-xs font-bold">GRILLED</div></div>
                    <div className="tv-card p-1.5 sm:p-2 md:p-4 text-center"><div className="text-lg sm:text-xl md:text-3xl mb-1">⚠️</div><div className="text-yellow-500 text-[8px] sm:text-[10px] md:text-xs font-bold">OBJECT</div></div>
                    <div className="tv-card p-1.5 sm:p-2 md:p-4 text-center"><div className="text-lg sm:text-xl md:text-3xl mb-1">🏆</div><div className="text-yellow-500 text-[8px] sm:text-[10px] md:text-xs font-bold">WIN</div></div>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-4xl sm:text-5xl md:text-6xl mb-3 md:mb-4">📊</div>
                  <h2 className="tv-title text-lg sm:text-xl md:text-2xl mb-2 md:mb-4">Court Statistics</h2>
                  <p className="text-gray-400 text-xs sm:text-sm mb-4 sm:mb-6">All-time stats from Judge Joody AI</p>

                  {statsLoading ? (
                    <div className="tv-card p-4 sm:p-6">
                      <div className="animate-pulse text-yellow-500 text-sm">Loading stats...</div>
                    </div>
                  ) : stats ? (
                    <div className="space-y-3 sm:space-y-4">
                      <div className="tv-card p-3 sm:p-4 md:p-6">
                        <div className="text-yellow-500 text-[10px] sm:text-xs font-bold tracking-widest mb-2">CASES FILED</div>
                        <div className="tv-stat-value text-3xl sm:text-4xl md:text-5xl" style={{ color: '#d4af37' }}>
                          {stats.cases_filed.toLocaleString()}
                        </div>
                        <div className="text-gray-500 text-[10px] sm:text-xs mt-1">Total disputes brought to court</div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        <div className="tv-card p-3 sm:p-4">
                          <div className="text-green-500 text-[10px] sm:text-xs font-bold tracking-widest mb-1">VERDICTS ACCEPTED</div>
                          <div className="text-2xl sm:text-3xl font-black text-green-400">
                            {stats.verdicts_accepted.toLocaleString()}
                          </div>
                          <div className="text-gray-500 text-[8px] sm:text-[10px] mt-1">Justice served</div>
                        </div>

                        <div className="tv-card p-3 sm:p-4">
                          <div className="text-red-500 text-[10px] sm:text-xs font-bold tracking-widest mb-1">VERDICTS REJECTED</div>
                          <div className="text-2xl sm:text-3xl font-black text-red-400">
                            {stats.verdicts_rejected.toLocaleString()}
                          </div>
                          <div className="text-gray-500 text-[8px] sm:text-[10px] mt-1">Contested rulings</div>
                        </div>
                      </div>

                      {stats.cases_filed > 0 && (
                        <div className="tv-card p-3 sm:p-4">
                          <div className="text-yellow-500 text-[10px] sm:text-xs font-bold tracking-widest mb-2">ACCEPTANCE RATE</div>
                          <div className="w-full bg-gray-700 rounded-full h-3 sm:h-4 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-500"
                              style={{ width: `${((stats.verdicts_accepted / (stats.verdicts_accepted + stats.verdicts_rejected)) * 100) || 0}%` }}
                            />
                          </div>
                          <div className="text-gray-400 text-xs sm:text-sm mt-2">
                            {((stats.verdicts_accepted / (stats.verdicts_accepted + stats.verdicts_rejected)) * 100 || 0).toFixed(1)}% of verdicts accepted
                          </div>
                        </div>
                      )}
                    </div>
                  ) : statsError ? (
                    <div className="tv-card p-4 sm:p-6">
                      <div className="text-yellow-500 text-sm mb-2">📊 Stats table not configured</div>
                      <div className="text-gray-500 text-xs">
                        Run the SQL setup in your Supabase dashboard to enable stats tracking.
                      </div>
                      <button
                        onClick={() => { setStatsError(false); setStatsLoading(false); }}
                        className="mt-3 text-yellow-500 hover:text-yellow-300 text-xs font-bold"
                      >
                        🔄 RETRY
                      </button>
                    </div>
                  ) : (
                    <div className="tv-card p-4 sm:p-6">
                      <div className="text-gray-500 text-sm">No stats available yet</div>
                      <div className="text-gray-600 text-xs mt-2">Be the first to file a case!</div>
                    </div>
                  )}

                  {/* Past Verdicts Section */}
                  <div className="mt-6 sm:mt-8">
                    <div className="text-yellow-500 text-[10px] sm:text-xs font-bold tracking-widest mb-3 text-center">📜 RECENT VERDICTS</div>

                    {pastCasesLoading ? (
                      <div className="tv-card p-4 text-center">
                        <div className="animate-pulse text-yellow-500 text-sm">Loading verdicts...</div>
                      </div>
                    ) : pastCases.length > 0 ? (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {pastCases.map((pastCase) => (
                          <button
                            key={pastCase.id}
                            onClick={() => setSelectedPastCase(pastCase)}
                            className="w-full tv-card p-3 text-left hover:border-yellow-500 hover:bg-yellow-500/10 transition-all cursor-pointer group"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="text-white font-bold text-xs sm:text-sm truncate group-hover:text-yellow-300">{pastCase.title}</div>
                                <div className="text-gray-400 text-[10px] sm:text-xs">
                                  {pastCase.party_a_name} vs {pastCase.party_b_name}
                                </div>
                              </div>
                              <div className="flex-shrink-0 ml-2 flex items-center gap-2">
                                <div className="text-yellow-500 text-[10px] sm:text-xs font-bold">
                                  🏆 {pastCase.verdict?.winnerName}
                                </div>
                                <div className="text-gray-500 group-hover:text-yellow-500 text-[10px] transition-colors">
                                  →
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="tv-card p-4 text-center">
                        <div className="text-gray-500 text-sm">No verdicts yet</div>
                        <div className="text-gray-600 text-xs mt-1">Completed cases will appear here</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <ChannelBug text="COURT TV" />
          </TVFrame>
        </div>
      </div>
    );
  }

  // JOIN
  if (phase === 'join') {
    return (
      <div className="min-h-screen flex items-center justify-center p-2 sm:p-4 md:p-6">
        <div className="w-full max-w-sm sm:max-w-md md:max-w-lg">
          <TVFrame>
            <button onClick={() => setPhase('home')} className="text-yellow-500 hover:text-yellow-300 mb-4 sm:mb-6 font-bold text-sm sm:text-base">← BACK</button>

            <div className="text-center mb-4 sm:mb-6">
              <div className="text-4xl sm:text-5xl md:text-6xl mb-3 sm:mb-4">🔗</div>
              <h2 className="tv-title text-xl sm:text-2xl md:text-3xl mb-2">Join a Case</h2>
              <p className="text-gray-400 text-xs sm:text-sm md:text-base">Enter the room code shared by the other party</p>
            </div>

            <div className="mb-4">
              <label className="block text-yellow-500 mb-2 text-center font-bold text-[10px] sm:text-xs tracking-widest">ROOM CODE</label>
              <input
                type="text"
                placeholder="e.g., JUDY7X"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="w-full tv-input text-center text-2xl sm:text-3xl md:text-4xl tracking-widest uppercase"
              />
            </div>

            {/* Loading preview */}
            {isLoadingPreview && (
              <div className="tv-card p-4 mb-4 text-center">
                <div className="text-yellow-500 text-sm font-bold">Looking up case...</div>
              </div>
            )}

            {/* Case preview */}
            {joinPreview && !isLoadingPreview && (
              <div className="tv-card p-4 mb-4 border-2 border-green-500">
                <div className="text-green-400 text-xs font-bold mb-2 text-center tracking-widest">✓ CASE FOUND</div>
                <div className="text-center">
                  <div className="text-yellow-500 text-xs mb-1 font-bold">⚖️ DISPUTE</div>
                  <div className="text-white font-bold text-lg mb-2">{joinPreview.title}</div>
                  <div className="text-sm">
                    <span className="text-blue-400 font-bold">{joinPreview.partyA}</span>
                    <span className="text-gray-500 mx-2 font-bold">VS</span>
                    <span className="text-red-400 font-bold">{joinPreview.partyB}</span>
                  </div>
                  {joinPreview.stakes && (
                    <div className="text-yellow-400 text-xs mt-2 font-bold">🏆 {joinPreview.stakes}</div>
                  )}
                </div>
              </div>
            )}

            {joinError && (
              <div className="tv-gradient-red p-3 mb-4 text-center text-white font-bold">
                {joinError}
              </div>
            )}

            <button
              onClick={handleJoinCase}
              disabled={joinCode.length !== 6 || isLoading || !joinPreview}
              className="w-full tv-button text-sm sm:text-base md:text-lg py-3 sm:py-4"
            >
              {isLoading ? 'JOINING...' : joinPreview ? `JOIN AS ${joinPreview.partyB.toUpperCase()} →` : 'JOIN CASE →'}
            </button>
            <ChannelBug text="COURT TV" />
          </TVFrame>
        </div>
      </div>
    );
  }

  // CREATE
  if (phase === 'create') {
    return (
      <div className="min-h-screen p-2 sm:p-4 md:p-6">
        <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl mx-auto">
          <TVFrame showLive={false}>
            <button onClick={() => setPhase('home')} className="text-yellow-500 hover:text-yellow-300 mb-4 sm:mb-6 font-bold text-sm sm:text-base">← BACK</button>
            <h2 className="tv-title text-lg sm:text-xl md:text-2xl lg:text-3xl mb-4 sm:mb-6 text-center">File a New Case</h2>

            <div className="mb-4">
              <label className="block text-yellow-500 mb-2 font-bold text-xs tracking-widest">WHAT&apos;S THE DISPUTE?</label>
              <input type="text" placeholder="e.g., Who ate my leftover pizza" value={caseData.title} onChange={(e) => setCaseData({...caseData, title: e.target.value})} className="w-full tv-input text-white" style={{ color: 'white' }} />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div><label className="block text-yellow-500 mb-2 font-bold text-xs tracking-widest">PARTY A (YOU)</label><input type="text" placeholder="Your name" value={caseData.partyA} onChange={(e) => setCaseData({...caseData, partyA: e.target.value})} className="w-full tv-input text-white" style={{ color: 'white' }} /></div>
              <div><label className="block text-yellow-500 mb-2 font-bold text-xs tracking-widest">PARTY B (OPPONENT)</label><input type="text" placeholder="Their name" value={caseData.partyB} onChange={(e) => setCaseData({...caseData, partyB: e.target.value})} className="w-full tv-input text-white" style={{ color: 'white' }} /></div>
            </div>

            <div className="mb-4">
              <label className="block text-yellow-500 mb-2 font-bold text-xs tracking-widest">🏆 WHAT&apos;S AT STAKE?</label>
              <input type="text" placeholder="e.g., Loser buys dinner" value={caseData.stakes} onChange={(e) => setCaseData({...caseData, stakes: e.target.value})} className="w-full tv-input border-yellow-600 text-white" style={{ color: 'white' }} />
              <div className="flex flex-wrap gap-2 mt-3">
                {SUGGESTED_STAKES.map((stake, i) => (
                  <button key={i} onClick={() => setCaseData({...caseData, stakes: stake})} className="text-xs tv-card hover:border-yellow-500 text-gray-300 px-3 py-1">{stake}</button>
                ))}
              </div>
            </div>

            <div className="mb-3 sm:mb-4">
              <label className="block text-yellow-500 mb-2 font-bold text-[10px] sm:text-xs tracking-widest">CATEGORY</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-1 sm:gap-2">
                {CATEGORIES.map(cat => (<button key={cat.id} onClick={() => setCaseData({...caseData, category: cat.id})} className={`p-2 sm:p-3 border-2 text-left font-bold text-xs sm:text-sm ${caseData.category === cat.id ? 'tv-gradient-gold text-black border-yellow-300' : 'tv-card border-gray-600 text-gray-300 hover:border-gray-500'}`}>{cat.label}</button>))}
              </div>
            </div>

            <div className="mb-4 sm:mb-6">
              <label className="block text-yellow-500 mb-2 font-bold text-[10px] sm:text-xs tracking-widest">CHOOSE YOUR JUDGE</label>
              <div className="space-y-1 sm:space-y-2 md:grid md:grid-cols-2 md:gap-2 md:space-y-0">
                {Object.entries(JUDGE_PERSONALITIES).map(([id, judge]) => (<button key={id} onClick={() => setCaseData({...caseData, judge: id})} className={`w-full p-2 sm:p-3 md:p-4 border-2 text-left ${caseData.judge === id ? 'tv-gradient-gold text-black border-yellow-300' : 'tv-card border-gray-600 text-gray-300 hover:border-gray-500'}`}><div className="font-bold uppercase text-xs sm:text-sm md:text-base">{judge.name}</div><div className={`text-[10px] sm:text-xs md:text-sm ${caseData.judge === id ? 'text-yellow-900' : 'text-gray-500'}`}>{judge.tagline}</div></button>))}
              </div>
            </div>

            <button
              onClick={handleCreateCase}
              disabled={!caseData.title || !caseData.category || !caseData.partyA || !caseData.partyB || !caseData.stakes || isLoading}
              className="w-full tv-button text-sm sm:text-base md:text-lg py-3 sm:py-4"
            >
              {isLoading ? 'CREATING...' : 'CREATE CASE & GET ROOM CODE →'}
            </button>
          </TVFrame>
        </div>
      </div>
    );
  }

  // WAITING ROOM
  if (phase === 'waiting-room') {
    return (
      <div className="min-h-screen flex items-center justify-center p-2 sm:p-4 md:p-6">
        <div className="w-full max-w-sm sm:max-w-md md:max-w-lg">
          <TVFrame>
            <div className="text-center p-1 sm:p-2">
              {/* Case Title - Prominent */}
              <div className="lower-third mb-4 sm:mb-6 pl-4 sm:pl-6 text-left">
                <div className="text-[10px] sm:text-xs font-bold text-yellow-900 tracking-widest">⚖️ DISPUTE</div>
                <div className="text-black font-bold text-sm sm:text-lg">{caseData.title}</div>
                <div className="text-xs sm:text-sm mt-1">
                  <span className="text-blue-800 font-bold">{caseData.partyA}</span>
                  <span className="text-yellow-900 mx-1 sm:mx-2 font-bold">VS</span>
                  <span className="text-red-800 font-bold">{caseData.partyB}</span>
                </div>
              </div>

              <div className="on-air-badge inline-block mb-3 sm:mb-4">ON AIR</div>
              <h2 className="tv-title text-lg sm:text-xl md:text-2xl mb-2">Share This Room</h2>
              <p className="text-gray-400 mb-3 sm:mb-4 text-xs sm:text-sm">Send this code to {caseData.partyB} so they can join</p>

              <div className="tv-card p-3 sm:p-4 md:p-6 mb-4 sm:mb-6">
                <div className="text-yellow-500 text-[10px] sm:text-xs font-bold tracking-widest mb-2">ROOM CODE</div>
                <div className="tv-stat-value text-3xl sm:text-4xl md:text-5xl tracking-widest mb-3 sm:mb-4" style={{ color: '#d4af37' }}>{roomCode}</div>

                {/* Invite button */}
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="tv-button w-full py-3 sm:py-4 text-sm sm:text-base mb-3"
                >
                  📨 INVITE OPPONENT
                </button>

                {/* Copy code button */}
                <button
                  onClick={() => navigator.clipboard.writeText(roomCode)}
                  className="tv-button bg-gray-700 border-gray-600 text-white w-full py-2 text-xs sm:text-sm"
                >
                  📋 COPY CODE ONLY
                </button>

                <div className="mt-3 sm:mt-4 text-gray-500 text-[10px] sm:text-xs break-all">
                  {typeof window !== 'undefined' && `${window.location.origin}?room=${roomCode}`}
                </div>

                {/* Invite Modal */}
                {showInviteModal && (
                  <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowInviteModal(false)}>
                    <div className="tv-card p-4 sm:p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
                      <div className="text-center mb-4">
                        <div className="text-2xl mb-2">📨</div>
                        <h3 className="tv-title text-lg sm:text-xl">INVITE OPPONENT</h3>
                        <p className="text-gray-400 text-xs mt-1">Choose how to send the invite</p>
                      </div>

                      <div className="space-y-2">
                        <button
                          onClick={() => {
                            const shareUrl = `${window.location.origin}?room=${roomCode}`;
                            const text = `Join my Judge Joody AI case! ${shareUrl}`;
                            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                            setShowInviteModal(false);
                          }}
                          className="tv-button bg-green-700 border-green-500 text-white w-full py-3 text-sm flex items-center justify-center gap-2"
                        >
                          <span className="text-xl">💬</span>
                          <span>Send via WhatsApp</span>
                        </button>

                        <button
                          onClick={() => {
                            const shareUrl = `${window.location.origin}?room=${roomCode}`;
                            const text = `Join my Judge Joody AI case! ${shareUrl}`;
                            window.open(`sms:?body=${encodeURIComponent(text)}`, '_self');
                            setShowInviteModal(false);
                          }}
                          className="tv-button bg-blue-700 border-blue-500 text-white w-full py-3 text-sm flex items-center justify-center gap-2"
                        >
                          <span className="text-xl">📱</span>
                          <span>Send via Text Message</span>
                        </button>

                        <button
                          onClick={() => {
                            const shareUrl = `${window.location.origin}?room=${roomCode}`;
                            navigator.clipboard.writeText(shareUrl);
                            setShowInviteModal(false);
                          }}
                          className="tv-button bg-purple-700 border-purple-500 text-white w-full py-3 text-sm flex items-center justify-center gap-2"
                        >
                          <span className="text-xl">🔗</span>
                          <span>Copy Link</span>
                        </button>
                      </div>

                      <button
                        onClick={() => setShowInviteModal(false)}
                        className="w-full mt-4 text-gray-500 hover:text-white text-sm py-2"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Judge waiting GIF */}
              <div className="tv-card p-3 sm:p-4 mb-4 sm:mb-6">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-lg overflow-hidden border-2 border-yellow-600">
                    <img
                      src={JUDGE_GIFS[caseData.judge as keyof typeof JUDGE_GIFS]?.waiting || JUDGE_GIFS.joody.waiting}
                      alt="Judge waiting"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="text-yellow-500 font-bold text-xs sm:text-sm md:text-base">
                    Waiting for {caseData.partyB} to join...
                  </div>
                </div>
              </div>

              <button onClick={resetCase} className="text-gray-500 hover:text-gray-300 text-xs sm:text-sm font-bold">CANCEL</button>
            </div>
            <ChannelBug text="COURT TV" />
          </TVFrame>
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
      const judge = JUDGE_PERSONALITIES[caseData.judge as keyof typeof JUDGE_PERSONALITIES];
      return (
        <div className="min-h-screen flex items-center justify-center p-2 sm:p-4 md:p-6">
          <div className="w-full max-w-sm sm:max-w-md md:max-w-lg">
            <TVFrame>
              <div className="p-1 sm:p-2">
                <ProgressIndicator currentPhase="statements" />

                {/* COMING UP NEXT Banner */}
                <div className="breaking-banner text-center py-2 sm:py-3 mb-4 sm:mb-6">
                  <span className="text-xs sm:text-sm md:text-base">📺 COMING UP NEXT ON COURT TV 📺</span>
                </div>

                {/* Case Title */}
                <div className="text-center mb-4 sm:mb-6">
                  <div className="text-yellow-500 text-[10px] sm:text-xs font-bold tracking-widest mb-1">TODAY&apos;S CASE</div>
                  <h2 className="tv-title text-lg sm:text-xl md:text-2xl">{caseData.title}</h2>
                </div>

                {/* VS Matchup Display with Category GIF */}
                <div className="tv-card p-3 sm:p-4 mb-4 sm:mb-6">
                  {/* Category-specific dispute GIF */}
                  <div className="flex justify-center mb-3 sm:mb-4">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden border-2 border-red-500">
                      <img
                        src={getCategoryGif(caseData.category, 'dispute')}
                        alt="Case dispute"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-2 sm:gap-4">
                    <div className="text-center flex-1">
                      <div className="text-blue-400 font-black text-base sm:text-lg md:text-xl">{caseData.partyA}</div>
                      <div className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider">Plaintiff</div>
                    </div>
                    <div className="tv-gradient-red px-3 sm:px-4 py-1 sm:py-2 rounded">
                      <span className="text-white font-black text-lg sm:text-xl md:text-2xl">VS</span>
                    </div>
                    <div className="text-center flex-1">
                      <div className="text-red-400 font-black text-base sm:text-lg md:text-xl">{caseData.partyB}</div>
                      <div className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider">Defendant</div>
                    </div>
                  </div>
                </div>

                {/* Judge Introduction with GIF */}
                <div className="tv-card p-3 sm:p-4 mb-4 sm:mb-6">
                  <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                    {/* Judge GIF */}
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg overflow-hidden border-2 border-yellow-600 flex-shrink-0">
                      <img
                        src={JUDGE_GIFS[caseData.judge as keyof typeof JUDGE_GIFS]?.intro || JUDGE_GIFS.joody.intro}
                        alt={`${judge?.name || 'Judge'} reaction`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    {/* Judge Info */}
                    <div className="text-center sm:text-left">
                      <div className="text-[10px] sm:text-xs font-bold text-yellow-500 tracking-widest">PRESIDING</div>
                      <div className="text-white font-bold text-base sm:text-lg">⚖️ {judge?.name || 'Judge Joody'}</div>
                      <div className="text-gray-400 text-[10px] sm:text-xs italic">{judge?.tagline}</div>
                    </div>
                  </div>
                </div>

                {/* Stakes */}
                {caseData.stakes && (
                  <div className="tv-gradient-gold p-2 sm:p-3 mb-4 sm:mb-6 text-center">
                    <div className="text-yellow-900 text-[10px] sm:text-xs font-bold tracking-widest">🏆 WHAT&apos;S AT STAKE</div>
                    <div className="text-black font-bold text-sm sm:text-base">{caseData.stakes}</div>
                  </div>
                )}

                {/* Rules of Court */}
                <div className="tv-card p-2 sm:p-4 mb-4 sm:mb-6">
                  <div className="text-yellow-500 text-[10px] sm:text-xs font-bold tracking-widest mb-2">📋 RULES OF THE COURT</div>
                  <ul className="text-gray-400 text-[10px] sm:text-xs space-y-1">
                    <li className="flex items-start gap-1 sm:gap-2">
                      <span className="text-yellow-500">1.</span>
                      <span>Both parties will present opening statements</span>
                    </li>
                    <li className="flex items-start gap-1 sm:gap-2">
                      <span className="text-yellow-500">2.</span>
                      <span>The judge will cross-examine each party</span>
                    </li>
                    <li className="flex items-start gap-1 sm:gap-2">
                      <span className="text-yellow-500">3.</span>
                      <span>Credibility scores affect the final verdict</span>
                    </li>
                    <li className="flex items-start gap-1 sm:gap-2">
                      <span className="text-yellow-500">4.</span>
                      <span>The judge&apos;s decision is FINAL</span>
                    </li>
                  </ul>
                </div>

                {/* Status Indicator */}
                <div className="tv-card p-3 sm:p-4 border-2 border-yellow-600">
                  {isOtherTyping ? (
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-xl sm:text-2xl">✍️</span>
                      <div>
                        <div className="text-yellow-500 font-bold text-xs sm:text-sm">{waitingForName} is preparing their statement...</div>
                        <div className="flex justify-center gap-1 mt-1">
                          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-xl sm:text-2xl animate-pulse">⏳</span>
                      <div className="text-gray-400 text-xs sm:text-sm">Waiting for {waitingForName} to begin...</div>
                    </div>
                  )}
                </div>

                {/* Your role reminder */}
                <div className="text-center mt-3 sm:mt-4 text-gray-500 text-[10px] sm:text-xs">
                  You are: <span className={`font-bold ${myRole === 'A' ? 'text-blue-400' : 'text-red-400'}`}>{myRole === 'A' ? caseData.partyA : caseData.partyB}</span>
                  <span className="text-gray-600"> • Room: {roomCode}</span>
                </div>
              </div>
              <ChannelBug text="COURT TV" />
            </TVFrame>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen p-2 sm:p-4 md:p-6">
        <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl mx-auto">
          <TVFrame>
            <ProgressIndicator currentPhase="statements" />
            <div className="lower-third mb-4 sm:mb-6 pl-4 sm:pl-6">
              <div className="text-[10px] sm:text-xs font-bold text-yellow-900 tracking-widest">OPENING STATEMENTS</div>
              <div className="text-black font-bold text-sm sm:text-lg">{caseData.title}</div>
              {isMultiplayer && <div className="text-[10px] sm:text-xs text-yellow-900 mt-1">Room: {roomCode}</div>}
            </div>

            <StakesBadge stakes={caseData.stakes} />

            <div className="mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row gap-2">
                <PartyNamePlate
                  name={caseData.partyA}
                  party="A"
                  status={isPartyA ? 'active' : caseData.statementA ? 'done' : 'waiting'}
                />
                <div className="hidden sm:flex items-center text-yellow-500 font-black text-lg sm:text-xl">VS</div>
                <PartyNamePlate
                  name={caseData.partyB}
                  party="B"
                  status={!isPartyA ? 'active' : caseData.statementB ? 'done' : 'waiting'}
                />
              </div>
            </div>

            {/* Guidance box - hidden on very small screens */}
            <div className="tv-card p-2 sm:p-4 mb-3 sm:mb-4 hidden xs:block">
              <div className="text-yellow-500 text-xs sm:text-sm font-bold mb-1 sm:mb-2">💡 WHAT TO WRITE:</div>
              <ul className="text-gray-400 text-[10px] sm:text-sm space-y-0.5 sm:space-y-1">
                <li>• <span className="text-gray-300">What happened?</span> Your perspective</li>
                <li>• <span className="text-gray-300">Why are you right?</span> Explain your case</li>
                <li>• <span className="text-gray-300">Be specific!</span> Include details</li>
              </ul>
            </div>

            <div className={`tv-card p-2 sm:p-4 mb-3 sm:mb-4 border-2 ${isPartyA ? 'border-blue-600' : 'border-red-600'}`}>
              <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                <span className={`font-bold text-sm sm:text-lg ${isPartyA ? 'text-blue-400' : 'text-red-400'}`}>{currentName}</span>
                <span className="text-gray-400 text-[10px] sm:text-sm">— your statement</span>
              </div>
              <div className="text-gray-500 text-[10px] sm:text-xs mb-2 sm:mb-3">The judge will question you about this</div>
              <textarea
                placeholder="Describe what happened and why you're right..."
                value={currentStatement}
                onChange={(e) => handleStatementChange(e.target.value)}
                rows={4}
                className={`w-full tv-input text-white placeholder-gray-600 resize-none text-sm sm:text-base ${isPartyA ? 'border-blue-600' : 'border-red-600'}`}
                style={{ color: 'white' }}
              />
              <div className="flex justify-between mt-1 sm:mt-2 text-[10px] sm:text-xs text-gray-500">
                <span>{currentStatement.length} chars</span>
                <span className="text-yellow-500">{currentStatement.length < 50 ? '📝 Add detail' : currentStatement.length > 500 ? '✂️ Be concise' : '✓ Good'}</span>
              </div>
            </div>

            <button onClick={handleStatementSubmit} disabled={!currentStatement} className="w-full tv-button text-sm sm:text-base md:text-lg py-2 sm:py-3 md:py-4">
              {isPartyA ? `SUBMIT STATEMENT →` : `SUBMIT → CROSS-EXAM`}
            </button>
            <ChannelBug text="COURT TV" />
          </TVFrame>
        </div>
      </div>
    );
  }

  // CROSS-EXAM
  if (phase === 'crossExam') {
    const isMyTurn = isMultiplayer ? (myRole === examTarget) : true;

if (isMultiplayer && !isMyTurn && !isLoading) {
      return (
        <div className="min-h-screen p-2 sm:p-4 md:p-6">
          <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl mx-auto">
            <TVFrame>
              <ProgressIndicator currentPhase="crossExam" />
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-3 sm:mb-4">
                <div className="lower-third pl-4 sm:pl-6 flex-1">
                  <div className="text-[10px] sm:text-xs font-bold text-yellow-900 tracking-widest">{isClarifying ? '🔄 FOLLOW-UP' : 'CROSS-EXAMINATION'}</div>
                  <div className="text-black font-bold text-sm sm:text-base">{caseData.title}</div>
                </div>
                <RoundIndicator round={examRound + 1} totalRounds={3} />
              </div>

              <CredibilityBar
                partyA={caseData.partyA}
                partyB={caseData.partyB}
                credibilityA={credibilityA}
                credibilityB={credibilityB}
                history={credibilityHistory}
                activeParty={examTarget as 'A' | 'B'}
              />

              <Transcript caseData={caseData} responses={responses} objections={objections} isOpen={transcriptOpen} onToggle={() => setTranscriptOpen(!transcriptOpen)} />

              {currentQuestion && (
                <div className="tv-card p-4 mb-4 mt-4 border-2 border-yellow-600">
                  <div className="text-yellow-500 text-sm font-bold mb-1">JUDGE {JUDGE_PERSONALITIES[caseData.judge as keyof typeof JUDGE_PERSONALITIES]?.name?.toUpperCase().replace('JUDGE ', '') || 'JOODY'}:</div>
                  <div className="text-white"><TypewriterText text={currentQuestion} /></div>
                </div>
              )}

              {/* Typing indicator below the question */}
              <div className="tv-card p-4 mb-4">
                {isOtherTyping ? (
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-lg">✍️</span>
                    <span className="text-yellow-500 font-bold">{targetName} is typing</span>
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-lg">⏳</span>
                    <span className="text-gray-400">Waiting for {targetName} to answer...</span>
                  </div>
                )}
              </div>

              <div className="tv-card p-4">
                <div className="text-gray-400 text-sm text-center">
                  You are: <span className={`font-bold ${myRole === 'A' ? 'text-blue-400' : 'text-red-400'}`}>{myRole === 'A' ? caseData.partyA : caseData.partyB}</span>
                  <span className="text-gray-500"> (watching)</span>
                </div>
              </div>
              <ChannelBug text="COURT TV" />
            </TVFrame>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen p-2 sm:p-4 md:p-6">
        <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl mx-auto">
          <TVFrame>
            {/* Compact phase indicator during cross-exam - focus is on the questioning */}
            <ProgressIndicator currentPhase="crossExam" compact />
            <StakesBadge stakes={caseData.stakes} compact />

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-3 sm:mb-4">
              <div className="lower-third pl-4 sm:pl-6 flex-1">
                <div className="text-[10px] sm:text-xs font-bold text-yellow-900 tracking-widest">{isClarifying ? '🔄 FOLLOW-UP' : 'CROSS-EXAMINATION'}</div>
                <div className="text-black font-bold text-sm sm:text-base">{caseData.title}</div>
                {isMultiplayer && <div className="text-[10px] sm:text-xs text-yellow-900">Room: {roomCode}</div>}
              </div>
              <RoundIndicator round={examRound + 1} totalRounds={3} />
            </div>

            {/* Combined Turn + Credibility display */}
            <CredibilityBar
              partyA={caseData.partyA}
              partyB={caseData.partyB}
              credibilityA={credibilityA}
              credibilityB={credibilityB}
              history={credibilityHistory}
              activeParty={examTarget as 'A' | 'B'}
            />

            {isLoading ? (
              <LoadingOverlay emoji={loadingEmoji} message={loadingMessage} />
            ) : currentQuestion ? (
              <div className="space-y-4 mt-4">
                {/* Transcript above question */}
                <Transcript caseData={caseData} responses={responses} objections={objections} isOpen={transcriptOpen} onToggle={() => setTranscriptOpen(!transcriptOpen)} />

                <div className="tv-card p-4 border-2 border-yellow-600">
                  <div className="text-yellow-500 text-sm font-bold mb-1 uppercase">
                    {JUDGE_PERSONALITIES[caseData.judge as keyof typeof JUDGE_PERSONALITIES]?.name || 'Judge Joody'}:
                  </div>
                  <div className="text-white"><TypewriterText text={currentQuestion} /></div>
                </div>

                {canObjectToQuestion && !objectionsUsed[examTarget as 'A' | 'B'] && (
                  <button
                    onClick={() => {
                      console.log('[Objection] Button clicked');
                      setObjectionWindow({ type: 'question', content: currentQuestion });
                      setShowObjectionModal(true);
                    }}
                    className="tv-button tv-button-red py-1 px-3 text-xs"
                  >
                    ⚠️ OBJECT
                  </button>
                )}

                <div className={`tv-card p-4 border-2 ${examTarget === 'A' ? 'border-blue-600' : 'border-red-600'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`font-bold ${examTarget === 'A' ? 'text-blue-400' : 'text-red-400'}`}>{targetName}</span>
                    <span className="text-gray-400 text-sm">— your response</span>
                  </div>
                  <textarea
                    placeholder="Type your answer..."
                    value={currentResponse}
                    onChange={(e) => {
                      setCurrentResponse(e.target.value);
                      broadcastTyping();
                    }}
                    rows={4}
                    className="w-full tv-input text-white resize-none"
                    style={{ color: 'white' }}
                  />
                </div>

                <button
                  onClick={handleResponseSubmit}
                  disabled={!currentResponse}
                  className="w-full tv-button text-lg py-4"
                >
                  SUBMIT RESPONSE
                </button>
              </div>
            ) : (
              <LoadingOverlay emoji="📝" message="Preparing question..." />
            )}
            <ChannelBug text="COURT TV" />
          </TVFrame>
        </div>
      </div>
    );
  }

  // VERDICT
  if (phase === 'verdict') {
    const judgeGifs = JUDGE_GIFS[caseData.judge as keyof typeof JUDGE_GIFS] || JUDGE_GIFS.joody;

    if (isLoading || !verdict) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-2 sm:p-4 md:p-6">
          <div className="w-full max-w-sm sm:max-w-md md:max-w-lg">
            <TVFrame>
              <ProgressIndicator currentPhase="verdict" />
              <div className="text-center mt-4 sm:mt-8">
                {/* Judge thinking GIF */}
                <div className="w-32 h-32 sm:w-40 sm:h-40 mx-auto rounded-lg overflow-hidden border-4 border-yellow-600 mb-4">
                  <img
                    src={judgeGifs.thinking}
                    alt="Judge deliberating"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="tv-title text-base sm:text-lg md:text-xl mb-2">The judge is deliberating...</div>
                <div className="text-gray-400 text-xs sm:text-sm">{loadingMessage}</div>
                <div className="flex justify-center gap-1 sm:gap-2 mt-4">
                  {['📚', '⚖️', '🤝', '📜', '🔨'].map((e, i) => (
                    <span key={i} className="text-lg sm:text-xl md:text-2xl animate-pulse" style={{ animationDelay: `${i * 0.2}s` }}>{e}</span>
                  ))}
                </div>
              </div>
              <ChannelBug text="COURT TV" />
            </TVFrame>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen p-2 sm:p-4 md:p-6">
        <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl mx-auto">
          <TVFrame>
            {/* Compact progress indicator - verdict is the focus */}
            <ProgressIndicator currentPhase="verdict" compact />
            <div className="text-center mb-4 sm:mb-6">
              <div className="text-4xl sm:text-5xl md:text-6xl mb-3 sm:mb-4">⚖️</div>
              <h2 className="tv-title text-xl sm:text-2xl md:text-3xl mb-2">THE VERDICT</h2>
              <p className="text-gray-400 text-xs sm:text-sm">{caseData.title}</p>
            </div>

            {/* Winner announcement with Judge GIF */}
            <div className="tv-gradient-gold p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 text-center winner-glow">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                {/* Judge reaction GIF */}
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg overflow-hidden border-3 border-yellow-700 flex-shrink-0">
                  <img
                    src={judgeGifs.winner}
                    alt="Judge's reaction"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <div className="text-yellow-900 text-[10px] sm:text-xs font-bold tracking-widest mb-1 sm:mb-2">WINNER</div>
                  <div className="text-2xl sm:text-3xl md:text-4xl font-black text-black mb-1 sm:mb-2">{verdict.winnerName} 🏆</div>
                  <div className="text-yellow-900 italic text-xs sm:text-sm">&quot;{verdict.summary}&quot;</div>
                </div>
              </div>
            </div>

            {/* Winner/Loser category-specific GIFs */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="tv-card p-2 sm:p-3 text-center">
                <div className="text-green-400 text-[10px] sm:text-xs font-bold tracking-widest mb-2">🏆 WINNER</div>
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-lg overflow-hidden border-2 border-green-500 mb-2">
                  <img
                    src={getCategoryGif(caseData.category, 'winner')}
                    alt="Winner reaction"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-white font-bold text-xs sm:text-sm">{verdict.winnerName}</div>
              </div>
              <div className="tv-card p-2 sm:p-3 text-center">
                <div className="text-red-400 text-[10px] sm:text-xs font-bold tracking-widest mb-2">😢 LOSER</div>
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-lg overflow-hidden border-2 border-red-500 mb-2">
                  <img
                    src={getCategoryGif(caseData.category, 'loser')}
                    alt="Loser reaction"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-white font-bold text-xs sm:text-sm">{verdict.loserName}</div>
              </div>
            </div>

            <div className="tv-card p-2 sm:p-4 mb-4 sm:mb-6">
              <div className="text-yellow-500 text-[10px] sm:text-xs font-bold tracking-widest mb-1 sm:mb-2">JUDGE&apos;S REASONING</div>
              <div className="text-white text-xs sm:text-sm">{verdict.reasoning}</div>
            </div>

            {verdict.quotes?.length > 0 && (
              <div className="tv-card p-2 sm:p-4 mb-4 sm:mb-6">
                <div className="text-yellow-500 text-[10px] sm:text-xs font-bold tracking-widest mb-1 sm:mb-2">KEY QUOTES</div>
                {verdict.quotes.map((q: string, i: number) => (
                  <div key={i} className="text-gray-300 italic text-xs sm:text-sm mb-2 pl-2 sm:pl-3 border-l-2 border-yellow-600">&quot;{q}&quot;</div>
                ))}
              </div>
            )}

            <CredibilityBar partyA={caseData.partyA} partyB={caseData.partyB} credibilityA={credibilityA} credibilityB={credibilityB} history={credibilityHistory} />

            <StakesBadge stakes={caseData.stakes} />

            {/* Appeal Form */}
            {showAppealForm && (
              <div className="tv-card p-3 sm:p-4 mb-4 sm:mb-6 border-2 border-red-500">
                <div className="text-red-500 text-[10px] sm:text-xs font-bold tracking-widest mb-2">⚠️ FILE AN APPEAL</div>
                <p className="text-gray-400 text-xs sm:text-sm mb-3">
                  Make your case to the judge. Why should the verdict be reconsidered?
                </p>
                <textarea
                  value={appealArgument}
                  onChange={(e) => setAppealArgument(e.target.value)}
                  placeholder="Your appeal argument... (Be persuasive!)"
                  rows={4}
                  className="w-full tv-input text-white resize-none mb-3"
                  style={{ color: 'white' }}
                  disabled={isAppealing}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAppealSubmit}
                    disabled={!appealArgument.trim() || isAppealing}
                    className="flex-1 tv-button py-2 sm:py-3 bg-red-700 border-red-500 text-white text-sm sm:text-base"
                  >
                    {isAppealing ? '⏳ JUDGE IS REVIEWING...' : '📜 SUBMIT APPEAL'}
                  </button>
                  <button
                    onClick={() => { setShowAppealForm(false); setAppealArgument(''); }}
                    disabled={isAppealing}
                    className="tv-button py-2 sm:py-3 bg-gray-700 border-gray-500 text-white text-sm sm:text-base"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            )}

            {/* Appeal Result */}
            {appealResult && (
              <div className={`tv-card p-3 sm:p-4 mb-4 sm:mb-6 border-2 ${appealResult.upheld ? 'border-red-500' : 'border-green-500'}`}>
                <div className={`text-[10px] sm:text-xs font-bold tracking-widest mb-2 ${appealResult.upheld ? 'text-red-500' : 'text-green-500'}`}>
                  {appealResult.upheld ? '❌ APPEAL DENIED' : '✅ APPEAL GRANTED - VERDICT REVERSED!'}
                </div>
                {/* Appeal GIF */}
                <div className="flex justify-center mb-3">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden border-2 border-yellow-600">
                    <img
                      src={appealResult.upheld ? getSituationGif('appealDenied') : getSituationGif('appealGranted')}
                      alt={appealResult.upheld ? 'Appeal denied' : 'Appeal granted'}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
                <div className="text-yellow-500 font-bold text-sm sm:text-base mb-2 italic text-center">
                  &quot;{appealResult.reaction}&quot;
                </div>
                <div className="text-gray-300 text-xs sm:text-sm">
                  {appealResult.ruling}
                </div>
                {!appealResult.upheld && appealResult.newWinnerName && (
                  <div className="mt-3 p-2 bg-green-900/30 rounded border border-green-500 text-center">
                    <div className="text-green-400 text-xs sm:text-sm font-bold">
                      NEW WINNER: {appealResult.newWinnerName} 🏆
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Initial buttons - Accept or Appeal */}
            {verdictAccepted === null && !showAppealForm && !appealResult ? (
              <div className="space-y-2 sm:space-y-3 sm:flex sm:gap-3 sm:space-y-0">
                <button onClick={() => { setVerdictAccepted(true); incrementVerdictsAccepted(); }} className="w-full tv-button py-2 sm:py-3 md:py-4 bg-green-700 border-green-500 text-white text-sm sm:text-base">
                  ✅ ACCEPT VERDICT
                </button>
                <button onClick={() => setShowAppealForm(true)} className="w-full tv-button tv-button-red py-2 sm:py-3 md:py-4 text-sm sm:text-base">
                  ⚠️ APPEAL VERDICT
                </button>
              </div>
            ) : appealResult && !appealAcknowledged ? (
              /* After appeal - show accept/dismiss buttons */
              <div className="space-y-2 sm:space-y-3 sm:flex sm:gap-3 sm:space-y-0">
                <button
                  onClick={() => {
                    setVerdictAccepted(true);
                    setAppealAcknowledged(true);
                    incrementVerdictsAccepted();
                  }}
                  className="w-full tv-button py-2 sm:py-3 md:py-4 bg-green-700 border-green-500 text-white text-sm sm:text-base"
                >
                  ✅ ACCEPT VERDICT
                </button>
                <button
                  onClick={() => {
                    setVerdictAccepted(false);
                    setAppealAcknowledged(true);
                    incrementVerdictsRejected();
                  }}
                  className="w-full tv-button py-2 sm:py-3 md:py-4 bg-gray-700 border-gray-500 text-white text-sm sm:text-base"
                >
                  😤 {(JUDGE_PERSONALITIES[caseData.judge as keyof typeof JUDGE_PERSONALITIES] as any)?.dismissive || 'Whatever'}
                </button>
              </div>
            ) : verdictAccepted !== null || appealAcknowledged ? (
              <div className="text-center">
                {!appealResult && (
                  <div className={`text-base sm:text-lg md:text-xl mb-3 sm:mb-4 font-bold ${verdictAccepted ? 'text-green-400' : 'text-red-400'}`}>
                    {verdictAccepted ? '✅ VERDICT ACCEPTED' : '❌ VERDICT REJECTED'}
                  </div>
                )}
                {appealAcknowledged && (
                  <div className={`text-base sm:text-lg md:text-xl mb-3 sm:mb-4 font-bold ${verdictAccepted ? 'text-green-400' : 'text-gray-400'}`}>
                    {verdictAccepted ? '✅ VERDICT ACCEPTED' : '😤 CASE CLOSED'}
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
                  <button onClick={resetCase} className="tv-button text-sm sm:text-base">
                    🆕 START NEW CASE
                  </button>
                  <button
                    onClick={handleShare}
                    className={`tv-button text-sm sm:text-base ${
                      shareStatus === 'copied' ? 'bg-green-700 border-green-500' :
                      shareStatus === 'shared' ? 'bg-blue-700 border-blue-500' :
                      'bg-purple-700 border-purple-500'
                    } text-white`}
                  >
                    {shareStatus === 'copied' ? '✅ COPIED!' :
                     shareStatus === 'shared' ? '✅ SHARED!' :
                     '📤 SHARE VERDICT'}
                  </button>
                </div>
              </div>
            ) : null}

            <Transcript caseData={caseData} responses={responses} objections={objections} isOpen={transcriptOpen} onToggle={() => setTranscriptOpen(!transcriptOpen)} />
            <ChannelBug text="COURT TV" />
          </TVFrame>
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
        <ObjectionRuling ruling={currentObjectionRuling} onContinue={handleObjectionRulingContinue} judgeId={caseData.judge} />
      )}

      {showSnapJudgment && snapJudgment && (
        <SnapJudgmentDisplay
          judgment={snapJudgment}
          judgeId={caseData.judge}
          onContinue={() => {
            setShowSnapJudgment(false);
            setPhase('verdict');
          }}
        />
      )}

      <div className="min-h-screen flex items-center justify-center p-4">
        <TVFrame>
          <div className="text-center">
            <div className="text-4xl mb-4 animate-pulse">⚖️</div>
            <div className="tv-title text-xl">Loading...</div>
          </div>
        </TVFrame>
      </div>
    </>
  );
}
