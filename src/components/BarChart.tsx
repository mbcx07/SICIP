import React from 'react';

interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  title?: string;
}

export default function BarChart({ data, title }: BarChartProps) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {title && <h4 style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>{title}</h4>}
      {data.map((d, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ width: 90, fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'right', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.label}</div>
          <div style={{ flex: 1, height: 22, background: 'var(--surface-soft)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${(d.value / max) * 100}%`,
              background: d.color || 'var(--brand-500)',
              borderRadius: '4px',
              transition: 'width 0.4s ease',
              minWidth: d.value > 0 ? 4 : 0,
            }} />
          </div>
          <div style={{ width: 24, fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'right' }}>{d.value}</div>
        </div>
      ))}
    </div>
  );
}
