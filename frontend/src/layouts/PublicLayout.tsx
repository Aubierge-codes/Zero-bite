import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import styles from './PublicLayout.module.css';

export default function PublicLayout() {
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className="container flex justify-between items-center">
          <div className="flex items-center gap-sm">
            <img src="/zero.png" alt="Zero Bite logo" className={styles.logo} />
            <span className={styles.logoText}>Zero Bite</span>
          </div>
          <nav className={`${styles.nav} ${navOpen ? styles.navOpen : ''}`}>
            <Link to="/" onClick={() => setNavOpen(false)}>Home</Link>
            <Link to="/about" onClick={() => setNavOpen(false)}>About</Link>
            <Link to="/dashboards" onClick={() => setNavOpen(false)}>Dashboards</Link>
            <Link to="/reports" onClick={() => setNavOpen(false)}>Reports</Link>
            <Link to="/contact" onClick={() => setNavOpen(false)}>Contact</Link>
          </nav>
          <div className="flex items-center gap-md">
            <span className={styles.langToggle}>EN / RW</span>
            <Link to="/login" className="btn-primary">Login</Link>
            <button className={styles.menuToggle} onClick={() => setNavOpen((v) => !v)} aria-label="Toggle menu">
              {navOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>
      <main key={location.pathname} className="page-fade-in">
        <Outlet />
      </main>
      <footer className={styles.footer}>
        <div className="container">
          <div className={styles.footerGrid}>
           <div className={styles.footerBrand}>
             <div className={styles.footerLogoRow}>
                <img src="/zero.png" alt="Zero Bite logo" className={styles.footerLogo} />
                <span className={styles.footerLogoText}>Zero Bite</span>
             </div>
             <p>Protecting communities through satellite-driven AI predictions and real-time climate intelligence.</p>
           </div>
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
                <li><Link to="/help">Help Center</Link></li>
                <li><Link to="/contact">Contact Us</Link></li>
                <li><Link to="/login">Admin Login</Link></li>
              </ul>
           </div>
           <div className={styles.footerColumn}>
              <h4>Platform</h4>
              <ul>
                <li><Link to="/public">Public Dashboard</Link></li>
                <li><a href="#">SMS Subscription</a></li>
                <li><a href="#">API Access</a></li>
              </ul>
           </div>
        </div>
        <hr className={styles.footerDivider} />
        <div className={styles.copyright}>
          <span className={styles.copyrightLeft}>© 2024 Zero Bite Rwanda. Powered by AI and Satellite Data.</span>
          <div className={styles.copyrightRight}>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
            <span>English (UK)</span>
          </div>
        </div>
        </div>
      </footer>
    </div>
  );
}
