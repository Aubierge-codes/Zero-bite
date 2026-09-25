import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Thermometer, Droplets, CloudRain, MapPin, Smartphone, FileText, TrendingUp, Bell, Users, Sparkles, Waves, Sprout } from 'lucide-react';
import SectorForecastChart from '../../components/charts/SectorForecastChart';
import QueryState from '../../components/QueryState';
import * as predictionsService from '../../services/predictionsService';
import * as alertsService from '../../services/alertsService';
import * as fieldTeamsService from '../../services/fieldTeamsService';
import { useAuthStore } from '../../stores/authStore';
import { riskLevelClass, riskColorVar, timeAgo, formatDateTime, signedPts } from '../../lib/format';

const STORAGE_KEY = 'zerobite_district';

export default function DistrictDashboard() {
  const user = useAuthStore((s) => s.user);

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

  // Default: the signed-in user's own district, else the highest-risk district.
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

  const dash = useQuery({
    queryKey: ['district-dashboard', district],
    queryFn: () => predictionsService.getDistrictDashboard(district),
    enabled: !!district,
    refetchInterval: 10 * 60 * 1000,
  });

  const alerts = useQuery({
    queryKey: ['district-alerts', district],
    queryFn: () => alertsService.listAlerts({ district }),
    enabled: !!district,
  });

  const teams = useQuery({
    queryKey: ['field-teams'],
    queryFn: () => fieldTeamsService.listFieldTeams(),
  });

  const subscribers = useQuery({
    queryKey: ['subscriber-count', district],
    queryFn: () => alertsService.getSubscriberCount(district),
    enabled: !!district,
  });

  const d = dash.data;
  const districtTeams = (teams.data ?? []).filter((t) => t.district === district);
  const enc = encodeURIComponent(district);

  const drivers = d
    ? [
        { icon: <CloudRain size={16} />, label: 'Rainfall today', value: `${d.rainfall_mm} mm` },
        { icon: <Droplets size={16} />, label: 'Humidity', value: `${d.humidity_pct}%` },
        { icon: <Thermometer size={16} />, label: 'Temperature', value: `${d.temperature_c}°C` },
        { icon: <Sprout size={16} />, label: 'Soil moisture index', value: d.soil_moisture.toFixed(2) },
        { icon: <Waves size={16} />, label: 'Standing-water index', value: d.standing_water_index.toFixed(2) },
        { icon: <MapPin size={16} />, label: 'Flood-risk index', value: d.flood_risk_index.toFixed(2) },
      ]
    : [];

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div className="flex items-center gap-md" style={{ flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: 0 }}>{district || 'District'}</h1>
          {d && <span className="badge" style={{ backgroundColor: '#F3F4F6', color: 'var(--color-text-secondary)' }}>{d.province} Province</span>}
        </div>
        <div className="flex gap-md">
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
      </div>

      <QueryState isLoading={dash.isLoading || !district} isError={dash.isError} error={dash.error} minHeight={300}>
        {d && (
          <div className="split-2-1">
            <div className="flex-col gap-xl">
              <div className="card">
                <div className="flex justify-between" style={{ flexWrap: 'wrap', gap: 'var(--spacing-lg)' }}>
                  <div>
                    <div className="flex items-center gap-sm" style={{ marginBottom: '0.5rem' }}>
                      <span className={`badge ${riskLevelClass(d.risk_level)}`}>{d.risk_level} risk</span>
                      <span style={{ fontSize: '0.875rem', color: 'var(--color-text-tertiary)' }}>Weather data refreshed {formatDateTime(d.last_updated)}</span>
                    </div>
                    <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{d.district} District</h2>
                    <p style={{ color: 'var(--color-text-secondary)', maxWidth: '420px', lineHeight: 1.6 }}>
                      Malaria breeding risk is{' '}
                      <span style={{ color: d.risk_change_pts > 0 ? 'var(--color-risk-critical)' : 'var(--color-risk-low)', fontWeight: 600 }}>
                        {d.risk_change_pts === 0 ? 'unchanged' : `${signedPts(d.risk_change_pts)}`}
                      </span>{' '}
                      versus a week ago, with {d.rainfall_mm} mm of rain and {d.humidity_pct}% humidity today.
                    </p>
                  </div>
                  <div className="flex items-center gap-xl">
                    <div className="text-center">
                      <div style={{ fontSize: '3rem', fontWeight: 800, color: riskColorVar(d.risk_score), lineHeight: 1 }}>{d.risk_score}</div>
                      <div style={{ fontSize: '1rem', color: 'var(--color-text-tertiary)', fontWeight: 600 }}>/ 100</div>
                      <div className={`badge ${riskLevelClass(d.risk_level)}`} style={{ marginTop: '0.5rem' }}>Risk Score</div>
                    </div>
                    <div className="flex-col gap-sm">
                      <div className="flex items-center gap-sm">
                        <span style={{ color: 'var(--color-risk-moderate)', display: 'flex' }}><Thermometer size={16} /></span>
                        <div style={{ fontSize: '0.875rem' }}>Temp: {d.temperature_c}°C</div>
                      </div>
                      <div className="flex items-center gap-sm">
                        <span style={{ color: 'var(--color-risk-moderate)', display: 'flex' }}><Droplets size={16} /></span>
                        <div style={{ fontSize: '0.875rem' }}>Humidity: {d.humidity_pct}%</div>
                      </div>
                      <div className="flex items-center gap-sm">
                        <span style={{ color: 'var(--color-risk-critical)', display: 'flex' }}><MapPin size={16} /></span>
                        <div style={{ fontSize: '0.875rem' }}>High-risk days ahead (7d): {d.high_risk_days_ahead}</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-md" style={{ marginTop: 'var(--spacing-xl)' }}>
                  <Link to={`/alerts?district=${enc}`} className="btn-primary" style={{ flex: 1, backgroundColor: 'var(--color-risk-high)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}><Smartphone size={16} /> Dispatch District Alert</Link>
                  <Link to={`/reports?district=${enc}`} className="btn-outline" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}><FileText size={16} /> Generate Report</Link>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-lg" style={{ marginTop: 'var(--spacing-xl)' }}>
                <div className="card">
                  <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MapPin size={20} /> Environmental Risk Drivers</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-md)' }}>Live conditions the model uses for {d.district}</p>
                  <div className="grid grid-cols-2 gap-sm">
                    {drivers.map((x) => (
                      <div key={x.label} style={{ backgroundColor: '#F9FAFB', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: 'var(--spacing-sm)' }}>
                        <div className="flex items-center gap-sm" style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>{x.icon} {x.label}</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{x.value}</div>
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: 'var(--spacing-sm)' }}>Model confidence: {d.confidence}%</p>
                </div>
                <div className="card">
                  <div className="flex justify-between items-center" style={{ marginBottom: '0.5rem' }}>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><TrendingUp size={20} /> 30-Day Risk Outlook</h3>
                    <span className="badge" style={{ backgroundColor: '#F3F4F6' }}>{d.model_version.split('-')[0]}</span>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-md)' }}>Past 14 days (observed weather) and next 16 days (weather forecast)</p>
                  <SectorForecastChart data={d.forecast_30day} />
                  <div className="flex gap-md" style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
                    <span className="flex items-center gap-sm"><span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#1F2937' }} /> Observed</span>
                    <span className="flex items-center gap-sm"><span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#9CA3AF' }} /> Forecast</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-lg" style={{ marginTop: 'var(--spacing-xl)' }}>
                <div className="card">
                  <h3 style={{ margin: 0, marginBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Bell size={20} /> Recent Alerts</h3>
                  <QueryState isLoading={alerts.isLoading} isError={alerts.isError} error={alerts.error} minHeight={80}>
                    {(alerts.data ?? []).length === 0 ? (
                      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>No alerts for {d.district} in the last 30 days.</p>
                    ) : (
                      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                        {(alerts.data ?? []).slice(0, 4).map((a) => (
                          <li key={a.id} style={{ paddingBottom: 'var(--spacing-md)', borderBottom: '1px solid var(--color-border)' }}>
                            <div className="flex justify-between" style={{ marginBottom: '0.25rem' }}>
                              <span className={`badge ${riskLevelClass(a.risk_level)}`}>{a.risk_level}</span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>{timeAgo(a.created_at)} · {a.status}</span>
                            </div>
                            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{a.trigger_reason}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </QueryState>
                  <Link to="/alerts" className="btn-outline" style={{ display: 'block', textAlign: 'center', width: '100%', marginTop: 'var(--spacing-md)', border: 'none' }}>View All Alerts</Link>
                </div>
                <div className="card">
                  <h3 style={{ margin: 0, marginBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Users size={20} /> Field Capacity</h3>
                  <div className="grid grid-cols-2 gap-md" style={{ marginBottom: 'var(--spacing-lg)' }}>
                    <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Field teams</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{districtTeams.length}</div>
                    </div>
                    <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>SMS subscribers</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{subscribers.data?.count ?? '—'}</div>
                    </div>
                  </div>
                  {districtTeams.length === 0 ? (
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>No field teams are registered for {d.district} yet.</p>
                  ) : (
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                      {districtTeams.map((t) => (
                        <li key={t.id} className="flex justify-between" style={{ fontSize: '0.875rem' }}>
                          <span>{t.name} · {t.team_size} people</span>
                          <span className="badge" style={{ backgroundColor: '#F3F4F6' }}>{t.status}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="flex items-center gap-sm" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <span style={{ display: 'flex' }}><Sparkles size={24} /></span>
                <h3 style={{ margin: 0 }}>Climate Intelligence Advisor</h3>
              </div>
              <div style={{ flex: 1, backgroundColor: '#F9FAFB', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)' }}>
                <div style={{ backgroundColor: 'var(--color-primary)', color: 'white', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: 'var(--spacing-lg)' }}>
                  {d.district} is at <strong>{d.risk_level}</strong> risk ({d.risk_score}/100, {signedPts(d.risk_change_pts)} vs last week). Soil moisture index is {d.soil_moisture.toFixed(2)} and flood-risk index {d.flood_risk_index.toFixed(2)}.
                  {d.high_risk_days_ahead > 0
                    ? ` The forecast shows ${d.high_risk_days_ahead} high-risk day(s) in the next 7 days.`
                    : ' No high-risk days are forecast in the next 7 days.'}
                </div>
                <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', letterSpacing: '0.05em', marginBottom: 'var(--spacing-md)' }}>Recommended Actions</h4>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                  {d.recommended_actions.map((a) => (
                    <li key={a} style={{ fontSize: '0.875rem', padding: 'var(--spacing-sm)', backgroundColor: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}>› {a}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </QueryState>
    </div>
  );
}
