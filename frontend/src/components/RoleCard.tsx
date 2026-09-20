import type { ReactNode } from 'react';

interface RoleCardProps {
  icon: ReactNode;
  title: string;
  tag: string;
  description: string;
  actionLabel?: string;
  onAction: () => void;
}

export default function RoleCard({ icon, title, tag, description, actionLabel = 'Enter Dashboard', onAction }: RoleCardProps) {
  return (
    <div className="card" style={{ textAlign: 'left' }}>
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: '#F3F4F6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 'var(--spacing-md)',
        }}
      >
        {icon}
      </div>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--color-text-tertiary)', marginBottom: '0.25rem' }}>
        {tag}
      </div>
      <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>{title}</h3>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: 'var(--spacing-lg)' }}>
        {description}
      </p>
      <button className="btn-outline" style={{ width: '100%' }} onClick={onAction}>
        {actionLabel}
      </button>
    </div>
  );
}
