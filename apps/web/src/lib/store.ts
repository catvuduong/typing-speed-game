import { useSyncExternalStore } from 'react';
import type { Mode } from './game';
import type { Content } from './words';

export type Result = {
  id: string;
  wpm: number;
  raw: number;
  accuracy: number;
  consistency: number;
  mode: Mode;
  content: Content;
  date: string;
};

type Bests = Record<string, number>;

const LEADERBOARD_KEY = 'typing-speed:leaderboard';
const BESTS_KEY = 'typing-speed:bests';
const LEADERBOARD_SIZE = 10;

const EMPTY_RESULTS: Result[] = [];
const EMPTY_BESTS: Bests = {};

/** Five believable scores so a first visit is not an empty leaderboard. */
const DEMO_RESULTS: Result[] = [
  { id: 'demo-1', wpm: 96, raw: 103, accuracy: 97, consistency: 92, mode: 60, content: 'words', date: '2026-10-03T18:21:00.000Z' },
  { id: 'demo-2', wpm: 88, raw: 92, accuracy: 96, consistency: 89, mode: 30, content: 'words', date: '2026-10-07T09:45:00.000Z' },
  { id: 'demo-3', wpm: 81, raw: 84, accuracy: 98, consistency: 94, mode: 15, content: 'words', date: '2026-10-11T20:12:00.000Z' },
  { id: 'demo-4', wpm: 74, raw: 79, accuracy: 94, consistency: 85, mode: 60, content: 'code', date: '2026-10-19T12:03:00.000Z' },
  { id: 'demo-5', wpm: 69, raw: 73, accuracy: 95, consistency: 87, mode: 30, content: 'quotes', date: '2026-10-24T07:58:00.000Z' },
];

export function bestKey(mode: Mode, content: Content): string {
  return `${mode}-${content}`;
}

function safeGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage can be blocked (private mode, full quota). The game still works without saving.
  }
}

function parse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

// Snapshots are cached by raw string so useSyncExternalStore sees a stable value between reads.
let resultsCache: { raw: string | null; value: Result[] } = { raw: null, value: EMPTY_RESULTS };
let bestsCache: { raw: string | null; value: Bests } = { raw: null, value: EMPTY_BESTS };

function getResultsSnapshot(): Result[] {
  const raw = safeGet(LEADERBOARD_KEY);
  if (raw !== resultsCache.raw) {
    resultsCache = { raw, value: parse<Result[]>(raw, EMPTY_RESULTS) };
  }
  return resultsCache.value;
}

function getBestsSnapshot(): Bests {
  const raw = safeGet(BESTS_KEY);
  if (raw !== bestsCache.raw) {
    bestsCache = { raw, value: parse<Bests>(raw, EMPTY_BESTS) };
  }
  return bestsCache.value;
}

export function readBest(mode: Mode, content: Content): number | null {
  return getBestsSnapshot()[bestKey(mode, content)] ?? null;
}

export function saveResult(result: Result): void {
  const results = [...getResultsSnapshot(), result]
    .sort((a, b) => b.wpm - a.wpm)
    .slice(0, LEADERBOARD_SIZE);
  safeSet(LEADERBOARD_KEY, JSON.stringify(results));

  const bests = { ...getBestsSnapshot() };
  const key = bestKey(result.mode, result.content);
  bests[key] = Math.max(bests[key] ?? 0, result.wpm);
  safeSet(BESTS_KEY, JSON.stringify(bests));

  emit();
}

/** Writes the demo scores on first visit only. Later visits keep whatever the player saved. */
export function seedDemoScores(): void {
  if (safeGet(LEADERBOARD_KEY) !== null) return;

  const bests: Bests = {};
  for (const result of DEMO_RESULTS) {
    const key = bestKey(result.mode, result.content);
    bests[key] = Math.max(bests[key] ?? 0, result.wpm);
  }
  safeSet(LEADERBOARD_KEY, JSON.stringify(DEMO_RESULTS));
  safeSet(BESTS_KEY, JSON.stringify(bests));

  emit();
}

export function useLeaderboard(): Result[] {
  return useSyncExternalStore(subscribe, getResultsSnapshot, () => EMPTY_RESULTS);
}

export function useBests(): Bests {
  return useSyncExternalStore(subscribe, getBestsSnapshot, () => EMPTY_BESTS);
}
