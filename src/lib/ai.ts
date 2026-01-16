import { JUDGE_PERSONALITIES } from './constants';

const ANTHROPIC_API_KEY = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;

// Helper to call Claude API
async function callClaude(prompt: string, maxTokens: number = 300): Promise<string> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    return data.content?.[0]?.text || '';
  } catch (error) {
    console.error('Claude API error:', error);
    return '';
  }
}

// Generate main cross-examination question
export async function generateMainQuestion(
  judgeId: string,
  caseData: any,
  responses: any[],
  examRound: number,
  examTarget: string,
  objections: any[]
): Promise<string> {
  const judge = JUDGE_PERSONALITIES[judgeId as keyof typeof JUDGE_PERSONALITIES];
  const targetName = examTarget === 'A' ? caseData.partyA : caseData.partyB;
  const otherName = examTarget === 'A' ? caseData.partyB : caseData.partyA;
  const targetStatement = examTarget === 'A' ? caseData.statementA : caseData.statementB;
  const otherStatement = examTarget === 'A' ? caseData.statementB : caseData.statementA;
  
  const previousResponses = responses
    .filter(r => r.party === examTarget)
    .map(r => `Q: ${r.question}\nA: ${r.answer}`)
    .join('\n\n');

  const prompt = `${judge.style}

You are judging a dispute: "${caseData.title}"

${targetName}'s opening statement: "${targetStatement}"
${otherName}'s opening statement: "${otherStatement}"

${previousResponses ? `Previous testimony from ${targetName}:\n${previousResponses}\n` : ''}

This is Round ${examRound + 1} of cross-examination. You're questioning ${targetName}.

Generate ONE pointed question that:
- Probes inconsistencies or gaps in their story
- References specific claims they or the other party made
- Stays in character with your judicial style
- Is direct and requires a real answer

Just output the question, nothing else.`;

  const question = await callClaude(prompt, 150);
  return question || `${targetName}, can you explain your side of what happened?`;
}

// Generate follow-up question
export async function generateAIFollowUp(
  judgeId: string,
  caseData: any,
  responses: any[],
  examTarget: string,
  lastResponse: string,
  clarificationCount: number,
  objections: any[]
): Promise<{ needsClarification: boolean; question: string | null }> {
  const judge = JUDGE_PERSONALITIES[judgeId as keyof typeof JUDGE_PERSONALITIES];
  const targetName = examTarget === 'A' ? caseData.partyA : caseData.partyB;
  
  const prompt = `${judge.style}

The witness ${targetName} just answered: "${lastResponse}"

Based on this response, decide if you need to ask a follow-up question. Consider:
- Did they actually answer the question?
- Did they reveal something that needs probing?
- Are there obvious gaps or contradictions?

You've already asked ${clarificationCount} follow-ups (max 3).

Respond in this exact format:
NEEDS_FOLLOWUP: yes or no
QUESTION: your follow-up question (only if yes)`;

  const result = await callClaude(prompt, 200);
  
  const needsFollowup = result.toLowerCase().includes('needs_followup: yes');
  const questionMatch = result.match(/QUESTION:\s*(.+)/i);
  
  return {
    needsClarification: needsFollowup && clarificationCount < 3,
    question: questionMatch ? questionMatch[1].trim() : null
  };
}

// Evaluate credibility of a response
export async function evaluateCredibility(
  caseData: any,
  responses: any[],
  party: string,
  currentResponse: string,
  currentQuestion: string,
  currentCredibility: number
): Promise<{
  newCredibility: number;
  change: number;
  analysis: string;
  flagged: string | null;
}> {
  const partyName = party === 'A' ? caseData.partyA : caseData.partyB;
  const statement = party === 'A' ? caseData.statementA : caseData.statementB;
  const otherStatement = party === 'A' ? caseData.statementB : caseData.statementA;
  
  const previousAnswers = responses
    .filter(r => r.party === party)
    .map(r => r.answer)
    .join('\n');

  const prompt = `Evaluate the credibility of this testimony.

${partyName}'s opening statement: "${statement}"
Other party claimed: "${otherStatement}"
${partyName}'s previous answers: "${previousAnswers}"

Question asked: "${currentQuestion}"
Their answer: "${currentResponse}"

Score each factor from -10 to +10:
1. CONSISTENCY: Does this match their previous statements? (not whether it matches the OTHER party)
2. RESPONSIVENESS: Did they actually answer the question asked?
3. ACCOUNTABILITY: Are they taking responsibility or deflecting?
4. SPECIFICITY: Concrete details vs vague/evasive?

Respond in this exact format:
CONSISTENCY: [score]
RESPONSIVENESS: [score]
ACCOUNTABILITY: [score]
SPECIFICITY: [score]
ANALYSIS: [one sentence summary]
FLAG: [major issue if any, or "none"]`;

  const result = await callClaude(prompt, 250);
  
  // Parse scores
  const consistencyMatch = result.match(/CONSISTENCY:\s*(-?\d+)/i);
  const responsivenessMatch = result.match(/RESPONSIVENESS:\s*(-?\d+)/i);
  const accountabilityMatch = result.match(/ACCOUNTABILITY:\s*(-?\d+)/i);
  const specificityMatch = result.match(/SPECIFICITY:\s*(-?\d+)/i);
  const analysisMatch = result.match(/ANALYSIS:\s*(.+)/i);
  const flagMatch = result.match(/FLAG:\s*(.+)/i);
  
  const totalChange = 
    (parseInt(consistencyMatch?.[1] || '0')) +
    (parseInt(responsivenessMatch?.[1] || '0')) +
    (parseInt(accountabilityMatch?.[1] || '0')) +
    (parseInt(specificityMatch?.[1] || '0'));
  
  const newCredibility = Math.max(5, Math.min(95, currentCredibility + totalChange));
  const flaggedText = flagMatch?.[1];
  const flagged = (flaggedText && flaggedText.toLowerCase() !== 'none') ? flaggedText : null;
  
  return {
    newCredibility,
    change: totalChange,
    analysis: analysisMatch?.[1] || 'Response evaluated.',
    flagged: flagged || null
  };
}

// Check for snap judgment
export async function checkForSnapJudgment(
  judgeId: string,
  caseData: any,
  responses: any[],
  lastParty: string,
  lastResponse: string,
  credibilityA: number,
  credibilityB: number,
  objections: any[]
): Promise<{ triggered: boolean; winner?: string; reason?: string }> {
  const judge = JUDGE_PERSONALITIES[judgeId as keyof typeof JUDGE_PERSONALITIES];
  
  // Only check after at least 2 responses
  if (responses.length < 2) {
    return { triggered: false };
  }
  
  const prompt = `${judge.style}

Case: "${caseData.title}"
${caseData.partyA} credibility: ${credibilityA}%
${caseData.partyB} credibility: ${credibilityB}%

Recent response from ${lastParty === 'A' ? caseData.partyA : caseData.partyB}: "${lastResponse}"

Should you issue a SNAP JUDGMENT and end the case early? Only do this if:
- One party has clearly won/lost
- Someone made a devastating admission
- The evidence is overwhelming
- Continuing would be pointless

Respond in this exact format:
SNAP_JUDGMENT: yes or no
WINNER: [name if yes]
REASON: [dramatic one-liner if yes]`;

  const result = await callClaude(prompt, 150);
  
  const triggered = result.toLowerCase().includes('snap_judgment: yes');
  const winnerMatch = result.match(/WINNER:\s*(.+)/i);
  const reasonMatch = result.match(/REASON:\s*(.+)/i);
  
  return {
    triggered,
    winner: winnerMatch?.[1]?.trim(),
    reason: reasonMatch?.[1]?.trim()
  };
}

// Rule on an objection
export async function ruleOnObjection(
  judgeId: string,
  caseData: any,
  responses: any[],
  objection: any,
  contentObjectedTo: string,
  previousObjections: any[]
): Promise<{ sustained: boolean; reason: string }> {
  const judge = JUDGE_PERSONALITIES[judgeId as keyof typeof JUDGE_PERSONALITIES];
  
  const prompt = `${judge.style}

${objection.objector} objects on grounds of "${objection.type}".
They object to: "${contentObjectedTo}"
Their reason: "${objection.reason || 'No reason given'}"

Rule on this objection. Is it valid? Stay in character.

Respond in this exact format:
RULING: sustained or overruled
REASON: [your dramatic ruling explanation]`;

  const result = await callClaude(prompt, 150);
  
  const sustained = result.toLowerCase().includes('ruling: sustained');
  const reasonMatch = result.match(/REASON:\s*(.+)/i);
  
  return {
    sustained,
    reason: reasonMatch?.[1] || (sustained ? 'Sustained.' : 'Overruled.')
  };
}

// Generate final verdict
export async function generateAIVerdict(
  judgeId: string,
  caseData: any,
  responses: any[],
  credibilityA: number,
  credibilityB: number,
  objections: any[]
): Promise<{
  winner: string;
  winnerName: string;
  loserName: string;
  summary: string;
  reasoning: string;
  quotes: string[];
  credibilityImpact: string;
}> {
  const judge = JUDGE_PERSONALITIES[judgeId as keyof typeof JUDGE_PERSONALITIES];
  
  const allTestimony = responses
    .map(r => `${r.party === 'A' ? caseData.partyA : caseData.partyB}: "${r.answer}"`)
    .join('\n');

  const prompt = `${judge.style}

CASE: "${caseData.title}"
STAKES: ${caseData.stakes}

${caseData.partyA}'s statement: "${caseData.statementA}"
${caseData.partyB}'s statement: "${caseData.statementB}"

TESTIMONY:
${allTestimony}

FINAL CREDIBILITY:
${caseData.partyA}: ${credibilityA}%
${caseData.partyB}: ${credibilityB}%

Deliver your VERDICT. Stay completely in character.

Respond in this exact format:
WINNER: ${caseData.partyA} or ${caseData.partyB}
SUMMARY: [One dramatic sentence announcing the winner]
REASONING: [2-3 sentences explaining why, in character]
QUOTE1: [A damning or vindicating quote from testimony]
QUOTE2: [Another key quote]
CREDIBILITY_IMPACT: [How credibility affected your decision]`;

  const result = await callClaude(prompt, 500);
  
  const winnerMatch = result.match(/WINNER:\s*(.+)/i);
  const summaryMatch = result.match(/SUMMARY:\s*(.+)/i);
  const reasoningMatch = result.match(/REASONING:\s*(.+?)(?=QUOTE1:|$)/is);
  const quote1Match = result.match(/QUOTE1:\s*(.+)/i);
  const quote2Match = result.match(/QUOTE2:\s*(.+)/i);
  const credImpactMatch = result.match(/CREDIBILITY_IMPACT:\s*(.+)/i);
  
  const winnerName = winnerMatch?.[1]?.trim() || caseData.partyA;
  const winner = winnerName === caseData.partyA ? 'A' : 'B';
  const loserName = winner === 'A' ? caseData.partyB : caseData.partyA;
  
  return {
    winner,
    winnerName,
    loserName,
    summary: summaryMatch?.[1]?.trim() || `${winnerName} wins this case!`,
    reasoning: reasoningMatch?.[1]?.trim() || 'Based on the evidence presented.',
    quotes: [quote1Match?.[1], quote2Match?.[1]].filter(Boolean) as string[],
    credibilityImpact: credImpactMatch?.[1]?.trim() || 'Credibility was a factor.'
  };
}
