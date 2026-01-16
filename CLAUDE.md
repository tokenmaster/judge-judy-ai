# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

Judge Judy AI is a multiplayer AI-powered dispute resolution game using Next.js, TypeScript, Tailwind, Supabase (for real-time multiplayer), and Anthropic's Claude API for the AI judge.

## Development Commands

- `npm run dev` - Start the Next.js development server
- `npm run build` - Build for production

## Key Architecture Decisions

### Question Generation - IMPORTANT

**Problem Solved:** The game had a persistent loop where the judge would keep asking the same question repeatedly.

**Root Causes:**
1. Using a reactive `useEffect` to trigger question generation based on state changes caused race conditions
2. Multiple state changes could trigger the effect unpredictably
3. React's batching meant refs and state could get out of sync
4. Subscription callbacks captured stale closures

**Solution (implemented):**
1. **Explicit generation calls** - Removed the reactive useEffect. Questions are now generated explicitly at specific moments:
   - `handleStatementSubmit`: When entering crossExam phase (single player)
   - `handleResponseSubmit`: After transitioning to next party (single player)
   - `handleCaseUpdate`: When becoming examTarget via subscription (multiplayer)

2. **Refs for subscription callbacks** - Use refs to ensure subscription callbacks always call the latest handler versions:
   - `handleCaseUpdateRef` - Always points to latest `handleCaseUpdate`
   - `myRoleRef` - Always has current `myRole` value
   - Updated via: `handleCaseUpdateRef.current = handleCaseUpdate` after function definition
   - Subscription uses: `handleCaseUpdateRef.current(payload.new)` instead of direct call

3. **Small delays** - 100ms delays before generating to let state settle

### Key Files

- `src/components/JudgeJudyGame.tsx` - Main game component with all game logic
- `src/lib/ai.ts` - AI functions (generateMainQuestion, evaluateCredibility, etc.)
- `src/lib/constants.ts` - Judge personalities, categories, loading states
- `src/lib/supabase.ts` - Supabase client and types

### Multiplayer Flow

1. Party A creates case, gets room code
2. Party B joins with room code
3. Both submit statements
4. Cross-examination: examTarget player generates questions, other player waits
5. After each response, target switches and other player generates next question
6. After 2 rounds (4 questions total), verdict is generated

### Disabled Features

- Follow-up questions are disabled (`generateAIFollowUp` returns immediately)
- `MAX_CLARIFICATIONS = 1` but follow-up logic is commented out
