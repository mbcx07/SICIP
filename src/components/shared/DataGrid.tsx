// ============================================================
// SICIP — DataGrid Component (Tabla tipo Excel)
// ============================================================

import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, Download, FileSpreadsheet } from 'lucide-react';

interface Column<T> {
  key: string;
  label: string;
  render?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  filterable?: boolean;
}

interface DataGridProps<T> {
  columns: Column<T>[];
  data: T[];
  title?: string;
  subtitle?: string;
  searchPlaceholder?: string;
  searchFields?: string[];
  pageSize?: number;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  loading?: boolean;
  actions?: React.ReactNode;
  exportable?: boolean;
  exportFilename?: string;
  selectedId?: string;
  compact?: boolean;
}

export default function DataGrid<T extends Record<string, any>>({
  columns, data, title, subtitle, searchPlaceholder = 'Buscar...',
  searchFields, pageSize = 25, onRowClick, emptyMessage = 'Sin registros',
  loading, actions, exportable = true, exportFilename = 'export', selectedId, compact
}: DataGridProps<T>) {

  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    let result = [...data];

    // Search
    if (search) {
      const lower = search.toLowerCase();
      const fields = searchFields || columns.map(c => c.key);
      result = result.filter(row =>
        fields.some(f => String(row[f] || '').toLowerCase().includes(lower))
      );
    }

    // Column filters
    Object.entries(filters).forEach(([key, val]) => {
      if (val) {
        result = result.filter(row => String(row[key] || '').toLowerCase().includes(val.toLowerCase()));
      }
    });

    // Sort
    if (sortKey) {
      result.sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }

    return result;
  }, [data, search, sortKey, sortDir, filters, searchFields, columns]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const exportCSV = () => {
    const headers = columns.map(c => c.label);
    const rows = filtered.map(row =>
      columns.map(c => {
        const val = row[c.key];
        const str = val == null ? '' : String(val);
        return str.includes(',') ? `"${str}"` : str;
      })
    );
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exportFilename}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{
      background: 'white', borderRadius: '1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      border: '1px solid var(--border-soft)', overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '0.75rem', padding: compact ? '0.75rem' : '1rem 1.25rem',
        borderBottom: '1px solid var(--border-soft)'
      }}>
        <div>
          {title && <h3 style={{ margin: 0, fontSize: compact ? '0.95rem' : '1.05rem', fontWeight: 700 }}>{title}</h3>}
          {subtitle && <p style={{ margin: '0.15rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{subtitle} — {filtered.length} registros</p>}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              placeholder={searchPlaceholder}
              style={{
                padding: '0.5rem 0.5rem 0.5rem 2rem', border: '1px solid var(--border-soft)',
                borderRadius: '0.5rem', fontSize: '0.82rem', width: compact ? 160 : 220,
                outline: 'none'
              }}
            />
          </div>
          {actions}
          {exportable && filtered.length > 0 && (
            <button onClick={exportCSV} title="Exportar CSV"
              style={{
                display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.5rem 0.75rem',
                background: 'var(--brand-50)', border: '1px solid var(--brand-200)',
                borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600,
                color: 'var(--brand-700)'
              }}>
              <Download size={14} /> Exportar
            </button>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ width: 32, height: 32, border: '3px solid var(--brand-200)', borderTopColor: 'var(--brand-600)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 0.75rem' }}></div>
          Cargando datos...
        </div>
      ) : paged.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          <FileSpreadsheet size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
          {emptyMessage}
          {search && <p style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>Intenta con otro término de búsqueda</p>}
        </div>
      ) : (
        <>
          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: compact ? '0.78rem' : '0.84rem' }}>
              <thead>
                <tr style={{ background: '#f8faf8' }}>
                  {columns.map(col => (
                    <th key={col.key}
                      style={{
                        padding: compact ? '0.5rem 0.6rem' : '0.65rem 0.85rem',
                        textAlign: 'left', fontWeight: 700, color: 'var(--text-muted)',
                        fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em',
                        borderBottom: '2px solid var(--border-soft)', cursor: col.sortable !== false ? 'pointer' : 'default',
                        whiteSpace: 'nowrap', width: col.width,
                        userSelect: 'none'
                      }}
                      onClick={() => col.sortable !== false && toggleSort(col.key)}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        {col.label}
                        {sortKey === col.key && (sortDir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map((row, i) => (
                  <tr key={row.id || i}
                    onClick={() => onRowClick?.(row)}
                    style={{
                      borderBottom: '1px solid var(--border-soft)',
                      background: selectedId && row.id === selectedId ? '#e8f5e9' : i % 2 === 0 ? 'white' : '#fafcfa',
                      cursor: onRowClick ? 'pointer' : 'default',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => { if (!(selectedId && row.id === selectedId)) e.currentTarget.style.background = '#f0f7f0'; }}
                    onMouseLeave={e => { if (!(selectedId && row.id === selectedId)) e.currentTarget.style.background = i % 2 === 0 ? 'white' : '#fafcfa'; }}
                  >
                    {columns.map(col => (
                      <td key={col.key}
                        style={{
                          padding: compact ? '0.4rem 0.6rem' : '0.55rem 0.85rem',
                          whiteSpace: 'nowrap', maxWidth: col.width ? col.width : '250px',
                          overflow: 'hidden', textOverflow: 'ellipsis'
                        }}
                        title={String(row[col.key] ?? '')}
                      >
                        {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '0.65rem 1rem', borderTop: '1px solid var(--border-soft)',
              fontSize: '0.8rem', color: 'var(--text-muted)'
            }}>
              <span>{page * pageSize + 1}-{Math.min((page + 1) * pageSize, filtered.length)} de {filtered.length}</span>
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                  style={{ padding: '0.3rem 0.7rem', border: '1px solid var(--border-soft)', borderRadius: '0.4rem', background: 'white', cursor: page === 0 ? 'default' : 'pointer', opacity: page === 0 ? 0.4 : 1 }}>
                  Anterior
                </button>
                <span style={{ padding: '0.3rem 0.5rem', fontWeight: 600 }}>{page + 1} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                  style={{ padding: '0.3rem 0.7rem', border: '1px solid var(--border-soft)', borderRadius: '0.4rem', background: 'white', cursor: page >= totalPages - 1 ? 'default' : 'pointer', opacity: page >= totalPages - 1 ? 0.4 : 1 }}>
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
