import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export interface RiskTrendDatum {
  week: string;
  historical: number | null;
  predicted: number | null;
}

interface Props {
  data?: RiskTrendDatum[];
}

export default function RiskTrendChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary)', fontSize: '0.875rem' }}>
        No trend data available yet.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-divider)" vertical={false} />
        <XAxis dataKey="week" tick={{ fontSize: 12, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border)', fontSize: '0.8rem' }} />
        <Line type="monotone" dataKey="historical" name="Observed weather" stroke="var(--color-text-primary)" strokeWidth={2} dot={false} connectNulls />
        <Line type="monotone" dataKey="predicted" name="Forecast weather" stroke="var(--color-text-tertiary)" strokeWidth={2} strokeDasharray="5 5" dot={false} connectNulls />
      </LineChart>
    </ResponsiveContainer>
  );
}
