import React, { useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warn' | 'info';

interface ToastProps {
  type: ToastType;
  message: string;
  onClose: () => void;
  duration?: number;
}

const icons = {
  success: <CheckCircle2 size={18} />,
  error: <XCircle size={18} />,
  warn: <AlertTriangle size={18} />,
  info: <Info size={18} />,
};

const colors = {
  success: { bg: '#f0fdf4', border: '#bbf7d0', icon: '#22c55e', text: '#166534' },
  error: { bg: '#fef2f2', border: '#fecaca', icon: '#ef4444', text: '#991b1b' },
  warn: { bg: '#fffbeb', border: '#fde68a', icon: '#f59e0b', text: '#92400e' },
  info: { bg: '#eff6ff', border: '#bfdbfe', icon: '#3b82f6', text: '#1e40af' },
};

const Toast: React.FC<ToastProps> = ({ type, message, onClose, duration = 4000 }) => {
  useEffect(() => {
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [onClose, duration]);

  const c = colors[type];

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.875rem 1.25rem',
      background: c.bg,
      border: `1px solid ${c.border}`,
      borderRadius: '0.75rem',
      boxShadow: '0 4px 12px rgb(0 0 0 / 0.1)',
      maxWidth: 400,
      animation: 'slideIn 0.2s ease-out',
    }}>
      <span style={{ color: c.icon, flexShrink: 0 }}>{icons[type]}</span>
      <span style={{ flex: 1, fontSize: '0.875rem', fontWeight: 500, color: c.text }}>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.icon, padding: '0.15rem', flexShrink: 0 }}>
        <X size={16} />
      </button>
    </div>
  );
};

// Toast Container Manager
export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  return (
    <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', zIndex: 9999 }}>
      {toasts.map(t => (
        <Toast key={t.id} type={t.type} message={t.message} onClose={() => onRemove(t.id)} />
      ))}
    </div>
  );
};

export default Toast;
