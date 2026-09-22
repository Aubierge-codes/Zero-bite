import { Search, ChevronRight, TrendingUp, TrendingDown, Minus, Download, X, MapPin, Info, AlertTriangle, Loader2 } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import RiskHistoryAreaChart from '../../components/charts/RiskHistoryAreaChart';
import styles from './DistrictList.module.css';
import * as predictionsService from '../../services/predictionsService';
import type { DistrictListItem } from '../../services/predictionsService';

const FALLBACK_DISTRICTS: DistrictListItem[] = [
  { district: 'Gasabo', province: 'Kigali', current_risk: 82, risk_level: 'CRITICAL', trend_7day: 'Increasing', high_cells: 142, total_cells: 410 },
  { district: 'Kicukiro', province: 'Kigali', current_risk: 45, risk_level: 'MODERATE', trend_7day: 'Stable', high_cells: 58, total_cells: 375 },
  { district: 'Nyarugenge', province: 'Kigali', current_risk: 31, risk_level: 'LOW', trend_7day: 'Decreasing', high_cells: 22, total_cells: 290 },
  { district: 'Musanze', province: 'Northern', current_risk: 78, risk_level: 'HIGH', trend_7day: 'Increasing', high_cells: 110, total_cells: 320 },
  { district: 'Rubavu', province: 'Western', current_risk: 64, risk_level: 'HIGH', trend_7day: 'Increasing', high_cells: 88, total_cells: 280 },
  { district: 'Huye', province: 'Southern', current_risk: 22, risk_level: 'LOW', trend_7day: 'Decreasing', high_cells: 12, total_cells: 260 },
  { district: 'Nyagatare', province: 'Eastern', current_risk: 91, risk_level: 'CRITICAL', trend_7day: 'Increasing', high_cells: 180, total_cells: 450 },
  { district: 'Kayonza', province: 'Eastern', current_risk: 68, risk_level: 'HIGH', trend_7day: 'Stable', high_cells: 95, total_cells: 340 },
  { district: 'Rwamagana', province: 'Eastern', current_risk: 52, risk_level: 'MODERATE', trend_7day: 'Increasing', high_cells: 65, total_cells: 300 },
  { district: 'Gatsibo', province: 'Eastern', current_risk: 58, risk_level: 'MODERATE', trend_7day: 'Stable', high_cells: 72, total_cells: 310 },
];

const TREND_LABELS: Record<string, 'Increasing' | 'Stable' | 'Decreasing'> = {
  increasing: 'Increasing',
  up: 'Increasing',
  rising: 'Increasing',
  stable: 'Stable',
  flat: 'Stable',
  decreasing: 'Decreasing',
  down: 'Decreasing',
  falling: 'Decreasing',
  decline: 'Decreasing',
};

function normalizeTrend(raw?: string): 'Increasing' | 'Stable' | 'Decreasing' {
  if (!raw) return 'Stable';
  const key = raw.toLowerCase().trim();
  return TREND_LABELS[key] ?? 'Stable';
}

const trendIcons = { Increasing: TrendingUp, Stable: Minus, Decreasing: TrendingDown };

function trendColor(risk: number, trend: string) {
  if (trend === 'Decreasing') return 'var(--color-risk-low)';
  if (trend === 'Stable') return 'var(--color-text-secondary)';
  return risk > 75 ? 'var(--color-risk-critical)' : 'var(--color-risk-moderate)';
}

function riskBadgeClass(level?: string, score?: number): string {
  const l = (level || '').toUpperCase();
  if (l.includes('CRITICAL') || score !== undefined && score >= 80) return 'badge-critical';
  if (l.includes('HIGH') || score !== undefined && score >= 55) return 'badge-high';
  if (l.includes('MODERATE') || score !== undefined && score >= 30) return 'badge-moderate';
  return 'badge-low';
}

export default function DistrictList() {
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>('Gasabo');
  const [query, setQuery] = useState('');

  const { data: districtData, isLoading: districtsLoading } = useQuery({
    queryKey: ['districts-list'],
    queryFn: async () => {
      try {
        const list = await predictionsService.listAllDistricts();
        if (list && list.length) return list;
        return FALLBACK_DISTRICTS;
      } catch {
        return FALLBACK_DISTRICTS;
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  const districts = useMemo(() => (districtData && districtData.length ? districtData : FALLBACK_DISTRICTS), [districtData]);

  const visibleDistricts = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = [...districts].sort((a, b) => b.current_risk - a.current_risk);
    if (!q) return sorted;
    return sorted.filter((d) => d.district.toLowerCase().includes(q) || d.province.toLowerCase().includes(q));
  }, [districts, query]);

  const selected = useMemo(
    () => districts.find((d) => d.district === selectedDistrict) || null,
    [districts, selectedDistrict]
  );

  return (
    <div className={styles.layout}>
      {/* Main Table Area */}
      <div className={styles.tableArea}>
         <div style={{ marginBottom: 'var(--spacing-xl)' }}>
            <h2 style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ministry &gt; District Management</h2>
            <h1 style={{ fontSize: '2rem', margin: '0.25rem 0' }}>Administrative Districts</h1>
            {!districtsLoading && (
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {districts.length} districts monitored • sorted by current risk
              </p>
            )}
         </div>

         <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
            <div style={{ padding: 'var(--spacing-md) var(--spacing-lg)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center' }}>
               {districtsLoading ? <Loader2 size={18} className="spin" color="var(--color-text-secondary)" /> : <Search size={18} color="var(--color-text-secondary)" />}
               <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search districts by name or province..."
                  style={{ flex: 1, border: 'none', outline: 'none', padding: '0 var(--spacing-sm)', fontSize: '0.875rem', backgroundColor: 'transparent' }}
                  disabled={districtsLoading}
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
                     <th style={{ padding: 'var(--spacing-md) var(--spacing-lg)', fontWeight: 600 }}>Cells</th>
                     <th></th>
                  </tr>
               </thead>
               <tbody>
                  {districtsLoading && (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--color-border)', opacity: 0.55 }}>
                        <td style={{ padding: 'var(--spacing-md) var(--spacing-lg)' }}>
                          <div style={{ height: '1rem', width: `${40 + Math.random() * 50}%`, backgroundColor: '#E5E7EB', borderRadius: 4 }} />
                        </td>
                        <td style={{ padding: 'var(--spacing-md) var(--spacing-lg)' }}>
                          <div style={{ height: '0.75rem', width: `${25 + Math.random() * 30}%`, backgroundColor: '#F3F4F6', borderRadius: 4 }} />
                        </td>
                        <td style={{ padding: 'var(--spacing-md) var(--spacing-lg)', textAlign: 'center' }}>
                          <Loader2 size={14} className="spin" />
                        </td>
                        <td style={{ padding: 'var(--spacing-md) var(--spacing-lg)' }}>
                          <div style={{ height: '0.75rem', width: '35%', backgroundColor: '#F3F4F6', borderRadius: 4 }} />
                        </td>
                        <td style={{ padding: 'var(--spacing-md) var(--spacing-lg)' }}>
                          <div style={{ height: '0.75rem', width: '30%', backgroundColor: '#F3F4F6', borderRadius: 4 }} />
                        </td>
                        <td style={{ padding: 'var(--spacing-md) var(--spacing-lg)', textAlign: 'right' }}>
                          <ChevronRight size={16} color="var(--color-text-tertiary)" />
                        </td>
                      </tr>
                    ))
                  )}
                  {!districtsLoading && visibleDistricts.map((d, i) => {
                     const trend = normalizeTrend(d.trend_7day);
                     const TrendIcon = trendIcons[trend];
                     const color = trendColor(d.current_risk, trend);
                     return (
                        <tr key={`${d.district}-${i}`} style={{ borderBottom: '1px solid var(--color-border)', cursor: 'pointer', backgroundColor: selectedDistrict === d.district ? '#F0F9FF' : 'transparent' }} onClick={() => setSelectedDistrict(d.district)}>
                           <td style={{ padding: 'var(--spacing-md) var(--spacing-lg)', fontWeight: 500 }}>{d.district}</td>
                           <td style={{ padding: 'var(--spacing-md) var(--spacing-lg)', color: 'var(--color-text-secondary)' }}>{d.province}</td>
                           <td style={{ padding: 'var(--spacing-md) var(--spacing-lg)', textAlign: 'center' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
                                <span className={`badge ${riskBadgeClass(d.risk_level, d.current_risk)}`}>
                                  {d.risk_level || (d.current_risk >= 80 ? 'CRITICAL' : d.current_risk >= 55 ? 'HIGH' : d.current_risk >= 30 ? 'MODERATE' : 'LOW')}
                                </span>
                                <span style={{ color: d.current_risk > 75 ? 'var(--color-risk-critical)' : d.current_risk > 50 ? 'var(--color-risk-moderate)' : 'var(--color-risk-low)', fontWeight: 600 }}>{d.current_risk}</span>
                              </span>
                           </td>
                           <td style={{ padding: 'var(--spacing-md) var(--spacing-lg)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color }}>
                                 <TrendIcon size={16} /> {trend}
                              </div>
                           </td>
                           <td style={{ padding: 'var(--spacing-md) var(--spacing-lg)', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                             {typeof d.high_cells === 'number' && typeof d.total_cells === 'number' ? (
                               <><strong style={{ color: d.high_cells / d.total_cells > 0.3 ? 'var(--color-risk-critical)' : 'var(--color-text-primary)' }}>{d.high_cells}</strong> / {d.total_cells}</>
                             ) : (
                               '—'
                             )}
                           </td>
                           <td style={{ padding: 'var(--spacing-md) var(--spacing-lg)', textAlign: 'right' }}>
                              <ChevronRight size={16} color="var(--color-text-secondary)" />
                           </td>
                        </tr>
                     );
                  })}
                  {!districtsLoading && visibleDistricts.length === 0 && (
                     <tr>
                        <td colSpan={6} style={{ padding: 'var(--spacing-2xl)', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
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
                  <h2 style={{ fontSize: '1.5rem', margin: 0 }}>
                    {selected ? selected.district : selectedDistrict} District
                    {selected && <span className="badge" style={{ marginLeft: '0.5rem', backgroundColor: '#F3F4F6', color: 'var(--color-text-secondary)' }}>{selected.province}</span>}
                  </h2>
               </div>
               <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }} onClick={() => setSelectedDistrict(null)}><X size={20} /></button>
            </div>
            
            <div style={{ padding: 'var(--spacing-lg)', flex: 1 }}>
               <div style={{ backgroundColor: '#F9FAFB', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>AI Risk Prediction</div>
                  <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
                     <div style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1 }}>
                       {selected ? selected.current_risk : 82}
                       <span style={{ fontSize: '1rem', color: 'var(--color-text-tertiary)' }}>/100</span>
                     </div>
                     {selected ? (
                       (() => {
                         const trend = normalizeTrend(selected.trend_7day);
                         const TrendIcon = trendIcons[trend];
                         return (
                           <span className={`badge ${riskBadgeClass(selected.risk_level, selected.current_risk)}`} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                             <TrendIcon size={14} /> {trend}
                           </span>
                         );
                       })()
                     ) : (
                       <span className="badge badge-critical" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><TrendingUp size={14} /> Increasing</span>
                     )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', fontSize: '0.75rem', color: 'var(--color-text-secondary)', backgroundColor: 'white', padding: 'var(--spacing-sm)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                     <Info size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                     <span>
                       {selected
                         ? `${selected.district} (${selected.province} Province) — risk level ${selected.risk_level || (selected.current_risk >= 80 ? 'CRITICAL' : selected.current_risk >= 55 ? 'HIGH' : selected.current_risk >= 30 ? 'MODERATE' : 'LOW')}. Live feeds refreshed periodically from satellite and Meteo Rwanda data.`
                         : 'High vegetation indices and sudden rainfall increase predicted for next 14 days. Malaria breeding potential at seasonal high.'}
                     </span>
                  </div>
                  {selected && (typeof selected.high_cells === 'number' || typeof selected.total_cells === 'number') && (
                    <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-md)' }}>
                      <div style={{ flex: 1, padding: 'var(--spacing-sm)', backgroundColor: 'white', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>High-Risk Cells</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: typeof selected.high_cells === 'number' && selected.total_cells && selected.high_cells / selected.total_cells > 0.3 ? 'var(--color-risk-critical)' : 'var(--color-text-primary)' }}>{selected.high_cells ?? '—'}</div>
                      </div>
                      <div style={{ flex: 1, padding: 'var(--spacing-sm)', backgroundColor: 'white', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Total Cells</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{selected.total_cells ?? '—'}</div>
                      </div>
                    </div>
                  )}
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
