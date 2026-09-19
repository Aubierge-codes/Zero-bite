import { MapPin, Clock, CheckCircle, AlertTriangle, Users, Info, Calendar, Send, Eye, Droplets, Link, Bell } from 'lucide-react';

export default function WorkerDashboard() {
  return (
    <div>
      <div className="flex justify-between items-center" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div className="flex items-center gap-md">
           <h1 style={{ fontSize: '2rem', marginBottom: 0 }}>Worker Dashboard</h1>
           <span className="badge badge-low" style={{ backgroundColor: '#F3F4F6', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><MapPin size={12} /> Kinyinya Village, Gasabo District</span>
        </div>
        <div className="flex gap-md">
          <button className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Clock size={16} /> Recent Logs</button>
          <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={16} /> Complete Session</button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 2fr 1fr', gap: 'var(--spacing-xl)' }}>
        {/* Left Column */}
        <div className="flex-col gap-xl">
           <div className="card text-center">
              <h3 style={{ fontSize: '0.875rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', letterSpacing: '0.05em', marginBottom: 'var(--spacing-md)' }}>VILLAGE RISK LEVEL</h3>
              <div style={{ width: '120px', height: '120px', borderRadius: '50%', border: '8px solid #FDE8E8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--spacing-md)' }}>
                 <span style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--color-risk-critical)' }}>84</span>
              </div>
              <div className="badge badge-critical" style={{ marginBottom: 'var(--spacing-sm)' }}>High Risk Identified</div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Based on satellite moisture & rainfall data from the last 24h.</p>
           </div>
           
           <div className="card">
              <h3 style={{ fontSize: '1rem', marginBottom: 'var(--spacing-md)' }}>Today's Goals</h3>
              <div className="flex items-start gap-sm" style={{ marginBottom: 'var(--spacing-sm)' }}>
                 <input type="radio" checked readOnly style={{ marginTop: '4px' }} />
                 <div>
                    <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>Contact 12 Village Leaders</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>3/12 completed</div>
                 </div>
              </div>
              <div className="flex items-start gap-sm">
                 <input type="radio" checked readOnly style={{ marginTop: '4px' }} />
                 <div>
                    <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>Distribute SMS Alert</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>Broadcasted at 08:45 AM</div>
                 </div>
              </div>
           </div>
           
           <div className="card" style={{ backgroundColor: '#FFF8E1', borderColor: '#FDE68A' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: 'var(--spacing-sm)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AlertTriangle size={16} /> Weather Warning</h3>
              <p style={{ fontSize: '0.875rem', color: '#92400E' }}>Heavy rains expected in Gasabo District within the next 48 hours. Ensure all stagnant water logs are closed before Tuesday.</p>
           </div>
        </div>
        
        {/* Middle Column */}
        <div className="flex-col gap-xl">
           <div className="card" style={{ borderTop: '4px solid var(--color-risk-critical)' }}>
              <div className="flex justify-between items-center" style={{ marginBottom: '0.5rem' }}>
                 <h2 style={{ fontSize: '1.25rem' }}>Immediate Community Warning</h2>
                 <span className="badge badge-critical">Priority 1</span>
              </div>
              <p style={{ fontSize: '0.875rem', marginBottom: 'var(--spacing-md)' }}>High-risk breeding detected in North Sectors. Public broadcast required.</p>
              
              <div style={{ backgroundColor: '#FDE8E8', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)', display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
                 <span style={{ display: 'flex', alignItems: 'center' }}><AlertTriangle size={24} color="var(--color-risk-critical)" /></span>
                 <div>
                    <div style={{ fontWeight: 600, color: 'var(--color-risk-critical)', fontSize: '0.875rem' }}>Satellite Alert: Anomaly Detected</div>
                    <div style={{ fontSize: '0.875rem', color: '#991B1B' }}>Humidity levels reached 82% threshold for vector proliferation.</div>
                 </div>
              </div>
              
              <div className="flex gap-md">
                 <button className="btn-primary" style={{ flex: 2 }}>Compose Broadcast</button>
                 <button className="btn-outline" style={{ flex: 1 }}>View Sector Map</button>
              </div>
           </div>
           
           <div className="card">
              <div className="flex justify-between items-center" style={{ marginBottom: '0.5rem' }}>
                 <h2 style={{ fontSize: '1.25rem' }}>Broadcast Community SMS</h2>
                 <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Users size={16} /> 1,240 Contacts</span>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-md)' }}>Send warnings or health advice to all registered phones in your cell.</p>
              
              <div className="flex gap-sm" style={{ marginBottom: 'var(--spacing-md)' }}>
                 <span className="badge" style={{ backgroundColor: '#F3F4F6', color: 'var(--color-text-primary)' }}>Warning</span>
                 <span className="badge" style={{ backgroundColor: '#F3F4F6', color: 'var(--color-text-secondary)' }}>Prevention</span>
                 <span className="badge" style={{ backgroundColor: '#F3F4F6', color: 'var(--color-text-secondary)' }}>Visit</span>
              </div>
              
              <textarea 
                 rows={4}
                 style={{ width: '100%', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', marginBottom: 'var(--spacing-sm)', fontSize: '0.875rem', resize: 'none' }}
                 defaultValue="BITEYE: Inzu yawe iri mu gace gafite ibyago byinshi by'imibu. Siba amazi adatemba kandi ukoreshe inzitiramibu. - Zero Bite"
              />
              <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginBottom: 'var(--spacing-md)' }}>122 / 160 characters</div>
              
              <div style={{ backgroundColor: '#F0F4F8', padding: 'var(--spacing-sm)', borderRadius: 'var(--radius-md)', fontSize: '0.75rem', display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'flex-start', marginBottom: 'var(--spacing-lg)' }}>
                 <span style={{ display: 'flex', alignItems: 'center', marginTop: '2px' }}><Info size={14} /></span>
                 <span><strong>AI Suggestion:</strong> This message is highly effective. Translation in Kinyarwanda is accurate for the local context.</span>
              </div>
              
              <div className="flex justify-end gap-md">
                 <button className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Calendar size={16} /> Schedule</button>
                 <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Send size={16} /> Send Community SMS</button>
              </div>
           </div>
           
           <div>
              <h3 style={{ margin: 0, fontSize: '1rem', marginBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Eye size={16} /> Field Monitoring Tools</h3>
              <div className="grid grid-cols-2 gap-md">
                 <button className="btn-outline" style={{ height: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <Eye size={20} /> <span style={{ fontSize: '0.875rem' }}>Log Observation</span>
                 </button>
                 <button className="btn-outline" style={{ height: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <Droplets size={20} color="#3B82F6" /> <span style={{ fontSize: '0.875rem' }}>Check Water Site</span>
                 </button>
                 <button className="btn-outline" style={{ height: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <Calendar size={20} /> <span style={{ fontSize: '0.875rem' }}>Schedule Visit</span>
                 </button>
                 <button className="btn-outline" style={{ height: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <Link size={20} color="#F59E0B" /> <span style={{ fontSize: '0.875rem' }}>Share Report</span>
                 </button>
              </div>
           </div>
        </div>
        
        {/* Right Column */}
        <div className="flex-col gap-xl">
           <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="flex justify-between items-center" style={{ padding: 'var(--spacing-md)', borderBottom: '1px solid var(--color-border)' }}>
                 <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Bell size={16} /> Alerts Inbox</h3>
                 <span className="badge badge-low" style={{ backgroundColor: '#F3F4F6' }}>3 New</span>
              </div>
              
              <div style={{ padding: 'var(--spacing-md)', borderBottom: '1px solid var(--color-border)' }}>
                 <div className="flex justify-between items-center" style={{ marginBottom: '0.25rem' }}>
                    <span className="badge badge-critical">Urgent</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>10m ago</span>
                 </div>
                 <h4 style={{ fontSize: '0.875rem', margin: '0.25rem 0' }}>Visit Cell B Breeding Site</h4>
                 <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Satellite data shows 45% increase in moisture. Check for stagnant water.</p>
                 <div style={{ textAlign: 'right' }}><a href="#" style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Details &gt;</a></div>
              </div>
              
              <div style={{ padding: 'var(--spacing-md)' }}>
                 <button className="btn-outline" style={{ width: '100%', fontSize: '0.875rem', border: 'none', backgroundColor: '#F9FAFB' }}>View All Alert History</button>
              </div>
           </div>
           
           <div className="card">
              <h3 style={{ fontSize: '1rem', marginBottom: 'var(--spacing-md)' }}>Community Profile</h3>
              <div className="flex items-center gap-sm" style={{ marginBottom: 'var(--spacing-sm)' }}>
                 <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#E5E7EB' }}></div>
                 <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>Cyprien Mutabazi</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Cell Leader</div>
                 </div>
              </div>
              <button className="btn-outline" style={{ width: '100%', marginTop: 'var(--spacing-md)', fontSize: '0.875rem' }}>Contact Tree</button>
           </div>
        </div>
      </div>
    </div>
  );
}
