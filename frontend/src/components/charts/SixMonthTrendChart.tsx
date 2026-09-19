import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { month: 'Jan', district: 42, national: 38 },
  { month: 'Feb', district: 48, national: 40 },
  { month: 'Mar', district: 60, national: 45 },
  { month: 'Apr', district: 74, national: 52 },
  { month: 'May', district: 78, national: 56 },
  { month: 'Jun', district: 68, national: 54 },
];

export default function SixMonthTrendChart() {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-divider)" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border)', fontSize: '0.8rem' }} />
        <Legend wrapperStyle={{ fontSize: '0.75rem' }} formatter={(value) => (value === 'district' ? 'Current District Risk' : 'National Average')} />
        <Line type="monotone" dataKey="district" stroke="var(--color-text-primary)" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="national" stroke="var(--color-text-tertiary)" strokeWidth={2} strokeDasharray="5 5" dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
