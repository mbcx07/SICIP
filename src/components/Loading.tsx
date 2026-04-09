import React from 'react';

interface LoadingProps {
  message?: string;
  fullScreen?: boolean;
}

const Loading: React.FC<LoadingProps> = ({ message = 'Cargando...', fullScreen = true }) => {
  const spinner = (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: 48, height: 48,
        border: '3px solid var(--brand-200)',
        borderTopColor: 'var(--brand-600)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        margin: '0 auto 1rem',
      }} />
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{message}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
        {spinner}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      {spinner}
    </div>
  );
};

export default Loading;
