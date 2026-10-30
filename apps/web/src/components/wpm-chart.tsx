'use client';

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { WpmPoint } from '@/lib/metrics';

type Props = { data: WpmPoint[] };

export function WpmChart({ data }: Props) {
  return (
    <div className="wpm-chart" data-testid="wpm-chart">
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 12, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="#222a34" vertical={false} />
          <XAxis
            dataKey="second"
            tickFormatter={(s: number) => `${s}s`}
            stroke="#7d8590"
            tickLine={false}
            axisLine={false}
            fontSize={12}
          />
          <YAxis stroke="#7d8590" tickLine={false} axisLine={false} fontSize={12} width={36} />
          <Tooltip
            cursor={{ stroke: '#222a34' }}
            contentStyle={{ background: '#161b22', border: '1px solid #222a34', borderRadius: 8 }}
            labelFormatter={(s) => `${s}s`}
            formatter={(value) => [`${value} WPM`, 'Running']}
          />
          <Line
            type="monotone"
            dataKey="wpm"
            stroke="#7cf0c4"
            strokeWidth={2.5}
            dot={false}
            isAnimationActive
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
