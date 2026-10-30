import type { Content } from './words';
import type { Keystroke } from './metrics';

export type Mode = 15 | 30 | 60;

export const MODES: Mode[] = [15, 30, 60];

export type Phase = 'ready' | 'running' | 'finished';

export type GameState = {
  phase: Phase;
  runId: number;
  mode: Mode;
  content: Content;
  durationMs: number;
  target: string;
  typed: string;
  log: Keystroke[];
  startedAt: number;
  now: number;
  /** Personal best for this mode and content when the run started, or null if there was none. */
  bestBefore: number | null;
};

export type GameAction =
  | { type: 'restart'; mode: Mode; content: Content; durationMs: number; target: string }
  | { type: 'type'; chars: string; at: number; bestBefore: number | null }
  | { type: 'backspace' }
  | { type: 'tick'; at: number };

export function createGame(
  runId: number,
  mode: Mode,
  content: Content,
  durationMs: number,
  target: string,
): GameState {
  return {
    phase: 'ready',
    runId,
    mode,
    content,
    durationMs,
    target,
    typed: '',
    log: [],
    startedAt: 0,
    now: 0,
    bestBefore: null,
  };
}

export function elapsedMs(state: GameState): number {
  if (state.phase === 'ready') return 0;
  return Math.min(state.now - state.startedAt, state.durationMs);
}

function finish(state: GameState): GameState {
  return { ...state, phase: 'finished', now: state.startedAt + state.durationMs };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'restart':
      return createGame(
        state.runId + 1,
        action.mode,
        action.content,
        action.durationMs,
        action.target,
      );

    case 'type': {
      if (state.phase === 'finished') return state;

      let current = state;
      if (current.phase === 'ready') {
        current = {
          ...current,
          phase: 'running',
          startedAt: action.at,
          now: action.at,
          bestBefore: action.bestBefore,
        };
      }
      if (action.at - current.startedAt >= current.durationMs) return finish(current);

      let typed = current.typed;
      const log = [...current.log];
      for (const ch of action.chars) {
        if (typed.length >= current.target.length) break;
        log.push({ t: action.at - current.startedAt, ok: current.target[typed.length] === ch });
        typed += ch;
      }
      return { ...current, typed, log, now: action.at };
    }

    case 'backspace':
      if (state.phase !== 'running' || state.typed.length === 0) return state;
      return { ...state, typed: state.typed.slice(0, -1) };

    case 'tick':
      if (state.phase !== 'running') return state;
      if (action.at - state.startedAt >= state.durationMs) return finish(state);
      return { ...state, now: action.at };
  }
}
