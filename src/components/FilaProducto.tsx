import { FormEvent, useState } from 'react';
import { db, getDeviceId } from '../lib/db';
import { useEntradasDeReferencia } from '../hooks/useInventarioData';
import { calcularTotalesReferencia } from '../lib/formulas';
import { COLUMNAS_POR_CATEGORIA, ETIQUETA_COLUMNA, Existencia } from '../lib/types';
import CintaAcumulada from './CintaAcumulada';
import DiffBadge from './DiffBadge';

interface Props {
  existencia: Existencia;
  auditoriaId: string;
  abierta: boolean;
  onToggle: () => void;
  onSincronizarAhora: () => void;
}

export default function FilaProducto({ existencia, auditoriaId, abierta, onToggle, onSincronizarAhora }: Props) {
  const columnas = COLUMNAS_POR_CATEGORIA[existencia.categoria];
  const [columna, setColumna] = useState(columnas[0]);
  const [cantidad, setCantidad] = useState('');

  const entradas = useEntradasDeReferencia(existencia.referencia, auditoriaId) ?? [];
  const totales = calcularTotalesReferencia(existencia.referencia, entradas, existencia);
  const yaContado = Object.values(totales.porColumna).reduce((s, v) => s + (v ?? 0), 0) > 0;
  const entradasDeColumna = entradas.filter((e) => e.columna === columna);

  async function agregarHallazgo(e: FormEvent) {
    e.preventDefault();
    const valor = Number(cantidad.replace(',', '.'));
    if (!Number.isFinite(valor) || valor === 0) return;

    await db.entradas.add({
      id: crypto.randomUUID(),
      auditoriaId,
      categoria: existencia.categoria,
      referencia: existencia.referencia,
      columna,
      cantidad: valor,
      dispositivo: getDeviceId(),
      creado_en: new Date().toISOString(),
      sincronizado: 0,
    });
    setCantidad('');
    onSincronizarAhora();
  }

  async function eliminarHallazgo(id: string) {
    await db.entradas.delete(id);
    onSincronizarAhora();
  }

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: `1px solid ${abierta ? 'var(--amber)' : 'var(--border)'}`,
        borderRadius: 10,
        overflow: 'hidden',
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          textAlign: 'left',
          background: 'none',
          border: 'none',
          padding: '12px 14px',
          color: 'var(--text)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="num" style={{ fontSize: 12, color: 'var(--amber)', fontWeight: 700 }}>
              {existencia.referencia}
            </span>
            {yaContado && (
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--ok)' }} />
            )}
          </div>
          <div style={{ fontSize: 14.5, marginTop: 2 }}>{existencia.descripcion}</div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
            {existencia.linea}
            {existencia.sublinea ? ` · ${existencia.sublinea}` : ''} · sistema{' '}
            <span className="num">{existencia.cant_existencia}</span>
          </div>
        </div>
        {yaContado ? (
          <DiffBadge diferencia={totales.diferencia} />
        ) : (
          <span style={{ color: 'var(--text-muted)', fontSize: 18 }}>{abierta ? '−' : '+'}</span>
        )}
      </button>

      {abierta && (
        <div style={{ padding: '0 14px 14px' }}>
          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 0 12px' }} />

          <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
            Columna a registrar
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {columnas.map((c) => (
              <button
                key={c}
                onClick={() => setColumna(c)}
                style={{
                  padding: '6px 10px',
                  borderRadius: 8,
                  fontSize: 12.5,
                  border: `1px solid ${c === columna ? 'var(--amber)' : 'var(--border)'}`,
                  background: c === columna ? 'var(--amber-dim)' : 'var(--surface-raised)',
                  color: c === columna ? 'var(--amber)' : 'var(--text-muted)',
                  fontWeight: c === columna ? 700 : 500,
                }}
              >
                {ETIQUETA_COLUMNA[c]}
              </button>
            ))}
          </div>

          <CintaAcumulada entradas={entradasDeColumna} onEliminar={eliminarHallazgo} />

          <form onSubmit={agregarHallazgo} style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <input
              inputMode="decimal"
              placeholder="Cantidad en esta ubicación"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              autoFocus
              style={{
                flex: 1,
                padding: '12px 14px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--surface-raised)',
                color: 'var(--text)',
                fontSize: 16,
              }}
            />
            <button
              type="submit"
              style={{
                padding: '0 20px',
                borderRadius: 8,
                border: 'none',
                background: 'var(--amber)',
                color: '#1a1204',
                fontWeight: 700,
                fontSize: 15,
              }}
            >
              Agregar
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
