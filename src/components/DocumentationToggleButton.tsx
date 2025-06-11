
import { useDocumentationMode } from '@/context/DocumentationModeContext';
import { HelpCircle } from 'lucide-react';

export function DocumentationToggleButton() {
  const { enabled, toggle } = useDocumentationMode();
  return (
    <button
      onClick={toggle}
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 1000,
        background: enabled ? '#6366f1' : '#e5e7eb',
        color: enabled ? '#fff' : '#111',
        borderRadius: '50%',
        width: 48,
        height: 48,
        border: 'none',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 0.2s',
      }}
      title={enabled ? 'Disable Documentation Mode' : 'Enable Documentation Mode'}
    >
      <HelpCircle size={28} />
    </button>
  );
} 
