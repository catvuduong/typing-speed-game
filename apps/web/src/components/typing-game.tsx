'use client';

import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import type { FormEvent, KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import confetti from 'canvas-confetti';
import { computeMetrics } from '@/lib/metrics';
import { CONTENTS, buildText, layoutWords, seededRandom, type Content } from '@/lib/words';
import { createGame, elapsedMs, gameReducer, MODES, type GameState, type Mode } from '@/lib/game';
import { bestKey, readBest, saveResult, seedDemoScores, useBests, useLeaderboard } from '@/lib/store';
import { Leaderboard } from './leaderboard';
import { KeyHints } from './key-hints';
import { ResultsView } from './results-view';
import { TypingText } from './typing-text';

type Option<T> = { value: T; label: string; testId: string };

const MODE_OPTIONS: Option<Mode>[] = MODES.map((mode) => ({
  value: mode,
  label: `${mode}s`,
  testId: `mode-option-${mode}`,
}));

const CONTENT_OPTIONS: Option<Content>[] = CONTENTS.map((content) => ({
  value: content,
  label: content[0].toUpperCase() + content.slice(1),
  testId: `content-${content}`,
}));

/** Test-only override: `?duration=3` runs a 15s test for 3 seconds. Ignored unless it is a whole number of seconds. */
function parseTestSeconds(raw: string | null): number | null {
  const seconds = Number(raw);
  return Number.isInteger(seconds) && seconds >= 1 && seconds <= 60 ? seconds : null;
}

function initialState(testSeconds: number | null): GameState {
  const target = buildText('words', seededRandom(1));
  return createGame(0, 15, 'words', (testSeconds ?? 15) * 1000, target);
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function TypingGame() {
  const testSeconds = parseTestSeconds(useSearchParams().get('duration'));
  const [state, dispatch] = useReducer(gameReducer, testSeconds, initialState);
  const inputRef = useRef<HTMLInputElement>(null);
  const againRef = useRef<HTMLButtonElement>(null);
  const savedRunId = useRef<number | null>(null);

  const leaderboard = useLeaderboard();
  const bests = useBests();

  const startRun = useCallback(
    (mode: Mode, content: Content) => {
      dispatch({
        type: 'restart',
        mode,
        content,
        durationMs: (testSeconds ?? mode) * 1000,
        target: buildText(content, Math.random),
      });
      inputRef.current?.focus({ preventScroll: true });
    },
    [testSeconds],
  );

  const words = useMemo(() => layoutWords(state.target), [state.target]);
  const elapsed = elapsedMs(state);
  const metrics = useMemo(
    () => computeMetrics(state.typed, state.target, state.log, elapsed),
    [state.typed, state.target, state.log, elapsed],
  );
  const isNewPb = state.phase === 'finished' && state.bestBefore !== null && metrics.wpm > state.bestBefore;
  const personalBest = bests[bestKey(state.mode, state.content)] ?? null;

  useEffect(() => {
    seedDemoScores();
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (state.phase !== 'running') return;
    const timer = window.setInterval(() => dispatch({ type: 'tick', at: performance.now() }), 100);
    return () => window.clearInterval(timer);
  }, [state.phase]);

  // Esc restarts at any time. After a finished test, Tab moves focus to "Try again" so Enter restarts.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        startRun(state.mode, state.content);
      } else if (event.key === 'Tab' && state.phase === 'finished') {
        event.preventDefault();
        againRef.current?.focus();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [startRun, state.mode, state.content, state.phase]);

  // Save each finished run once. Runs on mobile too, where the key events come through input.
  useEffect(() => {
    if (state.phase !== 'finished' || savedRunId.current === state.runId) return;
    savedRunId.current = state.runId;

    saveResult({
      id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
      wpm: metrics.wpm,
      raw: metrics.raw,
      accuracy: metrics.accuracy,
      consistency: metrics.consistency,
      mode: state.mode,
      content: state.content,
      date: new Date().toISOString(),
    });

    if (isNewPb && !prefersReducedMotion()) {
      confetti({ particleCount: 140, spread: 75, origin: { y: 0.4 } });
    }
  }, [state.phase, state.runId, state.mode, state.content, metrics, isNewPb]);

  function handleInput(event: FormEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const inputType = (event.nativeEvent as InputEvent).inputType ?? '';

    if (inputType.startsWith('delete')) {
      dispatch({ type: 'backspace' });
    } else if (input.value) {
      dispatch({
        type: 'type',
        chars: input.value,
        at: performance.now(),
        bestBefore: state.phase === 'ready' ? readBest(state.mode, state.content) : null,
      });
    }
    input.value = '';
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace') {
      event.preventDefault();
      dispatch({ type: 'backspace' });
    }
  }

  function focusInput() {
    inputRef.current?.focus({ preventScroll: true });
  }

  const remainingSeconds = Math.ceil((state.durationMs - elapsed) / 1000);

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">
          <span className="logo" aria-hidden="true">
            {'>'}
          </span>
          <h1>Typing Speed</h1>
        </div>
        <div className="personal-best" data-testid="personal-best">
          <span className="label">Personal best</span>
          <strong>{personalBest !== null ? `${personalBest} WPM` : '—'}</strong>
          <span className="muted">
            {state.mode}s · {state.content}
          </span>
        </div>
      </header>

      <div className="layout">
        <section className="card game" aria-label="Typing test">
          <div className="controls">
            <Segmented
              label="Duration"
              options={MODE_OPTIONS}
              selected={state.mode}
              onSelect={(mode) => startRun(mode, state.content)}
            />
            <Segmented
              label="Content"
              options={CONTENT_OPTIONS}
              selected={state.content}
              onSelect={(content) => startRun(state.mode, content)}
            />
          </div>

          <div className="test-body">
            {state.phase === 'finished' ? (
              <ResultsView
                metrics={metrics}
                mode={state.mode}
                content={state.content}
                isNewPb={isNewPb}
                againRef={againRef}
                onAgain={() => startRun(state.mode, state.content)}
              />
            ) : (
              <>
                <div className="stats">
                  <Stat label="Time left" value={`${Math.max(0, remainingSeconds)}s`} testId="time-left" />
                  <Stat label="WPM" value={metrics.wpm} testId="live-wpm" />
                  <Stat label="Accuracy" value={`${metrics.accuracy}%`} testId="live-accuracy" />
                </div>
                <div className="typing-area" data-testid="typing-area" onClick={focusInput}>
                  <TypingText words={words} typed={state.typed} />
                </div>
                {state.phase === 'ready' && <p className="muted start-line">Start typing to begin</p>}
              </>
            )}
          </div>

          <KeyHints />
        </section>

        <Leaderboard entries={leaderboard} />
      </div>

      <input
        ref={inputRef}
        className="typing-input"
        data-testid="typing-input"
        aria-label="Type here"
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
      />
    </main>
  );
}

type SegmentedProps<T> = {
  label: string;
  options: Option<T>[];
  selected: T;
  onSelect: (value: T) => void;
};

function Segmented<T>({ label, options, selected, onSelect }: SegmentedProps<T>) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((option) => {
        const isSelected = option.value === selected;
        return (
          <button
            key={option.testId}
            type="button"
            data-testid={option.testId}
            aria-pressed={isSelected}
            className={isSelected ? 'segment active' : 'segment'}
            onClick={() => onSelect(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function Stat({ label, value, testId }: { label: string; value: string | number; testId: string }) {
  return (
    <div className="stat">
      <span className="label">{label}</span>
      <span className="stat-value" data-testid={testId}>
        {value}
      </span>
    </div>
  );
}
