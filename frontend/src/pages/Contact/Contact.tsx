import { useState, type FormEvent, type ChangeEvent } from 'react';
import { Mail, Phone, MapPin, Clock, Send, Users, Newspaper, LifeBuoy, Handshake, CheckCircle2, Loader2 } from 'lucide-react';
import styles from './Contact.module.css';

const channels = [
  { icon: <Users size={20} />, title: 'General Inquiries', email: 'hello@zerobite.rw' },
  { icon: <Handshake size={20} />, title: 'Partnerships & Research', email: 'partners@zerobite.rw' },
  { icon: <Newspaper size={20} />, title: 'Press & Media', email: 'press@zerobite.rw' },
  { icon: <LifeBuoy size={20} />, title: 'Technical Support', email: 'support@zerobite.rw' },
];

type FormStatus = 'idle' | 'submitting' | 'success';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', org: '', subject: '', message: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<FormStatus>('idle');

  const updateField = (field: keyof typeof form) => (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!form.name.trim()) nextErrors.name = 'Please tell us your name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) nextErrors.email = 'Enter a valid email address.';
    if (!form.message.trim()) nextErrors.message = 'Let us know what you need.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setStatus('submitting');
    setTimeout(() => setStatus('success'), 1100);
  };

  const resetForm = () => {
    setForm({ name: '', email: '', org: '', subject: '', message: '' });
    setErrors({});
    setStatus('idle');
  };

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
            {status === 'success' ? (
              <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl) 0', animation: 'scaleIn 300ms ease-out' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--spacing-md)', color: 'var(--color-risk-low)' }}>
                  <CheckCircle2 size={28} />
                </div>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Message sent</h2>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-lg)', maxWidth: '360px', margin: '0 auto var(--spacing-lg)' }}>
                  Thanks, {form.name.split(' ')[0] || 'there'}. Our team usually replies within one business day.
                </p>
                <button className="btn-outline" onClick={resetForm}>Send Another Message</button>
              </div>
            ) : (
            <>
            <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--spacing-lg)' }}>Send Us a Message</h2>
            <form onSubmit={handleSubmit} noValidate>
              <div className="grid grid-cols-2 gap-lg">
                <div className={styles.formGroup}>
                  <label htmlFor="contact-name">Full Name</label>
                  <input id="contact-name" type="text" placeholder="Jane Uwase" value={form.name} onChange={updateField('name')} style={errors.name ? { borderColor: 'var(--color-risk-critical)' } : undefined} />
                  {errors.name && <span className={styles.fieldError}>{errors.name}</span>}
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="contact-email">Email Address</label>
                  <input id="contact-email" type="email" placeholder="jane@organization.rw" value={form.email} onChange={updateField('email')} style={errors.email ? { borderColor: 'var(--color-risk-critical)' } : undefined} />
                  {errors.email && <span className={styles.fieldError}>{errors.email}</span>}
                </div>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="contact-org">Organization (optional)</label>
                <input id="contact-org" type="text" placeholder="Ministry of Health, District Office, NGO..." value={form.org} onChange={updateField('org')} />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="contact-subject">Subject</label>
                <select id="contact-subject" value={form.subject} onChange={updateField('subject')}>
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
                <textarea id="contact-message" rows={5} placeholder="Tell us a bit about what you need..." value={form.message} onChange={updateField('message')} style={errors.message ? { borderColor: 'var(--color-risk-critical)' } : undefined} />
                {errors.message && <span className={styles.fieldError}>{errors.message}</span>}
              </div>
              <button type="submit" className="btn-primary" disabled={status === 'submitting'} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: status === 'submitting' ? 0.7 : 1 }}>
                {status === 'submitting' ? (
                  <><Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Sending...</>
                ) : (
                  <><Send size={16} /> Send Message</>
                )}
              </button>
            </form>
            </>
            )}
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
