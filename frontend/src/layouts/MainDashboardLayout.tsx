import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Bell, Building2, FileText, Settings, ShieldCheck, LogOut, Globe } from 'lucide-react';
import styles from './MainDashboardLayout.module.css';
import FloatingChatBubble from '../components/FloatingChatBubble';

export default function MainDashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const hasEmbeddedAssistant = location.pathname.startsWith('/district') || location.pathname.startsWith('/worker');

  const navItems = [
    { path: '/national', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/alerts', icon: <Bell size={20} />, label: 'Alerts Center' },
    { path: '/districts', icon: <Building2 size={20} />, label: 'District List' },
    { path: '/reports', icon: <FileText size={20} />, label: 'Reports' },
    { path: '/settings', icon: <Settings size={20} />, label: 'Settings' },
  ];

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <div className={styles.logo}></div>
          <span className={styles.brandText}>Zero Bite</span>
        </div>
        
        <nav className={styles.nav}>
          {navItems.map(item => (
            <div 
              key={item.path}
              className={`${styles.navItem} ${location.pathname.startsWith(item.path) ? styles.active : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.aiStatus}>
            <span className={styles.aiStatusIcon}><ShieldCheck size={20} /></span>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>AI Status</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Models updated 12m ago. Satellite feed active.</div>
            </div>
          </div>
          <div className={styles.logout} onClick={() => navigate('/login')}>
            <span><LogOut size={20} /></span>
            <span>Logout</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {/* Topbar */}
        <header className={styles.topbar}>
          <div className={styles.topNav}>
            <a onClick={() => navigate('/national')} className={location.pathname.startsWith('/national') ? styles.active : ''}>National</a>
            <a onClick={() => navigate('/district')} className={location.pathname.startsWith('/district') ? styles.active : ''}>Districts</a>
            <a onClick={() => navigate('/alerts')} className={location.pathname.startsWith('/alerts') ? styles.active : ''}>Alerts</a>
          </div>
          
          <div className={styles.profileSection}>
            <span className={styles.langToggle} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Globe size={16} /> EN / RW</span>
            <div className={styles.profile}>
              <div className={styles.profileInfo}>
                <div className={styles.profileRole}>Ministry</div>
                <div className={styles.profileName}>U. Ndayisaba</div>
              </div>
              <div className={styles.avatar}></div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className={styles.pageContent}>
          <Outlet />
        </div>
      </main>
      {!hasEmbeddedAssistant && <FloatingChatBubble />}
    </div>
  );
}
