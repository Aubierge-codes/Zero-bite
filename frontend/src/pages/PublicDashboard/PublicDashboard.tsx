import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Search, MapPin, AlertTriangle, Shield, Droplets, Home, Hospital, Calendar, Thermometer, Info, Circle, Loader2 } from 'lucide-react';
import FloatingChatBubble from '../../components/FloatingChatBubble';
import * as predictionsService from '../../services/predictionsService';
import * as alertsService from '../../services/alertsService';
import type { PublicDistrictRisk } from '../../services/predictionsService';

interface FallbackDistrict {
  district: string;
  risk_score: number;
  risk_level: string;
  transmission_stage: string;
  confidence_score: number;
  weather: { temperature_c: number; humidity_pct: number };
  weather_note: string;
  summary: string;
  recommended_prevention: Array<{ action: string; priority: string; detail: string }>;
  updated_at: string;
}

const FALLBACK_DISTRICTS: Record<string, FallbackDistrict> = {
  'kigali - gasabo': {
    district: 'Kigali - Gasabo',
    risk_score: 68,
    risk_level: 'HIGH',
    transmission_stage: 'Acceleration',
    confidence_score: 94,
    weather: { temperature_c: 24, humidity_pct: 78 },
    weather_note: 'Heavy rainfall recorded in the last 48 hours. Stagnant water levels are increasing.',
    summary: 'Recent humidity spikes and local vegetation growth have accelerated breeding cycles.',
    recommended_prevention: [
      { action: 'Use Bed Nets', priority: 'Priority', detail: 'Ensure all family members sleep under insecticide-treated nets.' },
      { action: 'Clear Water', priority: 'High', detail: 'Empty containers and clear stagnant water around your dwelling.' },
      { action: 'Close Windows', priority: 'Medium', detail: 'Keep windows and doors closed or screened after 6:00 PM.' },
      { action: 'Seek Care', priority: 'Priority', detail: 'Visit your CHW immediately if you develop a sudden fever.' },
    ],
    updated_at: 'Today, 08:00 AM',
  },
  musanze: {
    district: 'Musanze',
    risk_score: 78,
    risk_level: 'HIGH',
    transmission_stage: 'Acceleration',
    confidence_score: 91,
    weather: { temperature_c: 19, humidity_pct: 82 },
    weather_note: 'Cooler highland temperatures combined with persistent mist are keeping humidity elevated.',
    summary: 'Elevated humidity near Volcanoes National Park is accelerating breeding conditions.',
    recommended_prevention: [
      { action: 'Use Bed Nets', priority: 'Priority', detail: 'Ensure all family members sleep under insecticide-treated nets.' },
      { action: 'Clear Water', priority: 'High', detail: 'Empty containers and clear stagnant water around your dwelling.' },
      { action: 'Close Windows', priority: 'Medium', detail: 'Keep windows and doors closed or screened after 6:00 PM.' },
      { action: 'Seek Care', priority: 'Priority', detail: 'Visit your CHW immediately if you develop a sudden fever.' },
    ],
    updated_at: 'Today, 07:30 AM',
  },
  rubavu: {
    district: 'Rubavu',
    risk_score: 64,
    risk_level: 'HIGH',
    transmission_stage: 'Onset',
    confidence_score: 89,
    weather: { temperature_c: 26, humidity_pct: 71 },
    weather_note: 'Lakeside humidity remains high after three consecutive days of rain.',
    summary: 'Heavy rains along the Lake Kivu shoreline have created new standing water sites.',
    recommended_prevention: [
      { action: 'Use Bed Nets', priority: 'Priority', detail: 'Ensure all family members sleep under insecticide-treated nets.' },
      { action: 'Clear Water', priority: 'High', detail: 'Empty containers and clear stagnant water around your dwelling.' },
      { action: 'Close Windows', priority: 'Medium', detail: 'Keep windows and doors closed or screened after 6:00 PM.' },
      { action: 'Seek Care', priority: 'Priority', detail: 'Visit your CHW immediately if you develop a sudden fever.' },
    ],
    updated_at: 'Today, 08:15 AM',
  },
  huye: {
    district: 'Huye',
    risk_score: 22,
    risk_level: 'LOW',
    transmission_stage: 'Decline',
    confidence_score: 92,
    weather: { temperature_c: 27, humidity_pct: 54 },
    weather_note: 'Dry conditions are reducing the number of active standing-water sites.',
    summary: 'Risk is continuing to decline as the dry season progresses across the Southern Province.',
    recommended_prevention: [
      { action: 'Use Bed Nets', priority: 'Priority', detail: 'Ensure all family members sleep under insecticide-treated nets.' },
      { action: 'Clear Water', priority: 'High', detail: 'Empty containers and clear stagnant water around your dwelling.' },
      { action: 'Close Windows', priority: 'Medium', detail: 'Keep windows and doors closed or screened after 6:00 PM.' },
      { action: 'Seek Care', priority: 'Priority', detail: 'Visit your CHW immediately if you develop a sudden fever.' },
    ],
    updated_at: 'Today, 06:45 AM',
  },
};

const POPULAR_DISTRICTS = ['kigali', 'musanze', 'rubavu', 'huye'];

function riskBand(score: number) {
  if (score >= 76) return { label: 'Critical', badgeClass: 'badge-critical', color: 'var(--color-risk-critical)', ring: '#FDE8E8' };
  if (score >= 51) return { label: 'High', badgeClass: 'badge-high', color: 'var(--color-risk-high)', ring: '#FEF0E6' };
  if (score >= 26) return { label: 'Elevated', badgeClass: 'badge-moderate', color: 'var(--color-risk-moderate)', ring: '#FFF8E1' };
  return { label: 'Low', badgeClass: 'badge-low', color: 'var(--color-risk-low)', ring: '#E8F5E9' };
}

function formatUpdatedAt(iso?: string, fallback?: string): string {
  if (fallback) return fallback;
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
  const [selectedKey, setSelectedKey] = useState('kigali - gasabo');
  const [query, setQuery] = useState('Kigali - Gasabo');
  const [notFound, setNotFound] = useState(false);
  const [searchParams] = useSearchParams();

  const [smsPhone, setSmsPhone] = useState('');
  const [smsSuccess, setSmsSuccess] = useState<string | null>(null);
  const [smsError, setSmsError] = useState<string | null>(null);

  const lookup = (raw: string) => {
    const key = raw.trim().toLowerCase();
    const allKeys = Object.keys(FALLBACK_DISTRICTS);
    const match = allKeys.find((k) => k === key || k.includes(key) || FALLBACK_DISTRICTS[k].district.toLowerCase().includes(key));
    if (match) {
      setSelectedKey(match);
      setQuery(FALLBACK_DISTRICTS[match].district);
      setNotFound(false);
    } else {
      setSelectedKey(key);
      setQuery(raw.trim());
      setNotFound(false);
    }
  };

  useEffect(() => {
    const fromLanding = searchParams.get('district');
    if (fromLanding) lookup(fromLanding);
  }, []);

  const { data: riskData, isLoading: riskLoading, error: riskError } = useQuery<PublicDistrictRisk | null>({
    queryKey: ['public-district', selectedKey],
    queryFn: async () => {
      try {
        return await predictionsService.getPublicDistrictRisk(selectedKey);
      } catch (e: any) {
        if (e?.status === 404) return null;
        throw e;
      }
    },
    retry: 1,
  });

  const subscribeMut = useMutation({
    mutationFn: (phone: string) => alertsService.subscribeSms({ phone_number: phone, district: riskData?.district ?? selectedKey }),
    onSuccess: (data) => {
      setSmsSuccess(`Subscribed ${data.phone || smsPhone} to ${data.district || selectedKey} alerts successfully.`);
      setSmsError(null);
      setSmsPhone('');
      setTimeout(() => setSmsSuccess(null), 5000);
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

  const fallback = FALLBACK_DISTRICTS[selectedKey];
  const districtLabel = riskData?.district || fallback?.district || selectedKey;
  const riskScore = riskData?.risk_score ?? fallback?.risk_score ?? 0;
  const summaryText = fallback?.summary || 'Forecast data is currently being processed for this district.';
  const stage = riskData?.transmission_stage || fallback?.transmission_stage || 'Stable';
  const confidence = riskData?.confidence_score ?? fallback?.confidence_score ?? 85;
  const updated = formatUpdatedAt(riskData?.updated_at, fallback?.updated_at);
  const temp = riskData?.weather?.temperature_c ?? fallback?.weather.temperature_c ?? 24;
  const humidity = riskData?.weather?.humidity_pct ?? fallback?.weather.humidity_pct ?? 70;
  const weatherNote = fallback?.weather_note || 'Local weather data is currently unavailable.';
  const preventions = riskData?.recommended_prevention?.length ? riskData.recommended_prevention : (fallback?.recommended_prevention || []);

  const band = riskBand(riskScore);

  return (
    <div className="container" style={{ padding: 'var(--spacing-2xl) 0' }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-2xl)' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: 'var(--spacing-sm)' }}>Check Your District's Climate Risk</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.125rem' }}>Real-time satellite insights for malaria prevention across Rwanda's 30 districts.</p>
        
        <div style={{ maxWidth: '600px', margin: 'var(--spacing-xl) auto' }}>
           <div style={{ display: 'flex', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-xs)', backgroundColor: 'var(--color-surface)', alignItems: 'center' }}>
              <span style={{ padding: 'var(--spacing-sm) var(--spacing-md)', color: 'var(--color-text-tertiary)' }}><Search size={20} /></span>
              <input
                 type="text"
                 placeholder="Kigali - Gasabo"
                 style={{ flex: 1, border: 'none', outline: 'none', fontSize: '1rem', backgroundColor: 'transparent' }}
                 value={query}
                 onChange={(e) => { setQuery(e.target.value); setNotFound(false); }}
                 onKeyDown={(e) => { if (e.key === 'Enter') lookup(query); }}
              />
           </div>
           {notFound && (
              <p style={{ color: 'var(--color-risk-critical)', fontSize: '0.8125rem', marginTop: 'var(--spacing-sm)' }}>
                 No match for "{query}" yet -- try one of the districts below.
              </p>
           )}
           <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-sm)', justifyContent: 'center', marginTop: 'var(--spacing-sm)', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Popular:</span>
              {POPULAR_DISTRICTS.map((name) => (
                <button key={name} className="badge" style={{ backgroundColor: '#F3F4F6', cursor: 'pointer', textTransform: 'capitalize' }} onClick={() => lookup(name)}>{name}</button>
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
                   ) : 'Active Forecast'}
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
                    <h3 style={{ fontSize: '1rem', marginBottom: 'var(--spacing-sm)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AlertTriangle size={16} /> AI Prediction Detail</h3>
                    <p style={{ fontSize: '1rem', lineHeight: 1.5, marginBottom: 'var(--spacing-md)' }}>
                      Risk is <span style={{ color: band.color, fontWeight: 600 }}>{band.label}</span> for the next 7 days. {summaryText}
                    </p>

                    <div className="grid grid-cols-2 gap-md">
                       <div style={{ padding: 'var(--spacing-md)', backgroundColor: '#F9FAFB', borderRadius: 'var(--radius-md)' }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Transmission Stage</div>
                          <div style={{ fontWeight: 600 }}>{riskLoading ? '—' : stage}</div>
                       </div>
                       <div style={{ padding: 'var(--spacing-md)', backgroundColor: '#F9FAFB', borderRadius: 'var(--radius-md)' }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Confidence Score</div>
                          <div style={{ fontWeight: 600 }}>{riskLoading ? '—' : `${confidence}% Accuracy`}</div>
                       </div>
                    </div>
                 </div>
              </div>
              {riskError && (
                <div style={{ marginTop: 'var(--spacing-md)', padding: 'var(--spacing-sm) var(--spacing-md)', backgroundColor: '#FDE8E8', borderRadius: 'var(--radius-sm)', color: '#991B1B', fontSize: '0.875rem' }}>
                  Could not load live forecast — showing the latest available data.
                </div>
              )}
           </div>
           
           <div>
              <div className="flex justify-between items-center" style={{ marginBottom: 'var(--spacing-lg)', flexWrap: 'wrap', gap: 'var(--spacing-sm)' }}>
                 <h2 style={{ fontSize: '1.5rem' }}>Recommended Prevention</h2>
                 <a href="#" style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>See All Tips &rarr;</a>
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
                      {riskLoading ? <Loader2 size={22} className="spin" /> : `${temp}°C`}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Temperature</div>
                 </div>
                 <div style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem', fontSize: '1.5rem', fontWeight: 600, color: '#3B82F6' }}>
                      <Droplets size={20} />
                      {riskLoading ? <Loader2 size={18} className="spin" style={{ color: '#3B82F6' }} /> : `${humidity}%`}
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
                 <li>
                    <div className="flex justify-between items-center" style={{ marginBottom: '0.25rem' }}>
                       <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Circle size={12} fill="var(--color-risk-low)" color="var(--color-risk-low)" /> Low</span>
                       <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>0-25</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Minimal breeding conditions observed.</div>
                 </li>
                 <li>
                    <div className="flex justify-between items-center" style={{ marginBottom: '0.25rem' }}>
                       <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Circle size={12} fill="var(--color-risk-moderate)" color="var(--color-risk-moderate)" /> Elevated</span>
                       <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>26-50</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Conditions favorable for mosquito activity.</div>
                 </li>
                 <li>
                    <div className="flex justify-between items-center" style={{ marginBottom: '0.25rem' }}>
                       <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Circle size={12} fill="var(--color-risk-high)" color="var(--color-risk-high)" /> High</span>
                       <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>51-75</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>High probability of malaria transmission.</div>
                 </li>
                 <li>
                    <div className="flex justify-between items-center" style={{ marginBottom: '0.25rem' }}>
                       <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Circle size={12} fill="var(--color-risk-critical)" color="var(--color-risk-critical)" /> Critical</span>
                       <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>76-100</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Immediate preventive action required.</div>
                 </li>
              </ul>
           </div>
           
           <div className="card" style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', marginBottom: '0.5rem' }}>Stay Protected</h3>
              <p style={{ fontSize: '0.875rem', color: '#D1D5DB', marginBottom: 'var(--spacing-md)' }}>Get weekly malaria risk alerts for your village via SMS. No smartphone required.</p>
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
