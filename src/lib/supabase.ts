import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database
export interface Case {
  id: string;
  room_code: string;
  title: string;
  category: string;
  judge: string;
  stakes: string;
  party_a_name: string;
  party_b_name: string;
  party_a_session: string | null;
  party_b_session: string | null;
  phase: string;
  current_turn: string;
  exam_round: number;
  exam_target: string;
  statement_a: string | null;
  statement_b: string | null;
  current_question: string | null;
  credibility_a: number;
  credibility_b: number;
  objections_used_a: boolean;
  objections_used_b: boolean;
  verdict: any | null;
  created_at: string;
}

export interface Response {
  id: string;
  case_id: string;
  round: number;
  party: string;
  party_name: string;
  question: string;
  answer: string;
  is_clarification: boolean;
  credibility_change: number;
  created_at: string;
}

export interface Objection {
  id: string;
  case_id: string;
  objector_party: string;
  objector_name: string;
  target: string;
  type: string;
  reason: string;
  is_question_objection: boolean;
  sustained: boolean | null;
  ruling_reason: string | null;
  created_at: string;
}

// Helper functions
export const generateRoomCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const getSessionId = (): string => {
  if (typeof window === 'undefined') return '';

  let sessionId = sessionStorage.getItem('judge_judy_session');
  if (!sessionId) {
    sessionId = 'session_' + Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('judge_judy_session', sessionId);
  }
  return sessionId;
};

// Stats tracking
export interface Stats {
  id: string;
  cases_filed: number;
  verdicts_accepted: number;
  verdicts_rejected: number;
  updated_at: string;
}

export const getStats = async (): Promise<Stats | null> => {
  const { data, error } = await supabase
    .from('stats')
    .select('*')
    .eq('id', 'global')
    .single();

  if (error) {
    console.error('Error fetching stats:', error);
    return null;
  }
  return data;
};

export const incrementCasesFiled = async (): Promise<void> => {
  const { error } = await supabase.rpc('increment_cases_filed');
  if (error) {
    console.error('Error incrementing cases filed:', error);
  }
};

export const incrementVerdictsAccepted = async (): Promise<void> => {
  const { error } = await supabase.rpc('increment_verdicts_accepted');
  if (error) {
    console.error('Error incrementing verdicts accepted:', error);
  }
};

export const incrementVerdictsRejected = async (): Promise<void> => {
  const { error } = await supabase.rpc('increment_verdicts_rejected');
  if (error) {
    console.error('Error incrementing verdicts rejected:', error);
  }
};
