import { useState, type FormEvent } from 'react';
import styles from './Landing.module.css';
import { useNavigate } from 'react-router-dom';
<<<<<<< HEAD
import { Satellite, Brain, Smartphone, CheckCircle2, Bot, ArrowUp, Landmark, Building2, Stethoscope, Globe, Shield, Droplets, Scissors, Clock, ArrowRight, Info, GraduationCap, RadioTower, Download, Loader2 } from 'lucide-react';
import RwandaHeroMap from '../../components/RwandaHeroMap';
import RoleCard from '../../components/RoleCard';
import Reveal from '../../components/Reveal';
import CountUp from '../../components/CountUp';
=======
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Satellite, Brain, Smartphone, CheckCircle2, Bot, ArrowUp, Landmark, Building2,
  Stethoscope, Globe, Shield, Droplets, Scissors, Clock, ArrowRight, Info,
  GraduationCap, RadioTower, Download, AlertTriangle, Loader2
} from 'lucide-react';
import RwandaHeroMap from '../../components/RwandaHeroMap';
import RoleCard from '../../components/RoleCard';
import * as predictionsService from '../../services/predictionsService';
import * as alertsService from '../../services/alertsService';
>>>>>>> origin/main

const assistantChecklist = [
  'Ask about specific district forecasts',
  'Get recommendations for community health risks',
  'Draft SMS alerts in Kinyarwanda or English',
  'Understand the data behind risk scores',
];

const preventionTips = [
  { icon: <Shield size={16} />, title: 'Mosquito Nets', description: 'Ensure all household members sleep under insecticide-treated nets.' },
  { icon: <Droplets size={16} />, title: 'Clear Water', description: 'Empty or cover all containers of standing water near homes.' },
  { icon: <Scissors size={16} />, title: 'Bush Clearing', description: 'Keep grass short and clear dense vegetation around dwellings.' },
  { icon: <Clock size={16} />, title: 'Peak Exposure', description: 'Avoid being outdoors during dusk and dawn peak biting hours.' },
];

const trustStats = [
  { value: 94, suffix: '%', label: 'Prediction Accuracy' },
  { value: 12, suffix: 'm', label: 'Data Latency' },
  { value: 30, suffix: '+', label: 'Districts Monitored' },
];

const partners = [
  { icon: <Satellite size={22} />, name: 'European Space Agency' },
  { icon: <Landmark size={22} />, name: 'Ministry of Health' },
  { icon: <GraduationCap size={22} />, name: 'University of Rwanda' },
  { icon: <RadioTower size={22} />, name: 'SMS Delivery Network' },
];

const roles = [
  {
    icon: <Landmark size={22} />,
    tag: 'MINISTRY',
    title: 'Ministry Officials',
    description: 'National level strategic overview and cross-district resource allocation.',
    path: '/login',
  },
  {
    icon: <Building2 size={22} />,
    tag: 'DISTRICT',
    title: 'District Health Officers',
    description: 'Deep-dive district analytics, sector mapping, and 14-day forecasts.',
    path: '/login',
  },
  {
    icon: <Stethoscope size={22} />,
    tag: 'CHW',
    title: 'CHWs & Village Leaders',
    description: 'Immediate action plans, SMS alert workflows, and local observation logs.',
    path: '/login',
  },
  {
    icon: <Globe size={22} />,
    tag: 'PUBLIC',
    title: 'General Public',
    description: 'Personal risk scores, prevention tips, and localized weather symptoms.',
    path: '/public',
  },
];

const FALLBACK_DISTRICTS = [
  'Bugesera', 'Gatsibo', 'Kayonza', 'Kirehe', 'Nyagatare', 'Rwamagana',
  'Huye', 'Gisagara', 'Kamonyi', 'Muhanga', 'Nyamagabe', 'Nyamasheke',
  'Nyanza', 'Ruhango', 'Nyaruguru', 'Gakenke', 'Gicumbi', 'Burera',
  'Musanze', 'Ngororero', 'Nyabihu', 'Rubavu', 'Rulindo', 'Karongi',
  'Nyarugenge', 'Gasabo', 'Kicukiro', 'Rusizi', 'Ngoma', 'Rutsiro',
];

export default function Landing() {
  const navigate = useNavigate();
  const [heroQuery, setHeroQuery] = useState('');

  const [subName, setSubName] = useState('');
  const [subPhone, setSubPhone] = useState('');
  const [subDistrict, setSubDistrict] = useState('');
  const [subSuccess, setSubSuccess] = useState<string | null>(null);
  const [subError, setSubError] = useState<string | null>(null);

  const checkRisk = () => {
    const params = heroQuery.trim() ? `?district=${encodeURIComponent(heroQuery.trim())}` : '';
    navigate(`/public${params}`);
  };

<<<<<<< HEAD
  const [subscribeForm, setSubscribeForm] = useState({ name: '', phone: '', district: '' });
  const [subscribeError, setSubscribeError] = useState('');
  const [subscribeStatus, setSubscribeStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  const handleSubscribe = (e: FormEvent) => {
    e.preventDefault();
    if (!/^\+?[\d\s]{9,15}$/.test(subscribeForm.phone.trim())) {
      setSubscribeError('Enter a valid phone number.');
      return;
    }
    if (!subscribeForm.district) {
      setSubscribeError('Select your district.');
      return;
    }
    setSubscribeError('');
    setSubscribeStatus('submitting');
    setTimeout(() => setSubscribeStatus('success'), 1000);
  };

=======
  const { data: districts = [], isLoading: districtsLoading } = useQuery({
    queryKey: ['all-districts'],
    queryFn: async () => {
      try {
        const list = await predictionsService.listAllDistricts();
        if (list && list.length) return list.map((d) => d.district);
        return FALLBACK_DISTRICTS;
      } catch {
        return FALLBACK_DISTRICTS;
      }
    },
    staleTime: 1000 * 60 * 60,
  });

  const subscribeMut = useMutation({
    mutationFn: (payload: { phone_number: string; district: string }) => alertsService.subscribeSms(payload),
    onSuccess: (data) => {
      setSubSuccess(`You are now subscribed! ${data.phone || subPhone} will receive alerts for ${data.district || subDistrict}.`);
      setSubError(null);
      setSubName('');
      setSubPhone('');
      setSubDistrict('');
      setTimeout(() => setSubSuccess(null), 6000);
    },
    onError: (e: any) => {
      setSubError(e?.detail || 'Could not subscribe. Please check the phone number and try again.');
      setSubSuccess(null);
      setTimeout(() => setSubError(null), 7000);
    },
  });

  const handleSubscribe = () => {
    const phone = subPhone.trim();
    const district = subDistrict.trim();
    if (!phone) {
      setSubError('Please enter your phone number.');
      return;
    }
    if (!district) {
      setSubError('Please select a district.');
      return;
    }
    subscribeMut.mutate({ phone_number: phone, district });
  };

  const districtOptions = Array.isArray(districts) && districts.length ? districts : FALLBACK_DISTRICTS;

>>>>>>> origin/main
  return (
    <div>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className="container" style={{ position: 'relative' }}>
          <div className={styles.heroContent}>
<<<<<<< HEAD
            <div className="badge badge-low" style={{ marginBottom: '1rem', padding: '0.375rem 0.875rem', fontSize: '0.9375rem' }}>
              Powered by AI & Satellite Data
            </div>
=======
         
>>>>>>> origin/main
            <h1 className={styles.heroTitle}>Climate Intelligence for a Malaria-Free Rwanda.</h1>
            <p className={styles.heroSubtitle}>
              Predictive risk mapping for climate-driven health crises. Zero Bite gives you the data to act before the outbreak.
            </p>
            <div className={styles.searchBox}>
              <input
                type="text"
                placeholder="Enter your district (e.g., Kayonza)"
                value={heroQuery}
                onChange={(e) => setHeroQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') checkRisk(); }}
              />
              <button onClick={checkRisk}>Check Risk</button>
            </div>
<<<<<<< HEAD
            <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-tertiary)' }}>
              Trusted by <strong>30+ District Health Officers</strong> across Rwanda.
            </p>
=======
            <div className={styles.trustRow}>
              <div className={styles.avatarStack}>
                <span>DH</span>
                <span>MK</span>
                <span>+</span>
              </div>
              <p>
                Trusted by <strong>30+ District Health Officers</strong> across Rwanda.
              </p>
            </div>
>>>>>>> origin/main
          </div>

          <div className={styles.mapPlaceholder}>
            <div className={styles.mapCard}>
          
              <RwandaHeroMap />
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className={styles.section} style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="container">
          <Reveal>
            <h2 className={styles.sectionTitle}>How Zero Bite Works</h2>
            <p className={styles.sectionSubtitle}>
              The end-to-end intelligence pipeline protecting Rwandan communities from climate-related health disasters.
            </p>
          </Reveal>
          <div className={styles.grid3}>
            <Reveal delay={0}>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}><Satellite size={32} /></div>
                <h3>Data Ingestion</h3>
                <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
                  We pull real-time satellite imagery and Meteo Rwanda weather feeds.
                </p>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}><Brain size={32} /></div>
                <h3>AI Prediction</h3>
                <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
                  Our models process 12+ indicators to predict malaria breeding risk 30 days ahead.
                </p>
              </div>
            </Reveal>
            <Reveal delay={240}>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}><Smartphone size={32} /></div>
                <h3>Actionable Response</h3>
                <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
                  Localized alerts are sent to CHWs and Ministry officials for immediate intervention.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* AI Assistant Showcase */}
      <section className={styles.section}>
        <div className="container">
          <div className={styles.showcaseGrid}>
<<<<<<< HEAD
            <Reveal>
              <div>
                <div className="badge badge-low" style={{ marginBottom: '1rem', fontSize: '0.9375rem', padding: '0.375rem 0.875rem' }}>Virtual Assistant</div>
                <h2 style={{ fontSize: '2.25rem', marginBottom: '1rem' }}>Your 24/7 Climate Intelligence Partner</h2>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1875rem', lineHeight: 1.6 }}>
                  The Zero Bite AI Assistant understands the complex relationships between rainfall, temperature, and vector breeding. Get instant insights in your language.
                </p>
                <ul className={styles.checklist}>
                  {assistantChecklist.map((item) => (
                    <li key={item}>
                      <CheckCircle2 size={18} color="var(--color-risk-low)" style={{ flexShrink: 0 }} /> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
=======
            <div>
              
              <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Your 24/7 Climate Intelligence Partner</h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.125rem', lineHeight: 1.6 }}>
                The Zero Bite AI Assistant understands the complex relationships between rainfall, temperature, and vector breeding. Get instant insights in your language.
              </p>
              <ul className={styles.checklist}>
                {assistantChecklist.map((item) => (
                  <li key={item}>
                    <CheckCircle2 size={18} color="var(--color-risk-low)" style={{ flexShrink: 0 }} /> {item}
                  </li>
                ))}
              </ul>
            </div>
>>>>>>> origin/main

            <Reveal delay={150}>
              <div className={styles.chatCard}>
                <div className={styles.chatHeader}>
                  <span className={styles.chatAvatar}><Bot size={18} /></span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Zero Bite AI Assistant</div>
                    <div className={styles.chatStatus}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--color-risk-low)' }} /> Active • Kinyarwanda
                    </div>
                  </div>
                </div>
                <div className={styles.chatBody}>
                  <div className={styles.chatBubbleUser}>Mwaramutse! How can you help with today's malaria risk assessment?</div>
                  <div className={styles.chatSuggestion}>Why is the risk high in Kayonza today?</div>
                  <div className={styles.chatBubbleAi}>
                    Risk in <strong>Kayonza</strong> is currently at <strong>78/100</strong> (+15% today). This is driven by a 75% humidity spike combined with stagnant water detected via satellite imagery. Mosquitoes are highly active following recent rainfall in Nyanza village.
                  </div>
                </div>
                <div className={styles.chatInputRow}>
                  <input type="text" placeholder="Ask about your district here..." disabled />
                  <button aria-label="Send"><ArrowUp size={16} /></button>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Who Zero Bite Is For */}
      <section className={styles.section} style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="container">
          <Reveal>
            <h2 className={styles.sectionTitle}>Who Zero Bite Is For</h2>
            <p className={styles.sectionSubtitle}>Tailored dashboards for every level of the health system.</p>
          </Reveal>
          <div className="grid grid-cols-4 gap-lg">
            {roles.map((role, i) => (
              <Reveal key={role.tag} delay={i * 90}>
                <RoleCard
                  icon={role.icon}
                  tag={role.tag}
                  title={role.title}
                  description={role.description}
                  onAction={() => navigate(role.path)}
                />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Prevention at a Glance + Subscribe */}
      <section className={styles.section}>
        <div className="container">
<<<<<<< HEAD
          <div className={styles.showcaseGrid} style={{ alignItems: 'start' }}>
            <Reveal>
            <div>
              <h2 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Prevention at a Glance</h2>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-xl)', fontSize: '1.0625rem' }}>
=======
          <div className={styles.subscribeSplit}>
            {/* Prevention Card */}
            <div className={styles.preventionCard}>
              <h2 className={styles.preventionTitle}>Prevention at a Glance</h2>
              <p className={styles.preventionSubtitle}>
>>>>>>> origin/main
                Immediate steps to take based on current national climate trends.
              </p>
              <div className={styles.preventionGrid}>
                {preventionTips.map((tip) => (
                  <div key={tip.title} className={styles.preventionItem}>
                    <div className={styles.preventionIcon}>{tip.icon}</div>
                    <div>
<<<<<<< HEAD
                      <h4 style={{ fontSize: '1.125rem', marginBottom: '0.25rem' }}>{tip.title}</h4>
                      <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{tip.description}</p>
=======
                      <h4 className={styles.preventionItemTitle}>{tip.title}</h4>
                      <p className={styles.preventionItemDesc}>{tip.description}</p>
>>>>>>> origin/main
                    </div>
                  </div>
                ))}
              </div>
<<<<<<< HEAD
              <a href="#" className="flex items-center gap-sm" style={{ marginTop: 'var(--spacing-xl)', fontSize: '0.9375rem', fontWeight: 600 }}>
=======
              <a href="#" className={styles.preventionLink}>
>>>>>>> origin/main
                View full health guide <ArrowRight size={16} />
              </a>
            </div>
            </Reveal>

<<<<<<< HEAD
            <Reveal delay={150}>
            <div style={{ backgroundColor: 'var(--color-primary)', color: 'white', borderRadius: 'var(--radius-xl)', padding: 'var(--spacing-xl)' }}>
              {subscribeStatus === 'success' ? (
                <div style={{ textAlign: 'center', padding: 'var(--spacing-lg) 0', animation: 'scaleIn 300ms ease-out' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(76, 175, 80, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--spacing-md)', color: '#86EFAC' }}>
                    <CheckCircle2 size={24} />
                  </div>
                  <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>You're subscribed!</h3>
                  <p style={{ fontSize: '0.875rem', color: '#D1D5DB' }}>
                    Weekly risk alerts for {subscribeForm.district} will be sent to {subscribeForm.phone}.
                  </p>
                </div>
              ) : (
              <>
              <h3 style={{ fontSize: '1.375rem', marginBottom: '0.5rem' }}>Subscribe to Local Alerts</h3>
              <p style={{ fontSize: '0.9375rem', color: '#D1D5DB', marginBottom: 'var(--spacing-lg)', lineHeight: 1.6 }}>
                Receive real-time SMS alerts in English or Kinyarwanda when risk levels increase in your district.
              </p>
              <form onSubmit={handleSubscribe}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={subscribeForm.name}
                    onChange={(e) => setSubscribeForm((prev) => ({ ...prev, name: e.target.value }))}
                    style={{ padding: 'var(--spacing-md)', borderRadius: 'var(--radius-sm)', border: 'none', fontSize: '0.875rem' }}
                  />
                  <input
                    type="tel"
                    placeholder="+250 XXX XXX XXX"
                    value={subscribeForm.phone}
                    onChange={(e) => setSubscribeForm((prev) => ({ ...prev, phone: e.target.value }))}
                    style={{ padding: 'var(--spacing-md)', borderRadius: 'var(--radius-sm)', border: 'none', fontSize: '0.875rem' }}
                  />
                  <select
                    value={subscribeForm.district}
                    onChange={(e) => setSubscribeForm((prev) => ({ ...prev, district: e.target.value }))}
                    style={{ padding: 'var(--spacing-md)', borderRadius: 'var(--radius-sm)', border: 'none', fontSize: '0.875rem', color: subscribeForm.district ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}
                  >
                    <option value="">Select District</option>
                    <option>Gasabo</option>
                    <option>Kayonza</option>
                    <option>Musanze</option>
                    <option>Bugesera</option>
                    <option>Rubavu</option>
                    <option>Huye</option>
                  </select>
                </div>
                {subscribeError && <p style={{ color: '#FCA5A5', fontSize: '0.8125rem', marginBottom: 'var(--spacing-sm)' }}>{subscribeError}</p>}
                <button
                  type="submit"
                  disabled={subscribeStatus === 'submitting'}
                  style={{ width: '100%', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-sm)', backgroundColor: 'white', color: 'var(--color-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: subscribeStatus === 'submitting' ? 0.7 : 1 }}
                >
                  {subscribeStatus === 'submitting' ? (
                    <><Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Subscribing...</>
                  ) : 'Subscribe Now'}
                </button>
              </form>
              <div className="flex gap-sm" style={{ marginTop: 'var(--spacing-md)', fontSize: '0.75rem', color: '#9CA3AF', alignItems: 'flex-start' }}>
                <Info size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                <span>Zero Bite is a free service provided in partnership with the Ministry of Health. Standard SMS rates may apply. You can unsubscribe by texting STOP.</span>
=======
            {/* Subscribe to Local Alerts */}
            <div>
              <h2 className={styles.subscribeTitle}>Subscribe to Local Alerts</h2>
              <p className={styles.subscribeSubtitle}>
                Receive real-time SMS alerts in English or Kinyarwanda when risk levels in your district increase.
              </p>
              {subSuccess && (
                <div style={{ padding: '0.875rem 1rem', backgroundColor: '#ECFDF5', color: '#065F46', borderRadius: 12, marginBottom: '1.25rem', fontSize: '0.9375rem', border: '1px solid #A7F3D0' }}>
                  {subSuccess}
                </div>
              )}
              {subError && (
                <div style={{ padding: '0.875rem 1rem', backgroundColor: '#FEF2F2', color: '#991B1B', borderRadius: 12, marginBottom: '1.25rem', fontSize: '0.9375rem', border: '1px solid #FECACA', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>{subError}</span>
                </div>
              )}
              <div className={styles.subscribeForm}>
                <input
                  type="text"
                  placeholder="Full Name"
                  className={styles.subscribeInput}
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  disabled={subscribeMut.isPending}
                />
                <input
                  type="tel"
                  placeholder="+250 XXX XXX XXX"
                  className={styles.subscribeInput}
                  value={subPhone}
                  onChange={(e) => setSubPhone(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSubscribe(); }}
                  disabled={subscribeMut.isPending}
                />
                <select
                  className={styles.subscribeSelect}
                  value={subDistrict}
                  onChange={(e) => setSubDistrict(e.target.value)}
                  disabled={subscribeMut.isPending || districtsLoading}
                  style={{ gridColumn: '1 / -1' }}
                >
                  <option value="">{districtsLoading ? 'Loading districts…' : 'Select District'}</option>
                  {districtOptions.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <button
                  className={styles.subscribeButton}
                  style={{ gridColumn: '1 / -1', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: subscribeMut.isPending ? 0.85 : 1 }}
                  onClick={handleSubscribe}
                  disabled={subscribeMut.isPending}
                >
                  {subscribeMut.isPending ? (
                    <><Loader2 size={16} className="spin" /> Subscribing…</>
                  ) : 'Subscribe Now'}
                </button>
              </div>
              <div className={styles.subscribeNote}>
                <div className={styles.subscribeNoteIcon}>
                  <Info size={15} />
                </div>
                <p className={styles.subscribeNoteText}>
                  Zero Bite is a free service provided in partnership with the Ministry of Health. Standard SMS rates do not apply. You can unsubscribe at any time.
                </p>
>>>>>>> origin/main
              </div>
              </>
              )}
            </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Trust Through Science */}
      <section className={styles.section}>
        <div className="container">
          <Reveal>
            <h2 className={styles.sectionTitle}>Trust Through Science</h2>
            <p className={styles.sectionSubtitle}>
              Our models are trained on 15 years of historical Rwandan epidemiological data and validated against high-resolution satellite imagery from the European Space Agency.
            </p>
          </Reveal>

          <Reveal>
            <div className="grid grid-cols-3 gap-lg" style={{ marginBottom: 'var(--spacing-2xl)', textAlign: 'center' }}>
              {trustStats.map((stat) => (
                <div key={stat.label}>
                  <div style={{ fontSize: '3.25rem', fontWeight: 800 }}>
                    <CountUp value={stat.value} suffix={stat.suffix} />
                  </div>
                  <div style={{ fontSize: '0.9375rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </Reveal>

          <p style={{ textAlign: 'center', fontSize: '0.8125rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--spacing-lg)' }}>
            Our Research &amp; Delivery Partners
          </p>
          <div className="flex justify-center gap-xl" style={{ flexWrap: 'wrap', marginBottom: 'var(--spacing-2xl)' }}>
            {partners.map((partner) => (
              <div key={partner.name} title={partner.name} style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#F0F4F8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)' }}>
                {partner.icon}
              </div>
            ))}
          </div>

          <Reveal>
          <div className="card flex justify-between items-center" style={{ backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', flexWrap: 'wrap', gap: 'var(--spacing-lg)' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>2023 National Climate-Health Report</h3>
              <p style={{ fontSize: '0.9375rem', color: '#D1D5DB' }}>Download the comprehensive analysis on how AI is transforming outbreak prevention in Rwanda.</p>
            </div>
            <button style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: 'var(--spacing-sm) var(--spacing-lg)', borderRadius: 'var(--radius-md)', backgroundColor: 'white', color: 'var(--color-primary)', fontWeight: 600, flexShrink: 0 }}>
              <Download size={16} /> Download PDF (14.2 MB)
            </button>
          </div>
          </Reveal>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className="container">
          <Reveal>
            <h2 style={{ fontSize: '2rem' }}>Ready to secure your community?</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem', marginBottom: '1.5rem', fontSize: '1.0625rem' }}>
              Contact our team for specialized training, API access, or to join the District Health Intelligence Network.
            </p>
            <div className="flex justify-center gap-md">
               <button className="btn-primary">Contact Our Team</button>
               <button className="btn-outline" onClick={() => navigate('/public')}>View Public Portal</button>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
