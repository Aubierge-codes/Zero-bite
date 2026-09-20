import { Search, ChevronRight, TrendingUp, TrendingDown, Minus, Download, X, MapPin, Info, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import RiskHistoryAreaChart from '../../components/charts/RiskHistoryAreaChart';
import styles from './DistrictList.module.css';

const districts = [
  { name: 'Gasabo', province: 'Kigali', risk: 82, trend: 'Increasing' as const },
  { name: 'Kicukiro', province: 'Kigali', risk: 45, trend: 'Stable' as const },
  { name: 'Nyarugenge', province: 'Kigali', risk: 31, trend: 'Decreasing' as const },
  { name: 'Musanze', province: 'Northern', risk: 78, trend: 'Increasing' as const },
  { name: 'Rubavu', province: 'Western', risk: 64, trend: 'Increasing' as const },
  { name: 'Huye', province: 'Southern', risk: 22, trend: 'Decreasing' as const },
  { name: 'Nyagatare', province: 'Eastern', risk: 91, trend: 'Increasing' as const },
];

const trendIcons = { Increasing: TrendingUp, Stable: Minus, Decreasing: TrendingDown };

function trendColor(risk: number, trend: string) {
  if (trend === 'Decreasing') return 'var(--color-risk-low)';
  if (trend === 'Stable') return 'var(--color-text-secondary)';
  return risk > 75 ? 'var(--color-risk-critical)' : 'var(--color-risk-moderate)';
}

export default function DistrictList() {
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>('Gasabo');
  const [query, setQuery] = useState('');

  const visibleDistricts = districts.filter((d) => {
    const q = query.trim().toLowerCase();
    return q === '' || d.name.toLowerCase().includes(q) || d.province.toLowerCase().includes(q);
  });

  return (
    <div className={styles.layout}>
      {/* Main Table Area */}
      <div className={styles.tableArea}>
         <div style={{ marginBottom: 'var(--spacing-xl)' }}>
            <h2 style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ministry &gt; District Management</h2>
            <h1 style={{ fontSize: '2rem', margin: '0.25rem 0' }}>Administrative Districts</h1>
         </div>

         <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
            <div style={{ padding: 'var(--spacing-md) var(--spacing-lg)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center' }}>
               <Search size={18} color="var(--color-text-secondary)" />
               <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search districts by name or province..."
                  style={{ flex: 1, border: 'none', outline: 'none', padding: '0 var(--spacing-sm)', fontSize: '0.875rem' }}
               />
            </div>

            <div className={styles.tableWrap}>
            <table style={{ width: '100%', minWidth: '560px', borderCollapse: 'collapse', textAlign: 'left' }}>
               <thead>
                  <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid var(--color-border)', fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                     <th style={{ padding: 'var(--spacing-md) var(--spacing-lg)', fontWeight: 600 }}>District Name</th>
                     <th style={{ padding: 'var(--spacing-md) var(--spacing-lg)', fontWeight: 600 }}>Province</th>
                     <th style={{ padding: 'var(--spacing-md) var(--spacing-lg)', fontWeight: 600, textAlign: 'center' }}>Current Risk</th>
                     <th style={{ padding: 'var(--spacing-md) var(--spacing-lg)', fontWeight: 600 }}>7-Day Trend</th>
                     <th></th>
                  </tr>
               </thead>
               <tbody>
                  {visibleDistricts.map((d, i) => {
                     const TrendIcon = trendIcons[d.trend];
                     const color = trendColor(d.risk, d.trend);
                     return (
                        <tr key={i} style={{ borderBottom: '1px solid var(--color-border)', cursor: 'pointer', backgroundColor: selectedDistrict === d.name ? '#F0F9FF' : 'transparent' }} onClick={() => setSelectedDistrict(d.name)}>
                           <td style={{ padding: 'var(--spacing-md) var(--spacing-lg)', fontWeight: 500 }}>{d.name}</td>
                           <td style={{ padding: 'var(--spacing-md) var(--spacing-lg)', color: 'var(--color-text-secondary)' }}>{d.province}</td>
                           <td style={{ padding: 'var(--spacing-md) var(--spacing-lg)', textAlign: 'center' }}>
                              <span style={{ color: d.risk > 75 ? 'var(--color-risk-critical)' : d.risk > 50 ? 'var(--color-risk-moderate)' : 'var(--color-risk-low)', fontWeight: 600 }}>{d.risk}</span>
                           </td>
                           <td style={{ padding: 'var(--spacing-md) var(--spacing-lg)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color }}>
                                 <TrendIcon size={16} /> {d.trend}
                              </div>
                           </td>
                           <td style={{ padding: 'var(--spacing-md) var(--spacing-lg)', textAlign: 'right' }}>
                              <ChevronRight size={16} color="var(--color-text-secondary)" />
                           </td>
                        </tr>
                     );
                  })}
                  {visibleDistricts.length === 0 && (
                     <tr>
                        <td colSpan={5} style={{ padding: 'var(--spacing-2xl)', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                           No districts match "{query}".
                        </td>
                     </tr>
                  )}
               </tbody>
            </table>
            </div>
         </div>
      </div>

      {/* Side Drawer: District Profile */}
      {selectedDistrict && (
         <div className={styles.drawer}>
            <div style={{ padding: 'var(--spacing-lg)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>DISTRICT PROFILE</div>
                  <h2 style={{ fontSize: '1.5rem', margin: 0 }}>{selectedDistrict} District</h2>
               </div>
               <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }} onClick={() => setSelectedDistrict(null)}><X size={20} /></button>
            </div>
            
            <div style={{ padding: 'var(--spacing-lg)', flex: 1 }}>
               <div style={{ backgroundColor: '#F9FAFB', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>AI Risk Prediction</div>
                  <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
                     <div style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1 }}>82<span style={{ fontSize: '1rem', color: 'var(--color-text-tertiary)' }}>/100</span></div>
                     <span className="badge badge-critical" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: '#FDE8E8' }}><TrendingUp size={14} /> Increasing</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', fontSize: '0.75rem', color: 'var(--color-text-secondary)', backgroundColor: 'white', padding: 'var(--spacing-sm)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                     <Info size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                     <span>High vegetation indices and sudden rainfall increase predicted for next 14 days. Malaria breeding potential at seasonal high.</span>
                  </div>
               </div>

               <h3 style={{ fontSize: '1rem', marginBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><TrendingUp size={16} /> 30-Day Risk History</h3>
               <div style={{ backgroundColor: '#F9FAFB', borderRadius: 'var(--radius-md)', marginBottom: 'var(--spacing-xl)', border: '1px solid var(--color-border)', padding: 'var(--spacing-sm)' }}>
                  <RiskHistoryAreaChart />
               </div>

               <h3 style={{ fontSize: '1rem', marginBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MapPin size={16} /> Active Data Feeds</h3>
               <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap', marginBottom: 'var(--spacing-xl)' }}>
                  <span className="badge" style={{ backgroundColor: '#F3F4F6', color: 'var(--color-text-secondary)' }}>Sentinel-2 Satellite</span>
                  <span className="badge" style={{ backgroundColor: '#F3F4F6', color: 'var(--color-text-secondary)' }}>Meteo Rwanda API</span>
                  <span className="badge" style={{ backgroundColor: '#F3F4F6', color: 'var(--color-text-secondary)' }}>CHW Field Logs</span>
               </div>
            </div>

            <div style={{ padding: 'var(--spacing-lg)', borderTop: '1px solid var(--color-border)' }}>
               <button className="btn-primary" style={{ width: '100%', marginBottom: 'var(--spacing-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}><AlertTriangle size={16} /> Draft Specific District Alert</button>
               <div className="flex gap-sm">
                  <button className="btn-outline" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}><Download size={16} /> PDF Report</button>
                  <button className="btn-outline" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}><Download size={16} /> CSV Export</button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
