import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Clock, BarChart2, FileText, Printer, Download, CheckSquare, Square, MapPin, Landmark, X } from 'lucide-react';
import SixMonthTrendChart from '../../components/charts/SixMonthTrendChart';
import QueryState from '../../components/QueryState';
import * as predictionsService from '../../services/predictionsService';
import * as reportsService from '../../services/reportsService';
import { downloadCsv, riskLevelClass } from '../../lib/format';
import styles from './Reports.module.css';

const RISK = 'Malaria Risk Index';
const WEATHER = 'Meteorological Data';
const FLOOD = 'Flood Risk Index';
const OPS = 'Alerts & Field Operations';
const allIndicators = [RISK, WEATHER, FLOOD, OPS];

const templates = [
  { key: 'weekly', icon: Clock, title: 'Weekly Snapshot', description: 'The last 7 days.', days: 7 },
  { key: 'monthly', icon: BarChart2, title: 'Monthly Summary', description: 'The last 30 days.', days: 30 },
  { key: 'extended', icon: FileText, title: 'Extended Analysis', description: 'All available history (60 days).', days: 60 },
];

const iso = (d: Date) => d.toISOString().slice(0, 10);
const daysAgo = (n: number) => iso(new Date(Date.now() - n * 86400000));

export default function Reports() {
  const [searchParams] = useSearchParams();
  const initialDistrict = searchParams.get('district');

  const [activeTemplate, setActiveTemplate] = useState('monthly');
  const [start, setStart] = useState(daysAgo(29));
  const [end, setEnd] = useState(daysAgo(0));
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>(initialDistrict ? [initialDistrict] : []);
  const [selectedIndicators, setSelectedIndicators] = useState(new Set<string>([RISK, WEATHER, OPS]));

  const { data: districtList } = useQuery({
    queryKey: ['districts-list'],
    queryFn: () => predictionsService.listAllDistricts(),
    staleTime: 5 * 60 * 1000,
  });
  const districtNames = useMemo(() => (districtList ?? []).map((d) => d.district).sort(), [districtList]);

  const report = useQuery({
    queryKey: ['report', start, end, selectedDistricts.join(',')],
    queryFn: () => reportsService.getReportSummary({ start, end, districts: selectedDistricts }),
    retry: false,
  });
  const r = report.data;

  const toggleIndicator = (name: string) =>
    setSelectedIndicators((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  const pickTemplate = (key: string, days: number) => {
    setActiveTemplate(key);
    setStart(daysAgo(days - 1));
    setEnd(daysAgo(0));
  };

  const exportCsv = () => {
    if (!r) return;
    downloadCsv(`zero-bite-report-${r.period.start}_${r.period.end}.csv`, [
      ['District', 'Province', 'Avg risk', 'Peak risk', 'Latest risk', 'Latest level', 'Days high/critical', 'Total rain mm', 'Avg temp C', 'Avg humidity %', 'Avg flood-risk index'],
      ...r.districts.map((d) => [d.district, d.province, d.avg_risk, d.peak_risk, d.latest_risk, d.latest_level, d.days_high, d.total_rain_mm, d.avg_temp_c, d.avg_humidity, d.avg_flood_risk]),
    ]);
  };

  const th: React.CSSProperties = { textAlign: 'left', padding: '0.4rem 0.5rem', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-border)' };
  const td: React.CSSProperties = { padding: '0.4rem 0.5rem', fontSize: '0.8125rem', borderBottom: '1px solid var(--color-divider)' };
  const h2: React.CSSProperties = { fontSize: '1.125rem', borderLeft: '4px solid var(--color-primary)', paddingLeft: '0.5rem', marginBottom: 'var(--spacing-md)' };

  return (
    <div className={styles.layout}>
      <style>{`@media print { body * { visibility: hidden; } #report-doc, #report-doc * { visibility: visible; } #report-doc { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; border: none !important; } }`}</style>

      {/* Sidebar: Report Builder */}
      <div className={styles.sidebar}>
        <div style={{ marginBottom: 'var(--spacing-xl)' }}>
          <h2 style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reports &amp; Analytics</h2>
          <h1 style={{ fontSize: '1.75rem', margin: '0.25rem 0' }}>Custom Report Builder</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>Build a report from the model's risk output, weather data, alerts and field logs, then print it or export a CSV.</p>
        </div>

        <div style={{ marginBottom: 'var(--spacing-xl)' }}>
          <h3 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: 'var(--spacing-md)' }}>QUICK TEMPLATES</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            {templates.map((t) => {
              const isActive = activeTemplate === t.key;
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => pickTemplate(t.key, t.days)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', padding: 'var(--spacing-md)',
                    border: isActive ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)', cursor: 'pointer', textAlign: 'left',
                    backgroundColor: isActive ? '#FAFAFA' : 'transparent',
                  }}
                >
                  <div style={{ width: '40px', height: '40px', flexShrink: 0, borderRadius: '50%', backgroundColor: isActive ? 'var(--color-primary)' : '#F3F4F6', color: isActive ? 'white' : 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{t.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{t.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <h3 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: 'var(--spacing-md)' }}>REPORT CONFIGURATION</h3>

          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <label style={{ display: 'flex', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', alignItems: 'center', gap: '0.5rem' }}><Clock size={16} /> Time Range</label>
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
              <input type="date" value={start} min={r?.available.from} max={end} onChange={(e) => { setStart(e.target.value); setActiveTemplate(''); }} style={{ flex: 1, padding: 'var(--spacing-sm)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }} />
              <input type="date" value={end} min={start} max={iso(new Date())} onChange={(e) => { setEnd(e.target.value); setActiveTemplate(''); }} style={{ flex: 1, padding: 'var(--spacing-sm)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }} />
            </div>
            {r && <p style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', marginTop: '0.25rem' }}>Data available from {r.available.from}.</p>}
          </div>

          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <label style={{ display: 'flex', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', alignItems: 'center', gap: '0.5rem' }}><MapPin size={16} /> District Filter</label>
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
              {selectedDistricts.length === 0 && <span className="badge" style={{ backgroundColor: '#F3F4F6', color: 'var(--color-text-secondary)' }}>All 30 districts</span>}
              {selectedDistricts.map((d) => (
                <button key={d} className="badge" onClick={() => setSelectedDistricts((p) => p.filter((x) => x !== d))} style={{ backgroundColor: '#F3F4F6', color: 'var(--color-text-primary)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                  {d} <X size={12} />
                </button>
              ))}
            </div>
            <select
              value=""
              onChange={(e) => { const v = e.target.value; if (v && !selectedDistricts.includes(v)) setSelectedDistricts((p) => [...p, v]); }}
              style={{ width: '100%', padding: 'var(--spacing-sm)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: 'white' }}
            >
              <option value="">+ Add a district…</option>
              {districtNames.filter((d) => !selectedDistricts.includes(d)).map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: 'var(--spacing-xl)' }}>
            <label style={{ display: 'flex', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', alignItems: 'center', gap: '0.5rem' }}><BarChart2 size={16} /> Data Indicators</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
              {allIndicators.map((indicator) => {
                const checked = selectedIndicators.has(indicator);
                return (
                  <label key={indicator} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }} onClick={() => toggleIndicator(indicator)}>
                    {checked ? <CheckSquare size={16} color="var(--color-primary)" /> : <Square size={16} color="var(--color-text-secondary)" />}
                    {indicator}
                  </label>
                );
              })}
            </div>
          </div>

          <button className="btn-primary" style={{ width: '100%' }} onClick={() => report.refetch()} disabled={report.isFetching}>
            {report.isFetching ? 'Generating…' : 'Refresh Preview'}
          </button>
        </div>
      </div>

      {/* Main Area: Document Preview */}
      <div className={styles.preview}>
        <div className="page-header" style={{ marginBottom: 'var(--spacing-lg)' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Document Preview</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Built from live model output and stored operational data.</p>
          </div>
          <div className="flex gap-md" style={{ flexWrap: 'wrap' }}>
            <button className="btn-outline" onClick={() => window.print()} disabled={!r} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'white' }}><Printer size={16} /> Print / Save as PDF</button>
            <button className="btn-outline" onClick={exportCsv} disabled={!r} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'white' }}><Download size={16} /> Export CSV</button>
          </div>
        </div>

        <QueryState isLoading={report.isLoading} isError={report.isError} error={report.error} minHeight={300}>
          {r && (
            <div id="report-doc" className={styles.docMockup} style={{ backgroundColor: 'white', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)', flex: 1, margin: '0 auto', width: '100%', maxWidth: '800px', border: '1px solid var(--color-border)' }}>
              <div className="flex justify-between items-start" style={{ marginBottom: 'var(--spacing-2xl)', borderBottom: '2px solid var(--color-border)', paddingBottom: 'var(--spacing-lg)', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
                <div className="flex gap-md items-center">
                  <div style={{ width: '60px', height: '60px', borderRadius: '50%', border: '2px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)' }}>
                    <Landmark size={26} />
                  </div>
                  <div>
                    <h1 style={{ fontSize: '1.25rem', margin: 0 }}>Zero Bite Climate-Health Report</h1>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Malaria breeding risk · Rwanda</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>Model {r.model_version}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.75rem' }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>ID: {r.report_id}</div>
                  <div style={{ color: 'var(--color-text-secondary)' }}>Generated: {new Date(r.generated_at).toLocaleString('en-GB')}</div>
                  <div style={{ color: 'var(--color-text-secondary)' }}>Period: {r.period.start} to {r.period.end} ({r.period.days} days)</div>
                </div>
              </div>

              {selectedIndicators.has(RISK) && (
                <>
                  <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                    <h2 style={h2}>Executive Summary</h2>
                    <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--color-text-secondary)' }}>{r.executive_summary}</p>
                  </div>

                  <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                    <h2 style={h2}>District Risk Comparison</h2>
                    <div className="grid grid-cols-3 gap-md" style={{ marginBottom: 'var(--spacing-md)' }}>
                      <div style={{ backgroundColor: '#F3F4F6', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>DISTRICTS</div>
                        <div style={{ fontSize: '2rem', fontWeight: 700 }}>{r.totals.districts}</div>
                      </div>
                      <div style={{ backgroundColor: '#FDE8E8', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600, color: 'var(--color-risk-critical)', marginBottom: '0.25rem' }}>HIGH / CRITICAL NOW</div>
                        <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-risk-critical)' }}>{r.totals.by_level.HIGH + r.totals.by_level.CRITICAL}</div>
                      </div>
                      <div style={{ backgroundColor: '#FEF0E6', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600, color: 'var(--color-risk-high)', marginBottom: '0.25rem' }}>MODERATE NOW</div>
                        <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-risk-high)' }}>{r.totals.by_level.MODERATE}</div>
                      </div>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr><th style={th}>District</th><th style={th}>Avg risk</th><th style={th}>Peak</th><th style={th}>Latest</th><th style={th}>Days high</th></tr></thead>
                      <tbody>
                        {r.districts.map((d) => (
                          <tr key={d.district}>
                            <td style={td}>{d.district}</td>
                            <td style={td}>{d.avg_risk}</td>
                            <td style={td}>{d.peak_risk}</td>
                            <td style={td}><span className={`badge ${riskLevelClass(d.latest_level)}`}>{d.latest_risk} · {d.latest_level}</span></td>
                            <td style={td}>{d.days_high}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                    <h2 style={h2}>Weekly Trend</h2>
                    <div style={{ backgroundColor: '#F9FAFB', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-sm)' }}>
                      <SixMonthTrendChart data={r.weekly_trend} />
                    </div>
                  </div>
                </>
              )}

              {selectedIndicators.has(WEATHER) && (
                <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                  <h2 style={h2}>Meteorological Data</h2>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr><th style={th}>District</th><th style={th}>Total rain (mm)</th><th style={th}>Avg temp (°C)</th><th style={th}>Avg humidity (%)</th></tr></thead>
                    <tbody>
                      {r.districts.map((d) => (
                        <tr key={d.district}><td style={td}>{d.district}</td><td style={td}>{d.total_rain_mm}</td><td style={td}>{d.avg_temp_c}</td><td style={td}>{d.avg_humidity}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {selectedIndicators.has(FLOOD) && (
                <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                  <h2 style={h2}>Flood Risk Index (0–1)</h2>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr><th style={th}>District</th><th style={th}>Avg flood-risk index</th></tr></thead>
                    <tbody>
                      {[...r.districts].sort((a, b) => b.avg_flood_risk - a.avg_flood_risk).map((d) => (
                        <tr key={d.district}><td style={td}>{d.district}</td><td style={td}>{d.avg_flood_risk}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {selectedIndicators.has(OPS) && (
                <div>
                  <h2 style={h2}>Alerts &amp; Field Operations</h2>
                  <div className="grid grid-cols-3 gap-md">
                    {[
                      { label: 'Alerts raised', value: r.operations.alerts_total },
                      { label: 'Sites treated', value: r.operations.sites_treated },
                      { label: 'Larvicide used (ml)', value: r.operations.larvicide_ml },
                      { label: 'SMS delivered', value: r.operations.sms_delivered },
                      { label: 'Avg larvae reduction', value: r.operations.avg_larvae_reduction_pct != null ? `${r.operations.avg_larvae_reduction_pct}%` : 'No field data' },
                    ].map((x) => (
                      <div key={x.label} style={{ backgroundColor: '#F3F4F6', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>{x.label}</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{x.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </QueryState>
      </div>
    </div>
  );
}
