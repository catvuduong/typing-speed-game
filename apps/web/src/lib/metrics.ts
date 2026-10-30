export type Keystroke = { t: number; ok: boolean };

export type WpmPoint = { second: number; wpm: number };

export type Metrics = {
  wpm: number;
  raw: number;
  accuracy: number;
  consistency: number;
  chart: WpmPoint[];
};

const CHARS_PER_WORD = 5;

export function computeMetrics(
  typed: string,
  target: string,
  log: Keystroke[],
  elapsedMs: number,
): Metrics {
  const minutes = Math.max(elapsedMs, 1000) / 60000;

  let correctChars = 0;
  for (let i = 0; i < typed.length; i++) {
    if (typed[i] === target[i]) correctChars++;
  }

  const correctKeystrokes = log.filter((k) => k.ok).length;

  return {
    wpm: Math.round(correctChars / CHARS_PER_WORD / minutes),
    raw: Math.round(log.length / CHARS_PER_WORD / minutes),
    accuracy: log.length ? Math.round((correctKeystrokes / log.length) * 100) : 100,
    consistency: computeConsistency(log, elapsedMs),
    chart: computeChart(log, elapsedMs),
  };
}

/** 100 minus the coefficient of variation of keystrokes per second: steady typing scores near 100. */
function computeConsistency(log: Keystroke[], elapsedMs: number): number {
  const seconds = Math.max(1, Math.ceil(elapsedMs / 1000));
  const buckets = new Array<number>(seconds).fill(0);
  for (const key of log) {
    buckets[Math.min(Math.floor(key.t / 1000), seconds - 1)]++;
  }

  const mean = buckets.reduce((sum, n) => sum + n, 0) / seconds;
  if (mean === 0) return 0;

  const variance = buckets.reduce((sum, n) => sum + (n - mean) ** 2, 0) / seconds;
  const cv = Math.sqrt(variance) / mean;
  return Math.max(0, Math.min(100, Math.round((1 - cv) * 100)));
}

/** Running WPM at the end of each second, from correct keystrokes so far. */
function computeChart(log: Keystroke[], elapsedMs: number): WpmPoint[] {
  const seconds = Math.max(1, Math.ceil(elapsedMs / 1000));
  const points: WpmPoint[] = [];
  for (let second = 1; second <= seconds; second++) {
    const at = Math.min(second * 1000, Math.max(elapsedMs, 1000));
    const correct = log.filter((k) => k.ok && k.t <= at).length;
    points.push({ second, wpm: Math.round(correct / CHARS_PER_WORD / (at / 60000)) });
  }
  return points;
}
