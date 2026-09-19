import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { date: 'Oct 01', risk: 44 },
  { date: 'Oct 05', risk: 48 },
  { date: 'Oct 10', risk: 58 },
  { date: 'Oct 15', risk: 74 },
  { date: 'Oct 20', risk: 76 },
  { date: 'Oct 25', risk: 79 },
  { date: 'Oct 30', risk: 82 },
];

export default function RiskHistoryAreaChart() {
  return (
    <ResponsiveContainer width="100%" height={150}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
        <defs>
          <linearGradient id="riskHistoryFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-text-primary)" stopOpacity={0.25} />
            <stop offset="100%" stopColor="var(--color-text-primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-divider)" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} width={28} />
        <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border)', fontSize: '0.75rem' }} />
        <Area type="monotone" dataKey="risk" stroke="var(--color-text-primary)" strokeWidth={2} fill="url(#riskHistoryFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
