import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { DistrictForecastPoint } from '../../services/predictionsService';

interface Props {
  data?: DistrictForecastPoint[];
}

function shortDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Daily model risk score: observed weather (dark) followed by the weather forecast (light). */
export default function SectorForecastChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary)', fontSize: '0.875rem' }}>
        No forecast data available.
      </div>
    );
  }
  const chartData = data.map((d) => ({ ...d, label: shortDate(d.date) }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-divider)" vertical={false} />
        <XAxis dataKey="label" interval={4} tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border)', fontSize: '0.8rem' }}
          labelFormatter={(label, payload) => {
            const p = payload?.[0]?.payload as (typeof chartData)[number] | undefined;
            return p
              ? `${label} · ${p.rainfall_mm} mm rain · ${p.humidity_pct}% RH · ${p.temperature_c}°C${p.is_forecast ? ' (forecast)' : ''}`
              : String(label);
          }}
        />
        <Bar dataKey="risk_score" name="Risk score" radius={[3, 3, 0, 0]}>
          {chartData.map((d) => (
            <Cell key={d.date} fill={d.is_forecast ? '#9CA3AF' : '#1F2937'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
