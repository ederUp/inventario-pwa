import { useMemo } from 'react';
import { useEntradasDeAuditoria, useTodasLasExistencias } from '../hooks/useInventarioData';
import { calcularTotalesReferencia } from '../lib/formulas';
import { Categoria } from '../lib/types';
import DiffBadge from '../components/DiffBadge';

interface Props {
  categoria: Categoria;
  auditoriaId: string;
}

export default function ResumenScreen({ categoria, auditoriaId }: Props) {
  const existencias = useTodasLasExistencias(categoria) ?? [];
  const entradas = useEntradasDeAuditoria(auditoriaId, categoria) ?? [];

  const filas = useMemo(() => {
    const porReferencia = new Map<string, typeof entradas>();
    for (const e of entradas) {
      const arr = porReferencia.get(e.referencia) ?? [];
      arr.push(e);
      porReferencia.set(e.referencia, arr);
    }
    return Array.from(porReferencia.entries())
      .map(([referencia, ents]) => {
        const existencia = existencias.find((x) => x.referencia === referencia);
        return { existencia, totales: calcularTotalesReferencia(referencia, ents, existencia) };
      })
      .filter((f) => f.totales.diferencia !== 0)
      .sort((a, b) => Math.abs(b.totales.diferencia) - Math.abs(a.totales.diferencia));
  }, [entradas, existencias]);

  const totalUnidades = filas.reduce((s, f) => s + f.totales.diferencia, 0);
  const totalCosto = filas.reduce((s, f) => s + f.totales.costoTotalDiferencia, 0);
  const referenciasContadas = new Set(entradas.map((e) => e.referencia)).size;

  return (
    <div style={{ padding: 16 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: '14px 16px',
          marginBottom: 14,
        }}
      >
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Diferencia neta (unidades)</div>
          <div className="num" style={{ fontSize: 20, fontWeight: 700 }}>
            {totalUnidades > 0 ? '+' : ''}
            {totalUnidades}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Costo de la diferencia</div>
          <div className="num" style={{ fontSize: 20, fontWeight: 700 }}>
            ${totalCosto.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Referencias contadas</div>
          <div className="num" style={{ fontSize: 20, fontWeight: 700 }}>
            {referenciasContadas}
          </div>
        </div>
      </div>

      {filas.length === 0 && (
        <p style={{ color: 'var(--text-muted)', fontSize: 13.5 }}>
          Todavía no hay diferencias registradas en {categoria === 'madera' ? 'Maderas' : 'Ferretería'} para
          esta auditoría.
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filas.map(({ existencia, totales }) => (
          <div
            key={totales.referencia}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: '12px 14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <div>
              <div className="num" style={{ fontSize: 12, color: 'var(--amber)', fontWeight: 700 }}>
                {totales.referencia}
              </div>
              <div style={{ fontSize: 13.5, marginTop: 2 }}>{existencia?.descripcion ?? '—'}</div>
            </div>
            <DiffBadge diferencia={totales.diferencia} />
          </div>
        ))}
      </div>
    </div>
  );
}
