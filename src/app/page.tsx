'use client';

import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

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

function GameWithParams() {
  const searchParams = useSearchParams();
  const roomCode = searchParams.get('room');
  
  return <JudgeJudyGame initialRoomCode={roomCode || undefined} />;
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚖️</div>
          <div className="text-white text-xl">Loading...</div>
        </div>
      </div>
    }>
      <GameWithParams />
    </Suspense>
  );
}
