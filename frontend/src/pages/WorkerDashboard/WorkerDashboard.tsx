import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPin, AlertTriangle, Users, Send, Bell, Loader2, CheckCircle2 } from 'lucide-react';
import QueryState from '../../components/QueryState';
import * as predictionsService from '../../services/predictionsService';
import * as riskZonesService from '../../services/riskZonesService';
import * as alertsService from '../../services/alertsService';
import { useAuthStore } from '../../stores/authStore';
import { riskLevelClass, riskColorVar, timeAgo, signedPts } from '../../lib/format';

const STORAGE_KEY = 'zerobite_district';

const roleLabel: Record<string, string> = {
  field_worker: 'Field Worker',
  community_worker: 'Community Health Worker',
  district_officer: 'District Officer',
  ministry: 'Ministry Official',
  admin: 'Administrator',
  health_official: 'Health Official',
};

export default function WorkerDashboard() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const { data: districts } = useQuery({
    queryKey: ['districts-list'],
    queryFn: () => predictionsService.listAllDistricts(),
    staleTime: 5 * 60 * 1000,
  });

  const [district, setDistrict] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });

  useEffect(() => {
    if (district || !districts?.length) return;
    setDistrict(user?.district || districts[0].district);
  }, [district, districts, user?.district]);

  const choose = (name: string) => {
    setDistrict(name);
    try {
      localStorage.setItem(STORAGE_KEY, name);
    } catch {
      /* ignore */
    }
  };

  // The worker's zone = the model cell of their district.
  const zone = useQuery({
    queryKey: ['worker-zone', district],
    queryFn: async () => {
      const zones = await riskZonesService.listRiskZones({ region: district, limit: 1 });
      if (!zones.length) throw new Error(`No risk zone found for ${district} yet. Try again in a moment.`);
      return predictionsService.getZonePrediction(zones[0].id);
    },
    enabled: !!district,
    refetchInterval: 10 * 60 * 1000,
  });

  const alerts = useQuery({
    queryKey: ['district-alerts', district],
    queryFn: () => alertsService.listAlerts({ district }),
    enabled: !!district,
  });

  const subscribers = useQuery({
    queryKey: ['subscriber-count', district],
    queryFn: () => alertsService.getSubscriberCount(district),
    enabled: !!district,
  });

  const z = zone.data;

  // Goals: server suggests tasks; completion is remembered on this device per day.
  const goalsKey = `zerobite_goals_${district}_${new Date().toISOString().slice(0, 10)}`;
  const [done, setDone] = useState<Record<string, boolean>>({});
  useEffect(() => {
    try {
      setDone(JSON.parse(localStorage.getItem(goalsKey) || '{}'));
    } catch {
      setDone({});
    }
  }, [goalsKey]);
  const toggleGoal = (task: string) => {
    setDone((prev) => {
      const next = { ...prev, [task]: !prev[task] };
      try {
        localStorage.setItem(goalsKey, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const templates = useMemo(
    () => ({
      Warning: `Zero Bite: ${z?.risk_level ?? ''} malaria risk in ${district} today (${z?.village_risk ?? ''}/100). Sleep under a treated net and clear standing water around your home.`,
      Prevention: `Zero Bite: Protect your family from malaria - sleep under a treated bed net, empty containers holding water, and keep windows screened after 6 PM.`,
      Visit: `Zero Bite: A community health worker will visit your area soon. Please stay available to receive malaria prevention advice.`,
    }),
    [z?.risk_level, z?.village_risk, district]
  );
  const [message, setMessage] = useState('');
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const send = useMutation({
    mutationFn: () => alertsService.broadcastCommunitySms({ message, district, zone_id: z?.zone_id }),
    onSuccess: (res) => {
      setFeedback({ ok: true, text: res.message });
      queryClient.invalidateQueries({ queryKey: ['subscriber-count'] });
    },
    onError: (e: unknown) => setFeedback({ ok: false, text: e instanceof Error ? e.message : 'SMS failed.' }),
  });

  const urgent = z && (z.risk_level === 'HIGH' || z.risk_level === 'CRITICAL');

  return (
    <div>
      <div className="flex justify-between items-center" style={{ marginBottom: 'var(--spacing-xl)', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
        <div className="flex items-center gap-md" style={{ flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: 0 }}>Worker Dashboard</h1>
          {district && (
            <span className="badge" style={{ backgroundColor: '#F3F4F6', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <MapPin size={12} /> {district} District
            </span>
          )}
        </div>
        <select
          value={district}
          onChange={(e) => choose(e.target.value)}
          aria-label="Select district"
          style={{ padding: 'var(--spacing-sm) var(--spacing-md)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', backgroundColor: 'white' }}
        >
          {(districts ?? []).slice().sort((a, b) => a.district.localeCompare(b.district)).map((x) => (
            <option key={x.district} value={x.district}>{x.district}</option>
          ))}
        </select>
      </div>

      <QueryState isLoading={zone.isLoading || !district} isError={zone.isError} error={zone.error} minHeight={300}>
        {z && (
          <div className="split-1-2-1">
            <div className="flex-col gap-xl">
              <div className="card text-center">
                <h3 style={{ fontSize: '0.875rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', letterSpacing: '0.05em', marginBottom: 'var(--spacing-md)' }}>DISTRICT RISK LEVEL</h3>
                <div style={{ width: '120px', height: '120px', borderRadius: '50%', border: `8px solid ${z.village_risk >= 51 ? "#FDE8E8" : "#E8F5E9"}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--spacing-md)' }}>
                  <span style={{ fontSize: '3rem', fontWeight: 800, color: riskColorVar(z.village_risk) }}>{z.village_risk}</span>
                </div>
                <div className={`badge ${riskLevelClass(z.risk_level)}`} style={{ marginBottom: 'var(--spacing-sm)' }}>{z.risk_level} risk</div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                  {signedPts(z.risk_change_pts)} vs last week. Today: {z.rainfall_mm} mm rain, {z.humidity_pct}% humidity, {z.temperature_c}°C.
                </p>
              </div>

              <div className="card">
                <h3 style={{ fontSize: '1rem', marginBottom: 'var(--spacing-md)' }}>Today's Goals</h3>
                {z.today_goals.map((goal, i) => (
                  <label key={goal.task} className="flex items-start gap-sm" style={{ marginBottom: i < z.today_goals.length - 1 ? 'var(--spacing-sm)' : 0, cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!done[goal.task]} onChange={() => toggleGoal(goal.task)} style={{ marginTop: '4px' }} />
                    <div style={{ fontWeight: 500, fontSize: '0.875rem', textDecoration: done[goal.task] ? 'line-through' : 'none', color: done[goal.task] ? 'var(--color-text-secondary)' : 'var(--color-text-primary)' }}>{goal.task}</div>
                  </label>
                ))}
              </div>

              <div className="card" style={{ backgroundColor: '#FFF8E1', borderColor: '#FDE68A' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: 'var(--spacing-sm)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AlertTriangle size={16} /> Weather Outlook</h3>
                <p style={{ fontSize: '0.875rem', color: '#92400E' }}>{z.weather_warning}</p>
              </div>
            </div>

            <div className="flex-col gap-xl">
              <div className="card" style={{ borderTop: `4px solid ${urgent ? 'var(--color-risk-critical)' : 'var(--color-risk-low)'}` }}>
                <div className="flex justify-between items-center" style={{ marginBottom: '0.5rem' }}>
                  <h2 style={{ fontSize: '1.25rem' }}>{urgent ? 'Immediate Community Warning' : 'Community Status'}</h2>
                  <span className={`badge ${riskLevelClass(z.risk_level)}`}>{z.risk_level}</span>
                </div>
                <p style={{ fontSize: '0.875rem', marginBottom: 'var(--spacing-md)' }}>
                  {urgent
                    ? `High-risk breeding conditions in ${district}. A public broadcast is recommended.`
                    : `No high-risk conditions in ${district} right now. Keep up routine prevention.`}
                </p>
                <div className="flex gap-md">
                  <a href="#broadcast" className="btn-primary" style={{ flex: 2, textAlign: 'center' }}>Compose Broadcast</a>
                  <Link to="/alerts" className="btn-outline" style={{ flex: 1, textAlign: 'center' }}>View Alerts</Link>
                </div>
              </div>

              <div className="card" id="broadcast">
                <div className="flex justify-between items-center" style={{ marginBottom: '0.5rem' }}>
                  <h2 style={{ fontSize: '1.25rem' }}>Broadcast Community SMS</h2>
                  <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Users size={16} /> {subscribers.data?.count ?? '—'} subscribers
                  </span>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-md)' }}>
                  Sends to every phone subscribed to {district} alerts through the public portal.
                </p>

                <div className="flex gap-sm" style={{ marginBottom: 'var(--spacing-md)' }}>
                  {(Object.keys(templates) as Array<keyof typeof templates>).map((k) => (
                    <button key={k} type="button" className="badge" onClick={() => setMessage(templates[k])} style={{ backgroundColor: '#F3F4F6', color: 'var(--color-text-primary)', cursor: 'pointer' }}>{k}</button>
                  ))}
                </div>

                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write a message or pick a template above..."
                  style={{ width: '100%', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', marginBottom: 'var(--spacing-sm)', fontSize: '0.875rem', resize: 'none' }}
                />
                <div style={{ textAlign: 'right', fontSize: '0.75rem', color: message.length > 160 ? 'var(--color-risk-critical)' : 'var(--color-text-tertiary)', marginBottom: 'var(--spacing-md)' }}>{message.length} / 160 characters</div>

                {feedback && (
                  <div className="flex items-center gap-sm" style={{ fontSize: '0.875rem', marginBottom: 'var(--spacing-md)', color: feedback.ok ? 'var(--color-risk-low)' : 'var(--color-risk-critical)' }}>
                    {feedback.ok ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />} {feedback.text}
                  </div>
                )}

                <div className="flex justify-end gap-md">
                  <button
                    className="btn-primary"
                    disabled={!message.trim() || send.isPending}
                    onClick={() => { setFeedback(null); send.mutate(); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    {send.isPending ? <Loader2 size={16} className="spin" /> : <Send size={16} />} Send Community SMS
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-col gap-xl">
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="flex justify-between items-center" style={{ padding: 'var(--spacing-md)', borderBottom: '1px solid var(--color-border)' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Bell size={16} /> Alerts Inbox</h3>
                  <span className="badge" style={{ backgroundColor: '#F3F4F6' }}>{(alerts.data ?? []).filter((a) => a.status === 'active').length} active</span>
                </div>
                <QueryState isLoading={alerts.isLoading} isError={alerts.isError} error={alerts.error} minHeight={80}>
                  {(alerts.data ?? []).length === 0 ? (
                    <p style={{ padding: 'var(--spacing-md)', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>No alerts for {district} in the last 30 days.</p>
                  ) : (
                    (alerts.data ?? []).slice(0, 4).map((a) => (
                      <div key={a.id} style={{ padding: 'var(--spacing-md)', borderBottom: '1px solid var(--color-border)' }}>
                        <div className="flex justify-between items-center" style={{ marginBottom: '0.25rem' }}>
                          <span className={`badge ${riskLevelClass(a.risk_level)}`}>{a.risk_level}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>{timeAgo(a.created_at)}</span>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{a.trigger_reason}</p>
                      </div>
                    ))
                  )}
                </QueryState>
                <div style={{ padding: 'var(--spacing-md)' }}>
                  <Link to="/alerts" className="btn-outline" style={{ display: 'block', textAlign: 'center', width: '100%', fontSize: '0.875rem', border: 'none', backgroundColor: '#F9FAFB' }}>View All Alert History</Link>
                </div>
              </div>

              <div className="card">
                <h3 style={{ fontSize: '1rem', marginBottom: 'var(--spacing-md)' }}>Signed in as</h3>
                <div className="flex items-center gap-sm">
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.8rem' }}>
                    {(user?.name || '?').slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{user?.name ?? 'Guest'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{user ? (roleLabel[user.role] ?? user.role) : 'Not signed in'}</div>
                  </div>
                </div>
                {user?.phone && <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-sm)' }}>{user.phone}</p>}
              </div>
            </div>
          </div>
        )}
      </QueryState>
    </div>
  );
}
