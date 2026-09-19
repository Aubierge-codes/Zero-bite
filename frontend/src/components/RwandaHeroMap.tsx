import { AlertTriangle } from 'lucide-react';

const RISK_COLORS = {
  low: '#4CAF50',
  moderate: '#FFB300',
  high: '#F4511E',
  critical: '#E53935',
};

export default function RwandaHeroMap() {
  return (
    <div
      style={{
        position: 'relative',
        backgroundColor: '#EEF2F6',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        padding: '1rem',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '1rem',
          left: '1rem',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}
      >
        <div
          className="badge"
          style={{
            backgroundColor: RISK_COLORS.critical,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
          }}
        >
          <AlertTriangle size={12} /> Critical Risk Alert
        </div>
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: 'var(--radius-md)',
            padding: '0.5rem 0.75rem',
            fontSize: '0.7rem',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
          }}
        >
          <div style={{ fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.125rem' }}>RISK LEVELS</div>
          {(['low', 'moderate', 'high', 'critical'] as const).map((level) => (
            <div key={level} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', textTransform: 'capitalize' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: RISK_COLORS[level] }} />
              {level}
            </div>
          ))}
        </div>
      </div>

      <svg viewBox="0 0 320 340" width="100%" height="320" role="img" aria-label="Stylized risk map of Rwanda's provinces">
        {/* Northern Province */}
        <path
          d="M 110 20 Q 160 0 210 25 Q 235 45 215 70 Q 170 85 125 70 Q 95 50 110 20 Z"
          fill={RISK_COLORS.moderate}
          opacity={0.85}
          stroke="white"
          strokeWidth={3}
        />
        {/* Eastern Province */}
        <path
          d="M 215 70 Q 270 65 295 110 Q 310 170 285 230 Q 250 265 210 245 Q 190 190 200 140 Q 200 100 215 70 Z"
          fill={RISK_COLORS.critical}
          opacity={0.85}
          stroke="white"
          strokeWidth={3}
        />
        {/* Western Province */}
        <path
          d="M 125 70 Q 100 110 95 170 Q 90 230 105 280 Q 120 310 150 300 Q 165 250 155 190 Q 150 130 125 70 Z"
          fill={RISK_COLORS.low}
          opacity={0.85}
          stroke="white"
          strokeWidth={3}
        />
        {/* Southern Province */}
        <path
          d="M 150 300 Q 165 250 200 245 Q 210 245 210 245 Q 225 275 205 305 Q 180 330 150 320 Q 145 310 150 300 Z"
          fill={RISK_COLORS.low}
          opacity={0.85}
          stroke="white"
          strokeWidth={3}
        />
        {/* Kigali City */}
        <circle cx="178" cy="188" r="16" fill={RISK_COLORS.high} stroke="white" strokeWidth={3} />
        <text x="178" y="192" textAnchor="middle" fontSize="9" fontWeight={700} fill="white">
          KGL
        </text>

        <text x="165" y="45" textAnchor="middle" fontSize="10" fontWeight={600} fill="white">
          Northern
        </text>
        <text x="250" y="150" textAnchor="middle" fontSize="10" fontWeight={600} fill="white">
          Eastern
        </text>
        <text x="122" y="185" textAnchor="middle" fontSize="10" fontWeight={600} fill="white">
          Western
        </text>
        <text x="178" y="285" textAnchor="middle" fontSize="10" fontWeight={600} fill="white">
          Southern
        </text>
      </svg>

      <div
        style={{
          position: 'absolute',
          bottom: '1rem',
          right: '1rem',
          backgroundColor: 'white',
          borderRadius: 'var(--radius-md)',
          padding: '0.75rem 1rem',
          boxShadow: 'var(--shadow-md)',
          textAlign: 'right',
        }}
      >
        <div style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          National Average
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.375rem', justifyContent: 'flex-end' }}>
          <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>42.8%</span>
          <span style={{ fontSize: '0.75rem', color: RISK_COLORS.critical, fontWeight: 600 }}>+1.2%</span>
        </div>
      </div>
    </div>
  );
}
