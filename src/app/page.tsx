'use client';

import dynamic from 'next/dynamic';

// Load the game component client-side only (it uses browser APIs)
const JudgeJudyGame = dynamic(() => import('@/components/JudgeJudyGame'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">⚖️</div>
        <div className="text-white text-xl">Loading...</div>
      </div>
    </div>
  ),
});

export default function Home() {
  return <JudgeJudyGame />;
}
