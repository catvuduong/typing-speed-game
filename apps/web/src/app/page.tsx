import { Suspense } from 'react';
import { TypingGame } from '@/components/typing-game';

export default function Home() {
  // useSearchParams (for the test-only ?duration override) needs a Suspense boundary to prerender.
  return (
    <Suspense fallback={null}>
      <TypingGame />
    </Suspense>
  );
}
