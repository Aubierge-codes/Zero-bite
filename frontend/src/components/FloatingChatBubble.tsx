import { useEffect, useRef, useState, type FormEvent } from 'react';
import { MessageCircle, X, Send, Bot } from 'lucide-react';
import * as predictionsService from '../services/predictionsService';

interface Msg {
  from: 'user' | 'bot';
  text: string;
}

const GREETING: Msg = {
  from: 'bot',
  text: "Hello! Ask me about a district's malaria risk (e.g. \"Risk in Kayonza\"), the highest-risk districts today, or prevention tips. Answers come from live weather and the risk model.",
};

/**
 * Answers come only from the live API (no invented data):
 *  - "<district>" / "risk in <district>"  -> public risk card for that district
 *  - "highest" / "top" / "worst"          -> today's top districts
 *  - "prevent" / "tips" / "protect"       -> prevention advice
 */
async function answer(question: string): Promise<string> {
  const q = question.toLowerCase();
  const districts = await predictionsService.listAllDistricts();

  const named = districts.find((d) => q.includes(d.district.toLowerCase()));
  if (named) {
    const r = await predictionsService.getPublicDistrictRisk(named.district);
    return `${r.district}: ${r.risk_score}/100 (${r.risk_level}, ${r.transmission_stage} stage). ${r.summary} ${r.weather_note}`;
  }

  if (/(highest|top|worst|most|priority|rank)/.test(q)) {
    const top = districts.slice(0, 5).map((d) => `${d.district} ${d.current_risk}/100 (${d.risk_level})`);
    return `Highest risk today: ${top.join('; ')}.`;
  }

  if (/(prevent|tip|protect|net|advice|what should)/.test(q)) {
    const worst = districts[0];
    const r = await predictionsService.getPublicDistrictRisk(worst.district);
    return r.recommended_prevention.map((p) => `${p.action}: ${p.detail}`).join(' ');
  }

  return 'I can answer questions about a specific district ("Risk in Huye"), the highest-risk districts, or prevention tips.';
}

export default function FloatingChatBubble() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput('');
    setMessages((m) => [...m, { from: 'user', text }]);
    setBusy(true);
    try {
      const reply = await answer(text);
      setMessages((m) => [...m, { from: 'bot', text: reply }]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        { from: 'bot', text: err instanceof Error ? `Sorry, I could not load live data: ${err.message}` : 'Sorry, I could not load live data.' },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {open && (
        <div
          role="dialog"
          aria-label="Zero Bite assistant"
          style={{
            position: 'fixed', bottom: '5.5rem', right: '2rem', width: 'min(360px, calc(100vw - 2rem))', height: '440px',
            backgroundColor: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', zIndex: 60, overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: 'var(--spacing-md)', backgroundColor: 'var(--color-primary)', color: 'white' }}>
            <Bot size={18} />
            <strong style={{ flex: 1, fontSize: '0.9375rem' }}>Zero Bite Assistant</strong>
            <button aria-label="Close" onClick={() => setOpen(false)} style={{ color: 'white', display: 'flex' }}><X size={18} /></button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--spacing-md)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)', backgroundColor: '#F9FAFB' }}>
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.from === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%', padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius-md)', fontSize: '0.875rem', lineHeight: 1.5,
                  backgroundColor: m.from === 'user' ? 'var(--color-primary)' : 'white',
                  color: m.from === 'user' ? 'white' : 'var(--color-text-primary)',
                  border: m.from === 'user' ? 'none' : '1px solid var(--color-border)',
                }}
              >
                {m.text}
              </div>
            ))}
            {busy && <div style={{ alignSelf: 'flex-start', fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>Checking live data…</div>}
            <div ref={endRef} />
          </div>
          <form onSubmit={send} style={{ display: 'flex', gap: 'var(--spacing-sm)', padding: 'var(--spacing-sm)', borderTop: '1px solid var(--color-border)' }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about a district…"
              style={{ flex: 1, padding: 'var(--spacing-sm) var(--spacing-md)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-pill)', outline: 'none' }}
            />
            <button type="submit" aria-label="Send" disabled={busy || !input.trim()} style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
      <button
        aria-label={open ? 'Close AI Assistant' : 'Open AI Assistant'}
        onClick={() => setOpen((v) => !v)}
        style={{
          position: 'fixed', bottom: '2rem', right: '2rem', width: '52px', height: '52px', borderRadius: '50%',
          backgroundColor: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center',
          justifyContent: 'center', border: 'none', boxShadow: 'var(--shadow-lg)', cursor: 'pointer', zIndex: 50,
        }}
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </>
  );
}
