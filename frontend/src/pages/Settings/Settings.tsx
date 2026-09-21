import { useState } from 'react';
import { Users, Smartphone, Activity, List, Globe, Search, Plus, ShieldCheck, Download, Phone, Settings as SettingsIcon, CheckCircle2, Send, UserPlus, UserCog, Trash2, AlertTriangle, RefreshCw } from 'lucide-react';

const tabs = [
  { label: 'Users', icon: Users },
  { label: 'SMS Gateway', icon: Smartphone },
  { label: 'Thresholds', icon: Activity },
  { label: 'Audit Log', icon: List },
  { label: 'Localization', icon: Globe },
];

const users = [
  { name: 'Jean-Pierre Kabera', role: 'Ministry', district: 'National', status: 'Active', lastActive: '2 mins ago' },
  { name: 'Marie Claire Uwase', role: 'District Officer', district: 'Musanze', status: 'Active', lastActive: '1 hour ago' },
  { name: 'Emmanuel Gisa', role: 'CHW', district: 'Kayonza', status: 'Inactive', lastActive: '2 days ago' },
  { name: 'Sonia Mukamanzi', role: 'Admin', district: 'Kigali', status: 'Active', lastActive: 'Just now' },
  { name: 'Aimable Rugamba', role: 'District Officer', district: 'Nyamagabe', status: 'Active', lastActive: '5 hours ago' },
];

const auditLog = [
  { icon: UserPlus, actor: 'Sonia Mukamanzi', action: 'Added user Aimable Rugamba (District Officer, Nyamagabe)', time: 'Just now' },
  { icon: UserCog, actor: 'Jean-Pierre Kabera', action: 'Promoted model version v2.4 to production', time: '1 hour ago' },
  { icon: Smartphone, actor: 'System', action: 'SMS gateway health check passed (Africa\'s Talking)', time: '3 hours ago' },
  { icon: Activity, actor: 'Sonia Mukamanzi', action: 'Updated HIGH risk threshold from 0.70 to 0.65', time: '1 day ago' },
  { icon: Trash2, actor: 'Jean-Pierre Kabera', action: 'Deactivated user account for Emmanuel Gisa', time: '2 days ago' },
  { icon: RefreshCw, actor: 'System', action: 'Weekly model retraining completed -- accuracy 89.1%', time: '3 days ago' },
];

const smsDeliveryLog = [
  { district: 'Musanze', recipients: 1240, status: 'Delivered', time: '10:45 AM' },
  { district: 'Kayonza', recipients: 890, status: 'Delivered', time: '09:12 AM' },
  { district: 'Ruhengeri Sector', recipients: 312, status: 'Failed', time: '04:30 PM' },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState('Users');
  const [query, setQuery] = useState('');
  const [thresholds, setThresholds] = useState({ moderate: 35, high: 65, critical: 80 });
  const [language, setLanguage] = useState<'en' | 'rw'>('en');
  const [testSmsSent, setTestSmsSent] = useState(false);

  const visibleUsers = users.filter((u) => {
    const q = query.trim().toLowerCase();
    return q === '' || u.name.toLowerCase().includes(q) || u.district.toLowerCase().includes(q);
  });

  const sendTestSms = () => {
    setTestSmsSent(true);
    setTimeout(() => setTestSmsSent(false), 2500);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h2 style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><SettingsIcon size={14} /> System Administration / {activeTab}</h2>
        <h1 style={{ fontSize: '2rem', margin: '0.25rem 0' }}>Settings &amp; Admin</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>Manage platform security, technical integrations, and AI risk logic.</p>
      </div>

      <div style={{ display: 'flex', overflowX: 'auto', borderBottom: '1px solid var(--color-border)', marginBottom: 'var(--spacing-xl)' }}>
         {tabs.map(({ label, icon: Icon }) => (
            <button
               key={label}
               onClick={() => setActiveTab(label)}
               style={{
                  padding: 'var(--spacing-md) var(--spacing-xl)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                  borderBottom: activeTab === label ? '2px solid var(--color-primary)' : '2px solid transparent',
                  fontWeight: activeTab === label ? 600 : 400,
                  color: activeTab === label ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
               }}
            >
               <Icon size={16} /> {label}
            </button>
         ))}
      </div>

      {activeTab === 'SMS Gateway' && (
        <div className="flex-col gap-lg" style={{ marginBottom: 'var(--spacing-2xl)' }}>
          <div className="card">
            <div className="flex justify-between items-center" style={{ marginBottom: 'var(--spacing-lg)', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
              <div className="flex items-center gap-sm">
                <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: 'var(--color-risk-low)' }} />
                <h3 style={{ margin: 0, fontSize: '1rem' }}>Africa's Talking -- Connected</h3>
              </div>
              <span className="badge badge-low">Sandbox Mode</span>
            </div>
            <div className="grid grid-cols-3 gap-lg" style={{ marginBottom: 'var(--spacing-lg)' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Sender ID</div>
                <div style={{ fontWeight: 600 }}>ZeroBite</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>API Key</div>
                <div style={{ fontWeight: 600 }}>••••••••3f2a</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Delivery Success (7d)</div>
                <div style={{ fontWeight: 600, color: 'var(--color-risk-low)' }}>96.8%</div>
              </div>
            </div>
            <div className="flex gap-md" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
              <button className="btn-primary" onClick={sendTestSms} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Send size={16} /> Send Test SMS
              </button>
              {testSmsSent && (
                <span className="flex items-center gap-sm" style={{ fontSize: '0.875rem', color: 'var(--color-risk-low)' }}>
                  <CheckCircle2 size={16} /> Test message sent to +250 788 000 000
                </span>
              )}
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <h3 style={{ fontSize: '1rem', padding: 'var(--spacing-lg)', margin: 0, borderBottom: '1px solid var(--color-border)' }}>Recent Broadcasts</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid var(--color-border)', fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                  <th style={{ padding: 'var(--spacing-md) var(--spacing-lg)', fontWeight: 600 }}>District</th>
                  <th style={{ padding: 'var(--spacing-md) var(--spacing-lg)', fontWeight: 600 }}>Recipients</th>
                  <th style={{ padding: 'var(--spacing-md) var(--spacing-lg)', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: 'var(--spacing-md) var(--spacing-lg)', fontWeight: 600 }}>Time</th>
                </tr>
              </thead>
              <tbody>
                {smsDeliveryLog.map((row) => (
                  <tr key={row.district} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: 'var(--spacing-md) var(--spacing-lg)', fontWeight: 500, fontSize: '0.875rem' }}>{row.district}</td>
                    <td style={{ padding: 'var(--spacing-md) var(--spacing-lg)', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{row.recipients.toLocaleString()}</td>
                    <td style={{ padding: 'var(--spacing-md) var(--spacing-lg)' }}>
                      <span className={`badge ${row.status === 'Delivered' ? 'badge-low' : 'badge-critical'}`}>{row.status}</span>
                    </td>
                    <td style={{ padding: 'var(--spacing-md) var(--spacing-lg)', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{row.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'Thresholds' && (
        <div className="card" style={{ marginBottom: 'var(--spacing-2xl)' }}>
          <div className="flex items-start gap-sm" style={{ marginBottom: 'var(--spacing-xl)', backgroundColor: '#F0F9FF', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)' }}>
            <AlertTriangle size={16} color="#0284C7" style={{ marginTop: '2px', flexShrink: 0 }} />
            <p style={{ fontSize: '0.8125rem', color: '#0369A1' }}>
              These thresholds control when a zone is classified Moderate, High, or Critical across every dashboard. Changes apply to the next prediction run.
            </p>
          </div>

          {([
            { key: 'moderate' as const, label: 'Moderate Risk Threshold', color: 'var(--color-risk-moderate)' },
            { key: 'high' as const, label: 'High Risk Threshold', color: 'var(--color-risk-high)' },
            { key: 'critical' as const, label: 'Critical Risk Threshold', color: 'var(--color-risk-critical)' },
          ]).map((row) => (
            <div key={row.key} style={{ marginBottom: 'var(--spacing-xl)' }}>
              <div className="flex justify-between items-center" style={{ marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>{row.label}</label>
                <span style={{ fontWeight: 700, color: row.color }}>{thresholds[row.key]}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={thresholds[row.key]}
                onChange={(e) => setThresholds((prev) => ({ ...prev, [row.key]: Number(e.target.value) }))}
                style={{ width: '100%', accentColor: row.color }}
              />
            </div>
          ))}

          <button className="btn-primary" style={{ width: '100%' }}>Save Threshold Changes</button>
        </div>
      )}

      {activeTab === 'Audit Log' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 'var(--spacing-2xl)' }}>
          <h3 style={{ fontSize: '1rem', padding: 'var(--spacing-lg)', margin: 0, borderBottom: '1px solid var(--color-border)' }}>Administrative Activity</h3>
          <ul style={{ listStyle: 'none' }}>
            {auditLog.map((entry, i) => {
              const Icon = entry.icon;
              return (
                <li
                  key={i}
                  className="flex gap-md"
                  style={{ padding: 'var(--spacing-lg)', borderBottom: i < auditLog.length - 1 ? '1px solid var(--color-border)' : 'none' }}
                >
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--color-text-secondary)' }}>
                    <Icon size={16} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.875rem' }}><strong>{entry.actor}</strong> {entry.action}</p>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>{entry.time}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {activeTab === 'Localization' && (
        <div className="card" style={{ marginBottom: 'var(--spacing-2xl)' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: 'var(--spacing-md)' }}>Default Platform Language</h3>
          <div className="flex gap-md" style={{ marginBottom: 'var(--spacing-xl)' }}>
            <button
              onClick={() => setLanguage('en')}
              className="flex items-center gap-sm"
              style={{ flex: 1, padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)', border: language === 'en' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)', justifyContent: 'center', fontWeight: 600 }}
            >
              {language === 'en' && <CheckCircle2 size={16} color="var(--color-primary)" />} English
            </button>
            <button
              onClick={() => setLanguage('rw')}
              className="flex items-center gap-sm"
              style={{ flex: 1, padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)', border: language === 'rw' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)', justifyContent: 'center', fontWeight: 600 }}
            >
              {language === 'rw' && <CheckCircle2 size={16} color="var(--color-primary)" />} Kinyarwanda
            </button>
          </div>

          <h3 style={{ fontSize: '1rem', marginBottom: 'var(--spacing-md)' }}>Translation Coverage</h3>
          {[
            { label: 'Dashboard & Navigation', pct: 100 },
            { label: 'SMS Alert Templates', pct: 100 },
            { label: 'Prevention & Health Guides', pct: 87 },
            { label: 'Reports & Analytics', pct: 62 },
          ].map((row) => (
            <div key={row.label} style={{ marginBottom: 'var(--spacing-md)' }}>
              <div className="flex justify-between" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                <span>{row.label}</span>
                <span style={{ fontWeight: 600 }}>{row.pct}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: '#E5E7EB', borderRadius: '4px' }}>
                <div style={{ width: `${row.pct}%`, height: '100%', backgroundColor: row.pct === 100 ? 'var(--color-risk-low)' : 'var(--color-primary)', borderRadius: '4px' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'Users' && (
      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 'var(--spacing-2xl)' }}>
         <div className="flex justify-between items-center" style={{ padding: 'var(--spacing-lg)', borderBottom: '1px solid var(--color-border)', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 'var(--radius-sm)', padding: 'var(--spacing-sm) var(--spacing-md)', width: '100%', maxWidth: '300px' }}>
               <Search size={16} color="var(--color-text-secondary)" />
               <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search users by name or district..."
                  style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', padding: '0 var(--spacing-sm)', fontSize: '0.875rem' }}
               />
            </div>
            <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Plus size={16} /> Add User</button>
         </div>

         <div style={{ overflowX: 'auto' }}>
         <table style={{ width: '100%', minWidth: '640px', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
               <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid var(--color-border)', fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                  <th style={{ padding: 'var(--spacing-md) var(--spacing-lg)', fontWeight: 600 }}>User</th>
                  <th style={{ padding: 'var(--spacing-md) var(--spacing-lg)', fontWeight: 600 }}>Role</th>
                  <th style={{ padding: 'var(--spacing-md) var(--spacing-lg)', fontWeight: 600 }}>District</th>
                  <th style={{ padding: 'var(--spacing-md) var(--spacing-lg)', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: 'var(--spacing-md) var(--spacing-lg)', fontWeight: 600 }}>Last Active</th>
                  <th style={{ padding: 'var(--spacing-md) var(--spacing-lg)', fontWeight: 600, textAlign: 'right' }}>Actions</th>
               </tr>
            </thead>
            <tbody>
               {visibleUsers.map((u, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                     <td style={{ padding: 'var(--spacing-md) var(--spacing-lg)', fontWeight: 500, fontSize: '0.875rem' }}>{u.name}</td>
                     <td style={{ padding: 'var(--spacing-md) var(--spacing-lg)' }}><span className="badge" style={{ backgroundColor: '#F3F4F6', fontWeight: 500, textTransform: 'none' }}>{u.role}</span></td>
                     <td style={{ padding: 'var(--spacing-md) var(--spacing-lg)', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{u.district}</td>
                     <td style={{ padding: 'var(--spacing-md) var(--spacing-lg)', fontSize: '0.875rem' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: u.status === 'Active' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
                           <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: u.status === 'Active' ? 'var(--color-risk-low)' : 'var(--color-text-tertiary)' }}></span>
                           {u.status}
                        </span>
                     </td>
                     <td style={{ padding: 'var(--spacing-md) var(--spacing-lg)', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{u.lastActive}</td>
                     <td style={{ padding: 'var(--spacing-md) var(--spacing-lg)', textAlign: 'right' }}>
                        <button style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>Edit</button>
                     </td>
                  </tr>
               ))}
               {visibleUsers.length === 0 && (
                  <tr>
                     <td colSpan={6} style={{ padding: 'var(--spacing-2xl)', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                        No users match "{query}".
                     </td>
                  </tr>
               )}
            </tbody>
         </table>
         </div>
      </div>
      )}

      <div style={{ backgroundColor: '#F9FAFB', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--spacing-xl)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--spacing-lg)' }}>
         <div style={{ display: 'flex', gap: 'var(--spacing-lg)', maxWidth: '600px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
               <ShieldCheck size={24} color="var(--color-text-secondary)" />
            </div>
            <div>
               <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>System Health &amp; Compliance</h3>
               <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Zero Bite complies with Rwanda MoH data privacy standards. All administrative changes are logged for seasonal review.</p>
            </div>
         </div>
         <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
            <button className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'white' }}><Download size={16} /> Download Security Report</button>
            <button className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'white' }}><Phone size={16} /> Contact System Support</button>
         </div>
      </div>
    </div>
  );
}
