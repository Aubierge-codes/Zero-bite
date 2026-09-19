import { Search, Settings, MapPin, Thermometer, Droplets, Smartphone, FileText, TrendingUp, Bell, Package, Sparkles, ArrowUpRight } from 'lucide-react';
import SectorForecastChart from '../../components/charts/SectorForecastChart';

const sectors = [
  { name: 'Gahini', score: 82 },
  { name: 'Kabare', score: 65 },
  { name: 'Kabarondo', score: 44 },
  { name: 'Mukarange', score: 71 },
  { name: 'Murama', score: 38 },
  { name: 'Murundi', score: 55 },
  { name: 'Mwiri', score: 88 },
  { name: 'Ndego', score: 91 },
];

function sectorColor(score: number) {
  if (score >= 76) return { bg: '#FDE8E8', border: 'var(--color-risk-critical)', text: 'var(--color-risk-critical)' };
  if (score >= 51) return { bg: '#FEF0E6', border: 'var(--color-risk-high)', text: 'var(--color-risk-high)' };
  return { bg: '#F0F9F0', border: 'var(--color-risk-low)', text: 'var(--color-risk-low)' };
}

export default function DistrictDashboard() {
  return (
    <div>
      <div className="flex justify-between items-center" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div className="flex items-center gap-md">
           <h1 style={{ fontSize: '2rem', marginBottom: 0 }}>Kayonza</h1>
           <span className="badge badge-low" style={{ backgroundColor: '#F3F4F6', color: 'var(--color-text-secondary)' }}>Eastern Province</span>
        </div>
        <div className="flex gap-md">
          <button className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Search size={16} /> Find Sector</button>
          <button className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Settings size={16} /> Configuration</button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '2fr 1fr', gap: 'var(--spacing-xl)' }}>
        <div className="flex-col gap-xl">
           <div className="card">
              <div className="flex justify-between">
                 <div>
                    <div className="flex items-center gap-sm" style={{ marginBottom: '0.5rem' }}>
                       <span className="badge badge-high">High Risk</span>
                       <span style={{ fontSize: '0.875rem', color: 'var(--color-text-tertiary)' }}>Last updated: Oct 28, 14:30</span>
                    </div>
                    <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Kayonza District</h2>
                    <p style={{ color: 'var(--color-text-secondary)', maxWidth: '400px', lineHeight: 1.6 }}>
                      Malaria breeding risk has increased by <span style={{ color: 'var(--color-risk-critical)', fontWeight: 600 }}>14%</span> this week due to unseasonal rainfall in the Eastern Province.
                    </p>
                 </div>
                 <div className="flex items-center gap-xl">
                    <div className="text-center">
                       <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--color-risk-critical)', lineHeight: 1 }}>78</div>
                       <div style={{ fontSize: '1rem', color: 'var(--color-text-tertiary)', fontWeight: 600 }}>/ 100</div>
                       <div className="badge badge-critical" style={{ marginTop: '0.5rem' }}>Risk Score</div>
                    </div>
                    <div className="flex-col gap-sm">
                       <div className="flex items-center gap-sm">
                          <span style={{ color: 'var(--color-risk-moderate)', display: 'flex' }}><Thermometer size={16} /></span>
                          <div>
                             <div style={{ fontSize: '0.875rem' }}>Temp: 28°C</div>
                             <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>(+2°)</div>
                          </div>
                       </div>
                       <div className="flex items-center gap-sm">
                          <span style={{ color: 'var(--color-risk-moderate)', display: 'flex' }}><Droplets size={16} /></span>
                          <div>
                             <div style={{ fontSize: '0.875rem' }}>Humidity:</div>
                             <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>82% (+12%)</div>
                          </div>
                       </div>
                       <div className="flex items-center gap-sm">
                          <span style={{ color: 'var(--color-risk-critical)', display: 'flex' }}><MapPin size={16} /></span>
                          <div style={{ fontSize: '0.875rem' }}>Active Hotspots: 4</div>
                       </div>
                    </div>
                 </div>
              </div>
              <div className="flex gap-md" style={{ marginTop: 'var(--spacing-xl)' }}>
                 <button className="btn-primary" style={{ flex: 1, backgroundColor: 'var(--color-risk-high)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}><Smartphone size={16} /> Dispatch Sector Alerts</button>
                 <button className="btn-outline" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}><FileText size={16} /> Generate Monthly Report</button>
              </div>
           </div>
           
           <div className="grid grid-cols-2 gap-lg" style={{ marginTop: 'var(--spacing-xl)' }}>
              <div className="card">
                 <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MapPin size={20} /> Sector Risk Heatmap</h3>
                 <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-md)' }}>Visual distribution of breeding risk across Kayonza</p>
                 <div style={{ backgroundColor: '#F9FAFB', minHeight: '250px', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-sm)' }}>
                    <div className="grid grid-cols-3 gap-sm">
                       {sectors.map((s) => {
                          const c = sectorColor(s.score);
                          return (
                             <div key={s.name} style={{ backgroundColor: c.bg, border: `1px solid ${c.border}`, borderRadius: 'var(--radius-sm)', padding: 'var(--spacing-sm)' }}>
                                <div style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>{s.name}</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: c.text }}>{s.score}</div>
                             </div>
                          );
                       })}
                    </div>
                 </div>
              </div>
              <div className="card">
                 <div className="flex justify-between items-center" style={{ marginBottom: '0.5rem' }}>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><TrendingUp size={20} /> 30-Day Risk Forecast</h3>
                    <span className="badge" style={{ backgroundColor: '#F3F4F6' }}>AI MODEL V4.2</span>
                 </div>
                 <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-md)' }}>Contributing factors for predicted malaria breeding</p>
                 <SectorForecastChart />
                 <div className="flex gap-md" style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
                    <span className="flex items-center gap-sm"><span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#F97316' }} /> Humidity Index</span>
                    <span className="flex items-center gap-sm"><span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#14B8A6' }} /> Temperature Factor</span>
                    <span className="flex items-center gap-sm"><span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#1F2937' }} /> Satellite Pooling</span>
                 </div>
              </div>
           </div>
           
           <div className="grid grid-cols-2 gap-lg" style={{ marginTop: 'var(--spacing-xl)' }}>
              <div className="card">
                 <h3 style={{ margin: 0, marginBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Bell size={20} /> Recent Alerts Dispatch</h3>
                 <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                    <li style={{ paddingBottom: 'var(--spacing-md)', borderBottom: '1px solid var(--color-border)' }}>
                       <div className="flex justify-between" style={{ marginBottom: '0.25rem' }}>
                          <span className="badge badge-low" style={{ backgroundColor: '#F3F4F6', color: 'var(--color-text-secondary)' }}>SMS Alert</span>
                          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Kayonza CHWs</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>2h ago</span>
                       </div>
                       <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Heavy pooling detected. Initiate larval source...</p>
                    </li>
                 </ul>
                 <button className="btn-outline" style={{ width: '100%', marginTop: 'var(--spacing-md)', border: 'none' }}>View All Dispatch Logs</button>
              </div>
              <div className="card">
                 <h3 style={{ margin: 0, marginBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Package size={20} /> Resource Availability</h3>
                 <div className="grid grid-cols-2 gap-md" style={{ marginBottom: 'var(--spacing-lg)' }}>
                    <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)', textAlign: 'center' }}>
                       <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>ITN STOCK</div>
                       <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>12.4k</div>
                    </div>
                    <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)', textAlign: 'center' }}>
                       <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>SPRAY TEAMS</div>
                       <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>08</div>
                    </div>
                 </div>
                 <div style={{ marginBottom: 'var(--spacing-md)' }}>
                    <div className="flex justify-between" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                       <span>Community Outreach Goal</span>
                       <span style={{ fontWeight: 600 }}>68%</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: '#E5E7EB', borderRadius: '4px' }}>
                       <div style={{ width: '68%', height: '100%', backgroundColor: 'var(--color-primary)', borderRadius: '4px' }}></div>
                    </div>
                 </div>
                 <button className="btn-outline" style={{ width: '100%' }}>Request Logistics Support</button>
              </div>
           </div>
        </div>
        
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
           <div className="flex items-center gap-sm" style={{ marginBottom: 'var(--spacing-lg)' }}>
              <span style={{ display: 'flex' }}><Sparkles size={24} /></span>
              <h3 style={{ margin: 0 }}>Climate Intelligence Advisor</h3>
           </div>
           
           <div style={{ flex: 1, backgroundColor: '#F9FAFB', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)', overflowY: 'auto' }}>
              <div style={{ backgroundColor: 'var(--color-primary)', color: 'white', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: 'var(--spacing-sm)' }}>
                 Hello Officer Ndayisaba. I've analyzed the latest satellite data for Kayonza. <br/><br/>
                 The risk score in <strong>Mwiri</strong> and <strong>Ndego</strong> sectors has jumped to <strong>91</strong>. This is primarily driven by persistent humidity levels above 80% and new surface water pooling detected near the Akagera river banks.
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', textAlign: 'right', marginBottom: 'var(--spacing-lg)' }}>AI Assistant • 2:30 PM</div>
              
              <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', letterSpacing: '0.05em', marginBottom: 'var(--spacing-md)' }}>Recommended Actions</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                 <li style={{ fontSize: '0.875rem', padding: 'var(--spacing-sm)', backgroundColor: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}>› Deploy larvicide teams to Ndego Sector marshes.</li>
                 <li style={{ fontSize: '0.875rem', padding: 'var(--spacing-sm)', backgroundColor: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}>› SMS Alert: Advise residents near Mwiri on ITN usage.</li>
              </ul>
           </div>
           
           <div style={{ marginTop: 'var(--spacing-md)', display: 'flex', gap: 'var(--spacing-sm)' }}>
              <input type="text" placeholder="Ask about risk factors..." style={{ flex: 1, padding: 'var(--spacing-sm) var(--spacing-md)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-pill)', outline: 'none' }} />
              <button style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none' }}><ArrowUpRight size={20} /></button>
           </div>
        </div>
      </div>
    </div>
  );
}
