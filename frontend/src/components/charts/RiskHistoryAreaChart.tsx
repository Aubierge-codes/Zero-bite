import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export interface RiskHistoryDatum {
  date: string;
  risk: number;
}

interface Props {
  data?: RiskHistoryDatum[];
}

export default function RiskHistoryAreaChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary)', fontSize: '0.75rem' }}>
        No history available.
      </div>
    );
  }
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
        <XAxis dataKey="date" interval="preserveStartEnd" tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} width={28} />
        <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border)', fontSize: '0.75rem' }} />
        <Area type="monotone" dataKey="risk" name="Risk score" stroke="var(--color-text-primary)" strokeWidth={2} fill="url(#riskHistoryFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
