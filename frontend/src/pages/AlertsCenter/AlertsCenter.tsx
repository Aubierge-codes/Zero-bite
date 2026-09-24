import { useState, useMemo } from 'react';
import {
  Search, Filter, Save, Send, MonitorSmartphone, Smartphone, MessageSquare, Bot,
  AlertTriangle, Construction, Loader2, CheckCircle2,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import styles from './AlertsCenter.module.css';
import * as alertsService from '../../services/alertsService';
import type { AlertItem, AlertTemplate } from '../../services/alertsService';

const composeTabs = [
  { label: 'Compose Message', icon: MessageSquare },
  { label: 'Templates', icon: MonitorSmartphone },
  { label: 'Fallback Rules', icon: AlertTriangle },
];

const statusFilters = ['All', 'active', 'acknowledged', 'resolved'] as const;
type StatusFilter = (typeof statusFilters)[number];

type Channel = 'sms' | 'dashboard';

const demoAlerts: AlertItem[] = [
  {
    id: 'demo-1',
    risk_level: 'HIGH',
    region: 'Musanze District',
    site_name: 'Musanze Sector',
    trigger_reason: 'Malaria Risk Spike Detected',
    status: 'active',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
];

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function statusDisplay(s: string) {
  switch (s?.toLowerCase()) {
    case 'active':
      return 'Sent';
    case 'acknowledged':
      return 'Scheduled';
    case 'resolved':
      return 'Resolved';
    case 'failed':
      return 'Failed';
    default:
      return s || 'Unknown';
  }
}

function statusBadgeStyle(status: string) {
  const s = status?.toLowerCase();
  if (s === 'failed' || s === 'critical') {
    return { backgroundColor: '#FDE8E8', color: 'var(--color-risk-critical)' };
  }
  if (s === 'resolved' || s === 'acknowledged') {
    return { backgroundColor: '#E8F5E9', color: 'var(--color-risk-low)' };
  }
  return { backgroundColor: '#F3F4F6', color: 'var(--color-text-secondary)' };
}

function riskBadgeStyle(level: string) {
  switch (level?.toUpperCase()) {
    case 'CRITICAL':
      return { backgroundColor: '#FDE8E8', color: 'var(--color-risk-critical)' };
    case 'HIGH':
      return { backgroundColor: '#FEF0E6', color: 'var(--color-risk-high)' };
    case 'MODERATE':
      return { backgroundColor: '#FFF8E1', color: 'var(--color-risk-moderate)' };
    case 'LOW':
    default:
      return { backgroundColor: '#E8F5E9', color: 'var(--color-risk-low)' };
  }
}

export default function AlertsCenter() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('Compose Message');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [message, setMessage] = useState(
    'Attention: High rainfall predicted for Musanze over next 3 days. Community Health Workers are advised to increase mosquito net distribution and clear stagnant water sites.'
  );
  const [riskLevel] = useState('HIGH');
  const [targetAudience, setTargetAudience] = useState('community_workers');
  const [geographicScope, setGeographicScope] = useState<string[]>(['Musanze']);
  const [useDashboard, setUseDashboard] = useState(true);
  const [useSms, setUseSms] = useState(false);
  const [composeError, setComposeError] = useState<string | null>(null);
  const [composeSuccess, setComposeSuccess] = useState<string | null>(null);

  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['alerts', { hours: 720 }],
    queryFn: () => alertsService.listAlerts({ hours: 720 }),
    select: (d) => (d && d.length > 0 ? d : demoAlerts),
  });

  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['alert-templates'],
    queryFn: () => alertsService.getAlertTemplates(),
  });

  const composeMut = useMutation({
    mutationFn: (payload: alertsService.ComposeAlertRequest) =>
      alertsService.composeAlert(payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      setComposeSuccess(res.message || 'Alert composed and sent successfully.');
      setComposeError(null);
      setTimeout(() => setComposeSuccess(null), 4000);
    },
    onError: (err: any) => {
      setComposeError(err?.detail || err?.message || 'Failed to send alert.');
      setComposeSuccess(null);
    },
  });

  const ackMut = useMutation({
    mutationFn: (id: string) => alertsService.acknowledgeAlert(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  });

  const resolveMut = useMutation({
    mutationFn: (id: string) => alertsService.resolveAlert(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  });

  const visibleAlerts = useMemo(() => {
    if (!alerts) return demoAlerts;
    return alerts.filter((a) => {
      const matchesStatus =
        statusFilter === 'All' ||
        (a.status || '').toLowerCase() === statusFilter.toLowerCase();
      const q = query.trim().toLowerCase();
      const matchesQuery =
        q === '' ||
        (a.trigger_reason || '').toLowerCase().includes(q) ||
        (a.region || '').toLowerCase().includes(q) ||
        (a.site_name || '').toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [alerts, statusFilter, query]);

  if (alerts && alerts.length > 0 && !selectedId) {
    setSelectedId(alerts[0].id);
  }

  const selected = visibleAlerts.find((a) => a.id === selectedId) || visibleAlerts[0];

  const handleSendAlert = () => {
    if (!message.trim()) {
      setComposeError('Please enter a message to send.');
      return;
    }
    const channels: Channel[] = [];
    if (useDashboard) channels.push('dashboard');
    if (useSms) channels.push('sms');
    if (channels.length === 0) {
      setComposeError('Please select at least one delivery channel.');
      return;
    }
    setComposeError(null);
    setComposeSuccess(null);
    composeMut.mutate({
      message: message.trim(),
      delivery_channels: channels,
      target_audience: targetAudience,
      geographic_scope: geographicScope,
      risk_level: riskLevel,
    });
  };

  const applyTemplate = (tpl: AlertTemplate) => {
    setMessage(tpl.message);
    if (tpl.audience) setTargetAudience(tpl.audience);
    setActiveTab('Compose Message');
  };

  return (
    <div className={styles.layout}>
      {/* Sidebar: Alerts Inbox */}
      <div className={styles.inbox}>
        <div style={{ padding: 'var(--spacing-lg)', borderBottom: '1px solid var(--color-border)' }}>
          <div className="flex justify-between items-center" style={{ marginBottom: 'var(--spacing-md)' }}>
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Alerts Inbox</h2>
            <button style={{ color: 'var(--color-text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}>
              <Filter size={18} />
            </button>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#F3F4F6',
              borderRadius: 'var(--radius-sm)',
              padding: 'var(--spacing-xs) var(--spacing-sm)',
            }}
          >
            <Search size={16} color="var(--color-text-secondary)" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search alerts..."
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                outline: 'none',
                padding: 'var(--spacing-xs) var(--spacing-sm)',
                fontSize: '0.875rem',
              }}
            />
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 'var(--spacing-sm)',
            padding: 'var(--spacing-md) var(--spacing-lg)',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          {statusFilters.map((status) => (
            <button
              key={status}
              className="badge"
              onClick={() => setStatusFilter(status)}
              style={
                statusFilter === status
                  ? {
                      backgroundColor: 'var(--color-text-primary)',
                      color: 'white',
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                    }
                  : {
                      backgroundColor: '#F3F4F6',
                      color: 'var(--color-text-secondary)',
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                    }
              }
            >
              {status === 'All' ? 'All' : statusDisplay(status)}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {alertsLoading && (
            <div
              style={{
                padding: 'var(--spacing-xl)',
                textAlign: 'center',
                color: 'var(--color-text-secondary)',
                fontSize: '0.875rem',
              }}
            >
              <Loader2 size={20} style={{ display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />{' '}
              Loading alerts...
            </div>
          )}
          {!alertsLoading &&
            visibleAlerts.map((alert) => (
              <div
                key={alert.id}
                onClick={() => setSelectedId(alert.id)}
                style={{
                  padding: 'var(--spacing-lg)',
                  borderBottom: '1px solid var(--color-border)',
                  backgroundColor:
                    (selected?.id || selectedId) === alert.id ? '#F9FAFB' : 'transparent',
                  borderLeft:
                    (selected?.id || selectedId) === alert.id
                      ? '3px solid var(--color-text-primary)'
                      : '3px solid transparent',
                  cursor: 'pointer',
                }}
              >
                <div className="flex justify-between" style={{ marginBottom: '0.25rem' }}>
                  <h4 style={{ fontSize: '0.875rem', margin: 0 }}>
                    {alert.trigger_reason || alert.region}
                  </h4>
                  <span className="badge" style={statusBadgeStyle(alert.status)}>
                    {statusDisplay(alert.status)}
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                  {alert.region}
                  {alert.site_name ? ` • ${alert.site_name}` : ''}
                </p>
                <div className="flex justify-between items-center">
                  <div className="flex gap-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                    <span
                      className="badge"
                      style={{
                        ...riskBadgeStyle(alert.risk_level),
                        padding: '2px 8px',
                        fontSize: '0.6875rem',
                        textTransform: 'uppercase',
                      }}
                    >
                      {alert.risk_level}
                    </span>
                    <Smartphone size={14} />
                    <MonitorSmartphone size={14} />
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                    {formatDate(alert.created_at)}
                  </span>
                </div>
              </div>
            ))}
          {!alertsLoading && visibleAlerts.length === 0 && (
            <p
              style={{
                padding: 'var(--spacing-xl)',
                textAlign: 'center',
                fontSize: '0.875rem',
                color: 'var(--color-text-secondary)',
              }}
            >
              No alerts match your filters.
            </p>
          )}
        </div>

        <div style={{ padding: 'var(--spacing-lg)' }}>
          <button
            className="btn-primary"
            style={{ width: '100%' }}
            onClick={() => setActiveTab('Compose Message')}
          >
            + Compose New Alert
          </button>
        </div>
      </div>

      {/* Main Panel: Alert Composer */}
      <div className={styles.composer}>
        <div style={{ padding: 'var(--spacing-xl)' }}>
          <div className="page-header" style={{ marginBottom: 'var(--spacing-xl)' }}>
            <div>
              <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Alert Composer</h1>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                Draft climate intelligence messages for cross-channel delivery.
              </p>
            </div>
            <div className="flex gap-md">
              <button
                className="btn-outline"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Save size={16} /> Save as Draft
              </button>
              <button
                className="btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                onClick={handleSendAlert}
                disabled={composeMut.isPending}
              >
                {composeMut.isPending ? (
                  <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} />
                ) : (
                  <Send size={16} />
                )}
                {composeMut.isPending ? 'Sending...' : 'Send Alert'}
              </button>
            </div>
          </div>

          {composeSuccess && (
            <div
              style={{
                padding: '0.625rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: '#E8F5E9',
                color: '#166534',
                fontSize: '0.8125rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <CheckCircle2 size={16} /> {composeSuccess}
            </div>
          )}

          {composeError && (
            <div
              style={{
                padding: '0.625rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: '#FDE8E8',
                color: '#B91C1C',
                fontSize: '0.8125rem',
                marginBottom: '1rem',
              }}
            >
              {composeError}
            </div>
          )}

          <div
            className="flex gap-md"
            style={{ marginBottom: 'var(--spacing-xl)', borderBottom: '1px solid var(--color-border)' }}
          >
            {composeTabs.map(({ label, icon: Icon }) => (
              <button
                key={label}
                onClick={() => setActiveTab(label)}
                className="flex items-center gap-sm"
                style={{
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  fontWeight: activeTab === label ? 600 : 400,
                  color: activeTab === label ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                  borderBottom:
                    activeTab === label
                      ? '2px solid var(--color-primary)'
                      : '2px solid transparent',
                  background: 'none',
                  borderTop: 'none',
                  borderLeft: 'none',
                  borderRight: 'none',
                  cursor: 'pointer',
                }}
              >
                <Icon size={16} /> {label}
              </button>
            ))}
          </div>

          {activeTab === 'Fallback Rules' ? (
            <div
              className="card"
              style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: '#F3F4F6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto var(--spacing-md)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                <Construction size={22} />
              </div>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>
                {activeTab} is coming soon
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                This panel isn&apos;t built yet. Switch back to Compose Message to draft an alert.
              </p>
            </div>
          ) : activeTab === 'Templates' ? (
            <div className="grid grid-cols-2 gap-md">
              {(templatesLoading ? [] : templates || []).map((tpl) => (
                <div
                  key={tpl.id}
                  className="card"
                  style={{ cursor: 'pointer' }}
                  onClick={() => applyTemplate(tpl)}
                >
                  <div className="flex justify-between items-center" style={{ marginBottom: '0.5rem' }}>
                    <h4 style={{ fontSize: '0.9375rem', margin: 0 }}>{tpl.name}</h4>
                    <span
                      className="badge"
                      style={{
                        backgroundColor: '#F3F4F6',
                        color: 'var(--color-text-secondary)',
                        textTransform: 'capitalize',
                      }}
                    >
                      {tpl.audience.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: '0.8125rem',
                      color: 'var(--color-text-secondary)',
                      lineHeight: 1.5,
                      marginBottom: '0.75rem',
                    }}
                  >
                    {tpl.message}
                  </p>
                  <div className="flex gap-sm">
                    {tpl.channel.map((c) => (
                      <span
                        key={c}
                        className="badge"
                        style={{ backgroundColor: '#F9FAFB', color: 'var(--color-text-secondary)' }}
                      >
                        {c.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              {!templatesLoading && (!templates || templates.length === 0) && (
                <div
                  className="card"
                  style={{
                    gridColumn: '1 / -1',
                    textAlign: 'center',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  No templates available.
                </div>
              )}
            </div>
          ) : (
            <div className="split-2-1">
              {/* Form Area */}
              <div className="flex-col gap-lg">
                <div className="card">
                  <h3
                    style={{
                      fontSize: '1rem',
                      marginBottom: 'var(--spacing-md)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <MonitorSmartphone size={16} /> Delivery Channels &amp; Targeting
                  </h3>
                  <div
                    className="grid grid-cols-2 gap-md"
                    style={{ marginBottom: 'var(--spacing-lg)' }}
                  >
                    <div
                      onClick={() => setUseDashboard((v) => !v)}
                      style={{
                        padding: 'var(--spacing-md)',
                        border: useDashboard
                          ? '2px solid var(--color-primary)'
                          : '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: useDashboard ? '#FAFAFA' : 'white',
                        cursor: 'pointer',
                      }}
                    >
                      <MonitorSmartphone
                        size={24}
                        style={{
                          marginBottom: '0.5rem',
                          color: useDashboard
                            ? 'var(--color-primary)'
                            : 'var(--color-text-secondary)',
                        }}
                      />
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Dashboard</div>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--color-text-secondary)',
                          marginTop: '0.25rem',
                        }}
                      >
                        Immediate notification in-app for logged-in users.
                      </div>
                    </div>
                    <div
                      onClick={() => setUseSms((v) => !v)}
                      style={{
                        padding: 'var(--spacing-md)',
                        border: useSms
                          ? '2px solid var(--color-primary)'
                          : '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: useSms ? '#FAFAFA' : 'white',
                        cursor: 'pointer',
                      }}
                    >
                      <Smartphone
                        size={24}
                        style={{
                          marginBottom: '0.5rem',
                          color: useSms ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                        }}
                      />
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>SMS Broadcast</div>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--color-text-secondary)',
                          marginTop: '0.25rem',
                        }}
                      >
                        Direct to mobile. Critical for offline areas.
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-md">
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          color: 'var(--color-text-secondary)',
                          marginBottom: '0.5rem',
                        }}
                      >
                        TARGET AUDIENCE
                      </label>
                      <select
                        value={targetAudience}
                        onChange={(e) => setTargetAudience(e.target.value)}
                        style={{
                          width: '100%',
                          padding: 'var(--spacing-sm)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--color-border)',
                          fontSize: '0.875rem',
                        }}
                      >
                        <option value="all">All users</option>
                        <option value="community_workers">Community Health Workers</option>
                        <option value="district_officers">District Officers</option>
                        <option value="ministry">Ministry Officials</option>
                        <option value="public">General Public</option>
                      </select>
                    </div>
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          color: 'var(--color-text-secondary)',
                          marginBottom: '0.5rem',
                        }}
                      >
                        GEOGRAPHIC SCOPE
                      </label>
                      <select
                        value={geographicScope[0] || ''}
                        onChange={(e) => setGeographicScope(e.target.value ? [e.target.value] : [])}
                        style={{
                          width: '100%',
                          padding: 'var(--spacing-sm)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--color-border)',
                          fontSize: '0.875rem',
                        }}
                      >
                        <option value="">Select district</option>
                        {[
                          'Kigali',
                          'Musanze',
                          'Kayonza',
                          'Rubavu',
                          'Bugesera',
                          'Gicumbi',
                          'Huye',
                          'Rusizi',
                        ].map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div
                    className="flex justify-between items-center"
                    style={{ marginBottom: 'var(--spacing-md)' }}
                  >
                    <h3
                      style={{
                        margin: 0,
                        fontSize: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <MessageSquare size={16} /> Message Content
                    </h3>
                    <button
                      className="btn-outline"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.75rem',
                      }}
                    >
                      <Bot size={14} /> AI Refine
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-md">
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          color: 'var(--color-text-secondary)',
                          marginBottom: '0.5rem',
                        }}
                      >
                        ENGLISH (DEFAULT)
                      </label>
                      <textarea
                        rows={6}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        style={{
                          width: '100%',
                          padding: 'var(--spacing-sm)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--color-border)',
                          fontSize: '0.875rem',
                          resize: 'vertical',
                        }}
                      />
                      <div
                        style={{
                          textAlign: 'right',
                          fontSize: '0.75rem',
                          color: 'var(--color-text-tertiary)',
                          marginTop: '0.25rem',
                        }}
                      >
                        {message.length} / 160 characters
                      </div>
                    </div>
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          color: 'var(--color-text-secondary)',
                          marginBottom: '0.5rem',
                        }}
                      >
                        KINYARWANDA (TRANSLATED)
                      </label>
                      <textarea
                        rows={6}
                        placeholder="Translation will appear here..."
                        readOnly
                        style={{
                          width: '100%',
                          padding: 'var(--spacing-sm)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--color-border)',
                          fontSize: '0.875rem',
                          resize: 'vertical',
                          backgroundColor: '#F9FAFB',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {selected && selected.status !== 'resolved' && (
                  <div className="card">
                    <h3
                      style={{
                        margin: 0,
                        fontSize: '0.9375rem',
                        marginBottom: '0.5rem',
                      }}
                    >
                      Lifecycle for selected alert
                    </h3>
                    <p
                      style={{
                        fontSize: '0.8125rem',
                        color: 'var(--color-text-secondary)',
                        marginBottom: '0.75rem',
                      }}
                    >
                      {selected.trigger_reason} — <strong>{selected.region}</strong>
                    </p>
                    <div className="flex gap-sm">
                      <button
                        className="btn-outline"
                        onClick={() => ackMut.mutate(selected.id)}
                        disabled={ackMut.isPending || resolveMut.isPending}
                      >
                        {ackMut.isPending
                          ? 'Acknowledging...'
                          : 'Acknowledge / Assign Team'}
                      </button>
                      <button
                        className="btn-primary"
                        onClick={() => resolveMut.mutate(selected.id)}
                        disabled={ackMut.isPending || resolveMut.isPending}
                      >
                        {resolveMut.isPending ? 'Resolving...' : 'Mark Resolved'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar Assistants Area */}
              <div className="flex-col gap-lg">
                <div
                  className="card"
                  style={{ backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' }}
                >
                  <h3
                    style={{
                      fontSize: '1rem',
                      marginBottom: 'var(--spacing-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <Bot size={16} color="#0284C7" /> AI Wording Assistant
                  </h3>
                  <p
                    style={{
                      fontSize: '0.75rem',
                      color: '#0369A1',
                      marginBottom: 'var(--spacing-md)',
                    }}
                  >
                    Based on current satellite data in Musanze, I recommend focusing on stagnant water prevention.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div
                      onClick={() =>
                        setMessage(
                          'Focus on clearing gutters and stagnant water pools near dwellings. Bed net inspections recommended in high-density sectors.'
                        )
                      }
                      style={{
                        padding: 'var(--spacing-sm)',
                        backgroundColor: 'white',
                        border: '1px solid #BAE6FD',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                      }}
                    >
                      &quot;Focus on clearing gutters and stagnant w...&quot;
                    </div>
                    <div
                      onClick={() =>
                        setMessage(
                          'Increase surveillance for fever symptoms. Visit CHW posts with any sudden fever, especially in children under 5.'
                        )
                      }
                      style={{
                        padding: 'var(--spacing-sm)',
                        backgroundColor: 'white',
                        border: '1px solid #BAE6FD',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                      }}
                    >
                      &quot;Increase surveillance for fever symptoms...&quot;
                    </div>
                  </div>
                  <button
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#0284C7',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      marginTop: 'var(--spacing-sm)',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    See more suggestions
                  </button>
                </div>

                <div className="card">
                  <h3
                    style={{
                      fontSize: '1rem',
                      marginBottom: 'var(--spacing-md)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <Smartphone size={16} /> SMS Preview
                  </h3>
                  <div
                    style={{
                      maxWidth: '260px',
                      margin: '0 auto',
                      backgroundColor: '#F3F4F6',
                      borderRadius: 'var(--radius-md)',
                      padding: 'var(--spacing-md)',
                    }}
                  >
                    <div
                      style={{
                        textAlign: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: 'var(--color-text-secondary)',
                        marginBottom: 'var(--spacing-sm)',
                      }}
                    >
                      Zero Bite
                    </div>
                    <div
                      style={{
                        backgroundColor: '#E5E7EB',
                        padding: 'var(--spacing-sm) var(--spacing-md)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.875rem',
                        lineHeight: 1.5,
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      {message.slice(0, 140)}
                      {message.length > 140 ? '...' : ''}
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
