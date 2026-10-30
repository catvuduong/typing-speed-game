import type { RefObject } from 'react';
import type { Metrics } from '@/lib/metrics';
import type { Mode } from '@/lib/game';
import type { Content } from '@/lib/words';
import { WpmChart } from './wpm-chart';

type Props = {
  metrics: Metrics;
  mode: Mode;
  content: Content;
  isNewPb: boolean;
  againRef: RefObject<HTMLButtonElement | null>;
  onAgain: () => void;
};

export function ResultsView({ metrics, mode, content, isNewPb, againRef, onAgain }: Props) {
  return (
    <section className="results" data-testid="results" aria-label="Results">
      <div className="result-hero">
        <div className="hero-stat">
          <span className="label">WPM</span>
          <strong className="big" data-testid="wpm">
            {metrics.wpm}
          </strong>
        </div>
        <div className="result-stats">
          <div className="stat">
            <span className="label">Raw WPM</span>
            <span className="stat-value" data-testid="raw-wpm">{metrics.raw}</span>
          </div>
          <div className="stat">
            <span className="label">Accuracy</span>
            <span className="stat-value" data-testid="accuracy">{metrics.accuracy}%</span>
          </div>
          <div className="stat">
            <span className="label">Consistency</span>
            <span className="stat-value" data-testid="consistency">{metrics.consistency}%</span>
          </div>
        </div>
        <div className="result-meta">
          <span className="muted">
            {mode}s · {content}
          </span>
          {isNewPb && (
            <span className="pb-badge" data-testid="new-pb-badge">
              New personal best
            </span>
          )}
        </div>
      </div>

      <WpmChart data={metrics.chart} />

      <button
        type="button"
        className="btn-primary try-again"
        data-testid="try-again"
        ref={againRef}
        onClick={onAgain}
      >
        Try again
        <span className="try-keys" aria-hidden="true">
          <kbd className="keycap">Tab</kbd>
          <kbd className="keycap">Enter</kbd>
        </span>
      </button>
    </section>
  );
}
