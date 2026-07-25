import { useState } from 'react';
import BuscadorReferencia from '../components/BuscadorReferencia';
import FilaProducto from '../components/FilaProducto';
import { useExistencias } from '../hooks/useInventarioData';
import { subirPendientes } from '../lib/sync';
import { Categoria } from '../lib/types';

interface Props {
  categoria: Categoria;
  auditoriaId: string;
}

export default function ConteoScreen({ categoria, auditoriaId }: Props) {
  const [texto, setTexto] = useState('');
  const [abierta, setAbierta] = useState<string | null>(null);
  const existencias = useExistencias(categoria, texto) ?? [];

  let lineaAnterior: string | null = null;

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <BuscadorReferencia valor={texto} onCambio={setTexto} />

      <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '2px 0' }}>
        {existencias.length} referencia{existencias.length === 1 ? '' : 's'} con existencia. Desplázate y
        toca una para registrar el hallazgo — sin perder tu lugar en la lista.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {existencias.map((e) => {
          const mostrarEncabezado = e.linea !== lineaAnterior;
          lineaAnterior = e.linea;
          return (
            <div key={e.referencia}>
              {mostrarEncabezado && e.linea && (
                <div
                  style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 5,
                    background: 'var(--bg)',
                    padding: '10px 2px 6px',
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--amber)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em',
                  }}
                >
                  {e.linea}
                </div>
              )}
              <FilaProducto
                existencia={e}
                auditoriaId={auditoriaId}
                abierta={abierta === e.referencia}
                onToggle={() => setAbierta((a) => (a === e.referencia ? null : e.referencia))}
                onSincronizarAhora={() => subirPendientes()}
              />
            </div>
          );
        })}
        {existencias.length === 0 && (
          <p style={{ color: 'var(--text-muted)', fontSize: 13.5 }}>
            No hay referencias con existencia {texto ? `que coincidan con “${texto}”` : 'para esta bodega'}.
          </p>
        )}
      </div>
    </div>
  );
}
