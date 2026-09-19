import styles from './Landing.module.css';
import { useNavigate } from 'react-router-dom';
import { Satellite, Brain, Smartphone } from 'lucide-react';
import RwandaHeroMap from '../../components/RwandaHeroMap';

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
