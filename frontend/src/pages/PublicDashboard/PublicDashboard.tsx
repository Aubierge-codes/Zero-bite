import { useState } from 'react';
import { Search, MapPin, AlertTriangle, Shield, Droplets, Home, Hospital, Calendar, Thermometer, Info, Circle } from 'lucide-react';
import FloatingChatBubble from '../../components/FloatingChatBubble';

interface DistrictSnapshot {
  label: string;
  risk: number;
  summary: string;
  stage: string;
  confidence: string;
  updated: string;
  temp: number;
  humidity: number;
  weatherNote: string;
}

const districtLookup: Record<string, DistrictSnapshot> = {
  'kigali - gasabo': {
    label: 'Kigali - Gasabo', risk: 68,
    summary: 'Recent humidity spikes and local vegetation growth have accelerated breeding cycles.',
    stage: 'Acceleration', confidence: '94% Accuracy', updated: 'Today, 08:00 AM',
    temp: 24, humidity: 78, weatherNote: 'Heavy rainfall recorded in the last 48 hours. Stagnant water levels are increasing.',
  },
  musanze: {
    label: 'Musanze', risk: 78,
    summary: 'Elevated humidity near Volcanoes National Park is accelerating breeding conditions.',
    stage: 'Acceleration', confidence: '91% Accuracy', updated: 'Today, 07:30 AM',
    temp: 19, humidity: 82, weatherNote: 'Cooler highland temperatures combined with persistent mist are keeping humidity elevated.',
  },
  rubavu: {
    label: 'Rubavu', risk: 64,
    summary: 'Heavy rains along the Lake Kivu shoreline have created new standing water sites.',
    stage: 'Onset', confidence: '89% Accuracy', updated: 'Today, 08:15 AM',
    temp: 26, humidity: 71, weatherNote: 'Lakeside humidity remains high after three consecutive days of rain.',
  },
  huye: {
    label: 'Huye', risk: 22,
    summary: 'Risk is continuing to decline as the dry season progresses across the Southern Province.',
    stage: 'Decline', confidence: '92% Accuracy', updated: 'Today, 06:45 AM',
    temp: 27, humidity: 54, weatherNote: 'Dry conditions are reducing the number of active standing-water sites.',
  },
};

function riskBand(score: number) {
  if (score >= 76) return { label: 'Critical', badgeClass: 'badge-critical', color: 'var(--color-risk-critical)', ring: '#FDE8E8' };
  if (score >= 51) return { label: 'High', badgeClass: 'badge-high', color: 'var(--color-risk-high)', ring: '#FEF0E6' };
  if (score >= 26) return { label: 'Elevated', badgeClass: 'badge-moderate', color: 'var(--color-risk-moderate)', ring: '#FFF8E1' };
  return { label: 'Low', badgeClass: 'badge-low', color: 'var(--color-risk-low)', ring: '#E8F5E9' };
}

export default function PublicDashboard() {
  const [selectedKey, setSelectedKey] = useState('kigali - gasabo');
  const [query, setQuery] = useState('Kigali - Gasabo');
  const [notFound, setNotFound] = useState(false);

  const district = districtLookup[selectedKey];
  const band = riskBand(district.risk);

  const lookup = (raw: string) => {
    const key = raw.trim().toLowerCase();
    const match = Object.keys(districtLookup).find((k) => k === key || k.includes(key) || districtLookup[k].label.toLowerCase().includes(key));
    if (match) {
      setSelectedKey(match);
      setQuery(districtLookup[match].label);
      setNotFound(false);
    } else {
      setNotFound(true);
    }
  };

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
              <button className="badge" style={{ backgroundColor: '#F3F4F6', cursor: 'pointer' }} onClick={() => lookup('kigali')}>Kigali</button>
              <button className="badge" style={{ backgroundColor: '#F3F4F6', cursor: 'pointer' }} onClick={() => lookup('musanze')}>Musanze</button>
              <button className="badge" style={{ backgroundColor: '#F3F4F6', cursor: 'pointer' }} onClick={() => lookup('rubavu')}>Rubavu</button>
              <button className="badge" style={{ backgroundColor: '#F3F4F6', cursor: 'pointer' }} onClick={() => lookup('huye')}>Huye</button>
           </div>
        </div>
      </div>

      <div className="split-2-1">
        <div className="flex-col gap-xl">
           <div className="card">
              <div className="flex justify-between items-center" style={{ marginBottom: 'var(--spacing-lg)' }}>
                 <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MapPin size={20} /> {district.label}</h2>
                 <span className="badge" style={{ backgroundColor: '#F3F4F6' }}>Active Forecast</span>
              </div>

              <div className="flex gap-xl items-center" style={{ flexWrap: 'wrap' }}>
                 <div style={{ textAlign: 'center', padding: 'var(--spacing-lg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', border: `6px solid ${band.ring}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--spacing-sm)' }}>
                       <span style={{ fontSize: '2rem', fontWeight: 700, color: band.color }}>{district.risk}</span>
                    </div>
                    <div className={`badge ${band.badgeClass}`} style={{ marginBottom: '0.25rem' }}>{band.label} Risk</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Updated: {district.updated}</div>
                 </div>

                 <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: 'var(--spacing-sm)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AlertTriangle size={16} /> AI Prediction Detail</h3>
                    <p style={{ fontSize: '1rem', lineHeight: 1.5, marginBottom: 'var(--spacing-md)' }}>Risk is <span style={{ color: band.color, fontWeight: 600 }}>{band.label}</span> for the next 7 days. {district.summary}</p>

                    <div className="grid grid-cols-2 gap-md">
                       <div style={{ padding: 'var(--spacing-md)', backgroundColor: '#F9FAFB', borderRadius: 'var(--radius-md)' }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Transmission Stage</div>
                          <div style={{ fontWeight: 600 }}>{district.stage}</div>
                       </div>
                       <div style={{ padding: 'var(--spacing-md)', backgroundColor: '#F9FAFB', borderRadius: 'var(--radius-md)' }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Confidence Score</div>
                          <div style={{ fontWeight: 600 }}>{district.confidence}</div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
           
           <div>
              <div className="flex justify-between items-center" style={{ marginBottom: 'var(--spacing-lg)', flexWrap: 'wrap', gap: 'var(--spacing-sm)' }}>
                 <h2 style={{ fontSize: '1.5rem' }}>Recommended Prevention</h2>
                 <a href="#" style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>See All Tips &rarr;</a>
              </div>
              
              <div className="grid grid-cols-2 gap-md">
                 <div className="card" style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                    <div><Shield size={24} /></div>
                    <div>
                       <h3 style={{ margin: 0, fontSize: '1rem', marginBottom: '0.25rem' }}>Use Bed Nets <span className="badge badge-low" style={{ marginLeft: '0.25rem' }}>Priority</span></h3>
                       <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Ensure all family members sleep under insecticide-treated nets.</p>
                    </div>
                 </div>
                 <div className="card" style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                    <div><Droplets size={24} /></div>
                    <div>
                       <h3 style={{ margin: 0, fontSize: '1rem', marginBottom: '0.25rem' }}>Clear Water</h3>
                       <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Empty containers and clear stagnant water around your dwelling.</p>
                    </div>
                 </div>
                 <div className="card" style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                    <div><Home size={24} /></div>
                    <div>
                       <h3 style={{ margin: 0, fontSize: '1rem', marginBottom: '0.25rem' }}>Close Windows</h3>
                       <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Keep windows and doors closed or screened after 6:00 PM.</p>
                    </div>
                 </div>
                 <div className="card" style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                    <div><Hospital size={24} /></div>
                    <div>
                       <h3 style={{ margin: 0, fontSize: '1rem', marginBottom: '0.25rem' }}>Seek Care</h3>
                       <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Visit your CHW immediately if you develop a sudden fever.</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
        
        <div className="flex-col gap-lg">
           <div className="card">
              <h3 style={{ margin: 0, fontSize: '1rem', marginBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Calendar size={16} /> Local Weather</h3>
              <div className="flex justify-between items-center" style={{ marginBottom: 'var(--spacing-md)' }}>
                 <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '2rem', fontWeight: 700 }}><Thermometer size={24} /> {district.temp}°C</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Temperature</div>
                 </div>
                 <div style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem', fontSize: '1.5rem', fontWeight: 600, color: '#3B82F6' }}><Droplets size={20} /> {district.humidity}%</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Humidity</div>
                 </div>
              </div>
              <div style={{ padding: 'var(--spacing-sm)', backgroundColor: '#F0F4F8', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                 {district.weatherNote}
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
              <input type="text" placeholder="Enter phone number (e.g., 078...)" style={{ width: '100%', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-sm)', border: 'none', marginBottom: 'var(--spacing-sm)' }} />
              <button style={{ width: '100%', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-sm)', backgroundColor: 'white', color: 'var(--color-primary)', fontWeight: 600, border: 'none' }}>Subscribe Free</button>
           </div>
        </div>
      </div>
      <FloatingChatBubble />
    </div>
  );
}
