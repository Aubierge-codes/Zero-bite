import { useNavigate } from 'react-router-dom';
import { Landmark, Building2, Stethoscope, Globe, CheckCircle2 } from 'lucide-react';
import styles from './Dashboards.module.css';
import RoleCard from '../../components/RoleCard';

const roleDashboards = [
  {
    icon: <Landmark size={28} />,
    tag: 'MINISTRY',
    title: 'National Dashboard',
    description: 'A national command view for strategic oversight across all 30 districts.',
    features: [
      'Live district risk heatmap with alert-density toggle',
      'AI situation summary with recommended national actions',
      'Risk probability trends: historical vs. predicted',
      'Downloadable strategy and district priority reports',
    ],
    path: '/login',
  },
  {
    icon: <Building2 size={28} />,
    tag: 'DISTRICT',
    title: 'District Dashboard',
    description: 'Sector-level analytics for district health officers running day-to-day response.',
    features: [
      'Sector risk heatmap with 30-day AI forecast',
      'Resource availability: ITN stock, spray teams, outreach goals',
      'One-click sector alert dispatch',
      'Climate Intelligence Advisor for district-specific Q&A',
    ],
    path: '/login',
  },
  {
    icon: <Stethoscope size={28} />,
    tag: 'CHW',
    title: 'Worker Dashboard',
    description: 'Field-ready tools for Community Health Workers and village leaders.',
    features: [
      'Village risk score updated from satellite moisture data',
      'Community SMS broadcast composer with AI wording help',
      'Field monitoring: log observations and water sites',
      'Offline sync and SMS fallback for low-connectivity areas',
    ],
    path: '/login',
  },
  {
    icon: <Globe size={28} />,
    tag: 'PUBLIC',
    title: 'Public Portal',
    description: 'A free, no-login risk lookup anyone in Rwanda can use.',
    features: [
      'Search any district for its current risk score',
      'Personalized prevention tips based on local conditions',
      'Local weather conditions and 7-day outlook',
      'Free SMS risk alerts for your village',
    ],
    path: '/public',
  },
];

export default function Dashboards() {
  const navigate = useNavigate();

  return (
    <div>
    <section className={styles.hero}>
  <div className={`container ${styles.heroGrid}`}>
    <div className={styles.heroVisual}>
      <img src="/dash.png" alt="National dashboard view" className={styles.dashboardImage} />
    </div>

    <div className={styles.heroText}>
      <h1 className={styles.heroTitle}>Dashboards Built for Every Role</h1>
      <p className={styles.heroSubtitle}>
        From national strategy to village-level response, Zero Bite gives each part of the health system the exact
        view it needs.
      </p>
    </div>

    <div className={styles.heroVisual}>
      <img src="/das.png" alt="District dashboard view" className={styles.dashboardImage} />
    </div>
  </div>
</section>

      <section className="container" style={{ padding: 'var(--spacing-2xl) 0' }}>
        <h2 style={{ fontSize: '1.25rem', textAlign: 'center', marginBottom: 'var(--spacing-xl)', color: 'var(--color-text-secondary)' }}>
          Jump straight to your role
        </h2>
        <div className="grid grid-cols-4 gap-lg">
          {roleDashboards.map((role) => (
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
      </section>

      <section className="container" style={{ padding: 'var(--spacing-xl) 0', borderTop: '1px solid var(--color-border)' }}>
        {roleDashboards.map((role, i) => (
          <div key={role.tag} className={`${styles.roleRow} ${i % 2 === 1 ? styles.reverse : ''}`}>
            <div className={styles.roleInfo}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#F0F4F8', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--spacing-md)' }}>
                {role.icon}
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--color-text-tertiary)', marginBottom: '0.25rem' }}>
                {role.tag}
              </div>
              <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{role.title}</h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', lineHeight: 1.6, marginBottom: 'var(--spacing-lg)' }}>
                {role.description}
              </p>
              <button className="btn-primary" onClick={() => navigate(role.path)}>Enter Dashboard</button>
            </div>

            <div className={`card ${styles.roleFeatures}`}>
              <ul className={styles.featureList}>
                {role.features.map((feature) => (
                  <li key={feature}>
                    <CheckCircle2 size={18} color="var(--color-risk-low)" style={{ flexShrink: 0, marginTop: '1px' }} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </section>

      <section className="container" style={{ padding: 'var(--spacing-2xl) 0', textAlign: 'center', borderTop: '1px solid var(--color-border)' }}>
        <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Not sure which dashboard is yours?</h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-lg)' }}>
          Our team can get you set up with the right access for your role.
        </p>
        <div className="flex justify-center gap-md">
          <button className="btn-primary" onClick={() => navigate('/contact')}>Contact Our Team</button>
          <button className="btn-outline" onClick={() => navigate('/public')}>Try the Public Portal</button>
        </div>
      </section>
    </div>
  );
}
