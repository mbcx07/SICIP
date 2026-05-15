// ============================================================
// SICIP — Módulo: Catálogos (Documental + Salarial + Puestos)
// ============================================================

import React, { useState } from 'react';
import CatalogosDocScreen from './CatalogosDocScreen';
import SueldosScreen from './SueldosScreen';
import PuestosScreen from './PuestosScreen';
import { Book, DollarSign, Briefcase } from 'lucide-react';

const TABS = [
  { id: 'documental', label: 'Tipos Documentales', icon: <Book size={18} /> },
  { id: 'salarial', label: 'Cat. Salarial', icon: <DollarSign size={18} /> },
  { id: 'puestos', label: 'Puestos (CATEHOR)', icon: <Briefcase size={18} /> },
];

export default function CatalogosScreen() {
  const [tab, setTab] = useState('documental');

  return (
    <div style={{ padding: '1.5rem' }}>
      <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--brand-700)', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Book size={24} /> Catálogos
      </h1>

      <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.35rem',
              padding: '0.5rem 0.85rem', borderRadius: '0.5rem',
              border: '1px solid var(--border-soft)',
              background: tab === t.id ? 'var(--brand-600)' : 'white',
              color: tab === t.id ? 'white' : 'var(--text-muted)',
              fontWeight: tab === t.id ? 700 : 500, fontSize: '0.82rem', cursor: 'pointer'
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'documental' && <CatalogosDocScreen />}
      {tab === 'salarial' && <SueldosScreen />}
      {tab === 'puestos' && <PuestosScreen />}
    </div>
  );
}
