import { useState } from 'react';
import styles from './Landing.module.css';
import { useNavigate } from 'react-router-dom';
import {
  Satellite, Brain, Smartphone, CheckCircle2, Bot, ArrowUp, Landmark, Building2,
  Stethoscope, Globe, Shield, Droplets, Scissors, Clock, ArrowRight, Info,
  GraduationCap, RadioTower, Download, AlertTriangle, Search
} from 'lucide-react';
import RwandaHeroMap from '../../components/RwandaHeroMap';
import RoleCard from '../../components/RoleCard';

const assistantChecklist = [
  'Ask about specific district forecasts',
  'Get recommendations for community health risks',
  'Draft SMS alerts in Kinyarwanda or English',
  'Understand the data behind risk scores',
];

const preventionTips = [
  { icon: <Shield size={20} />, title: 'Mosquito Nets', description: 'Ensure all household members sleep under insecticide-treated nets.' },
  { icon: <Droplets size={20} />, title: 'Clear Water', description: 'Empty out or cover all standing water near your dwelling.' },
  { icon: <Scissors size={20} />, title: 'Bush Clearing', description: 'Keep grass short and clear dense vegetation around dwellings.' },
  { icon: <Clock size={20} />, title: 'Peak Exposure', description: 'Avoid being outdoors during peak biting times (dusk till dawn).' },
];

const trustStats = [
  { value: '94%', label: 'Prediction Accuracy' },
  { value: '12m', label: 'Data Latency' },
  { value: '30+', label: 'Districts Monitored' },
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

export default function Landing() {
  const navigate = useNavigate();
  const [heroQuery, setHeroQuery] = useState('');

  const checkRisk = () => {
    const params = heroQuery.trim() ? `?district=${encodeURIComponent(heroQuery.trim())}` : '';
    navigate(`/public${params}`);
  };

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
          <h2 className={styles.sectionTitle}>How Zero Bite Works</h2>
          <p className={styles.sectionSubtitle}>
            The end-to-end intelligence pipeline protecting Rwandan communities from climate-related health disasters.
          </p>
          <div className={styles.grid3}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}><Satellite size={32} /></div>
              <h3>Data Ingestion</h3>
              <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
                We pull real-time satellite imagery and Meteo Rwanda weather feeds.
              </p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}><Brain size={32} /></div>
              <h3>AI Prediction</h3>
              <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
                Our models process 12+ indicators to predict malaria breeding risk 30 days ahead.
              </p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}><Smartphone size={32} /></div>
              <h3>Actionable Response</h3>
              <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
                Localized alerts are sent to CHWs and Ministry officials for immediate intervention.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Assistant Showcase */}
      <section className={styles.section}>
        <div className="container">
          <div className={styles.showcaseGrid}>
            <div>
              <div className="badge badge-low" style={{ marginBottom: '1rem' }}>Virtual Assistant</div>
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
          </div>
        </div>
      </section>

      {/* Who Zero Bite Is For */}
      <section className={styles.section} style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="container">
          <h2 className={styles.sectionTitle}>Who Zero Bite Is For</h2>
          <p className={styles.sectionSubtitle}>Tailored dashboards for every level of the health system.</p>
          <div className="grid grid-cols-4 gap-lg">
            {roles.map((role) => (
              <RoleCard
                key={role.tag}
                icon={role.icon}
                tag={role.tag}
                title={role.title}
                description={role.description}
                onAction={() => navigate(role.path)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Prevention at a Glance + Subscribe */}
      <section className={styles.section} style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="container">
          <div className={styles.showcaseGrid} style={{ alignItems: 'start' }}>
            <div>
              <h2 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Prevention at a Glance</h2>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-xl)' }}>
                Immediate steps to take based on current national climate trends.
              </p>
              <div className="grid grid-cols-2 gap-lg">
                {preventionTips.map((tip) => (
                  <div key={tip.title} className="flex gap-md">
                    <div style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }}>{tip.icon}</div>
                    <div>
                      <h4 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{tip.title}</h4>
                      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{tip.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <a href="#" className="flex items-center gap-sm" style={{ marginTop: 'var(--spacing-xl)', fontSize: '0.875rem', fontWeight: 600 }}>
                View full health guide <ArrowRight size={16} />
              </a>
            </div>

            <div style={{ backgroundColor: 'var(--color-primary)', color: 'white', borderRadius: 'var(--radius-xl)', padding: 'var(--spacing-xl)' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Subscribe to Local Alerts</h3>
              <p style={{ fontSize: '0.875rem', color: '#D1D5DB', marginBottom: 'var(--spacing-lg)', lineHeight: 1.6 }}>
                Receive real-time SMS alerts in English or Kinyarwanda when risk levels increase in your district.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
                <input type="text" placeholder="Full Name" style={{ padding: 'var(--spacing-md)', borderRadius: 'var(--radius-sm)', border: 'none', fontSize: '0.875rem' }} />
                <input type="tel" placeholder="+250 XXX XXX XXX" style={{ padding: 'var(--spacing-md)', borderRadius: 'var(--radius-sm)', border: 'none', fontSize: '0.875rem' }} />
                <select style={{ padding: 'var(--spacing-md)', borderRadius: 'var(--radius-sm)', border: 'none', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                  <option>Select District</option>
                </select>
              </div>
              <button style={{ width: '100%', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-sm)', backgroundColor: 'white', color: 'var(--color-primary)', fontWeight: 600 }}>
                Subscribe Now
              </button>
              <div className="flex gap-sm" style={{ marginTop: 'var(--spacing-md)', fontSize: '0.75rem', color: '#9CA3AF', alignItems: 'flex-start' }}>
                <Info size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                <span>Zero Bite is a free service provided in partnership with the Ministry of Health. Standard SMS rates may apply. You can unsubscribe by texting STOP.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Through Science */}
      <section className={styles.section}>
        <div className="container">
          <h2 className={styles.sectionTitle}>Trust Through Science</h2>
          <p className={styles.sectionSubtitle}>
            Our models are trained on 15 years of historical Rwandan epidemiological data and validated against high-resolution satellite imagery from the European Space Agency.
          </p>

          <div className="grid grid-cols-3 gap-lg" style={{ marginBottom: 'var(--spacing-2xl)', textAlign: 'center' }}>
            {trustStats.map((stat) => (
              <div key={stat.label}>
                <div style={{ fontSize: '3rem', fontWeight: 800 }}>{stat.value}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--spacing-lg)' }}>
            Our Research &amp; Delivery Partners
          </p>
          <div className="flex justify-center gap-xl" style={{ flexWrap: 'wrap', marginBottom: 'var(--spacing-2xl)' }}>
            {partners.map((partner) => (
              <div key={partner.name} title={partner.name} style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#F0F4F8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)' }}>
                {partner.icon}
              </div>
            ))}
          </div>

          <div className="card flex justify-between items-center" style={{ backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', flexWrap: 'wrap', gap: 'var(--spacing-lg)' }}>
            <div>
              <h3 style={{ fontSize: '1.125rem', marginBottom: '0.25rem' }}>2023 National Climate-Health Report</h3>
              <p style={{ fontSize: '0.875rem', color: '#D1D5DB' }}>Download the comprehensive analysis on how AI is transforming outbreak prevention in Rwanda.</p>
            </div>
            <button style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: 'var(--spacing-sm) var(--spacing-lg)', borderRadius: 'var(--radius-md)', backgroundColor: 'white', color: 'var(--color-primary)', fontWeight: 600, flexShrink: 0 }}>
              <Download size={16} /> Download PDF (14.2 MB)
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className="container">
          <h2>Ready to secure your community?</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
            Contact our team for specialized training, API access, or to join the District Health Intelligence Network.
          </p>
          <div className="flex justify-center gap-md">
             <button className="btn-primary">Contact Our Team</button>
             <button className="btn-outline" onClick={() => navigate('/public')}>View Public Portal</button>
          </div>
        </div>
      </section>
    </div>
  );
}