interface Section {
  heading: string;
  body: string;
}

interface LegalPageLayoutProps {
  title: string;
  updated: string;
  intro: string;
  sections: Section[];
}

export default function LegalPageLayout({ title, updated, intro, sections }: LegalPageLayoutProps) {
  return (
    <div className="container" style={{ padding: 'var(--spacing-2xl) 0', maxWidth: '760px' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{title}</h1>
      <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.875rem', marginBottom: 'var(--spacing-xl)' }}>
        Last updated: {updated}
      </p>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.0625rem', lineHeight: 1.7, marginBottom: 'var(--spacing-2xl)' }}>
        {intro}
      </p>
      {sections.map((section) => (
        <div key={section.heading} style={{ marginBottom: 'var(--spacing-xl)' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{section.heading}</h2>
          <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>{section.body}</p>
        </div>
      ))}
    </div>
  );
}
