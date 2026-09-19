import { Search, Filter, Save, Send, MonitorSmartphone, Smartphone, MessageSquare, Bot, AlertTriangle } from 'lucide-react';

const composeTabs = [
  { label: 'Compose Message', icon: MessageSquare },
  { label: 'Templates', icon: MonitorSmartphone },
  { label: 'Fallback Rules', icon: AlertTriangle },
];

export default function AlertsCenter() {
  return (
    <div style={{ height: 'calc(100vh - 120px)', display: 'flex', gap: 'var(--spacing-xl)', margin: '-var(--spacing-xl)' }}>
      {/* Sidebar: Alerts Inbox */}
      <div style={{ width: '320px', borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-surface)' }}>
        <div style={{ padding: 'var(--spacing-lg)', borderBottom: '1px solid var(--color-border)' }}>
           <div className="flex justify-between items-center" style={{ marginBottom: 'var(--spacing-md)' }}>
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Alerts Inbox</h2>
              <button style={{ color: 'var(--color-text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}><Filter size={18} /></button>
           </div>
           <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 'var(--radius-sm)', padding: 'var(--spacing-xs) var(--spacing-sm)' }}>
              <Search size={16} color="var(--color-text-secondary)" />
              <input type="text" placeholder="Search alerts..." style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', padding: 'var(--spacing-xs) var(--spacing-sm)', fontSize: '0.875rem' }} />
           </div>
        </div>
        
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', padding: 'var(--spacing-md) var(--spacing-lg)', borderBottom: '1px solid var(--color-border)' }}>
           <span className="badge" style={{ backgroundColor: 'var(--color-text-primary)', color: 'white' }}>All</span>
           <span className="badge" style={{ backgroundColor: '#F3F4F6', color: 'var(--color-text-secondary)' }}>Sent</span>
           <span className="badge" style={{ backgroundColor: '#F3F4F6', color: 'var(--color-text-secondary)' }}>Scheduled</span>
           <span className="badge" style={{ backgroundColor: '#FDE8E8', color: 'var(--color-risk-critical)' }}>Failed</span>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto' }}>
           {/* Alert Item 1 */}
           <div style={{ padding: 'var(--spacing-lg)', borderBottom: '1px solid var(--color-border)', backgroundColor: '#F9FAFB', borderLeft: '3px solid var(--color-text-primary)', cursor: 'pointer' }}>
              <div className="flex justify-between" style={{ marginBottom: '0.25rem' }}>
                 <h4 style={{ fontSize: '0.875rem', margin: 0 }}>Malaria Risk Spike: Musanze</h4>
                 <span className="badge" style={{ backgroundColor: '#F3F4F6', color: 'var(--color-text-secondary)' }}>Sent</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>All CHWs, Musanze District</p>
              <div className="flex justify-between items-center">
                 <div className="flex gap-sm" style={{ color: 'var(--color-text-tertiary)' }}><Smartphone size={14} /> <MonitorSmartphone size={14} /></div>
                 <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>12 Oct, 10:45 AM</span>
              </div>
           </div>

           {/* Alert Item 2 */}
           <div style={{ padding: 'var(--spacing-lg)', borderBottom: '1px solid var(--color-border)', cursor: 'pointer' }}>
              <div className="flex justify-between" style={{ marginBottom: '0.25rem' }}>
                 <h4 style={{ fontSize: '0.875rem', margin: 0 }}>Seasonal Rainfall Forecast</h4>
                 <span className="badge" style={{ backgroundColor: '#F3F4F6', color: 'var(--color-text-secondary)' }}>Scheduled</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>General Public, Northern Province</p>
              <div className="flex justify-between items-center">
                 <div className="flex gap-sm" style={{ color: 'var(--color-text-tertiary)' }}><MonitorSmartphone size={14} /></div>
                 <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>12 Oct, 09:00 AM</span>
              </div>
           </div>

           {/* Alert Item 3 */}
           <div style={{ padding: 'var(--spacing-lg)', borderBottom: '1px solid var(--color-border)', cursor: 'pointer' }}>
              <div className="flex justify-between" style={{ marginBottom: '0.25rem' }}>
                 <h4 style={{ fontSize: '0.875rem', margin: 0 }}>Flood Alert: Ruhengeri Sector</h4>
                 <span className="badge badge-critical">Failed</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Emergency Contacts</p>
              <div className="flex justify-between items-center">
                 <div className="flex gap-sm" style={{ color: 'var(--color-text-tertiary)' }}><Smartphone size={14} /></div>
                 <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>11 Oct, 04:30 PM</span>
              </div>
           </div>
        </div>

        <div style={{ padding: 'var(--spacing-lg)' }}>
           <button className="btn-primary" style={{ width: '100%' }}>+ Compose New Alert</button>
        </div>
      </div>

      {/* Main Panel: Alert Composer */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <div style={{ padding: 'var(--spacing-xl)' }}>
           <div className="flex justify-between items-center" style={{ marginBottom: 'var(--spacing-xl)' }}>
              <div>
                 <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Alert Composer</h1>
                 <p style={{ color: 'var(--color-text-secondary)' }}>Draft climate intelligence messages for cross-channel delivery.</p>
              </div>
              <div className="flex gap-md">
                 <button className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Save size={16} /> Save as Draft</button>
                 <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Send size={16} /> Send Alert</button>
              </div>
           </div>

           <div className="flex gap-md" style={{ marginBottom: 'var(--spacing-xl)', borderBottom: '1px solid var(--color-border)' }}>
              {composeTabs.map(({ label, icon: Icon }, i) => (
                 <button
                    key={label}
                    className="flex items-center gap-sm"
                    style={{
                       padding: 'var(--spacing-sm) var(--spacing-md)',
                       fontWeight: i === 0 ? 600 : 400,
                       color: i === 0 ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                       borderBottom: i === 0 ? '2px solid var(--color-primary)' : '2px solid transparent',
                    }}
                 >
                    <Icon size={16} /> {label}
                 </button>
              ))}
           </div>

           <div className="grid" style={{ gridTemplateColumns: '2fr 1fr', gap: 'var(--spacing-xl)' }}>
              {/* Form Area */}
              <div className="flex-col gap-lg">
                 <div className="card">
                    <h3 style={{ fontSize: '1rem', marginBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MonitorSmartphone size={16} /> Delivery Channels & Targeting</h3>
                    <div className="grid grid-cols-2 gap-md" style={{ marginBottom: 'var(--spacing-lg)' }}>
                       <div style={{ padding: 'var(--spacing-md)', border: '2px solid var(--color-primary)', borderRadius: 'var(--radius-md)', backgroundColor: '#FAFAFA' }}>
                          <MonitorSmartphone size={24} style={{ marginBottom: '0.5rem' }} />
                          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Dashboard</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>Immediate notification in-app for logged-in users.</div>
                       </div>
                       <div style={{ padding: 'var(--spacing-md)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                          <Smartphone size={24} style={{ marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }} />
                          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>SMS Broadcast</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>Direct to mobile. Critical for offline areas.</div>
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-md">
                       <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>TARGET AUDIENCE</label>
                          <select style={{ width: '100%', padding: 'var(--spacing-sm)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.875rem' }}>
                             <option>Select roles or groups</option>
                          </select>
                       </div>
                       <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>GEOGRAPHIC SCOPE</label>
                          <select style={{ width: '100%', padding: 'var(--spacing-sm)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.875rem' }}>
                             <option>Select districts/sectors</option>
                          </select>
                       </div>
                    </div>
                 </div>

                 <div className="card">
                    <div className="flex justify-between items-center" style={{ marginBottom: 'var(--spacing-md)' }}>
                       <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MessageSquare size={16} /> Message Content</h3>
                       <button className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}><Bot size={14} /> AI Refine</button>
                    </div>
                    <div className="grid grid-cols-2 gap-md">
                       <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>ENGLISH (DEFAULT)</label>
                          <textarea rows={6} style={{ width: '100%', padding: 'var(--spacing-sm)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.875rem', resize: 'vertical' }} defaultValue="Attention: High rainfall predicted for Musanze over next 3 days. Community Health Workers are advised to increase mosquito net distribution and clear stagnant water sites." />
                          <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: '0.25rem' }}>156 / 160 characters</div>
                       </div>
                       <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>KINYARWANDA (TRANSLATED)</label>
                          <textarea rows={6} style={{ width: '100%', padding: 'var(--spacing-sm)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.875rem', resize: 'vertical', backgroundColor: '#F9FAFB' }} placeholder="Translation will appear here..." readOnly />
                       </div>
                    </div>
                 </div>
              </div>

              {/* Sidebar Assistants Area */}
              <div className="flex-col gap-lg">
                 <div className="card" style={{ backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: 'var(--spacing-sm)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Bot size={16} color="#0284C7" /> AI Wording Assistant</h3>
                    <p style={{ fontSize: '0.75rem', color: '#0369A1', marginBottom: 'var(--spacing-md)' }}>Based on current satellite data in Musanze, I recommend focusing on stagnant water prevention.</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                       <div style={{ padding: 'var(--spacing-sm)', backgroundColor: 'white', border: '1px solid #BAE6FD', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', cursor: 'pointer' }}>"Focus on clearing gutters and stagnant w..."</div>
                       <div style={{ padding: 'var(--spacing-sm)', backgroundColor: 'white', border: '1px solid #BAE6FD', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', cursor: 'pointer' }}>"Increase surveillance for fever symptoms..."</div>
                    </div>
                    <button style={{ background: 'none', border: 'none', color: '#0284C7', fontSize: '0.75rem', fontWeight: 600, marginTop: 'var(--spacing-sm)', cursor: 'pointer' }}>See more suggestions</button>
                 </div>

                 <div className="card">
                    <h3 style={{ fontSize: '1rem', marginBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Smartphone size={16} /> SMS Preview</h3>
                    <div style={{ maxWidth: '260px', margin: '0 auto', backgroundColor: '#F3F4F6', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)' }}>
                       <div style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-sm)' }}>Zero Bite</div>
                       <div style={{ backgroundColor: '#E5E7EB', padding: 'var(--spacing-sm) var(--spacing-md)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', lineHeight: 1.5, color: 'var(--color-text-primary)' }}>
                          Attention: High rainfall predicted for Musanze over next 3 days...
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
