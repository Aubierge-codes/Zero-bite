import { Loader2, AlertTriangle } from 'lucide-react';
import type { ReactNode } from 'react';

interface QueryStateProps {
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  minHeight?: number | string;
  children: ReactNode;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Something went wrong loading this data.';
}

export default function QueryState({ isLoading, isError, error, minHeight = 160, children }: QueryStateProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-sm" style={{ minHeight, color: 'var(--color-text-secondary)' }}>
        <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} />
        <span style={{ fontSize: '0.875rem' }}>Loading live data...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center gap-sm" style={{ minHeight, padding: 'var(--spacing-md)', color: 'var(--color-risk-critical)' }}>
        <AlertTriangle size={18} style={{ flexShrink: 0 }} />
        <span style={{ fontSize: '0.875rem' }}>{errorMessage(error)}</span>
      </div>
    );
  }

  return <>{children}</>;
}
