import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { week: 'W1', historical: 32, predicted: null },
  { week: 'W2', historical: 38, predicted: null },
  { week: 'W3', historical: 52, predicted: 52 },
  { week: 'W4', historical: null, predicted: 46 },
  { week: 'W5', historical: null, predicted: 41 },
  { week: 'W6', historical: null, predicted: 37 },
];

export default function RiskTrendChart() {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-divider)" vertical={false} />
        <XAxis dataKey="week" tick={{ fontSize: 12, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border)', fontSize: '0.8rem' }} />
        <Line type="monotone" dataKey="historical" name="Historical" stroke="var(--color-text-primary)" strokeWidth={2} dot={false} connectNulls />
        <Line type="monotone" dataKey="predicted" name="Predicted" stroke="var(--color-text-tertiary)" strokeWidth={2} strokeDasharray="5 5" dot={false} connectNulls />
      </LineChart>
    </ResponsiveContainer>
  );
}
