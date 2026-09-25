import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Search, MapPin, AlertTriangle, Shield, Droplets, Home, Hospital, Calendar, Thermometer, Info, Circle, Loader2 } from 'lucide-react';
import FloatingChatBubble from '../../components/FloatingChatBubble';
import * as predictionsService from '../../services/predictionsService';
import * as alertsService from '../../services/alertsService';
import * as adminService from '../../services/adminService';
import type { PublicDistrictRisk } from '../../services/predictionsService';

function riskBand(level: string) {
  switch ((level || '').toUpperCase()) {
    case 'CRITICAL':
      return { label: 'Critical', badgeClass: 'badge-critical', color: 'var(--color-risk-critical)', ring: '#FDE8E8' };
    case 'HIGH':
      return { label: 'High', badgeClass: 'badge-high', color: 'var(--color-risk-high)', ring: '#FEF0E6' };
    case 'MODERATE':
      return { label: 'Moderate', badgeClass: 'badge-moderate', color: 'var(--color-risk-moderate)', ring: '#FFF8E1' };
    default:
      return { label: 'Low', badgeClass: 'badge-low', color: 'var(--color-risk-low)', ring: '#E8F5E9' };
  }
}

function formatUpdatedAt(iso?: string): string {
  if (!iso) return 'Recently';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return 'Recently';
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffH = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffH < 1) return 'Just now';
    if (diffH < 24) return `${diffH}h ago`;
    return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch {
    return 'Recently';
  }
}

function iconForAction(action: string) {
  const l = action.toLowerCase();
  if (l.includes('net') || l.includes('bed')) return <Shield size={24} />;
  if (l.includes('water') || l.includes('clear')) return <Droplets size={24} />;
  if (l.includes('window') || l.includes('screen')) return <Home size={24} />;
  if (l.includes('care') || l.includes('chw') || l.includes('hospital')) return <Hospital size={24} />;
  return <Shield size={24} />;
}

function priorityBadgeClass(priority: string): string {
  const p = priority.toLowerCase();
  if (p.includes('critical') || p.includes('priority') || p.includes('high')) return 'badge-high';
  if (p.includes('medium') || p.includes('moderate')) return 'badge-moderate';
  return 'badge-low';
}

export default function PublicDashboard() {
  const [selected, setSelected] = useState('');
  const [query, setQuery] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [searchParams] = useSearchParams();

  const [smsPhone, setSmsPhone] = useState('');
  const [smsSuccess, setSmsSuccess] = useState<string | null>(null);
  const [smsError, setSmsError] = useState<string | null>(null);

  const { data: districts } = useQuery({
    queryKey: ['districts-list'],
    queryFn: () => predictionsService.listAllDistricts(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: thresholds } = useQuery({
    queryKey: ['thresholds'],
    queryFn: () => adminService.getThresholds(),
    staleTime: 60 * 60 * 1000,
  });

  const names = (districts ?? []).map((d) => d.district);
  const highestRisk = (districts ?? []).slice(0, 4).map((d) => d.district);

  const lookup = (raw: string) => {
    const key = raw.trim().toLowerCase();
    if (!key) return;
    const match = names.find((n) => n.toLowerCase() === key) ?? names.find((n) => n.toLowerCase().includes(key));
    if (match) {
      setSelected(match);
      setQuery(match);
      setNotFound(false);
    } else {
      setNotFound(true);
    }
  };

  // Initial district: ?district= from the landing page, else Gasabo (Kigali).
  useEffect(() => {
    if (selected || names.length === 0) return;
    const fromLanding = searchParams.get('district');
    const start = names.find((n) => n.toLowerCase() === (fromLanding || '').trim().toLowerCase())
      ?? names.find((n) => fromLanding && n.toLowerCase().includes(fromLanding.trim().toLowerCase()))
      ?? (names.includes('Gasabo') ? 'Gasabo' : names[0]);
    setSelected(start);
    setQuery(start);
  }, [names.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data: riskData, isLoading: riskLoading, error: riskError } = useQuery<PublicDistrictRisk>({
    queryKey: ['public-district', selected],
    queryFn: () => predictionsService.getPublicDistrictRisk(selected),
    enabled: !!selected,
    retry: 1,
  });

  const subscribeMut = useMutation({
    mutationFn: (phone: string) => alertsService.subscribeSms({ phone_number: phone, district: selected }),
    onSuccess: (data) => {
      setSmsSuccess(`Subscribed ${data.phone} to ${data.district} alerts.${data.confirmation_sms_sent ? ' A confirmation SMS was sent.' : ''}`);
      setSmsError(null);
      setSmsPhone('');
      setTimeout(() => setSmsSuccess(null), 6000);
    },
    onError: (e: any) => {
      setSmsError(e?.detail || 'Failed to subscribe. Please check the phone number and try again.');
      setSmsSuccess(null);
      setTimeout(() => setSmsError(null), 6000);
    },
  });

  const handleSubscribe = () => {
    const phone = smsPhone.trim();
    if (!phone) {
      setSmsError('Please enter a valid phone number.');
      return;
    }
    subscribeMut.mutate(phone);
  };

  const districtLabel = riskData?.district || selected || '—';
  const riskScore = riskData?.risk_score ?? 0;
  const summaryText = riskData?.summary ?? '';
  const stage = riskData?.transmission_stage ?? '—';
  const confidence = riskData?.confidence_score ?? 0;
  const updated = formatUpdatedAt(riskData?.updated_at);
  const temp = riskData?.weather?.temperature_c;
  const humidity = riskData?.weather?.humidity_pct;
  const weatherNote = riskData?.weather_note ?? '';
  const preventions = riskData?.recommended_prevention ?? [];

  const band = riskBand(riskData?.risk_level ?? 'LOW');

  return (
    <div className="container" style={{ padding: 'var(--spacing-2xl) 0' }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-2xl)' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: 'var(--spacing-sm)' }}>Check Your District's Climate Risk</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.125rem' }}>Live weather-driven malaria risk for Rwanda's 30 districts.</p>
        
        <div style={{ maxWidth: '600px', margin: 'var(--spacing-xl) auto' }}>
           <div style={{ display: 'flex', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-xs)', backgroundColor: 'var(--color-surface)', alignItems: 'center' }}>
              <span style={{ padding: 'var(--spacing-sm) var(--spacing-md)', color: 'var(--color-text-tertiary)' }}><Search size={20} /></span>
              <input
                 type="text"
                 placeholder="Search a district, e.g. Gasabo"
                 style={{ flex: 1, border: 'none', outline: 'none', fontSize: '1rem', backgroundColor: 'transparent' }}
                 value={query}
                 onChange={(e) => { setQuery(e.target.value); setNotFound(false); }}
                 onKeyDown={(e) => { if (e.key === 'Enter') lookup(query); }}
              />
           </div>
           {notFound && (
              <p style={{ color: 'var(--color-risk-critical)', fontSize: '0.8125rem', marginTop: 'var(--spacing-sm)' }}>
                 No district matches "{query}" — try one of the suggestions below.
              </p>
           )}
           <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-sm)', justifyContent: 'center', marginTop: 'var(--spacing-sm)', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Highest risk now:</span>
              {highestRisk.map((name) => (
                <button key={name} className="badge" style={{ backgroundColor: '#F3F4F6', cursor: 'pointer', }} onClick={() => lookup(name)}>{name}</button>
              ))}
           </div>
        </div>
      </div>

      <div className="split-2-1">
        <div className="flex-col gap-xl">
           <div className="card">
              <div className="flex justify-between items-center" style={{ marginBottom: 'var(--spacing-lg)' }}>
                 <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MapPin size={20} /> {districtLabel}</h2>
                 <span className="badge" style={{ backgroundColor: '#F3F4F6' }}>
                   {riskLoading ? (
                     <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}><Loader2 size={12} className="spin" /> Loading…</span>
                   ) : 'Live Forecast'}
                 </span>
              </div>

              <div className="flex gap-xl items-center" style={{ flexWrap: 'wrap' }}>
                 <div style={{ textAlign: 'center', padding: 'var(--spacing-lg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', border: `6px solid ${band.ring}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--spacing-sm)' }}>
                       {riskLoading ? (
                         <Loader2 size={28} className="spin" style={{ color: band.color }} />
                       ) : (
                         <span style={{ fontSize: '2rem', fontWeight: 700, color: band.color }}>{riskScore}</span>
                       )}
                    </div>
                    <div className={`badge ${band.badgeClass}`} style={{ marginBottom: '0.25rem' }}>{band.label} Risk</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Updated: {updated}</div>
                 </div>

                 <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: 'var(--spacing-sm)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AlertTriangle size={16} /> Risk Detail</h3>
                    <p style={{ fontSize: '1rem', lineHeight: 1.5, marginBottom: 'var(--spacing-md)' }}>
                      Risk is <span style={{ color: band.color, fontWeight: 600 }}>{band.label}</span> today. {summaryText}
                    </p>

                    <div className="grid grid-cols-2 gap-md">
                       <div style={{ padding: 'var(--spacing-md)', backgroundColor: '#F9FAFB', borderRadius: 'var(--radius-md)' }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Transmission Stage</div>
                          <div style={{ fontWeight: 600 }}>{riskLoading ? '—' : stage}</div>
                       </div>
                       <div style={{ padding: 'var(--spacing-md)', backgroundColor: '#F9FAFB', borderRadius: 'var(--radius-md)' }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Confidence Score</div>
                          <div style={{ fontWeight: 600 }}>{riskLoading ? '—' : `${confidence}% model certainty`}</div>
                       </div>
                    </div>
                 </div>
              </div>
              {riskError && (
                <div style={{ marginTop: 'var(--spacing-md)', padding: 'var(--spacing-sm) var(--spacing-md)', backgroundColor: '#FDE8E8', borderRadius: 'var(--radius-sm)', color: '#991B1B', fontSize: '0.875rem' }}>
                  {riskError instanceof Error ? riskError.message : 'Could not load the live forecast.'}
                </div>
              )}
           </div>
           
           <div>
              <div className="flex justify-between items-center" style={{ marginBottom: 'var(--spacing-lg)', flexWrap: 'wrap', gap: 'var(--spacing-sm)' }}>
                 <h2 style={{ fontSize: '1.5rem' }}>Recommended Prevention</h2>
                 <Link to="/help" style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Learn more &rarr;</Link>
              </div>
              
              <div className="grid grid-cols-2 gap-md">
                 {preventions.length === 0 && riskLoading && (
                   Array.from({ length: 4 }).map((_, i) => (
                     <div key={i} className="card" style={{ display: 'flex', gap: 'var(--spacing-md)', opacity: 0.6 }}>
                       <div><Loader2 size={24} className="spin" /></div>
                       <div style={{ flex: 1 }}>
                         <div style={{ height: '1rem', backgroundColor: '#E5E7EB', borderRadius: 4, marginBottom: '0.5rem', width: '50%' }} />
                         <div style={{ height: '0.75rem', backgroundColor: '#F3F4F6', borderRadius: 4, width: '90%' }} />
                       </div>
                     </div>
                   ))
                 )}
                 {preventions.map((p, idx) => (
                   <div key={`${p.action}-${idx}`} className="card" style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                      <div>{iconForAction(p.action)}</div>
                      <div>
                         <h3 style={{ margin: 0, fontSize: '1rem', marginBottom: '0.25rem' }}>
                           {p.action}
                           {p.priority && <span className={`badge ${priorityBadgeClass(p.priority)}`} style={{ marginLeft: '0.25rem' }}>{p.priority}</span>}
                         </h3>
                         <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{p.detail}</p>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
        
        <div className="flex-col gap-lg">
           <div className="card">
              <h3 style={{ margin: 0, fontSize: '1rem', marginBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Calendar size={16} /> Local Weather</h3>
              <div className="flex justify-between items-center" style={{ marginBottom: 'var(--spacing-md)' }}>
                 <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '2rem', fontWeight: 700 }}>
                      <Thermometer size={24} />
                      {riskLoading || temp === undefined ? <Loader2 size={22} className="spin" /> : `${temp}°C`}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Temperature</div>
                 </div>
                 <div style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem', fontSize: '1.5rem', fontWeight: 600, color: '#3B82F6' }}>
                      <Droplets size={20} />
                      {riskLoading || humidity === undefined ? <Loader2 size={18} className="spin" style={{ color: '#3B82F6' }} /> : `${humidity}%`}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Humidity</div>
                 </div>
              </div>
              <div style={{ padding: 'var(--spacing-sm)', backgroundColor: '#F0F4F8', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                 {weatherNote}
              </div>
           </div>
           
           <div className="card">
              <h3 style={{ margin: 0, fontSize: '1rem', marginBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Info size={16} /> Risk Band Guide</h3>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                 {[
                   { label: 'Low', color: 'var(--color-risk-low)', range: thresholds ? `0-${thresholds.moderate - 1}` : '', text: 'Minimal breeding conditions.' },
                   { label: 'Moderate', color: 'var(--color-risk-moderate)', range: thresholds ? `${thresholds.moderate}-${thresholds.high - 1}` : '', text: 'Conditions favourable for mosquito activity.' },
                   { label: 'High', color: 'var(--color-risk-high)', range: thresholds ? `${thresholds.high}-${thresholds.critical - 1}` : '', text: 'High probability of malaria transmission.' },
                   { label: 'Critical', color: 'var(--color-risk-critical)', range: thresholds ? `${thresholds.critical}-100` : '', text: 'Immediate preventive action required.' },
                 ].map((row) => (
                   <li key={row.label}>
                      <div className="flex justify-between items-center" style={{ marginBottom: '0.25rem' }}>
                         <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Circle size={12} fill={row.color} color={row.color} /> {row.label}</span>
                         <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>{row.range}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{row.text}</div>
                   </li>
                 ))}
              </ul>
           </div>
           
           <div className="card" style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', marginBottom: '0.5rem' }}>Stay Protected</h3>
              <p style={{ fontSize: '0.875rem', color: '#D1D5DB', marginBottom: 'var(--spacing-md)' }}>Get malaria risk alerts for {selected || 'your district'} via SMS when risk rises. No smartphone required.</p>
              {smsSuccess && (
                <div style={{ padding: 'var(--spacing-sm) var(--spacing-md)', backgroundColor: 'rgba(34,197,94,0.18)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', marginBottom: 'var(--spacing-sm)', color: '#BBF7D0', border: '1px solid rgba(34,197,94,0.35)' }}>
                  {smsSuccess}
                </div>
              )}
              {smsError && (
                <div style={{ padding: 'var(--spacing-sm) var(--spacing-md)', backgroundColor: 'rgba(239,68,68,0.18)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', marginBottom: 'var(--spacing-sm)', color: '#FECACA', border: '1px solid rgba(239,68,68,0.35)' }}>
                  {smsError}
                </div>
              )}
              <input
                type="text"
                placeholder="Enter phone number (e.g., 078...)"
                value={smsPhone}
                onChange={(e) => setSmsPhone(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSubscribe(); }}
                style={{ width: '100%', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-sm)', border: 'none', marginBottom: 'var(--spacing-sm)', color: '#111' }}
                disabled={subscribeMut.isPending}
              />
              <button
                onClick={handleSubscribe}
                disabled={subscribeMut.isPending}
                style={{ width: '100%', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-sm)', backgroundColor: 'white', color: 'var(--color-primary)', fontWeight: 600, border: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: subscribeMut.isPending ? 'not-allowed' : 'pointer', opacity: subscribeMut.isPending ? 0.85 : 1 }}
              >
                {subscribeMut.isPending ? (
                  <><Loader2 size={16} className="spin" /> Subscribing…</>
                ) : 'Subscribe Free'}
              </button>
           </div>
        </div>
      </div>
      <FloatingChatBubble />
    </div>
  );
}
