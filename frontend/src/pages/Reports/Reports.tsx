import { Clock, BarChart2, FileText, Printer, Share2, Download, CheckSquare, Square, MapPin } from 'lucide-react';

export default function Reports() {
  return (
    <div style={{ height: 'calc(100vh - 120px)', display: 'flex', gap: 'var(--spacing-xl)', margin: '-var(--spacing-xl)' }}>
      {/* Sidebar: Report Builder */}
      <div style={{ width: '350px', borderRight: '1px solid var(--color-border)', padding: 'var(--spacing-xl)', overflowY: 'auto', backgroundColor: 'var(--color-surface)' }}>
         <div style={{ marginBottom: 'var(--spacing-xl)' }}>
            <h2 style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reports &amp; Analytics</h2>
            <h1 style={{ fontSize: '1.75rem', margin: '0.25rem 0' }}>Custom Report Builder</h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>Synthesize district health indicators, climate trends, and AI forecasting into production-ready PDF or CSV exports for stakeholder reporting.</p>
         </div>
         
         <div style={{ marginBottom: 'var(--spacing-xl)' }}>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: 'var(--spacing-md)' }}>QUICK TEMPLATES</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', padding: 'var(--spacing-md)', border: '2px solid var(--color-primary)', borderRadius: 'var(--radius-md)', cursor: 'pointer', backgroundColor: '#FAFAFA' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Clock size={20} /></div>
                  <div>
                     <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Monthly Summary</div>
                     <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Detailed view of the last 30 days.</div>
                  </div>
               </div>
               <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', padding: 'var(--spacing-md)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#F3F4F6', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BarChart2 size={20} /></div>
                  <div>
                     <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Seasonal Analysis</div>
                     <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Climate trends for the current season.</div>
                  </div>
               </div>
               <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', padding: 'var(--spacing-md)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#F3F4F6', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileText size={20} /></div>
                  <div>
                     <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Annual Brief</div>
                     <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>High-level executive summary of the year.</div>
                  </div>
               </div>
            </div>
         </div>

         <div>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: 'var(--spacing-md)' }}>REPORT CONFIGURATION</h3>
            
            <div style={{ marginBottom: 'var(--spacing-md)' }}>
               <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', alignItems: 'center', gap: '0.5rem' }}><Clock size={16} /> Time Range</label>
               <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                  <input type="date" style={{ flex: 1, padding: 'var(--spacing-sm)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }} defaultValue="2024-05-01" />
                  <input type="date" style={{ flex: 1, padding: 'var(--spacing-sm)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }} defaultValue="2024-05-31" />
               </div>
            </div>

            <div style={{ marginBottom: 'var(--spacing-md)' }}>
               <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', alignItems: 'center', gap: '0.5rem' }}><MapPin size={16} /> District Filter</label>
               <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
                  <span className="badge" style={{ backgroundColor: '#F3F4F6', color: 'var(--color-text-primary)' }}>Kigali ✕</span>
                  <span className="badge" style={{ backgroundColor: '#F3F4F6', color: 'var(--color-text-primary)' }}>Musanze ✕</span>
                  <span className="badge" style={{ backgroundColor: '#F3F4F6', color: 'var(--color-text-secondary)' }}>+ 28 More</span>
               </div>
            </div>

            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
               <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', alignItems: 'center', gap: '0.5rem' }}><BarChart2 size={16} /> Data Indicators</label>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckSquare size={16} color="var(--color-primary)" /> Malaria Risk Index</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckSquare size={16} color="var(--color-primary)" /> Disaster Probability</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Square size={16} color="var(--color-text-secondary)" /> Resource Availability</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckSquare size={16} color="var(--color-primary)" /> CHW Intervention Logs</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Square size={16} color="var(--color-text-secondary)" /> Meteorological Data</label>
               </div>
            </div>

            <button className="btn-primary" style={{ width: '100%' }}>Generate Preview</button>
         </div>
      </div>

      {/* Main Area: Document Preview */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 'var(--spacing-xl)', overflowY: 'auto', backgroundColor: '#F3F4F6' }}>
         <div className="flex justify-between items-center" style={{ marginBottom: 'var(--spacing-lg)' }}>
            <div>
               <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Document Preview</h2>
               <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Live visualization of your generated export parameters.</p>
            </div>
            <div className="flex gap-md">
               <button className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'white' }}><Printer size={16} /> Print</button>
               <button className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'white' }}><Share2 size={16} /> Share</button>
               <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#10B981' }}><Download size={16} /> Export PDF</button>
               <button className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'white' }}><Download size={16} /> Export CSV</button>
            </div>
         </div>

         {/* Document Mockup */}
         <div style={{ backgroundColor: 'white', padding: 'var(--spacing-2xl)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)', flex: 1, margin: '0 auto', width: '100%', maxWidth: '800px', border: '1px solid var(--color-border)' }}>
            <div className="flex justify-between items-start" style={{ marginBottom: 'var(--spacing-2xl)', borderBottom: '2px solid var(--color-border)', paddingBottom: 'var(--spacing-lg)' }}>
               <div className="flex gap-md items-center">
                  <div style={{ width: '60px', height: '60px', borderRadius: '50%', border: '2px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🇷🇼</div>
                  <div>
                     <h1 style={{ fontSize: '1.25rem', margin: 0 }}>REPUBLIC OF RWANDA</h1>
                     <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>MINISTRY OF HEALTH • MALARIA DIVISION</div>
                     <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>Climate Health Intelligence Platform (Zero Bite)</div>
                  </div>
               </div>
               <div style={{ textAlign: 'right', fontSize: '0.75rem' }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>ID: ZB-2024-MAY-04</div>
                  <div style={{ color: 'var(--color-text-secondary)' }}>Generated on: May 24, 2024</div>
                  <div style={{ color: 'var(--color-text-secondary)' }}>Reporting Period: May 1 - May 31, 2024</div>
               </div>
            </div>

            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
               <h2 style={{ fontSize: '1.125rem', borderLeft: '4px solid var(--color-primary)', paddingLeft: '0.5rem', marginBottom: 'var(--spacing-md)' }}>Executive Summary</h2>
               <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--color-text-secondary)' }}>
                  The month of May 2024 has shown a moderate increase in malaria breeding risk across the Northern and Eastern provinces. AI projections indicate a <strong>12.4% rise</strong> in district-level risk compared to the previous reporting period, largely attributed to higher-than-average precipitation and humidity levels recorded in the sectors of Musanze and Nyagatare.
               </p>
            </div>

            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
               <h2 style={{ fontSize: '1.125rem', borderLeft: '4px solid var(--color-primary)', paddingLeft: '0.5rem', marginBottom: 'var(--spacing-md)' }}>District Risk Comparison</h2>
               <div className="grid grid-cols-3 gap-md">
                  <div style={{ backgroundColor: '#F3F4F6', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                     <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>TOTAL DISTRICTS</div>
                     <div style={{ fontSize: '2rem', fontWeight: 700 }}>30</div>
                  </div>
                  <div style={{ backgroundColor: '#FDE8E8', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                     <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 600, color: 'var(--color-risk-critical)', marginBottom: '0.25rem' }}>HIGH RISK (ZONE 1)</div>
                     <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-risk-critical)' }}>08</div>
                  </div>
                  <div style={{ backgroundColor: '#FEF0E6', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                     <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 600, color: 'var(--color-risk-high)', marginBottom: '0.25rem' }}>MOD. RISK (ZONE 2)</div>
                     <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-risk-high)' }}>14</div>
                  </div>
               </div>
            </div>

            <div>
               <h2 style={{ fontSize: '1.125rem', borderLeft: '4px solid var(--color-primary)', paddingLeft: '0.5rem', marginBottom: 'var(--spacing-md)' }}>6-Month Trend Analysis</h2>
               <div style={{ height: '200px', backgroundColor: '#F9FAFB', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--color-text-tertiary)' }}>Chart Visualization (Recharts)</span>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
