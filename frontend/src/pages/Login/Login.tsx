import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Stethoscope, Building2, Landmark, Globe, Phone, Mail, WifiOff, Loader2 } from 'lucide-react';
import styles from './Login.module.css';
import * as authService from '../../services/authService';
import { useAuthStore, roleToDashboardPath } from '../../stores/authStore';

type RoleKey = 'chw' | 'district' | 'ministry' | 'public';
type AuthMethod = 'phone' | 'email';
type OtpStage = 'request' | 'verify';

const ROLE_TO_BACKEND: Record<Exclude<RoleKey, 'public'>, string> = {
  chw: 'community_worker',
  district: 'district_officer',
  ministry: 'ministry',
};

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);

  const redirectTo =
    (location.state as { from?: string } | null)?.from || null;

  const [activeRole, setActiveRole] = useState<RoleKey>('chw');
  const [authMethod, setAuthMethod] = useState<AuthMethod>('phone');
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpStage, setOtpStage] = useState<OtpStage>('request');
  const [otpCode, setOtpCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  const roleForBackend =
    activeRole === 'public' ? 'community_worker' : ROLE_TO_BACKEND[activeRole];

  const navigateAfterLogin = (role: string, explicitRedirect?: string) => {
    const target = redirectTo || explicitRedirect || roleToDashboardPath(role);
    navigate(target, { replace: true });
  };

  // ── Email / password mutation ──────────────────────────────────────────
  const emailLogin = useMutation({
    mutationFn: () => authService.loginWithEmail(phoneOrEmail, password),
    onSuccess: (res) => {
      setAuth(res.access_token, res.user);
      setErrorMsg(null);
      navigateAfterLogin(res.role, res.redirect_to);
    },
    onError: (err: any) => {
      setErrorMsg(err?.detail || err?.message || 'Invalid credentials. Please try again.');
    },
  });

  // ── Send OTP mutation ─────────────────────────────────────────────────
  const sendOtpMut = useMutation({
    mutationFn: () => authService.sendOtp(phoneOrEmail, roleForBackend),
    onSuccess: (res) => {
      setOtpStage('verify');
      setErrorMsg(null);
      if (res.dev_otp) {
        setDevOtpHint(res.dev_otp);
      }
    },
    onError: (err: any) => {
      setErrorMsg(
        err?.detail ||
          err?.message ||
          'Failed to send OTP. Please check the phone number.'
      );
    },
  });

  // ── Verify OTP mutation ───────────────────────────────────────────────
  const verifyOtpMut = useMutation({
    mutationFn: () => authService.verifyOtp(phoneOrEmail, otpCode),
    onSuccess: (res) => {
      setAuth(res.access_token, res.user);
      setErrorMsg(null);
      setDevOtpHint(null);
      navigateAfterLogin(res.role, res.redirect_to);
    },
    onError: (err: any) => {
      setErrorMsg(err?.detail || err?.message || 'Invalid OTP code.');
    },
  });

  const handlePublicPortalClick = () => navigate('/public');

  const handleSubmit = () => {
    setErrorMsg(null);
    if (activeRole === 'public') {
      handlePublicPortalClick();
      return;
    }

    if (authMethod === 'email') {
      if (!phoneOrEmail || !password) {
        setErrorMsg('Please enter both email and password.');
        return;
      }
      emailLogin.mutate();
    } else {
      if (!phoneOrEmail) {
        setErrorMsg('Please enter a phone number.');
        return;
      }
      if (otpStage === 'request') {
        sendOtpMut.mutate();
      } else {
        if (!otpCode || otpCode.length < 4) {
          setErrorMsg('Please enter the 6-digit OTP code.');
          return;
        }
        verifyOtpMut.mutate();
      }
    }
  };

  const submitting =
    emailLogin.isPending || sendOtpMut.isPending || verifyOtpMut.isPending;

  const resetOtpStage = () => {
    setOtpStage('request');
    setOtpCode('');
    setDevOtpHint(null);
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
              onClick={() => {
                setActiveRole('chw');
                resetOtpStage();
              }}
            >
              <div className={styles.roleIcon}><Stethoscope size={24} /></div>
              <div className={styles.roleInfo}>
                <h3>Community Worker</h3>
                <p>Village-level monitoring &amp; logs</p>
              </div>
            </div>

            <div
              className={`${styles.roleCard} ${activeRole === 'district' ? styles.active : ''}`}
              onClick={() => {
                setActiveRole('district');
                resetOtpStage();
              }}
            >
              <div className={styles.roleIcon}><Building2 size={24} /></div>
              <div className={styles.roleInfo}>
                <h3>District Officer</h3>
                <p>Regional forecasts &amp; alerts</p>
              </div>
            </div>

            <div
              className={`${styles.roleCard} ${activeRole === 'ministry' ? styles.active : ''}`}
              onClick={() => {
                setActiveRole('ministry');
                resetOtpStage();
              }}
            >
              <div className={styles.roleIcon}><Landmark size={24} /></div>
              <div className={styles.roleInfo}>
                <h3>Ministry Official</h3>
                <p>National strategy &amp; risk mapping</p>
              </div>
            </div>

            <div
              className={`${styles.roleCard} ${activeRole === 'public' ? styles.active : ''}`}
              onClick={handlePublicPortalClick}
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
            <div
              className="badge badge-moderate"
              style={{ marginBottom: '1rem', backgroundColor: '#E5E7EB', color: 'var(--color-text-secondary)' }}
            >
              {activeRole === 'chw'
                ? 'Community Worker Authentication'
                : activeRole === 'district'
                ? 'District Officer Authentication'
                : activeRole === 'ministry'
                ? 'Ministry Official Authentication'
                : 'Public Portal'}
            </div>
            <h2>Secure Login</h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
              Enter your credentials below to access the platform.
            </p>

            {activeRole !== 'public' && (
              <div className={styles.authTabs}>
                <div
                  className={`${styles.authTab} ${authMethod === 'phone' ? styles.active : ''}`}
                  onClick={() => {
                    setAuthMethod('phone');
                    resetOtpStage();
                    setPhoneOrEmail('');
                    setPassword('');
                    setErrorMsg(null);
                  }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  <Phone size={16} /> Phone OTP
                </div>
                <div
                  className={`${styles.authTab} ${authMethod === 'email' ? styles.active : ''}`}
                  onClick={() => {
                    setAuthMethod('email');
                    setPhoneOrEmail('');
                    setPassword('');
                    setErrorMsg(null);
                  }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  <Mail size={16} /> Email &amp; Pass
                </div>
              </div>
            )}

            {errorMsg && (
              <div
                style={{
                  padding: '0.625rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: '#FDE8E8',
                  color: '#B91C1C',
                  fontSize: '0.8125rem',
                  marginBottom: '1rem',
                }}
              >
                {errorMsg}
              </div>
            )}

            {activeRole !== 'public' && (
              <>
                <div className={styles.inputGroup}>
                  <label>
                    {authMethod === 'phone' ? 'Phone Number (MTN/Airtel)' : 'Email Address'}
                  </label>
                  <input
                    type={authMethod === 'phone' ? 'tel' : 'email'}
                    placeholder={authMethod === 'phone' ? '+250 788 000 000' : 'name@gov.rw'}
                    value={phoneOrEmail}
                    onChange={(e) => setPhoneOrEmail(e.target.value)}
                    disabled={submitting || (authMethod === 'phone' && otpStage === 'verify')}
                  />
                </div>

                {authMethod === 'email' ? (
                  <div className={styles.inputGroup}>
                    <label>Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={submitting}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSubmit();
                      }}
                    />
                  </div>
                ) : otpStage === 'verify' ? (
                  <>
                    <div className={styles.inputGroup}>
                      <label>OTP Code</label>
                      <input
                        type="text"
                        placeholder="Enter 6-digit code"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        disabled={submitting}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSubmit();
                        }}
                      />
                    </div>
                    {devOtpHint && (
                      <p
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--color-text-secondary)',
                          marginBottom: '1rem',
                          textAlign: 'center',
                        }}
                      >
                        Dev mode — your OTP is: <strong>{devOtpHint}</strong>
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        resetOtpStage();
                        setErrorMsg(null);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-text-secondary)',
                        fontSize: '0.8125rem',
                        marginBottom: '1rem',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      ← Request a new code
                    </button>
                  </>
                ) : (
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginBottom: '1rem', textAlign: 'center' }}>
                    A one-time verification code will be sent to this number.
                  </p>
                )}
              </>
            )}

            <button
              className={`btn-primary ${styles.btnFull}`}
              onClick={activeRole === 'public' ? handlePublicPortalClick : handleSubmit}
              disabled={submitting}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              {submitting && <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} />}
              {activeRole === 'public'
                ? 'Open Public Portal'
                : authMethod === 'email'
                ? submitting
                  ? 'Signing in...'
                  : 'Sign In'
                : otpStage === 'request'
                ? submitting
                  ? 'Sending OTP...'
                  : 'Send OTP Code'
                : submitting
                ? 'Verifying...'
                : 'Verify &amp; Sign In'}
            </button>

            <div className={styles.systemReliability}>
              <div style={{ color: 'var(--color-text-secondary)' }}><WifiOff size={24} /></div>
              <div>
                <h4 style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                  Offline Sync &amp; SMS Fallback{' '}
                  <span className="badge badge-low" style={{ marginLeft: '0.5rem' }}>ACTIVE</span>
                </h4>
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
