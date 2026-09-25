import { useState } from 'react';
import styles from './Landing.module.css';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Satellite, Brain, Smartphone, CheckCircle2, Bot, ArrowUp, Landmark, Building2,
  Stethoscope, Globe, Shield, Droplets, Scissors, Clock, ArrowRight, Info,
  GraduationCap, RadioTower, Download, AlertTriangle, Loader2
} from 'lucide-react';
import RwandaHeroMap from '../../components/RwandaHeroMap';
import RoleCard from '../../components/RoleCard';
import Reveal from '../../components/Reveal';
import CountUp from '../../components/CountUp';
import * as predictionsService from '../../services/predictionsService';
import * as alertsService from '../../services/alertsService';
import * as contactService from '../../services/contactService';

const assistantChecklist = [
  "Ask about any district's current risk",
  "See today's highest-risk districts",
  'Get prevention advice based on current conditions',
  'Understand the rainfall and humidity behind each score',
];

const preventionTips = [
  { icon: <Shield size={16} />, title: 'Mosquito Nets', description: 'Ensure all household members sleep under insecticide-treated nets.' },
  { icon: <Droplets size={16} />, title: 'Clear Water', description: 'Empty or cover all containers of standing water near homes.' },
  { icon: <Scissors size={16} />, title: 'Bush Clearing', description: 'Keep grass short and clear dense vegetation around dwellings.' },
  { icon: <Clock size={16} />, title: 'Peak Exposure', description: 'Avoid being outdoors during dusk and dawn peak biting hours.' },
];

const dataSources = [
  { icon: <Satellite size={22} />, name: 'Open-Meteo (live weather & forecast)' },
  { icon: <GraduationCap size={22} />, name: 'NASA POWER (10+ years of training data)' },
  { icon: <Landmark size={22} />, name: 'NISR census & terrain statistics' },
  { icon: <RadioTower size={22} />, name: "Africa's Talking (SMS delivery)" },
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

  const { data: districtList = [], isLoading: districtsLoading } = useQuery({
    queryKey: ['districts-list'],
    queryFn: () => predictionsService.listAllDistricts(),
    staleTime: 1000 * 60 * 5,
  });
  const districts = districtList.map((d) => d.district).sort((x, y) => x.localeCompare(y));
  const topDistrict = districtList[0];
  const highRiskCount = districtList.filter((d) => d.risk_level === 'HIGH' || d.risk_level === 'CRITICAL').length;

  const { data: metrics } = useQuery({
    queryKey: ['public-model-metrics'],
    queryFn: () => contactService.getPublicModelMetrics(),
    staleTime: 1000 * 60 * 60,
    retry: false,
  });

  const { data: topRisk } = useQuery({
    queryKey: ['public-district', topDistrict?.district],
    queryFn: () => predictionsService.getPublicDistrictRisk(topDistrict!.district),
    enabled: !!topDistrict,
    staleTime: 1000 * 60 * 10,
  });

  const trustStats = [
    ...(metrics ? [{ value: Math.round(metrics.accuracy * 1000) / 10, suffix: '%', label: 'Measured Model Accuracy' }] : []),
    { value: districtList.length || 30, suffix: '', label: 'Districts Monitored' },
    { value: 16, suffix: ' days', label: 'Weather Forecast Horizon' },
  ];

  const subscribeMut = useMutation({
    mutationFn: (payload: { phone_number: string; district: string; name?: string }) => alertsService.subscribeSms(payload),
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
    subscribeMut.mutate({ phone_number: phone, district, name: subName.trim() || undefined });
  };

  const districtOptions = districts;

  return (
    <div>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className="container" style={{ position: 'relative' }}>
          <div className={styles.heroContent}>
         
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
            {districtList.length > 0 && (
              <div className={styles.trustRow}>
                <p>
                  Live today: <strong>{highRiskCount} of {districtList.length} districts</strong> at high or critical risk
                  {topDistrict ? <> — highest is <strong>{topDistrict.district}</strong> ({topDistrict.current_risk}/100)</> : null}.
                </p>
              </div>
            )}
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
                  We pull live weather and 16-day forecasts for every district from Open-Meteo.
                </p>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}><Brain size={32} /></div>
                <h3>AI Prediction</h3>
                <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
                  Our model scores 12 climate and terrain indicators to estimate malaria breeding risk up to 16 days ahead.
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
            <div>
              
              <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Your 24/7 Climate Intelligence Partner</h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.125rem', lineHeight: 1.6 }}>
                The Zero Bite assistant answers questions from live weather and the risk model: how rainfall, temperature and humidity translate into malaria breeding risk for your district.
              </p>
              <ul className={styles.checklist}>
                {assistantChecklist.map((item) => (
                  <li key={item}>
                    <CheckCircle2 size={18} color="var(--color-risk-low)" style={{ flexShrink: 0 }} /> {item}
                  </li>
                ))}
              </ul>
            </div>

            <Reveal delay={150}>
              <div className={styles.chatCard}>
                <div className={styles.chatHeader}>
                  <span className={styles.chatAvatar}><Bot size={18} /></span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Zero Bite AI Assistant</div>
                    <div className={styles.chatStatus}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--color-risk-low)' }} /> Active • Live data
                    </div>
                  </div>
                </div>
                <div className={styles.chatBody}>
                  <div className={styles.chatBubbleUser}>Mwaramutse! How can you help with today's malaria risk assessment?</div>
                  <div className={styles.chatSuggestion}>{topDistrict ? `What is the risk in ${topDistrict.district} today?` : 'What is the risk in my district today?'}</div>
                  <div className={styles.chatBubbleAi}>
                    {topRisk ? (
                      <>
                        Risk in <strong>{topRisk.district}</strong> is currently <strong>{topRisk.risk_score}/100</strong> ({topRisk.risk_level.toLowerCase()}). {topRisk.summary} {topRisk.weather_note}
                      </>
                    ) : (
                      'Loading live risk data…'
                    )}
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
          <div className={styles.subscribeSplit}>
            {/* Prevention Card */}
            <div className={styles.preventionCard}>
              <h2 className={styles.preventionTitle}>Prevention at a Glance</h2>
              <p className={styles.preventionSubtitle}>
                Immediate steps to take based on current national climate trends.
              </p>
              <div className={styles.preventionGrid}>
                {preventionTips.map((tip) => (
                  <div key={tip.title} className={styles.preventionItem}>
                    <div className={styles.preventionIcon}>{tip.icon}</div>
                    <div>
                      <h4 className={styles.preventionItemTitle}>{tip.title}</h4>
                      <p className={styles.preventionItemDesc}>{tip.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <a href="#" className={styles.preventionLink}>
                View full health guide <ArrowRight size={16} />
              </a>
            </div>

            {/* Subscribe to Local Alerts */}
            <div>
              <h2 className={styles.subscribeTitle}>Subscribe to Local Alerts</h2>
              <p className={styles.subscribeSubtitle}>
                Receive SMS alerts when malaria risk in your district rises to high or critical.
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
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Through Science */}
      <section className={styles.section}>
        <div className="container">
          <Reveal>
            <h2 className={styles.sectionTitle}>Trust Through Science</h2>
            <p className={styles.sectionSubtitle}>
              The risk model is trained on more than ten years of daily NASA POWER weather records for Rwanda's districts, and runs every hour on live Open-Meteo weather and forecasts.
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
            Our Data Sources
          </p>
          <div className="flex justify-center gap-xl" style={{ flexWrap: 'wrap', marginBottom: 'var(--spacing-2xl)' }}>
            {dataSources.map((partner) => (
              <div key={partner.name} title={partner.name} style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#F0F4F8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)' }}>
                {partner.icon}
              </div>
            ))}
          </div>

          <Reveal>
          <div className="card flex justify-between items-center" style={{ backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', flexWrap: 'wrap', gap: 'var(--spacing-lg)' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Build a Climate-Health Report</h3>
              <p style={{ fontSize: '0.9375rem', color: '#D1D5DB' }}>Generate a report from the latest model output for any date range and set of districts, then print or export it.</p>
            </div>
            <Link to="/reports" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: 'var(--spacing-sm) var(--spacing-lg)', borderRadius: 'var(--radius-md)', backgroundColor: 'white', color: 'var(--color-primary)', fontWeight: 600, flexShrink: 0 }}>
              <Download size={16} /> Open Report Builder
            </Link>
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
