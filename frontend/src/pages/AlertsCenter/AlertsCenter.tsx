import { useState } from 'react';
import { Search, Filter, Save, Send, MonitorSmartphone, Smartphone, MessageSquare, Bot, AlertTriangle, CheckCircle2, Clock, ArrowRightLeft, Loader2 } from 'lucide-react';
import styles from './AlertsCenter.module.css';

const composeTabs = [
  { label: 'Compose Message', icon: MessageSquare },
  { label: 'Templates', icon: MonitorSmartphone },
  { label: 'Fallback Rules', icon: AlertTriangle },
];

interface MessageTemplate {
  id: string;
  name: string;
  audience: string;
  channels: Channel[];
  message: string;
}

const messageTemplates: MessageTemplate[] = [
  {
    id: 'malaria-high',
    name: 'Malaria Risk Spike',
    audience: 'Community Workers',
    channels: ['sms', 'dashboard'],
    message: "ALERT: High malaria breeding risk detected in {district}. All Abajyanama b'ubuzima: conduct immediate stagnant water removal campaigns. Contact district office for support.",
  },
  {
    id: 'flood-warning',
    name: 'Flood Warning',
    audience: 'All',
    channels: ['sms', 'dashboard'],
    message: 'FLOOD WARNING: Heavy rainfall forecast for {district} in next 48 hours. Evacuate low-lying areas. Avoid river crossing.',
  },
  {
    id: 'monthly-briefing',
    name: 'Monthly Health Briefing',
    audience: 'District Officers',
    channels: ['dashboard'],
    message: 'Zero Bite Monthly Update for {district}: Risk level this month is {risk_level}. Key actions: {actions}.',
  },
  {
    id: 'critical-escalation',
    name: 'Critical Escalation',
    audience: 'Ministry',
    channels: ['sms', 'dashboard'],
    message: 'CRITICAL: Imminent outbreak risk in {district}. Risk score {score}/100. Ministry of Health escalation required. All response channels activated.',
  },
];

const fallbackRules = [
  { id: 1, title: 'SMS delivery failure', description: 'If an SMS fails to send within 5 minutes, automatically retry once via the secondary gateway.', enabled: true },
  { id: 2, title: 'Unseen dashboard alert', description: 'If a dashboard alert goes unacknowledged for 1 hour, escalate it as an SMS to the assigned team leader.', enabled: true },
  { id: 3, title: 'Critical zone, no field response', description: 'If a CRITICAL zone has no field team assignment within 2 hours, notify the district officer directly.', enabled: true },
  { id: 4, title: 'Offline CHW device', description: "If a Community Health Worker's device has been offline for 24h, queue alerts for delivery on next sync.", enabled: false },
];

const statusFilters = ['All', 'Sent', 'Scheduled', 'Failed'] as const;

type Channel = 'sms' | 'dashboard';

const alerts: { id: number; title: string; audience: string; status: string; date: string; channels: Channel[] }[] = [
  { id: 1, title: 'Malaria Risk Spike: Musanze', audience: 'All CHWs, Musanze District', status: 'Sent', date: '12 Oct, 10:45 AM', channels: ['sms', 'dashboard'] },
  { id: 2, title: 'Seasonal Rainfall Forecast', audience: 'General Public, Northern Province', status: 'Scheduled', date: '12 Oct, 09:00 AM', channels: ['dashboard'] },
  { id: 3, title: 'Flood Alert: Ruhengeri Sector', audience: 'Emergency Contacts', status: 'Failed', date: '11 Oct, 04:30 PM', channels: ['sms'] },
];

function statusBadgeStyle(status: string) {
  if (status === 'Failed') return { backgroundColor: '#FDE8E8', color: 'var(--color-risk-critical)' };
  return { backgroundColor: '#F3F4F6', color: 'var(--color-text-secondary)' };
}

export default function AlertsCenter() {
  const [activeTab, setActiveTab] = useState('Compose Message');
  const [statusFilter, setStatusFilter] = useState<(typeof statusFilters)[number]>('All');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(1);
  const [messageBody, setMessageBody] = useState(
    'Attention: High rainfall predicted for Musanze over next 3 days. Community Health Workers are advised to increase mosquito net distribution and clear stagnant water sites.'
  );
  const [rules, setRules] = useState(fallbackRules);
  const [templateLoaded, setTemplateLoaded] = useState<string | null>(null);
  const [sendState, setSendState] = useState<'idle' | 'sending'>('idle');
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const sendAlert = () => {
    if (!messageBody.trim()) {
      showToast('Write a message before sending.');
      return;
    }
    setSendState('sending');
    setTimeout(() => {
      setSendState('idle');
      showToast('Alert sent to all selected channels and recipients.');
    }, 1100);
  };

  const saveDraft = () => showToast('Draft saved.');

  const loadTemplate = (template: (typeof messageTemplates)[number]) => {
    setMessageBody(template.message);
    setTemplateLoaded(template.name);
    setActiveTab('Compose Message');
    setTimeout(() => setTemplateLoaded(null), 2500);
  };

  const toggleRule = (id: number) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  };

  const visibleAlerts = alerts.filter((a) => {
    const matchesStatus = statusFilter === 'All' || a.status === statusFilter;
    const q = query.trim().toLowerCase();
    const matchesQuery = q === '' || a.title.toLowerCase().includes(q) || a.audience.toLowerCase().includes(q);
    return matchesStatus && matchesQuery;
  });

  return (
    <div className={styles.layout}>
      {toast && (
        <div
          className="flex items-center gap-sm"
          style={{
            position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 500,
            backgroundColor: 'var(--color-primary)', color: 'white',
            padding: 'var(--spacing-md) var(--spacing-lg)', borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)', fontSize: '0.875rem', animation: 'fadeInUp 250ms ease-out',
          }}
        >
          <CheckCircle2 size={18} color="#86EFAC" /> {toast}
        </div>
      )}
      {/* Sidebar: Alerts Inbox */}
      <div className={styles.inbox}>
        <div style={{ padding: 'var(--spacing-lg)', borderBottom: '1px solid var(--color-border)' }}>
           <div className="flex justify-between items-center" style={{ marginBottom: 'var(--spacing-md)' }}>
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Alerts Inbox</h2>
              <button style={{ color: 'var(--color-text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}><Filter size={18} /></button>
           </div>
           <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 'var(--radius-sm)', padding: 'var(--spacing-xs) var(--spacing-sm)' }}>
              <Search size={16} color="var(--color-text-secondary)" />
              <input
                 type="text"
                 value={query}
                 onChange={(e) => setQuery(e.target.value)}
                 placeholder="Search alerts..."
                 style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', padding: 'var(--spacing-xs) var(--spacing-sm)', fontSize: '0.875rem' }}
              />
           </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', padding: 'var(--spacing-md) var(--spacing-lg)', borderBottom: '1px solid var(--color-border)' }}>
           {statusFilters.map((status) => (
              <button
                 key={status}
                 className="badge"
                 onClick={() => setStatusFilter(status)}
                 style={statusFilter === status ? { backgroundColor: 'var(--color-text-primary)', color: 'white', cursor: 'pointer' } : { backgroundColor: '#F3F4F6', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
              >
                 {status}
              </button>
           ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
           {visibleAlerts.map((alert) => (
              <div
                 key={alert.id}
                 onClick={() => setSelectedId(alert.id)}
                 style={{
                    padding: 'var(--spacing-lg)',
                    borderBottom: '1px solid var(--color-border)',
                    backgroundColor: selectedId === alert.id ? '#F9FAFB' : 'transparent',
                    borderLeft: selectedId === alert.id ? '3px solid var(--color-text-primary)' : '3px solid transparent',
                    cursor: 'pointer',
                 }}
              >
                 <div className="flex justify-between" style={{ marginBottom: '0.25rem' }}>
                    <h4 style={{ fontSize: '0.875rem', margin: 0 }}>{alert.title}</h4>
                    <span className="badge" style={statusBadgeStyle(alert.status)}>{alert.status}</span>
                 </div>
                 <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>{alert.audience}</p>
                 <div className="flex justify-between items-center">
                    <div className="flex gap-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                       {alert.channels.includes('sms') && <Smartphone size={14} />}
                       {alert.channels.includes('dashboard') && <MonitorSmartphone size={14} />}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>{alert.date}</span>
                 </div>
              </div>
           ))}
           {visibleAlerts.length === 0 && (
              <p style={{ padding: 'var(--spacing-xl)', textAlign: 'center', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                 No alerts match your filters.
              </p>
           )}
        </div>

        <div style={{ padding: 'var(--spacing-lg)' }}>
           <button className="btn-primary" style={{ width: '100%' }}>+ Compose New Alert</button>
        </div>
      </div>

      {/* Main Panel: Alert Composer */}
      <div className={styles.composer}>
        <div style={{ padding: 'var(--spacing-xl)' }}>
           <div className="page-header" style={{ marginBottom: 'var(--spacing-xl)' }}>
              <div>
                 <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Alert Composer</h1>
                 <p style={{ color: 'var(--color-text-secondary)' }}>Draft climate intelligence messages for cross-channel delivery.</p>
              </div>
              <div className="flex gap-md">
                 <button className="btn-outline" onClick={saveDraft} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Save size={16} /> Save as Draft</button>
                 <button
                    className="btn-primary"
                    onClick={sendAlert}
                    disabled={sendState === 'sending'}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: sendState === 'sending' ? 0.7 : 1 }}
                 >
                    {sendState === 'sending' ? (
                       <><Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Sending...</>
                    ) : (
                       <><Send size={16} /> Send Alert</>
                    )}
                 </button>
              </div>
           </div>

           <div className="flex gap-md" style={{ marginBottom: 'var(--spacing-xl)', borderBottom: '1px solid var(--color-border)' }}>
              {composeTabs.map(({ label, icon: Icon }) => (
                 <button
                    key={label}
                    onClick={() => setActiveTab(label)}
                    className="flex items-center gap-sm"
                    style={{
                       padding: 'var(--spacing-sm) var(--spacing-md)',
                       fontWeight: activeTab === label ? 600 : 400,
                       color: activeTab === label ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                       borderBottom: activeTab === label ? '2px solid var(--color-primary)' : '2px solid transparent',
                    }}
                 >
                    <Icon size={16} /> {label}
                 </button>
              ))}
           </div>

           {activeTab === 'Templates' && (
             <div className="grid grid-cols-2 gap-lg">
                {messageTemplates.map((template) => (
                   <div key={template.id} className="card">
                      <div className="flex justify-between items-start" style={{ marginBottom: '0.5rem' }}>
                         <h3 style={{ fontSize: '1rem', margin: 0 }}>{template.name}</h3>
                         <span className="badge" style={{ backgroundColor: '#F3F4F6', color: 'var(--color-text-secondary)' }}>{template.audience}</span>
                      </div>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: 'var(--spacing-md)' }}>
                         {template.message}
                      </p>
                      <div className="flex justify-between items-center">
                         <div className="flex gap-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                            {template.channels.includes('sms') && <Smartphone size={14} />}
                            {template.channels.includes('dashboard') && <MonitorSmartphone size={14} />}
                         </div>
                         <button className="btn-outline" onClick={() => loadTemplate(template)} style={{ fontSize: '0.8125rem', padding: '0.375rem 0.875rem' }}>
                            Use Template
                         </button>
                      </div>
                   </div>
                ))}
             </div>
           )}

           {activeTab === 'Fallback Rules' && (
             <div className="flex-col gap-md">
                <div className="flex items-start gap-sm" style={{ backgroundColor: '#F0F9FF', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--spacing-sm)' }}>
                   <ArrowRightLeft size={16} color="#0284C7" style={{ marginTop: '2px', flexShrink: 0 }} />
                   <p style={{ fontSize: '0.8125rem', color: '#0369A1' }}>
                      Fallback rules keep critical alerts from going unnoticed when the primary channel or recipient doesn't respond in time.
                   </p>
                </div>
                {rules.map((rule) => (
                   <div key={rule.id} className="card flex justify-between items-center" style={{ gap: 'var(--spacing-lg)' }}>
                      <div className="flex gap-md">
                         <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--color-text-secondary)' }}>
                            <Clock size={16} />
                         </div>
                         <div>
                            <h4 style={{ fontSize: '0.9375rem', marginBottom: '0.25rem' }}>{rule.title}</h4>
                            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{rule.description}</p>
                         </div>
                      </div>
                      <button
                         onClick={() => toggleRule(rule.id)}
                         aria-label={rule.enabled ? 'Disable rule' : 'Enable rule'}
                         style={{
                            flexShrink: 0,
                            width: '44px',
                            height: '24px',
                            borderRadius: 'var(--radius-pill)',
                            backgroundColor: rule.enabled ? 'var(--color-risk-low)' : '#D1D5DB',
                            position: 'relative',
                            transition: 'background-color var(--transition-fast)',
                         }}
                      >
                         <span
                            style={{
                               position: 'absolute',
                               top: '3px',
                               left: rule.enabled ? '23px' : '3px',
                               width: '18px',
                               height: '18px',
                               borderRadius: '50%',
                               backgroundColor: 'white',
                               transition: 'left var(--transition-fast)',
                               boxShadow: 'var(--shadow-sm)',
                            }}
                         />
                      </button>
                   </div>
                ))}
             </div>
           )}

           {activeTab === 'Compose Message' && (
           <div className="split-2-1">
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
                    {templateLoaded && (
                       <div className="flex items-center gap-sm" style={{ marginBottom: 'var(--spacing-md)', padding: 'var(--spacing-sm) var(--spacing-md)', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', color: '#166534' }}>
                          <CheckCircle2 size={14} /> Loaded "{templateLoaded}" template
                       </div>
                    )}
                    <div className="grid grid-cols-2 gap-md">
                       <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>ENGLISH (DEFAULT)</label>
                          <textarea
                             rows={6}
                             style={{ width: '100%', padding: 'var(--spacing-sm)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.875rem', resize: 'vertical' }}
                             value={messageBody}
                             onChange={(e) => setMessageBody(e.target.value)}
                          />
                          <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: '0.25rem' }}>{messageBody.length} / 320 characters</div>
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
                          {messageBody.length > 90 ? `${messageBody.slice(0, 90)}...` : messageBody}
                       </div>
                    </div>
                 </div>
              </div>
           </div>
           )}
        </div>
      </div>
    </div>
  );
}
