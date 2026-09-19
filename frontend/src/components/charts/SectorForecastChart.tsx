import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { date: 'Nov 01', humidity: 18, temperature: 12, pooling: 10 },
  { date: 'Nov 05', humidity: 24, temperature: 14, pooling: 14 },
  { date: 'Nov 10', humidity: 30, temperature: 16, pooling: 18 },
  { date: 'Nov 15', humidity: 34, temperature: 17, pooling: 22 },
  { date: 'Nov 20', humidity: 36, temperature: 18, pooling: 26 },
  { date: 'Nov 25', humidity: 30, temperature: 15, pooling: 20 },
  { date: 'Nov 30', humidity: 26, temperature: 13, pooling: 17 },
];

export default function SectorForecastChart() {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-divider)" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border)', fontSize: '0.8rem' }} />
        <Bar dataKey="humidity" name="Humidity Index" stackId="risk" fill="#F97316" radius={[0, 0, 0, 0]} />
        <Bar dataKey="temperature" name="Temperature Factor" stackId="risk" fill="#14B8A6" radius={[0, 0, 0, 0]} />
        <Bar dataKey="pooling" name="Satellite Pooling" stackId="risk" fill="#1F2937" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
