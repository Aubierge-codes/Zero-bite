/** Small formatting helpers shared by the dashboards. */

export function timeAgo(iso: string | Date): string {
  // Backend timestamps are UTC; naive strings (no offset) are treated as UTC.
  const s = typeof iso === 'string' && !/[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? `${iso}Z` : iso;
  const diff = Date.now() - new Date(s).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export function riskLevelClass(level?: string): string {
  switch ((level || '').toUpperCase()) {
    case 'CRITICAL':
      return 'badge-critical';
    case 'HIGH':
      return 'badge-high';
    case 'MODERATE':
      return 'badge-moderate';
    default:
      return 'badge-low';
  }
}

export function riskColorVar(score: number): string {
  if (score >= 76) return 'var(--color-risk-critical)';
  if (score >= 51) return 'var(--color-risk-high)';
  if (score >= 26) return 'var(--color-risk-moderate)';
  return 'var(--color-risk-low)';
}

export function formatDateTime(iso: string): string {
  const s = /[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? iso : `${iso}Z`;
  return new Date(s).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function signedPts(n: number): string {
  return `${n > 0 ? '+' : ''}${n} pts`;
}

export function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const escape = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = rows.map((r) => r.map(escape).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
