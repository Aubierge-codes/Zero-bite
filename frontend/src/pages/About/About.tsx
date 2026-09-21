import { useNavigate } from 'react-router-dom';
import { Database, Users, Share2, Zap, Satellite, Brain, HeartPulse, MapPin } from 'lucide-react';
import styles from './About.module.css';

const byTheNumbers = [
  { icon: <MapPin size={20} />, value: '30', label: 'Districts Monitored' },
  { icon: <HeartPulse size={20} />, value: '1.2M', label: 'People Protected' },
  { icon: <Satellite size={20} />, value: '15yrs', label: 'Historical Data' },
  { icon: <Brain size={20} />, value: '94%', label: 'Prediction Accuracy' },
];

const values = [
  {
    icon: <Database size={24} />,
    title: 'Data-Driven Precision',
    description: 'Every alert is grounded in satellite imagery, weather data, and validated epidemiological models — never guesswork.',
  },
  {
    icon: <Users size={24} />,
    title: 'Community-Centered',
    description: 'Built with Community Health Workers and district officials, so the tools fit how Rwandan health teams actually work.',
  },
  {
    icon: <Share2 size={24} />,
    title: 'Open Collaboration',
    description: 'We work alongside the Ministry of Health, researchers, and telecom partners to keep the response network connected.',
  },
  {
    icon: <Zap size={24} />,
    title: 'Rapid Response',
    description: 'Predictions run continuously so warnings reach field teams days before breeding conditions peak, not after.',
  },
];

export default function About() {
  const navigate = useNavigate();

  return (
    <div>
    <section className={styles.hero}>
  <div className={`container ${styles.heroGrid}`}>
    <div className={styles.heroText}>
      <p className={styles.eyebrow}>About Zero Bite</p>
      <h1 className={styles.heroTitle}>About Zero Bite</h1>
      <p className={styles.heroSubtitle}>
        Zero Bite is Rwanda's climate-health intelligence platform, built to turn satellite and weather data into
        early warnings that stop malaria outbreaks before they start.
      </p>
    </div>

    <div className={styles.heroVisual}>
      <img src="/satelite.png" alt="Satellite monitoring climate data" className={styles.satelliteImage} />
    </div>
  </div>
</section>

      <section className={styles.section}>
        <div className="container">
          <div className={styles.storyGrid}>
            <div>
              <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Our Mission</h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.0625rem', lineHeight: 1.7, marginBottom: '1rem' }}>
                Malaria transmission in Rwanda is closely tied to rainfall, humidity, and temperature — conditions that are
                shifting as the climate changes. Zero Bite combines Sentinel-2 satellite imagery, Meteo Rwanda weather
                feeds, and historical outbreak records into a single AI model that forecasts breeding risk 30 days ahead.
              </p>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.0625rem', lineHeight: 1.7 }}>
                That forecast becomes an alert routed straight to the district officers and Community Health Workers
                closest to the risk, so larviciding and net distribution happen before a spike in cases — not after.
              </p>
            </div>

            <div className="card">
              <h3 style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-lg)' }}>
                Zero Bite by the Numbers
              </h3>
              <div className="grid grid-cols-2 gap-lg">
                {byTheNumbers.map((stat) => (
                  <div key={stat.label} className={styles.statBlock}>
                    <div style={{ color: 'var(--color-text-secondary)', marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>{stat.icon}</div>
                    <div className={styles.statValue}>{stat.value}</div>
                    <div className={styles.statLabel}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.valuesSection}`}>
        <div className="container">
          <h2 className={styles.valuesTitle}>What We Stand For</h2>
          <p className={styles.valuesSubtitle}>
            The principles that shape every model we ship and every alert we send.
          </p>
          <div className="grid grid-cols-4 gap-lg">
            {values.map((value) => (
              <div key={value.title} className={styles.valueCard}>
                <div className={styles.valueIcon}>
                  {value.icon}
                </div>
                <h3 className={styles.valueTitle}>{value.title}</h3>
                <p className={styles.valueDescription}>{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section} style={{ textAlign: 'center' }}>
        <div className="container">
          <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Want to work with us?</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-lg)' }}>
            We partner with district health offices, researchers, and NGOs across Rwanda.
          </p>
          <div className="flex justify-center gap-md">
            <button className="btn-primary" onClick={() => navigate('/contact')}>Contact Our Team</button>
            <button className="btn-outline" onClick={() => navigate('/dashboards')}>Explore Dashboards</button>
          </div>
        </div>
      </section>
    </div>
  );
}