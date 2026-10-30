'use client';

import { useEffect, useState } from 'react';

const HINTS = [
  { keys: ['Tab', 'Enter'], label: 'try again' },
  { keys: ['Backspace'], label: 'correct' },
  { keys: ['Esc'], label: 'restart' },
];

export function KeyHints() {
  const [pressed, setPressed] = useState<string | null>(null);

  // Flash the matching key cap for a moment on every key press.
  useEffect(() => {
    let timer: number | undefined;
    function onKeyDown(event: KeyboardEvent) {
      setPressed(event.key === 'Escape' ? 'Esc' : event.key);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setPressed(null), 160);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <div className="key-hints" aria-label="Keyboard shortcuts">
      {HINTS.map((hint) => (
        <span key={hint.label} className="hint">
          {hint.keys.map((key, i) => (
            <span key={key}>
              {i > 0 && <span className="hint-plus">+</span>}
              <kbd className={pressed === key ? 'keycap pressed' : 'keycap'}>
                {key}
              </kbd>
            </span>
          ))}
          <span className="hint-label">{hint.label}</span>
        </span>
      ))}
    </div>
  );
}
