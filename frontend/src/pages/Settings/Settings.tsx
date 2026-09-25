import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Users, Smartphone, Activity, List, Brain, Search, Plus, Send, CheckCircle2, AlertTriangle, Settings as SettingsIcon, Loader2 } from 'lucide-react';
import QueryState from '../../components/QueryState';
import * as adminService from '../../services/adminService';
import * as authService from '../../services/authService';
import * as predictionsService from '../../services/predictionsService';
import * as dashboardService from '../../services/dashboardService';
import { formatDateTime } from '../../lib/format';

const tabs = [
  { label: 'Users', icon: Users },
  { label: 'SMS Gateway', icon: Smartphone },
  { label: 'Thresholds', icon: Activity },
  { label: 'Model', icon: Brain },
  { label: 'Audit Log', icon: List },
];

const ROLES = [
  { value: 'ministry', label: 'Ministry' },
  { value: 'district_officer', label: 'District Officer' },
  { value: 'community_worker', label: 'Community Worker' },
  { value: 'field_worker', label: 'Field Worker' },
  { value: 'health_official', label: 'Health Official' },
  { value: 'admin', label: 'Admin' },
];

const cell = { padding: 'var(--spacing-md) var(--spacing-lg)' } as const;
const head = { ...cell, fontWeight: 600 } as const;
const errText = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong.');

export default function Settings() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('Users');
  const [query, setQuery] = useState('');

  // ── Users ────────────────────────────────────────────────────────────────
  const users = useQuery({ queryKey: ['admin-users'], queryFn: adminService.listUsers, enabled: activeTab === 'Users' });
  const { data: districts } = useQuery({ queryKey: ['districts-list'], queryFn: () => predictionsService.listAllDistricts(), staleTime: 300000 });
  const toggleActive = useMutation({
    mutationFn: (u: adminService.AdminUser) => adminService.setUserActive(u.id, !u.is_active),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'district_officer', district: '', phone: '' });
  const [formMsg, setFormMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const addUser = useMutation({
    mutationFn: () => authService.register({ ...form, district: form.district || undefined, phone: form.phone || undefined }),
    onSuccess: () => {
      setFormMsg({ ok: true, text: 'Account created.' });
      setForm({ name: '', email: '', password: '', role: 'district_officer', district: '', phone: '' });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (e) => setFormMsg({ ok: false, text: errText(e) }),
  });
  const submitUser = (e: FormEvent) => {
    e.preventDefault();
    setFormMsg(null);
    addUser.mutate();
  };
  const visibleUsers = (users.data ?? []).filter((u) => {
    const q = query.trim().toLowerCase();
    return !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.district ?? '').toLowerCase().includes(q);
  });

  // ── SMS ──────────────────────────────────────────────────────────────────
  const sms = useQuery({ queryKey: ['sms-status'], queryFn: adminService.getSmsStatus, enabled: activeTab === 'SMS Gateway' });
  const smsLog = useQuery({ queryKey: ['sms-log'], queryFn: () => adminService.getSmsLog(20), enabled: activeTab === 'SMS Gateway' });
  const [testPhone, setTestPhone] = useState('');
  const [testMsg, setTestMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const testSms = useMutation({
    mutationFn: () => adminService.sendTestSms(testPhone),
    onSuccess: (r) => {
      setTestMsg({ ok: r.status === 'delivered', text: r.message });
      queryClient.invalidateQueries({ queryKey: ['sms-status'] });
      queryClient.invalidateQueries({ queryKey: ['sms-log'] });
    },
    onError: (e) => setTestMsg({ ok: false, text: errText(e) }),
  });

  // ── Thresholds / model ───────────────────────────────────────────────────
  const thresholds = useQuery({ queryKey: ['thresholds'], queryFn: adminService.getThresholds, enabled: activeTab === 'Thresholds' });
  const metrics = useQuery({ queryKey: ['model-metrics'], queryFn: adminService.getModelMetrics, enabled: activeTab === 'Model', retry: false });

  // ── Audit log ────────────────────────────────────────────────────────────
  const audit = useQuery({ queryKey: ['audit-log'], queryFn: () => dashboardService.getActivityLog(50), enabled: activeTab === 'Audit Log' });

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h2 style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><SettingsIcon size={14} /> System Administration / {activeTab}</h2>
        <h1 style={{ fontSize: '2rem', margin: '0.25rem 0' }}>Settings &amp; Admin</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>Manage accounts, the SMS gateway, and view the risk model's configuration and activity.</p>
      </div>

      <div style={{ display: 'flex', overflowX: 'auto', borderBottom: '1px solid var(--color-border)', marginBottom: 'var(--spacing-xl)' }}>
        {tabs.map(({ label, icon: Icon }) => (
          <button
            key={label}
            onClick={() => setActiveTab(label)}
            style={{
              padding: 'var(--spacing-md) var(--spacing-xl)', display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0, whiteSpace: 'nowrap',
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
          <QueryState isLoading={sms.isLoading} isError={sms.isError} error={sms.error} minHeight={120}>
            {sms.data && (
              <div className="card">
                <div className="flex justify-between items-center" style={{ marginBottom: 'var(--spacing-lg)', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
                  <div className="flex items-center gap-sm">
                    <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: sms.data.configured ? 'var(--color-risk-low)' : 'var(--color-risk-critical)' }} />
                    <h3 style={{ margin: 0, fontSize: '1rem' }}>{sms.data.provider} — {sms.data.configured ? 'Connected' : 'Not configured'}</h3>
                  </div>
                  {sms.data.sandbox && <span className="badge badge-low">Sandbox Mode</span>}
                </div>
                {!sms.data.configured && (
                  <p style={{ fontSize: '0.8125rem', color: '#92400E', backgroundColor: '#FFF8E1', padding: 'var(--spacing-sm) var(--spacing-md)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--spacing-lg)' }}>
                    Set AFRICASTALKING_API_KEY (and AFRICASTALKING_USERNAME) in the backend .env to send real SMS. Until then messages are logged as skipped.
                  </p>
                )}
                <div className="grid grid-cols-3 gap-lg" style={{ marginBottom: 'var(--spacing-lg)' }}>
                  <div><div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Sender ID</div><div style={{ fontWeight: 600 }}>{sms.data.sender_id}</div></div>
                  <div><div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>API Key</div><div style={{ fontWeight: 600 }}>{sms.data.api_key_hint ?? 'Not set'}</div></div>
                  <div><div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Delivery Success (7d)</div><div style={{ fontWeight: 600 }}>{sms.data.delivery_rate_7d != null ? `${sms.data.delivery_rate_7d}%` : 'No messages yet'}</div></div>
                  <div><div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Delivered / Failed (7d)</div><div style={{ fontWeight: 600 }}>{sms.data.delivered_7d} / {sms.data.failed_7d}</div></div>
                  <div><div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Active subscribers</div><div style={{ fontWeight: 600 }}>{sms.data.subscribers}</div></div>
                </div>
                <div className="flex gap-md" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
                  <input
                    type="tel"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="Phone for test SMS (078…)"
                    style={{ padding: 'var(--spacing-sm) var(--spacing-md)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}
                  />
                  <button className="btn-primary" disabled={!testPhone.trim() || testSms.isPending} onClick={() => { setTestMsg(null); testSms.mutate(); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {testSms.isPending ? <Loader2 size={16} className="spin" /> : <Send size={16} />} Send Test SMS
                  </button>
                  {testMsg && (
                    <span className="flex items-center gap-sm" style={{ fontSize: '0.875rem', color: testMsg.ok ? 'var(--color-risk-low)' : 'var(--color-risk-critical)' }}>
                      {testMsg.ok ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />} {testMsg.text}
                    </span>
                  )}
                </div>
              </div>
            )}
          </QueryState>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <h3 style={{ fontSize: '1rem', padding: 'var(--spacing-lg)', margin: 0, borderBottom: '1px solid var(--color-border)' }}>Recent Messages</h3>
            <QueryState isLoading={smsLog.isLoading} isError={smsLog.isError} error={smsLog.error} minHeight={80}>
              {(smsLog.data ?? []).length === 0 ? (
                <p style={{ padding: 'var(--spacing-lg)', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>No SMS have been sent yet.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid var(--color-border)', fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                      <th style={head}>Phone</th><th style={head}>District</th><th style={head}>Status</th><th style={head}>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(smsLog.data ?? []).map((row) => (
                      <tr key={row.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ ...cell, fontSize: '0.875rem' }}>{row.phone}</td>
                        <td style={{ ...cell, fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{row.district ?? '—'}</td>
                        <td style={cell} title={row.detail ?? ''}><span className={`badge ${row.status === 'delivered' ? 'badge-low' : 'badge-critical'}`}>{row.status}</span></td>
                        <td style={{ ...cell, fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{formatDateTime(row.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </QueryState>
          </div>
        </div>
      )}

      {activeTab === 'Thresholds' && (
        <div className="card" style={{ marginBottom: 'var(--spacing-2xl)' }}>
          <div className="flex items-start gap-sm" style={{ marginBottom: 'var(--spacing-xl)', backgroundColor: '#F0F9FF', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)' }}>
            <AlertTriangle size={16} color="#0284C7" style={{ marginTop: '2px', flexShrink: 0 }} />
            <p style={{ fontSize: '0.8125rem', color: '#0369A1' }}>
              These are the cut-offs the predictor currently applies to classify a district as Moderate, High or Critical. They are read from the backend configuration (MODERATE_RISK_THRESHOLD, HIGH_RISK_THRESHOLD, CRITICAL_RISK_THRESHOLD in .env); change them there and restart the API.
            </p>
          </div>
          <QueryState isLoading={thresholds.isLoading} isError={thresholds.isError} error={thresholds.error} minHeight={120}>
            {thresholds.data && (
              ([
                { key: 'moderate' as const, label: 'Moderate Risk Threshold', color: 'var(--color-risk-moderate)' },
                { key: 'high' as const, label: 'High Risk Threshold', color: 'var(--color-risk-high)' },
                { key: 'critical' as const, label: 'Critical Risk Threshold', color: 'var(--color-risk-critical)' },
              ]).map((row) => (
                <div key={row.key} style={{ marginBottom: 'var(--spacing-xl)' }}>
                  <div className="flex justify-between items-center" style={{ marginBottom: '0.5rem' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>{row.label}</label>
                    <span style={{ fontWeight: 700, color: row.color }}>{thresholds.data![row.key]}%</span>
                  </div>
                  <input type="range" min={0} max={100} value={thresholds.data![row.key]} readOnly disabled style={{ width: '100%', accentColor: row.color }} />
                </div>
              ))
            )}
          </QueryState>
        </div>
      )}

      {activeTab === 'Model' && (
        <div className="card" style={{ marginBottom: 'var(--spacing-2xl)' }}>
          <QueryState isLoading={metrics.isLoading} isError={metrics.isError} error={metrics.error} minHeight={120}>
            {metrics.data && (
              <>
                <h3 style={{ fontSize: '1rem', marginBottom: 'var(--spacing-md)' }}>Deployed model {metrics.data.deployed_version}</h3>
                <div className="grid grid-cols-3 gap-lg" style={{ marginBottom: 'var(--spacing-lg)' }}>
                  {[
                    { label: 'Accuracy', value: `${(metrics.data.accuracy * 100).toFixed(1)}%` },
                    { label: 'Precision', value: `${(metrics.data.precision * 100).toFixed(1)}%` },
                    { label: 'Recall', value: `${(metrics.data.recall * 100).toFixed(1)}%` },
                    { label: 'F1 score', value: `${(metrics.data.f1_score * 100).toFixed(1)}%` },
                    { label: 'Training rows', value: metrics.data.training_samples.toLocaleString() },
                    { label: 'Test rows', value: metrics.data.test_samples.toLocaleString() },
                  ].map((m) => (
                    <div key={m.label}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{m.label}</div>
                      <div style={{ fontWeight: 700, fontSize: '1.25rem' }}>{m.value}</div>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                  Evaluated {formatDateTime(metrics.data.evaluated_at)}. {metrics.data.note}
                </p>
              </>
            )}
          </QueryState>
        </div>
      )}

      {activeTab === 'Audit Log' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 'var(--spacing-2xl)' }}>
          <h3 style={{ fontSize: '1rem', padding: 'var(--spacing-lg)', margin: 0, borderBottom: '1px solid var(--color-border)' }}>System Activity</h3>
          <QueryState isLoading={audit.isLoading} isError={audit.isError} error={audit.error} minHeight={100}>
            {(audit.data ?? []).length === 0 ? (
              <p style={{ padding: 'var(--spacing-lg)', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>No activity recorded yet.</p>
            ) : (
              <ul style={{ listStyle: 'none' }}>
                {(audit.data ?? []).map((entry, i, arr) => (
                  <li key={entry.id} className="flex gap-md" style={{ padding: 'var(--spacing-lg)', borderBottom: i < arr.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '0.875rem' }}><span className="badge" style={{ backgroundColor: '#F3F4F6', marginRight: '0.5rem', textTransform: 'none' }}>{entry.event_type}</span>{entry.description}</p>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>{formatDateTime(entry.created_at)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </QueryState>
        </div>
      )}

      {activeTab === 'Users' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 'var(--spacing-2xl)' }}>
          <div className="flex justify-between items-center" style={{ padding: 'var(--spacing-lg)', borderBottom: '1px solid var(--color-border)', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 'var(--radius-sm)', padding: 'var(--spacing-sm) var(--spacing-md)', width: '100%', maxWidth: '300px' }}>
              <Search size={16} color="var(--color-text-secondary)" />
              <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, email or district..." style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', padding: '0 var(--spacing-sm)', fontSize: '0.875rem' }} />
            </div>
            <button className="btn-primary" onClick={() => setShowForm((v) => !v)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Plus size={16} /> Add User</button>
          </div>

          {showForm && (
            <form onSubmit={submitUser} style={{ padding: 'var(--spacing-lg)', borderBottom: '1px solid var(--color-border)', backgroundColor: '#F9FAFB' }}>
              <div className="grid grid-cols-3 gap-md" style={{ marginBottom: 'var(--spacing-md)' }}>
                <input required placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ padding: 'var(--spacing-sm)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }} />
                <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={{ padding: 'var(--spacing-sm)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }} />
                <input required type="password" minLength={8} placeholder="Password (min 8)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} style={{ padding: 'var(--spacing-sm)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }} />
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} style={{ padding: 'var(--spacing-sm)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', backgroundColor: 'white' }}>
                  {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <select value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} style={{ padding: 'var(--spacing-sm)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', backgroundColor: 'white' }}>
                  <option value="">No home district</option>
                  {(districts ?? []).map((d) => d.district).sort().map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                <input type="tel" placeholder="Phone (optional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={{ padding: 'var(--spacing-sm)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }} />
              </div>
              <div className="flex items-center gap-md">
                <button className="btn-primary" type="submit" disabled={addUser.isPending}>{addUser.isPending ? 'Creating…' : 'Create account'}</button>
                {formMsg && <span style={{ fontSize: '0.875rem', color: formMsg.ok ? 'var(--color-risk-low)' : 'var(--color-risk-critical)' }}>{formMsg.text}</span>}
              </div>
            </form>
          )}

          <QueryState isLoading={users.isLoading} isError={users.isError} error={users.error} minHeight={120}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: '640px', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid var(--color-border)', fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                    <th style={head}>User</th><th style={head}>Role</th><th style={head}>District</th><th style={head}>Status</th><th style={head}>Created</th><th style={{ ...head, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleUsers.map((u) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ ...cell, fontSize: '0.875rem' }}><div style={{ fontWeight: 500 }}>{u.name}</div><div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{u.email}</div></td>
                      <td style={cell}><span className="badge" style={{ backgroundColor: '#F3F4F6', fontWeight: 500, textTransform: 'none' }}>{ROLES.find((r) => r.value === u.role)?.label ?? u.role}</span></td>
                      <td style={{ ...cell, fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{u.district ?? '—'}</td>
                      <td style={{ ...cell, fontSize: '0.875rem' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: u.is_active ? 'var(--color-risk-low)' : 'var(--color-text-tertiary)' }} />
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ ...cell, fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{formatDateTime(u.created_at)}</td>
                      <td style={{ ...cell, textAlign: 'right' }}>
                        <button onClick={() => toggleActive.mutate(u)} disabled={toggleActive.isPending} style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>
                          {u.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {visibleUsers.length === 0 && (
                    <tr><td colSpan={6} style={{ padding: 'var(--spacing-2xl)', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>No users found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {toggleActive.isError && <p style={{ padding: 'var(--spacing-md) var(--spacing-lg)', color: 'var(--color-risk-critical)', fontSize: '0.875rem' }}>{errText(toggleActive.error)}</p>}
          </QueryState>
        </div>
      )}
    </div>
  );
}
