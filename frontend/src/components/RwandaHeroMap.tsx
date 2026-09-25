import { useQuery } from '@tanstack/react-query';
import DistrictRiskMap from './DistrictRiskMap';
import * as predictionsService from '../services/predictionsService';

const legend = [
  { label: 'Low', color: '#4CAF50' },
  { label: 'Moderate', color: '#FFB300' },
  { label: 'High', color: '#F4511E' },
  { label: 'Critical', color: '#E53935' },
];

/** Live district risk map for the landing hero (replaces the old static image). */
export default function RwandaHeroMap() {
  const { data: summary } = useQuery({
    queryKey: ['national-summary'],
    queryFn: () => predictionsService.getNationalSummary(),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div style={{ position: 'relative', width: '100%', height: '420px', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
      <DistrictRiskMap />
      <div
        style={{
          position: 'absolute', left: 12, bottom: 12, zIndex: 400, backgroundColor: 'white', borderRadius: 8,
          padding: '6px 10px', boxShadow: 'var(--shadow-md)', fontSize: '0.7rem', display: 'flex', gap: 10, alignItems: 'center',
        }}
      >
        {legend.map((l) => (
          <span key={l.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: l.color }} /> {l.label}
          </span>
        ))}
      </div>
      {summary && (
        <div
          style={{
            position: 'absolute', right: 12, bottom: 12, zIndex: 400, backgroundColor: 'white', borderRadius: 8,
            padding: '6px 12px', boxShadow: 'var(--shadow-md)',
          }}
        >
          <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>National avg risk (live)</div>
          <div style={{ fontSize: '1.125rem', fontWeight: 700 }}>{summary.avg_national_risk}/100</div>
        </div>
      )}
    </div>
  );
}
