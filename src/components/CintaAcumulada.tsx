import { EntradaConteo } from '../lib/types';

interface Props {
  entradas: EntradaConteo[];
  onEliminar: (id: string) => void;
}

/**
 * Esto es la traducción visual directa de tu hábito en Excel de escribir
 * "=17+15+2" a medida que recorrías la bodega: cada hallazgo queda como
 * una "ficha" en la cinta, con quién/cuándo lo registró, y la suma total
 * al final — pero ahora cada número es un dato real y editable, no texto
 * de fórmula.
 */
export default function CintaAcumulada({ entradas, onEliminar }: Props) {
  if (entradas.length === 0) {
    return (
      <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '8px 0' }}>
        Sin hallazgos registrados todavía en esta auditoría.
      </p>
    );
  }

  const total = entradas.reduce((s, e) => s + e.cantidad, 0);

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 6,
        padding: '10px 0',
      }}
    >
      {entradas.map((e, i) => (
        <span key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {i > 0 && <span style={{ color: 'var(--text-muted)' }}>+</span>}
          <button
            onClick={() => onEliminar(e.id)}
            title={`Registrado ${new Date(e.creado_en).toLocaleString('es-CO')} · toca para eliminar`}
            className="num"
            style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--border)',
              color: e.sincronizado ? 'var(--text)' : 'var(--amber)',
              borderRadius: 8,
              padding: '4px 10px',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {e.cantidad}
          </button>
        </span>
      ))}
      <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>=</span>
      <span className="num" style={{ fontSize: 15, fontWeight: 700 }}>
        {total}
      </span>
    </div>
  );
}
