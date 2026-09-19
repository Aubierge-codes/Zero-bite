import { Search, MapPin, AlertTriangle, Shield, Droplets, Home, Hospital, Calendar, Thermometer, Info, Circle } from 'lucide-react';
import FloatingChatBubble from '../../components/FloatingChatBubble';

export default function PublicDashboard() {
  return (
    <div className="container" style={{ padding: 'var(--spacing-2xl) 0' }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-2xl)' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: 'var(--spacing-sm)' }}>Check Your District's Climate Risk</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.125rem' }}>Real-time satellite insights for malaria prevention across Rwanda's 30 districts.</p>
        
        <div style={{ maxWidth: '600px', margin: 'var(--spacing-xl) auto' }}>
           <div style={{ display: 'flex', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-xs)', backgroundColor: 'var(--color-surface)', alignItems: 'center' }}>
              <span style={{ padding: 'var(--spacing-sm) var(--spacing-md)', color: 'var(--color-text-tertiary)' }}><Search size={20} /></span>
              <input type="text" placeholder="Kigali - Gasabo" style={{ flex: 1, border: 'none', outline: 'none', fontSize: '1rem', backgroundColor: 'transparent' }} defaultValue="Kigali - Gasabo" />
           </div>
           <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'center', marginTop: 'var(--spacing-sm)', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Popular:</span>
              <span className="badge" style={{ backgroundColor: '#F3F4F6' }}>Kigali</span>
              <span className="badge" style={{ backgroundColor: '#F3F4F6' }}>Musanze</span>
              <span className="badge" style={{ backgroundColor: '#F3F4F6' }}>Rubavu</span>
              <span className="badge" style={{ backgroundColor: '#F3F4F6' }}>Huye</span>
           </div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '2fr 1fr', gap: 'var(--spacing-xl)' }}>
        <div className="flex-col gap-xl">
           <div className="card">
              <div className="flex justify-between items-center" style={{ marginBottom: 'var(--spacing-lg)' }}>
                 <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MapPin size={20} /> Kigali - Gasabo</h2>
                 <span className="badge" style={{ backgroundColor: '#F3F4F6' }}>Active Forecast</span>
              </div>
              
              <div className="flex gap-xl items-center">
                 <div style={{ textAlign: 'center', padding: 'var(--spacing-lg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', border: '6px solid #FDE8E8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--spacing-sm)' }}>
                       <span style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-risk-critical)' }}>68</span>
                    </div>
                    <div className="badge badge-high" style={{ marginBottom: '0.25rem' }}>High Risk</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Updated: Today, 08:00 AM</div>
                 </div>
                 
                 <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: 'var(--spacing-sm)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AlertTriangle size={16} /> AI Prediction Detail</h3>
                    <p style={{ fontSize: '1rem', lineHeight: 1.5, marginBottom: 'var(--spacing-md)' }}>Risk is <span style={{ color: 'var(--color-risk-critical)', fontWeight: 600 }}>High</span> for the next 7 days. Recent humidity spikes and local vegetation growth have accelerated breeding cycles.</p>
                    
                    <div className="grid grid-cols-2 gap-md">
                       <div style={{ padding: 'var(--spacing-md)', backgroundColor: '#F9FAFB', borderRadius: 'var(--radius-md)' }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Transmission Stage</div>
                          <div style={{ fontWeight: 600 }}>Acceleration</div>
                       </div>
                       <div style={{ padding: 'var(--spacing-md)', backgroundColor: '#F9FAFB', borderRadius: 'var(--radius-md)' }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Confidence Score</div>
                          <div style={{ fontWeight: 600 }}>94% Accuracy</div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
           
           <div>
              <div className="flex justify-between items-center" style={{ marginBottom: 'var(--spacing-lg)' }}>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '2rem', fontWeight: 700 }}><Thermometer size={24} /> 24°C</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Temperature</div>
                 </div>
                 <div style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem', fontSize: '1.5rem', fontWeight: 600, color: '#3B82F6' }}><Droplets size={20} /> 78%</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Humidity</div>
                 </div>
              </div>
              <div style={{ padding: 'var(--spacing-sm)', backgroundColor: '#F0F4F8', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                 Heavy rainfall recorded in the last 48 hours. Stagnant water levels are increasing.
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
