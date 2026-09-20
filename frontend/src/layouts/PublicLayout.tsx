import { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
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
        </div>
        <div className={styles.copyright}>
          <div className="container flex justify-between items-center">
            <span>© 2024 Zero Bite Rwanda. Powered by AI and Satellite Data.</span>
            <div className="flex gap-md">
              <Link to="/privacy">Privacy Policy</Link>
              <a href="#">Terms of Service</a>
              <span>English (UK)</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
