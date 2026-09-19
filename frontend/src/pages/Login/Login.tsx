import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Building2, Landmark, Globe, Phone, Mail, WifiOff } from 'lucide-react';
import styles from './Login.module.css';

export default function Login() {
  const [activeRole, setActiveRole] = useState('chw');
  const [authMethod, setAuthMethod] = useState('phone');
  const navigate = useNavigate();

  const handleLogin = () => {
    // Navigate to respective dashboard based on role
    if (activeRole === 'ministry') navigate('/national');
    else if (activeRole === 'district') navigate('/district');
    else navigate('/worker');
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginWrapper}>
        <div className={styles.roleSelection}>
          <h1>Welcome to Zero Bite</h1>
          <p>Please select your designated role to access the climate-intelligence portal.</p>
          
          <div className={styles.roleList}>
            <div 
              className={`${styles.roleCard} ${activeRole === 'chw' ? styles.active : ''}`}
              onClick={() => setActiveRole('chw')}
            >
              <div className={styles.roleIcon}><Stethoscope size={24} /></div>
              <div className={styles.roleInfo}>
                <h3>Community Worker</h3>
                <p>Village-level monitoring & logs</p>
              </div>
            </div>
            
            <div 
              className={`${styles.roleCard} ${activeRole === 'district' ? styles.active : ''}`}
              onClick={() => setActiveRole('district')}
            >
              <div className={styles.roleIcon}><Building2 size={24} /></div>
              <div className={styles.roleInfo}>
                <h3>District Officer</h3>
                <p>Regional forecasts & alerts</p>
              </div>
            </div>

            <div 
              className={`${styles.roleCard} ${activeRole === 'ministry' ? styles.active : ''}`}
              onClick={() => setActiveRole('ministry')}
            >
              <div className={styles.roleIcon}><Landmark size={24} /></div>
              <div className={styles.roleInfo}>
                <h3>Ministry Official</h3>
                <p>National strategy & risk mapping</p>
              </div>
            </div>

            <div 
              className={`${styles.roleCard} ${activeRole === 'public' ? styles.active : ''}`}
              onClick={() => navigate('/public')}
            >
              <div className={styles.roleIcon}><Globe size={24} /></div>
              <div className={styles.roleInfo}>
                <h3>Public Portal</h3>
                <p>General risk view (Read-only)</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className={styles.loginFormCard}>
            <div className="badge badge-moderate" style={{ marginBottom: '1rem', backgroundColor: '#E5E7EB', color: 'var(--color-text-secondary)' }}>
              {activeRole === 'chw' ? 'Community Worker Authentication' : activeRole === 'district' ? 'District Officer Authentication' : 'Ministry Official Authentication'}
            </div>
            <h2>Secure Login</h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
              Enter your credentials below to access the platform.
            </p>

            <div className={styles.authTabs}>
              <div 
                className={`${styles.authTab} ${authMethod === 'phone' ? styles.active : ''}`}
                onClick={() => setAuthMethod('phone')}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <Phone size={16} /> Phone OTP
              </div>
              <div 
                className={`${styles.authTab} ${authMethod === 'email' ? styles.active : ''}`}
                onClick={() => setAuthMethod('email')}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <Mail size={16} /> Email & Pass
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label>{authMethod === 'phone' ? 'Phone Number (MTN/Airtel)' : 'Email Address'}</label>
              <input type={authMethod === 'phone' ? 'tel' : 'email'} placeholder={authMethod === 'phone' ? '+250 788 000 000' : 'name@gov.rw'} />
            </div>

            {authMethod === 'email' && (
              <div className={styles.inputGroup}>
                <label>Password</label>
                <input type="password" placeholder="••••••••" />
              </div>
            )}
            
            {authMethod === 'phone' && (
               <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginBottom: '1rem', textAlign: 'center' }}>
                 A one-time verification code will be sent to this number.
               </p>
            )}

            <button className={`btn-primary ${styles.btnFull}`} onClick={handleLogin}>
              {authMethod === 'phone' ? 'Send OTP Code' : 'Sign In'}
            </button>
            
            <div className={styles.systemReliability}>
              <div style={{ color: 'var(--color-text-secondary)' }}><WifiOff size={24} /></div>
              <div>
                <h4 style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Offline Sync & SMS Fallback <span className="badge badge-low" style={{ marginLeft: '0.5rem' }}>ACTIVE</span></h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                  Low connectivity? Zero Bite supports SMS-based data logging and critical alert reception.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
