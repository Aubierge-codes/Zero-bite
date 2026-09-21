import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Building2, Landmark, Globe, Phone, Mail, WifiOff, Loader2, ArrowLeft } from 'lucide-react';
import styles from './Login.module.css';

const OTP_LENGTH = 6;

export default function Login() {
  const [activeRole, setActiveRole] = useState('chw');
  const [authMethod, setAuthMethod] = useState('phone');
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [sending, setSending] = useState(false);
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [otpError, setOtpError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (resendCooldown === 0) return;
    const timer = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleLogin = () => {
    // Navigate to respective dashboard based on role
    if (activeRole === 'ministry') navigate('/national');
    else if (activeRole === 'district') navigate('/district');
    else navigate('/worker');
  };

  const sendOtp = () => {
    if (!/^\+?[\d\s]{9,15}$/.test(phone.trim())) {
      setFormError('Enter a valid phone number.');
      return;
    }
    setFormError('');
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setStep('otp');
      setResendCooldown(30);
      setTimeout(() => otpRefs.current[0]?.focus(), 50);
    }, 900);
  };

  const handleEmailSubmit = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError('Enter a valid email address.');
      return;
    }
    if (!password) {
      setFormError('Enter your password.');
      return;
    }
    setFormError('');
    setSending(true);
    setTimeout(() => {
      setSending(false);
      handleLogin();
    }, 700);
  };

  const updateOtpDigit = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    setOtpError('');
    if (value && index < OTP_LENGTH - 1) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  };

  const verifyOtp = () => {
    if (otp.some((d) => d === '')) {
      setOtpError('Enter the full 6-digit code.');
      return;
    }
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      handleLogin();
    }, 800);
  };

  const backToCredentials = () => {
    setStep('credentials');
    setOtp(Array(OTP_LENGTH).fill(''));
    setOtpError('');
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
            {step === 'otp' ? (
              <div style={{ animation: 'fadeIn 250ms ease-out' }}>
                <button onClick={backToCredentials} className="flex items-center gap-sm" style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem', marginBottom: '1rem' }}>
                  <ArrowLeft size={14} /> Back
                </button>
                <h2>Enter Verification Code</h2>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                  We sent a 6-digit code to <strong>{phone}</strong>.
                </p>
                <div className="flex gap-sm" style={{ marginBottom: '0.75rem', justifyContent: 'center' }}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => updateOtpDigit(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      style={{
                        width: '44px', height: '52px', textAlign: 'center', fontSize: '1.25rem', fontWeight: 600,
                        border: `1px solid ${otpError ? 'var(--color-risk-critical)' : 'var(--color-border)'}`,
                        borderRadius: 'var(--radius-md)', outline: 'none',
                      }}
                    />
                  ))}
                </div>
                {otpError && <p style={{ color: 'var(--color-risk-critical)', fontSize: '0.8125rem', textAlign: 'center', marginBottom: '1rem' }}>{otpError}</p>}
                <button className={`btn-primary ${styles.btnFull}`} onClick={verifyOtp} disabled={verifying} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: verifying ? 0.7 : 1, marginTop: otpError ? 0 : '0.5rem' }}>
                  {verifying ? (<><Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Verifying...</>) : 'Verify & Sign In'}
                </button>
                <p style={{ textAlign: 'center', fontSize: '0.8125rem', marginTop: '1rem', color: 'var(--color-text-secondary)' }}>
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : (
                    <button onClick={sendOtp} style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Resend Code</button>
                  )}
                </p>
              </div>
            ) : (
            <>
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
                onClick={() => { setAuthMethod('phone'); setFormError(''); }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <Phone size={16} /> Phone OTP
              </div>
              <div
                className={`${styles.authTab} ${authMethod === 'email' ? styles.active : ''}`}
                onClick={() => { setAuthMethod('email'); setFormError(''); }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <Mail size={16} /> Email & Pass
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label>{authMethod === 'phone' ? 'Phone Number (MTN/Airtel)' : 'Email Address'}</label>
              {authMethod === 'phone' ? (
                <input type="tel" placeholder="+250 788 000 000" value={phone} onChange={(e) => setPhone(e.target.value)} />
              ) : (
                <input type="email" placeholder="name@gov.rw" value={email} onChange={(e) => setEmail(e.target.value)} />
              )}
            </div>

            {authMethod === 'email' && (
              <div className={styles.inputGroup}>
                <label>Password</label>
                <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            )}

            {authMethod === 'phone' && (
               <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginBottom: '1rem', textAlign: 'center' }}>
                 A one-time verification code will be sent to this number.
               </p>
            )}

            {formError && <p style={{ color: 'var(--color-risk-critical)', fontSize: '0.8125rem', marginBottom: '1rem' }}>{formError}</p>}

            <button
              className={`btn-primary ${styles.btnFull}`}
              onClick={authMethod === 'phone' ? sendOtp : handleEmailSubmit}
              disabled={sending}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: sending ? 0.7 : 1 }}
            >
              {sending ? (
                <><Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> {authMethod === 'phone' ? 'Sending...' : 'Signing in...'}</>
              ) : (authMethod === 'phone' ? 'Send OTP Code' : 'Sign In')}
            </button>
            </>
            )}

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
