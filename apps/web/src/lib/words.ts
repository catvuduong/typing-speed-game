export type Content = 'words' | 'code' | 'quotes';

export const CONTENTS: Content[] = ['words', 'code', 'quotes'];

const COMMON_WORDS = [
  'the', 'of', 'and', 'to', 'in', 'is', 'you', 'that', 'it', 'he', 'was', 'for', 'on', 'are', 'as',
  'with', 'his', 'they', 'be', 'at', 'one', 'have', 'this', 'from', 'or', 'had', 'by', 'hot', 'word',
  'but', 'what', 'some', 'we', 'can', 'out', 'other', 'were', 'all', 'there', 'when', 'up', 'use',
  'your', 'how', 'said', 'an', 'each', 'she', 'which', 'do', 'their', 'time', 'if', 'will', 'way',
  'about', 'many', 'then', 'them', 'write', 'would', 'like', 'so', 'these', 'her', 'long', 'make',
  'thing', 'see', 'him', 'two', 'has', 'look', 'more', 'day', 'could', 'go', 'come', 'did', 'number',
  'sound', 'no', 'most', 'people', 'my', 'over', 'know', 'water', 'than', 'call', 'first', 'who',
  'may', 'down', 'side', 'been', 'now', 'find', 'practice', 'speed', 'keyboard', 'window', 'river',
  'bright', 'simple', 'garden', 'planet', 'pencil', 'silver', 'morning', 'journey', 'answer',
];

const CODE_SNIPPETS = [
  'const sum = numbers.reduce((total, n) => total + n, 0);',
  'function greet(name) { return `Hello, ${name}!`; }',
  'for (let i = 0; i < items.length; i++) { console.log(items[i]); }',
  'const user = { id: 1, name: "Ada", active: true };',
  'export async function fetchUser(id) { return fetch(`/api/users/${id}`); }',
  'if (!token) { throw new Error("missing token"); }',
  'const squares = [1, 2, 3].map((x) => x * x);',
  'type Point = { x: number; y: number };',
  'const [count, setCount] = useState(0);',
  'import { useEffect, useState } from "react";',
  'const timer = setTimeout(() => done(), 1000);',
  'while (queue.length > 0) { process(queue.shift()); }',
  'const spread = Math.max(...values) - Math.min(...values);',
  'git commit -m "fix: handle empty input"',
  'SELECT name, email FROM users WHERE active = 1;',
  'const result = await db.query(sql, [userId]);',
  '.button { padding: 8px 16px; border-radius: 6px; }',
  'def add(a, b): return a + b',
];

const QUOTES = [
  'Simple is better than complex.',
  'Talk is cheap. Show me the code.',
  'Premature optimization is the root of all evil.',
  'Make it work, make it right, make it fast.',
  'Any fool can write code that a computer can understand. Good programmers write code that humans can understand.',
  'Programs must be written for people to read, and only incidentally for machines to execute.',
  'The best way to predict the future is to invent it.',
  'Stay hungry, stay foolish.',
  'Less is more.',
  'Measure twice, cut once.',
  'Practice does not make perfect. Perfect practice makes perfect.',
  'Good typing is a habit, built one keystroke at a time.',
];

const POOLS: Record<Content, string[]> = {
  words: COMMON_WORDS,
  code: CODE_SNIPPETS,
  quotes: QUOTES,
};

/** Length of the generated passage. Long enough that nobody runs out in 60 seconds. */
const TEXT_LENGTH = 2000;

/** Deterministic PRNG (mulberry32) so the first render matches on server and client. */
export function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildText(content: Content, random: () => number): string {
  const pool = POOLS[content];
  const parts: string[] = [];
  let length = 0;
  while (length < TEXT_LENGTH) {
    const pick = pool[Math.floor(random() * pool.length)];
    parts.push(pick);
    length += pick.length + 1;
  }
  return parts.join(' ');
}

export type LaidOutWord = { text: string; start: number };

/** Splits the passage into words. Each word keeps its trailing space so every character has an index. */
export function layoutWords(target: string): LaidOutWord[] {
  const parts = target.split(' ');
  let start = 0;
  return parts.map((word, i) => {
    const text = i < parts.length - 1 ? `${word} ` : word;
    const laidOut = { text, start };
    start += text.length;
    return laidOut;
  });
}
