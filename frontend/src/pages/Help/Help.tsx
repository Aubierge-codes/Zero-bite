import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, LifeBuoy } from 'lucide-react';

const faqs = [
  {
    question: "How accurate are Zero Bite's predictions?",
    answer: "The model is trained on more than ten years of daily NASA POWER weather records for Rwanda's districts and evaluated on a held-out 20% test set; its measured accuracy is shown on the About page and in Settings. It estimates weather-driven breeding risk, not confirmed case counts.",
  },
  {
    question: 'How do I subscribe to SMS risk alerts?',
    answer: "Visit the Public Portal, search for your district, and use the \"Subscribe Free\" form -- or use the \"Subscribe to Local Alerts\" box on the homepage. No smartphone required, and you can unsubscribe any time by texting STOP.",
  },
  {
    question: "I'm a Community Health Worker. How do I get dashboard access?",
    answer: "Platform accounts are issued by your District Health Office. Reach out through our Contact page and we'll connect you with the right district administrator.",
  },
  {
    question: 'What do the risk levels mean?',
    answer: "Scores run from 0 to 100 and are grouped into Low, Moderate, High and Critical. Low means minimal breeding conditions, Moderate means conditions favour mosquito activity, High means a high probability of transmission, and Critical means immediate preventive action is required. The exact cut-offs are listed in the Risk Band Guide on the Public Portal.",
  },
  {
    question: 'Is my personal data safe?',
    answer: 'Yes. We only collect what is needed to deliver alerts and never sell personal data to third parties. See our Privacy Policy for the full details.',
  },
  {
    question: 'Who do I contact for technical support?',
    answer: 'Email support@zerobite.rw, or use the Technical Support channel on our Contact page -- we typically respond within one business day.',
  },
];

export default function Help() {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="container" style={{ padding: 'var(--spacing-2xl) 0', maxWidth: '760px' }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-2xl)' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#F0F4F8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--spacing-md)', color: 'var(--color-text-secondary)' }}>
          <LifeBuoy size={26} />
        </div>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Help Center</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.0625rem' }}>Answers to the questions we hear most often.</p>
      </div>

      <div className="flex-col gap-md">
        {faqs.map((faq, i) => {
          const isOpen = openIndex === i;
          return (
            <div key={faq.question} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <button
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="flex justify-between items-center"
                style={{ width: '100%', padding: 'var(--spacing-lg)', textAlign: 'left', fontWeight: 600, gap: 'var(--spacing-md)' }}
              >
                <span>{faq.question}</span>
                <ChevronDown size={18} style={{ flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform var(--transition-fast)', color: 'var(--color-text-secondary)' }} />
              </button>
              {isOpen && (
                <p style={{ padding: '0 var(--spacing-lg) var(--spacing-lg)', color: 'var(--color-text-secondary)', lineHeight: 1.7, fontSize: '0.9375rem' }}>
                  {faq.answer}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="card" style={{ marginTop: 'var(--spacing-2xl)', textAlign: 'center' }}>
        <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>Still need help?</h3>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-lg)' }}>Our team is happy to walk you through it directly.</p>
        <button className="btn-primary" onClick={() => navigate('/contact')}>Contact Our Team</button>
      </div>
    </div>
  );
}
