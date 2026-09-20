import { useNavigate } from 'react-router-dom';
import { MapPinOff } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div
      className="container"
      style={{
        minHeight: 'calc(100vh - 180px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 'var(--spacing-2xl) var(--spacing-lg)',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: '#F0F4F8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 'var(--spacing-lg)',
          color: 'var(--color-text-secondary)',
        }}
      >
        <MapPinOff size={28} />
      </div>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Page Not Found</h1>
      <p style={{ color: 'var(--color-text-secondary)', maxWidth: '440px', marginBottom: 'var(--spacing-xl)', lineHeight: 1.6 }}>
        The page you're looking for doesn't exist or may have moved. Check the URL, or head back to somewhere useful.
      </p>
      <div className="flex justify-center gap-md" style={{ flexWrap: 'wrap' }}>
        <button className="btn-primary" onClick={() => navigate('/')}>Back to Home</button>
        <button className="btn-outline" onClick={() => navigate('/contact')}>Contact Support</button>
      </div>
    </div>
  );
}
