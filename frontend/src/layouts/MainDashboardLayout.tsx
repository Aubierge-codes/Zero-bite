import { useState } from 'react';
import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, Bell, Building2, FileText, Settings, ShieldCheck, LogOut, Globe, Menu, X } from 'lucide-react';
import styles from './MainDashboardLayout.module.css';
import FloatingChatBubble from '../components/FloatingChatBubble';
import { useAuthStore, roleToDashboardPath } from '../stores/authStore';
import * as authService from '../services/authService';
import * as dashboardService from '../services/dashboardService';
import { useQuery } from '@tanstack/react-query';
import { timeAgo } from '../lib/format';

export default function MainDashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const logoutStore = useAuthStore((s) => s.logout);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardService.getDashboardStats(),
    enabled: !!token,
    refetchInterval: 5 * 60 * 1000,
  });
  const hasEmbeddedAssistant = location.pathname.startsWith('/district') || location.pathname.startsWith('/worker');

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const dashboardPath = user ? roleToDashboardPath(user.role) : null;

  const navItems = [
    { path: dashboardPath || '/national', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/alerts', icon: <Bell size={20} />, label: 'Alerts Center' },
    { path: '/districts', icon: <Building2 size={20} />, label: 'District List' },
    { path: '/reports', icon: <FileText size={20} />, label: 'Reports' },
    { path: '/settings', icon: <Settings size={20} />, label: 'Settings' },
  ];

  const goTo = (path: string) => {
    navigate(path);
    setSidebarOpen(false);
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      /* ignore */
    }
    logoutStore();
    navigate('/login', { replace: true });
  };

  const profileName = user?.name || 'Guest';
  const profileRole = user?.role
    ? {
        ministry: 'Ministry',
        admin: 'Admin',
        district_officer: 'District Officer',
        district: 'District Officer',
        community_worker: 'CHW',
        field_worker: 'Field Worker',
        worker: 'Worker',
        chw: 'CHW',
      }[user.role] || user.role
    : 'Not signed in';

  return (
    <div className={styles.layout}>
      {sidebarOpen && <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.brand}>
          <img src="/zero.png" alt="Zero Bite logo" className={styles.logo} />
          <span className={styles.brandText}>Zero Bite</span>
          <button className={styles.sidebarClose} onClick={() => setSidebarOpen(false)} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <nav className={styles.nav}>
          {navItems.map(item => (
            <div
              key={item.path}
              className={`${styles.navItem} ${location.pathname.startsWith(item.path) ? styles.active : ''}`}
              onClick={() => goTo(item.path)}
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
              <div className={styles.aiStatusTitle}>AI Status</div>
              <div className={styles.aiStatusDetail}>{stats?.prediction.last_run ? `Predictions updated ${timeAgo(stats.prediction.last_run)}. Live weather feed active.` : 'Waiting for the first prediction run…'}</div>
            </div>
          </div>
          <div className={styles.logout} onClick={handleLogout}>
            <span><LogOut size={20} /></span>
            <span>Logout</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {/* Topbar */}
        <header className={styles.topbar}>
          <button className={styles.menuToggle} onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <Menu size={22} />
          </button>

          <div className={styles.topNav}>
            <a onClick={() => navigate('/national')} className={location.pathname.startsWith('/national') ? styles.active : ''}>National</a>
            <a onClick={() => navigate('/district')} className={location.pathname.startsWith('/district') ? styles.active : ''}>Districts</a>
            <a onClick={() => navigate('/alerts')} className={location.pathname.startsWith('/alerts') ? styles.active : ''}>Alerts</a>
          </div>

          <div className={styles.profileSection}>
            <span className={styles.langToggle} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Globe size={16} /> EN / RW</span>
            <div className={styles.profile}>
              <div className={styles.profileInfo}>
                <div className={styles.profileRole}>{profileRole}</div>
                <div className={styles.profileName}>{profileName}</div>
              </div>
              <div className={styles.avatar}></div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div key={location.pathname} className={`${styles.pageContent} page-fade-in`}>
          <Outlet />
        </div>
      </main>
      {!hasEmbeddedAssistant && <FloatingChatBubble />}
    </div>
  );
}
