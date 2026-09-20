import styles from './Landing.module.css';
import { useNavigate } from 'react-router-dom';
import { Satellite, Brain, Smartphone, CheckCircle2, Bot, ArrowUp, Landmark, Building2, Stethoscope, Globe } from 'lucide-react';
import RwandaHeroMap from '../../components/RwandaHeroMap';
import RoleCard from '../../components/RoleCard';

const assistantChecklist = [
  'Ask about specific district forecasts',
  'Get recommendations for community health risks',
  'Draft SMS alerts in Kinyarwanda or English',
  'Understand the data behind risk scores',
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

  return (
    <div>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className="container" style={{ position: 'relative' }}>
          <div className={styles.heroContent}>
            <div className="badge badge-low" style={{ marginBottom: '1rem', padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}>
              Powered by AI & Satellite Data
            </div>
            <h1 className={styles.heroTitle}>Climate Intelligence for a Malaria-Free Rwanda.</h1>
            <p className={styles.heroSubtitle}>
              Predictive risk mapping for climate-driven health crises. Zero Bite gives you the data to act before the outbreak.
            </p>
            <div className={styles.searchBox}>
              <input type="text" placeholder="Enter your district (e.g., Kayonza)" />
              <button onClick={() => navigate('/public')}>Check Risk</button>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-tertiary)' }}>
              Trusted by <strong>30+ District Health Officers</strong> across Rwanda.
            </p>
          </div>
          <div className={styles.mapPlaceholder}>
            <RwandaHeroMap />
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
