import { JUDGE_PERSONALITIES } from './constants';

const ANTHROPIC_API_KEY = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;

// Helper to call Claude API
async function callClaude(prompt: string, maxTokens: number = 300): Promise<string> {
  if (!ANTHROPIC_API_KEY) {
    console.error('Claude API error: Missing API key');
    return '';
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Claude API error:', response.status, errorData);
      return '';
    }

    const data = await response.json();
    return data.content?.[0]?.text || '';
  } catch (error) {
    console.error('Claude API error:', error);
    return '';
  }
}

// Round purposes for structured cross-examination (exported for UI)
export const ROUND_PURPOSES = {
  0: {
    name: 'Clarification & Scope',
    goal: 'eliminate ambiguity and surface hidden assumptions',
    questionFocus: 'clarifying core claims or assumptions',
    examples: [
      'When you say "[specific term]", what exactly do you mean by that?',
      'Your statement assumes [assumption]. Is that correct?',
      'Can you clarify what specifically happened on [date/time]?',
      'What exactly are you asking for as an outcome here?'
    ],
    judgeCheck: 'Are their claims well-defined? Are assumptions explicit or evasive?'
  },
  1: {
    name: 'Justification & Evidence',
    goal: 'test strength of reasoning and support',
    questionFocus: 'evidence, proof, and logical basis for claims',
    examples: [
      'What evidence do you have that supports this claim?',
      'Why should I believe your version over theirs?',
      'Can you prove that [specific claim] actually happened?',
      'What makes you so certain about [assertion]?'
    ],
    judgeCheck: 'Quality of evidence vs. rhetoric? Logical coherence? Data vs. assertion?'
  },
  2: {
    name: 'Stress Test & Tradeoffs',
    goal: 'expose fragility, risk, and edge cases',
    questionFocus: 'failure modes, downsides, and conditions where their position breaks',
    examples: [
      'Under what circumstances would you admit you were wrong?',
      'What\'s the weakest part of your argument?',
      'If [opposing scenario], would your position still hold?',
      'What responsibility, if any, do you bear in this situation?'
    ],
    judgeCheck: 'Risk awareness? Intellectual honesty? Do they acknowledge any fault?'
  }
};

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

  // Get round purpose
  const roundPurpose = ROUND_PURPOSES[examRound as keyof typeof ROUND_PURPOSES] || ROUND_PURPOSES[0];

  const targetResponses = responses
    .filter((r: any) => r.party === examTarget)
    .map((r: any) => `Q: ${r.question}\nA: ${r.answer}`)
    .join('\n\n');

  const otherParty = examTarget === 'A' ? 'B' : 'A';
  const opponentResponses = responses
    .filter((r: any) => r.party === otherParty)
    .map((r: any) => `Q: ${r.question}\nA: ${r.answer}`)
    .join('\n\n');

  // Build round-specific instruction
  let roundInstruction = '';
  if (examRound === 0) {
    roundInstruction = `FOCUS: ${targetName} and ${otherName} have made conflicting claims. Find a specific point where they contradict each other and ask ${targetName} to clarify or explain the discrepancy.`;
  } else if (examRound === 1) {
    roundInstruction = `FOCUS: ${otherName} made specific claims or provided details that challenge ${targetName}'s position. Ask ${targetName} to justify their position in light of what ${otherName} said.`;
  } else {
    roundInstruction = `FOCUS: Find the weakest part of ${targetName}'s argument OR something ${otherName} said that ${targetName} hasn't addressed. Press ${targetName} on this specific vulnerability.`;
  }

  const prompt = `${judge.style}

You are cross-examining ${targetName} in a dispute: "${caseData.title}"

=== CASE FOUNDATION ===
${targetName}'s opening claim: "${targetStatement}"
${otherName}'s counter-claim: "${otherStatement}"

=== ${otherName.toUpperCase()}'S TESTIMONY ===
${opponentResponses ? opponentResponses : `${otherName} has not testified yet.`}

=== ${targetName.toUpperCase()}'S PREVIOUS ANSWERS ===
${targetResponses ? targetResponses : `${targetName} has not answered any questions yet.`}

=== YOUR ANALYSIS (think through this carefully) ===
Before asking your question, analyze:
1. CORE CONFLICT: What is the fundamental disagreement between ${targetName} and ${otherName}?
2. OPPONENT'S KEY POINTS: What specific things did ${otherName} claim that ${targetName} should have to address?
3. GAPS OR CONTRADICTIONS: Are there inconsistencies between what ${targetName} says and what ${otherName} says?
4. UNPROVEN CLAIMS: What has ${targetName} asserted without evidence or explanation?

=== ROUND ${examRound + 1}: ${roundPurpose.name.toUpperCase()} ===
Goal: ${roundPurpose.goal}
${roundInstruction}

Based on your analysis, ask ${targetName} ONE specific question that:
- Directly addresses something ${otherName} claimed or revealed
- Tests a weakness, gap, or unproven assertion in ${targetName}'s position
- Requires a concrete, specific answer (not just "yes" or "no")
- References specific details from the statements or testimony

CRITICAL: Your question MUST reference the actual dispute content. Do NOT ask generic questions.

Output ONLY the question itself, addressed directly to ${targetName}. Must end with a question mark.`;

  const question = await callClaude(prompt, 200);

  // Ensure it's actually a question
  let cleanQuestion = question.trim();
  if (!cleanQuestion.endsWith('?')) {
    cleanQuestion = `${targetName}, can you explain what you mean by "${targetStatement.slice(0, 50)}..."?`;
  }

  return cleanQuestion || `${targetName}, can you explain your side of what happened?`;
}

// Generate follow-up question - DISABLED
export async function generateAIFollowUp(
  judgeId: string,
  caseData: any,
  responses: any[],
  examTarget: string,
  lastResponse: string,
  clarificationCount: number,
  objections: any[]
): Promise<{ needsClarification: boolean; question: string | null }> {
  // Follow-up questions are disabled
  return { needsClarification: false, question: null };
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
    .filter((r: any) => r.party === party)
    .map((r: any) => r.answer)
    .join('\n');

  const prompt = `You are analyzing testimony in a dispute. Think critically and apply real-world logic.

DISPUTE CONTEXT:
${partyName}'s claim: "${statement}"
Other party's counter-claim: "${otherStatement}"
${previousAnswers ? `${partyName}'s previous testimony: "${previousAnswers}"` : ''}

CURRENT EXCHANGE:
Question: "${currentQuestion}"
${partyName}'s answer: "${currentResponse}"

ANALYZE THIS RESPONSE CRITICALLY:

1. LOGICAL CONSISTENCY (-10 to +10):
   - Does this answer contradict their earlier statements?
   - Is the internal logic sound, or are there holes?
   - Would a reasonable person find this believable?

2. DIRECT RESPONSIVENESS (-10 to +10):
   - Did they actually answer what was asked?
   - Are they dodging, deflecting, or going off-topic?
   - Did they address the specific claim/accusation?

3. ACCOUNTABILITY & HONESTY (-10 to +10):
   - Are they taking fair responsibility or blame-shifting?
   - Do they acknowledge any fault or nuance?
   - Does it sound rehearsed/defensive vs genuine?

4. SUBSTANCE & SPECIFICITY (-10 to +10):
   - Concrete details (names, dates, specifics) vs vague generalities?
   - Can their claims be verified or are they unfalsifiable?
   - Is this real engagement or just noise?

5. REAL-WORLD PLAUSIBILITY:
   - Does this make sense given how people actually behave?
   - Are there red flags suggesting dishonesty or exaggeration?

Respond in this exact format:
CONSISTENCY: [score]
RESPONSIVENESS: [score]
ACCOUNTABILITY: [score]
SPECIFICITY: [score]
ANALYSIS: [2-3 sentences of substantive analysis explaining your assessment]
FLAG: [specific credibility concern if any, or "none"]`;

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
  
  const newCredibility = Math.max(5, Math.min(100, currentCredibility + totalChange));
  const flaggedText = flagMatch?.[1];
  const flagged = (flaggedText && flaggedText.toLowerCase() !== 'none') ? flaggedText : null;
  
  return {
    newCredibility,
    change: totalChange,
    analysis: analysisMatch?.[1] || 'Response evaluated.',
    flagged: flagged
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

  // Check after at least 2 responses (1 per party)
  if (responses.length < 2) {
    console.log('[SnapJudgment] Skipping - only', responses.length, 'responses');
    return { triggered: false };
  }

  // Check if credibility difference is notable (15+ points)
  const credDiff = Math.abs(credibilityA - credibilityB);
  if (credDiff < 15) {
    console.log('[SnapJudgment] Skipping - credibility diff only', credDiff);
    return { triggered: false };
  }

  const allTestimony = responses
    .map((r: any) => `${r.party === 'A' ? caseData.partyA : caseData.partyB}: "${r.answer}"`)
    .join('\n');

  const prompt = `${judge.style}

Case: "${caseData.title}"
Stakes: ${caseData.stakes}

${caseData.partyA}'s claim: "${caseData.statementA}"
${caseData.partyB}'s claim: "${caseData.statementB}"

Testimony so far:
${allTestimony}

Current credibility:
${caseData.partyA}: ${credibilityA}%
${caseData.partyB}: ${credibilityB}%

Most recent response from ${lastParty === 'A' ? caseData.partyA : caseData.partyB}: "${lastResponse}"

Should you issue a SNAP JUDGMENT and end the case early? Consider:
- Has one party clearly won/lost based on logic and evidence?
- Did someone make a damaging admission or contradiction?
- Is this case FRIVOLOUS, FAKE, or NONSENSICAL and should be DISMISSED?
- Are both parties just wasting the court's time with gibberish?

You can:
1. Continue the case (SNAP_JUDGMENT: no)
2. Rule for one party early (SNAP_JUDGMENT: yes, WINNER: [name])
3. DISMISS the case if it's not a real dispute (SNAP_JUDGMENT: yes, WINNER: NOBODY - CASE DISMISSED)

Respond in this exact format:
SNAP_JUDGMENT: yes or no
WINNER: [name if ruling early, "NOBODY - CASE DISMISSED" if dismissing, "none" if continuing]
REASON: [dramatic one-liner explaining your decision]`;

  const result = await callClaude(prompt, 150);

  console.log('[SnapJudgment] AI response:', result);

  const triggered = result.toLowerCase().includes('snap_judgment: yes');
  const winnerMatch = result.match(/WINNER:\s*(.+)/i);
  const reasonMatch = result.match(/REASON:\s*(.+)/i);

  console.log('[SnapJudgment] Triggered:', triggered);

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
  isDismissed?: boolean;
}> {
  const judge = JUDGE_PERSONALITIES[judgeId as keyof typeof JUDGE_PERSONALITIES];

  // Organize testimony by round for structured analysis
  const round1Testimony = responses.slice(0, 2); // Clarification round
  const round2Testimony = responses.slice(2, 4); // Justification round
  const round3Testimony = responses.slice(4, 6); // Stress test round

  const formatRoundTestimony = (roundResponses: any[]) => {
    return roundResponses.map((r: any) =>
      `${r.party === 'A' ? caseData.partyA : caseData.partyB}: "${r.answer}"`
    ).join('\n');
  };

  const prompt = `${judge.style}

You are delivering a verdict. While staying in character, you must SYSTEMATICALLY EVALUATE both parties based on the structured cross-examination.

CASE: "${caseData.title}"
STAKES: ${caseData.stakes}

=== OPENING POSITIONS ===
${caseData.partyA}'s claim: "${caseData.statementA}"
${caseData.partyB}'s claim: "${caseData.statementB}"

=== ROUND 1: CLARIFICATION & SCOPE ===
(Goal: Were claims well-defined? Were assumptions explicit or evasive?)
${formatRoundTestimony(round1Testimony) || 'No testimony'}

=== ROUND 2: JUSTIFICATION & EVIDENCE ===
(Goal: Quality of evidence? Logical coherence? Assertion vs. proof?)
${formatRoundTestimony(round2Testimony) || 'No testimony'}

=== ROUND 3: STRESS TEST & TRADEOFFS ===
(Goal: Risk awareness? Intellectual honesty? Do they acknowledge fault?)
${formatRoundTestimony(round3Testimony) || 'No testimony'}

=== CREDIBILITY SCORES ===
${caseData.partyA}: ${credibilityA}%
${caseData.partyB}: ${credibilityB}%

=== SYNTHESIS PROCESS ===
Compare both parties across:
1. CLARITY: Whose claims were better defined and less ambiguous?
2. JUSTIFICATION: Whose reasoning was stronger, with better evidence?
3. RISK AWARENESS: Who showed more intellectual honesty about weaknesses?
4. Which position holds under the widest set of conditions?
5. Which relies on fewer or weaker assumptions?

You have THREE options:
- Rule for ${caseData.partyA}
- Rule for ${caseData.partyB}
- DISMISS the case (if frivolous, fake, or both equally at fault)

Respond in this exact format:
WINNER: ${caseData.partyA} or ${caseData.partyB} or NOBODY - CASE DISMISSED
SUMMARY: [One dramatic sentence announcing the verdict]
REASONING: [3-4 sentences referencing KEY QUESTIONS that determined outcome. What was the critical weakness in the losing position? Include any unresolved uncertainty.]
QUOTE1: [A revealing quote from testimony]
QUOTE2: [Another key quote]
CREDIBILITY_IMPACT: [How their answers during each round affected your ruling]`;

  const result = await callClaude(prompt, 500);
  
  const winnerMatch = result.match(/WINNER:\s*(.+)/i);
  const summaryMatch = result.match(/SUMMARY:\s*(.+)/i);
  const reasoningMatch = result.match(/REASONING:\s*([^]*?)(?=QUOTE1:|$)/i);
  const quote1Match = result.match(/QUOTE1:\s*(.+)/i);
  const quote2Match = result.match(/QUOTE2:\s*(.+)/i);
  const credImpactMatch = result.match(/CREDIBILITY_IMPACT:\s*(.+)/i);

  const winnerRaw = winnerMatch?.[1]?.trim() || caseData.partyA;

  // Check for case dismissal
  const isDismissed = winnerRaw.toLowerCase().includes('nobody') ||
                      winnerRaw.toLowerCase().includes('dismissed') ||
                      winnerRaw.toLowerCase().includes('dismiss');

  let winner: string;
  let winnerName: string;
  let loserName: string;

  if (isDismissed) {
    winner = 'DISMISSED';
    winnerName = 'Case Dismissed';
    loserName = 'Case Dismissed';
  } else {
    winnerName = winnerRaw;
    winner = winnerName === caseData.partyA ? 'A' : 'B';
    loserName = winner === 'A' ? caseData.partyB : caseData.partyA;
  }

  const quotes: string[] = [];
  if (quote1Match?.[1]) quotes.push(quote1Match[1]);
  if (quote2Match?.[1]) quotes.push(quote2Match[1]);

  return {
    winner,
    winnerName,
    loserName,
    summary: summaryMatch?.[1]?.trim() || (isDismissed ? 'Case dismissed!' : `${winnerName} wins this case!`),
    reasoning: reasoningMatch?.[1]?.trim() || 'Based on the evidence presented.',
    quotes,
    credibilityImpact: credImpactMatch?.[1]?.trim() || 'Credibility was a factor.',
    isDismissed
  };
}

// Evaluate an appeal
export async function evaluateAppeal(
  judgeId: string,
  caseData: any,
  originalVerdict: any,
  appealArgument: string,
  responses: any[],
  credibilityA: number,
  credibilityB: number
): Promise<{
  upheld: boolean;
  newWinner?: string;
  newWinnerName?: string;
  ruling: string;
  reaction: string;
}> {
  const judge = JUDGE_PERSONALITIES[judgeId as keyof typeof JUDGE_PERSONALITIES];

  const allTestimony = responses
    .map((r: any) => `${r.party === 'A' ? caseData.partyA : caseData.partyB}: "${r.answer}"`)
    .join('\n');

  const prompt = `${judge.style}

CASE: "${caseData.title}"
STAKES: ${caseData.stakes}

ORIGINAL VERDICT: ${originalVerdict.winnerName} won.
ORIGINAL REASONING: ${originalVerdict.reasoning}

The losing party (${originalVerdict.loserName}) has filed an APPEAL with this argument:
"${appealArgument}"

TESTIMONY REVIEW:
${caseData.partyA}'s statement: "${caseData.statementA}"
${caseData.partyB}'s statement: "${caseData.statementB}"
${allTestimony}

CREDIBILITY SCORES:
${caseData.partyA}: ${credibilityA}%
${caseData.partyB}: ${credibilityB}%

Consider the appeal argument carefully. Does it:
- Raise valid points not fully considered?
- Point out errors in your reasoning?
- Present a compelling reframing of the evidence?

You may UPHOLD your original verdict or REVERSE it if the appeal is truly compelling.
Stay completely in character. Be dramatic.

Respond in this exact format:
RULING: UPHELD or REVERSED
NEW_WINNER: [only if reversed, the new winner's name]
EXPLANATION: [2-3 sentences explaining your decision on the appeal, in character]
REACTION: [A dramatic one-liner reaction to the appeal attempt]`;

  const result = await callClaude(prompt, 400);

  const rulingMatch = result.match(/RULING:\s*(UPHELD|REVERSED)/i);
  const newWinnerMatch = result.match(/NEW_WINNER:\s*(.+)/i);
  const explanationMatch = result.match(/EXPLANATION:\s*([^]*?)(?=REACTION:|$)/i);
  const reactionMatch = result.match(/REACTION:\s*(.+)/i);

  const upheld = rulingMatch?.[1]?.toUpperCase() !== 'REVERSED';

  let newWinner, newWinnerName;
  if (!upheld) {
    newWinnerName = newWinnerMatch?.[1]?.trim() || originalVerdict.loserName;
    newWinner = newWinnerName === caseData.partyA ? 'A' : 'B';
  }

  return {
    upheld,
    newWinner,
    newWinnerName,
    ruling: explanationMatch?.[1]?.trim() || (upheld ? 'The original verdict stands.' : 'The verdict has been reversed.'),
    reaction: reactionMatch?.[1]?.trim() || (upheld ? 'Nice try.' : 'You make a compelling point.')
  };
}
