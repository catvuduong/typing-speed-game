import { memo, useLayoutEffect, useRef } from 'react';
import type { LaidOutWord } from '@/lib/words';

/** Must match `.text-inner` line-height in globals.css. */
const LINE_HEIGHT = 40;

type WordProps = { text: string; start: number; typed: string };

// Only the words whose typed slice changed re-render on each keystroke.
const Word = memo(function Word({ text, start, typed }: WordProps) {
  return (
    <span className="word" data-testid="word">
      {text.split('').map((ch, i) => {
        const state = i < typed.length ? (typed[i] === ch ? 'correct' : 'wrong') : 'upcoming';
        return (
          <span key={i} data-index={start + i} data-state={state} className={`char ${state}`}>
            {ch}
          </span>
        );
      })}
    </span>
  );
});

type Props = { words: LaidOutWord[]; typed: string };

export function TypingText({ words, typed }: Props) {
  const innerRef = useRef<HTMLDivElement>(null);
  const caretRef = useRef<HTMLSpanElement>(null);

  // Moves the caret to the next character and scrolls the text so the active line stays in view.
  useLayoutEffect(() => {
    const inner = innerRef.current;
    const caret = caretRef.current;
    if (!inner || !caret) return;

    const place = () => {
      const next = inner.querySelector<HTMLElement>(`[data-index="${typed.length}"]`);
      if (!next) return;
      caret.style.left = `${next.offsetLeft}px`;
      caret.style.top = `${next.offsetTop}px`;
      const line = Math.round(next.offsetTop / LINE_HEIGHT);
      inner.style.transform = `translateY(${-Math.max(0, line - 1) * LINE_HEIGHT}px)`;
    };

    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [typed, words]);

  return (
    <div className="text-viewport" data-testid="text">
      <div className="text-inner" ref={innerRef}>
        {words.map((word) => (
          <Word
            key={word.start}
            text={word.text}
            start={word.start}
            typed={typed.slice(word.start, word.start + word.text.length)}
          />
        ))}
        <span className="caret" ref={caretRef} data-testid="caret" aria-hidden="true" />
      </div>
    </div>
  );
}
