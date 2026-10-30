import type { Result } from '@/lib/store';

type Props = { entries: Result[] };

export function Leaderboard({ entries }: Props) {
  return (
    <section className="card leaderboard" aria-labelledby="leaderboard-title">
      <div className="card-heading">
        <h2 id="leaderboard-title">Leaderboard</h2>
        <span className="muted">Top 10 · saved in this browser</span>
      </div>

      {entries.length === 0 ? (
        <p className="muted">No scores yet. Finish a test to claim the first spot.</p>
      ) : (
        <ol className="rows">
          {entries.map((entry, i) => (
            <li key={entry.id} className="row" data-testid="leaderboard-row">
              <span className="row-rank">{i + 1}</span>
              <span className="row-wpm" data-testid="row-wpm">
                {entry.wpm}
                <small> wpm</small>
              </span>
              <span className="row-accuracy" data-testid="row-accuracy">
                {entry.accuracy}%
              </span>
              <span className="badge" data-testid={`mode-${entry.mode}`}>
                {entry.mode}s
              </span>
              <span className="row-meta muted">
                {entry.content} ·{' '}
                <time dateTime={entry.date}>
                  {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </time>
              </span>
            </li>
          ))}
        </ol>
      )}

      <p className="footnote muted">Scores are stored in this browser only.</p>
    </section>
  );
}
