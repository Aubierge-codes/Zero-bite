import { Mail, Phone, MapPin, Clock, Send, Users, Newspaper, LifeBuoy, Handshake } from 'lucide-react';
import styles from './Contact.module.css';

const channels = [
  { icon: <Users size={20} />, title: 'General Inquiries', email: 'hello@zerobite.rw' },
  { icon: <Handshake size={20} />, title: 'Partnerships & Research', email: 'partners@zerobite.rw' },
  { icon: <Newspaper size={20} />, title: 'Press & Media', email: 'press@zerobite.rw' },
  { icon: <LifeBuoy size={20} />, title: 'Technical Support', email: 'support@zerobite.rw' },
];

export default function Contact() {
  return (
    <div>
      <section className={styles.hero}>
        <div className="container">
          <h1 className={styles.heroTitle}>Get in Touch</h1>
          <p className={styles.heroSubtitle}>
            Questions about a district rollout, partnership opportunities, or platform access? Our team usually
            responds within one business day.
          </p>
        </div>
      </section>

      <section className="container" style={{ padding: 'var(--spacing-2xl) 0' }}>
        <div className="split-2-1">
          <div className="card">
            <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--spacing-lg)' }}>Send Us a Message</h2>
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-2 gap-lg">
                <div className={styles.formGroup}>
                  <label htmlFor="contact-name">Full Name</label>
                  <input id="contact-name" type="text" placeholder="Jane Uwase" />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="contact-email">Email Address</label>
                  <input id="contact-email" type="email" placeholder="jane@organization.rw" />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="contact-org">Organization (optional)</label>
                <input id="contact-org" type="text" placeholder="Ministry of Health, District Office, NGO..." />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="contact-subject">Subject</label>
                <select id="contact-subject" defaultValue="">
                  <option value="" disabled>Select a topic</option>
                  <option>District rollout / platform access</option>
                  <option>Partnership or research collaboration</option>
                  <option>Technical support</option>
                  <option>Press &amp; media</option>
                  <option>Other</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="contact-message">Message</label>
                <textarea id="contact-message" rows={5} placeholder="Tell us a bit about what you need..." />
              </div>
              <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Send size={16} /> Send Message
              </button>
            </form>
          </div>

          <div className="flex-col gap-lg">
            <div className="card">
              <h3 style={{ fontSize: '1rem', marginBottom: 'var(--spacing-lg)' }}>Contact Information</h3>
              <div className="flex-col gap-lg">
                <div className={styles.infoRow}>
                  <div className={styles.infoIcon}><Mail size={18} /></div>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>Email</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>hello@zerobite.rw</div>
                  </div>
                </div>
                <div className={styles.infoRow}>
                  <div className={styles.infoIcon}><Phone size={18} /></div>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>Phone</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>+250 788 000 000</div>
                  </div>
                </div>
                <div className={styles.infoRow}>
                  <div className={styles.infoIcon}><MapPin size={18} /></div>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>Office</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Kigali Innovation City, Kigali, Rwanda</div>
                  </div>
                </div>
                <div className={styles.infoRow}>
                  <div className={styles.infoIcon}><Clock size={18} /></div>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>Support Hours</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Mon – Fri, 8:00 AM – 5:00 PM CAT</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card" style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Need urgent field support?</h3>
              <p style={{ fontSize: '0.875rem', color: '#D1D5DB', marginBottom: 'var(--spacing-md)' }}>
                For active outbreak response, use the 24/7 hotlines below.
              </p>
              <div className="flex justify-between items-center" style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                <span>Emergency Toll-Free</span>
                <strong>114</strong>
              </div>
              <div className="flex justify-between items-center" style={{ fontSize: '0.875rem' }}>
                <span>Malaria Hotline</span>
                <strong>3456</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.hero} style={{ borderBottom: 'none', borderTop: '1px solid var(--color-border)' }}>
        <div className="container">
          <h2 style={{ fontSize: '1.5rem', marginBottom: 'var(--spacing-xl)' }}>Other Ways to Reach Us</h2>
          <div className={styles.channelGrid}>
            {channels.map((channel) => (
              <div key={channel.title} className={`card ${styles.channelCard}`} style={{ textAlign: 'left' }}>
                <div className={styles.infoIcon} style={{ marginBottom: 'var(--spacing-md)' }}>{channel.icon}</div>
                <h4 style={{ fontSize: '0.9375rem', marginBottom: '0.25rem' }}>{channel.title}</h4>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>{channel.email}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
