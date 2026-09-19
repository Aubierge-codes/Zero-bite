import { Download, Zap, AlertTriangle, TrendingUp, Users, MapPin, Layers, RefreshCw, Droplet, Wind, CloudRain } from 'lucide-react';
import DistrictRiskMap from '../../components/DistrictRiskMap';
import RiskTrendChart from '../../components/charts/RiskTrendChart';

const priorityDistricts = [
  { name: 'Kayonza', score: 88, hazard: 'Malaria', icon: <Droplet size={14} /> },
  { name: 'Bugesera', score: 82, hazard: 'Heatwave', icon: <Wind size={14} /> },
  { name: 'Gicumbi', score: 75, hazard: 'Floods', icon: <CloudRain size={14} /> },
  { name: 'Nyamasheke', score: 68, hazard: 'Malaria', icon: <Droplet size={14} /> },
  { name: 'Rubavu', score: 64, hazard: 'Floods', icon: <CloudRain size={14} /> },
];

function riskColor(score: number) {
  if (score >= 76) return 'var(--color-risk-critical)';
  if (score >= 51) return 'var(--color-risk-high)';
  if (score >= 26) return 'var(--color-risk-moderate)';
  return 'var(--color-risk-low)';
}

export default function NationalDashboard() {
  return (
    <div>
      <div className="page-header" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>National Climate Intelligence</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>Strategic oversight and AI-driven predictive modeling for Rwandan Districts.</p>
        </div>
        <div className="flex gap-md">
          <button className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Download size={16} /> Export Report</button>
          <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Zap size={16} /> All Hazards</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-lg" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div className="card">
           <div className="flex items-center gap-sm" style={{ marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--color-risk-critical)', display: 'flex', alignItems: 'center' }}><AlertTriangle size={20} /></span>
              <h3 style={{ fontSize: '1rem', margin: 0 }}>High-Risk Districts</h3>
           </div>
           <div className="flex items-baseline gap-sm">
             <span style={{ fontSize: '2rem', fontWeight: 700 }}>8</span>
             <span style={{ color: 'var(--color-text-tertiary)', fontSize: '0.875rem' }}>/ 30 districts</span>
           </div>
        </div>
        
        <div className="card">
           <div className="flex items-center gap-sm" style={{ marginBottom: '0.5rem' }}>
              <span style={{ display: 'flex', alignItems: 'center' }}><Zap size={20} /></span>
              <h3 style={{ fontSize: '1rem', margin: 0 }}>Active Warnings</h3>
           </div>
           <div className="flex items-baseline gap-sm">
             <span style={{ fontSize: '2rem', fontWeight: 700 }}>12</span>
             <span style={{ color: 'var(--color-text-tertiary)', fontSize: '0.875rem' }}>Disaster alerts active</span>
           </div>
        </div>

        <div className="card">
           <div className="flex items-center gap-sm" style={{ marginBottom: '0.5rem' }}>
              <span style={{ display: 'flex', alignItems: 'center' }}><TrendingUp size={20} /></span>
              <h3 style={{ fontSize: '1rem', margin: 0 }}>Avg. National Risk</h3>
           </div>
           <div className="flex items-baseline gap-sm">
             <span style={{ fontSize: '2rem', fontWeight: 700 }}>42</span>
             <span style={{ color: 'var(--color-risk-critical)', fontSize: '0.875rem' }}>+4% from last week</span>
           </div>
        </div>

        <div className="card">
           <div className="flex items-center gap-sm" style={{ marginBottom: '0.5rem' }}>
              <span style={{ display: 'flex', alignItems: 'center' }}><Users size={20} /></span>
              <h3 style={{ fontSize: '1rem', margin: 0 }}>Population at Risk</h3>
           </div>
           <div className="flex items-baseline gap-sm">
             <span style={{ fontSize: '2rem', fontWeight: 700 }}>1.2M</span>
             <span style={{ color: 'var(--color-text-tertiary)', fontSize: '0.875rem' }}>Estimated reach</span>
           </div>
        </div>
      </div>

      <div className="split-2-1">
        {/* Heatmap Area */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="flex justify-between items-center" style={{ marginBottom: 'var(--spacing-md)' }}>
            <h3 className="flex items-center gap-sm"><span style={{ color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center' }}><MapPin size={20} /></span> District Risk Heatmap</h3>
            <div className="flex gap-sm">
              <span className="badge badge-moderate" style={{ backgroundColor: '#F3F4F6', color: 'var(--color-text-primary)' }}>Risk Score</span>
              <span className="badge" style={{ backgroundColor: 'transparent', color: 'var(--color-text-secondary)' }}>Alert Density</span>
            </div>
          </div>
          
          <div style={{ flex: 1, backgroundColor: '#F0F4F8', borderRadius: 'var(--radius-md)', minHeight: '400px', position: 'relative', overflow: 'hidden' }}>
             <DistrictRiskMap />
             <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', zIndex: 400 }}>
                <button className="btn-outline" style={{ backgroundColor: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Layers size={16} /> Toggle Hazard Layers</button>
                <button className="btn-outline" style={{ backgroundColor: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><RefreshCw size={16} /> Sync Satellite Data</button>
             </div>
          </div>
        </div>

        {/* AI Situation Summary */}
        <div className="card">
          <div className="flex justify-between items-center" style={{ marginBottom: '0.5rem' }}>
             <h3 style={{ margin: 0 }}>AI Situation Summary</h3>
             <span className="badge" style={{ backgroundColor: '#F3F4F6' }}>v2.4 Engine</span>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-lg)' }}>Generated based on current satellite feed</p>
          
          <div style={{ backgroundColor: '#F9FAFB', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: 'var(--spacing-lg)' }}>
             <p><strong>Summary:</strong> Increased humidity in the <strong>Eastern Province</strong> combined with stagnant water data suggests a <span style={{ color: 'var(--color-risk-critical)', fontWeight: 600 }}>high probability (78%)</span> of malaria spike in the Kayonza sector within 14 days.</p>
             <br/>
             <p>Current national interventions are <strong>on track</strong> for 22 districts, but immediate awareness campaigns are recommended for <u style={{ cursor: 'pointer' }}>Bugesera</u> due to rising heat index.</p>
          </div>

          <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', letterSpacing: '0.05em', marginBottom: 'var(--spacing-md)' }}>Recommended Actions</h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            <li style={{ position: 'relative', paddingLeft: 'var(--spacing-lg)' }}>
              <span style={{ position: 'absolute', left: 0, top: '4px', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-primary)' }}></span>
              <strong>Deploy SMS Warning <br/>kayonza-01</strong>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Targeting 45,000 residents via CHW network.</p>
            </li>
            <li style={{ position: 'relative', paddingLeft: 'var(--spacing-lg)' }}>
              <span style={{ position: 'absolute', left: 0, top: '4px', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-border)' }}></span>
              <strong>Escalate Bugesera Status</strong>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Heatwave threshold reached for 48h period.</p>
            </li>
          </ul>

          <button className="btn-primary" style={{ width: '100%', marginTop: 'var(--spacing-xl)' }}>Generate Full Strategy Report</button>
        </div>
      </div>

      <div className="split-2-1" style={{ marginTop: 'var(--spacing-xl)' }}>
        {/* Risk Probability Trends */}
        <div className="card">
          <div className="flex justify-between items-center" style={{ marginBottom: '0.25rem' }}>
            <h3 style={{ margin: 0 }}>Risk Probability Trends</h3>
            <div className="flex items-center gap-md" style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
              <span className="flex items-center gap-sm"><span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--color-text-primary)' }} /> Historical</span>
              <span className="flex items-center gap-sm"><span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--color-text-tertiary)' }} /> Predicted</span>
            </div>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-md)' }}>Comparing historical norms vs. predicted intelligence</p>
          <RiskTrendChart />
        </div>

        {/* District Priority Ranking */}
        <div className="card">
          <div className="flex justify-between items-center" style={{ marginBottom: '0.25rem' }}>
            <h3 style={{ margin: 0 }}>District Priority Ranking</h3>
            <a href="/districts" style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>View All Districts &gt;</a>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-md)' }}>Top districts requiring immediate attention</p>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', textAlign: 'left' }}>
                <th style={{ paddingBottom: '0.5rem', fontWeight: 600 }}>District</th>
                <th style={{ paddingBottom: '0.5rem', fontWeight: 600 }}>Risk Score</th>
                <th style={{ paddingBottom: '0.5rem', fontWeight: 600 }}>Hazard Type</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {priorityDistricts.map((d) => (
                <tr key={d.name} style={{ borderTop: '1px solid var(--color-divider)' }}>
                  <td style={{ padding: '0.6rem 0', fontWeight: 500, fontSize: '0.875rem' }}>{d.name}</td>
                  <td style={{ padding: '0.6rem 0' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 28, padding: '0 6px', height: 22, borderRadius: 'var(--radius-pill)', fontSize: '0.75rem', fontWeight: 700, color: riskColor(d.score), backgroundColor: `${riskColor(d.score)}1A` }}>
                      {d.score}
                    </span>
                  </td>
                  <td style={{ padding: '0.6rem 0', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                    <span className="flex items-center gap-sm">{d.icon} {d.hazard}</span>
                  </td>
                  <td style={{ padding: '0.6rem 0', textAlign: 'right', color: 'var(--color-text-tertiary)' }}>&gt;</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
