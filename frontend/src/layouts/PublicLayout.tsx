import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import styles from './PublicLayout.module.css';

export default function PublicLayout() {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className="container flex justify-between items-center">
          <div className="flex items-center gap-sm">
            <div className={styles.logo}></div>
            <span className={styles.logoText}>Zero Bite</span>
          </div>
          <nav className={`${styles.nav} ${navOpen ? styles.navOpen : ''}`}>
            <a href="/" onClick={() => setNavOpen(false)}>Home</a>
            <a href="/about" onClick={() => setNavOpen(false)}>About</a>
            <a href="/dashboards" onClick={() => setNavOpen(false)}>Dashboards</a>
            <a href="/reports" onClick={() => setNavOpen(false)}>Reports</a>
            <a href="/contact" onClick={() => setNavOpen(false)}>Contact</a>
          </nav>
          <div className="flex items-center gap-md">
            <span className={styles.langToggle}>EN / RW</span>
            <a href="/login" className="btn-primary">Login</a>
            <button className={styles.menuToggle} onClick={() => setNavOpen((v) => !v)} aria-label="Toggle menu">
              {navOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className={styles.footer}>
        <div className="container flex justify-between" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--spacing-2xl)', paddingBottom: 'var(--spacing-xl)' }}>
           <div className={styles.footerBrand}>
             <div className="flex items-center gap-sm">
                <div className={styles.logo}></div>
                <span className={styles.logoText}>Zero Bite</span>
             </div>
             <p>Protecting communities through satellite-driven AI predictions and real-time climate intelligence.</p>
           </div>
           <div className={styles.footerColumns}>
             <div className={styles.footerColumn}>
                <h4>Resources</h4>
                <ul>
                  <li><a href="#">Data Methodology</a></li>
                  <li><a href="#">Meteo Rwanda Portal</a></li>
                  <li><a href="#">MoH Health Guide</a></li>
                </ul>
             </div>
             <div className={styles.footerColumn}>
                <h4>Support</h4>
                <ul>
                  <li><a href="#">Help Center</a></li>
                  <li><a href="#">Contact Us</a></li>
                  <li><a href="/login">Admin Login</a></li>
                </ul>
             </div>
             <div className={styles.footerColumn}>
                <h4>Platform</h4>
                <ul>
                  <li><a href="/public">Public Dashboard</a></li>
                  <li><a href="#">SMS Subscription</a></li>
                  <li><a href="#">API Access</a></li>
                </ul>
             </div>
           </div>
        </div>
        <div className={styles.copyright}>
          <div className="container flex justify-between items-center">
            <span>© 2024 Zero Bite Rwanda. Powered by AI and Satellite Data.</span>
            <div className="flex gap-md">
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <span>English (UK)</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
