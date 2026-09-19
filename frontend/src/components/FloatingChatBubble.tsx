import { MessageCircle } from 'lucide-react';

export default function FloatingChatBubble() {
  return (
    <button
      aria-label="Open AI Assistant"
      style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        width: '52px',
        height: '52px',
        borderRadius: '50%',
        backgroundColor: 'var(--color-primary)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: 'none',
        boxShadow: 'var(--shadow-lg)',
        cursor: 'pointer',
        zIndex: 50,
      }}
    >
      <MessageCircle size={22} />
    </button>
  );
}
