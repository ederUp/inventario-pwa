import { useState } from 'react';
import { useAuditorias } from '../hooks/useInventarioData';
import { crearAuditoria, obtenerUltimaBodega } from '../lib/auditorias';
import { Auditoria } from '../lib/types';

interface Props {
  onEntrar: (auditoria: Auditoria) => void;
}

export default function AuditoriasScreen({ onEntrar }: Props) {
  const auditorias = useAuditorias() ?? [];
  const [creando, setCreando] = useState(false);
  const ultima = obtenerUltimaBodega();
  const [pdv, setPdv] = useState('');
  const [bodegaMadera, setBodegaMadera] = useState(ultima.madera);
  const [bodegaFerreteria, setBodegaFerreteria] = useState(ultima.ferreteria);
  const [creandoEnCurso, setCreandoEnCurso] = useState(false);

  async function crear() {
    if (!pdv.trim() || (!bodegaMadera.trim() && !bodegaFerreteria.trim())) return;
    setCreandoEnCurso(true);
    const auditoria = await crearAuditoria({ pdv, bodegaMadera, bodegaFerreteria });
    setCreandoEnCurso(false);
    setCreando(false);
    onEntrar(auditoria);
  }

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
      {!creando ? (
        <button
          onClick={() => setCreando(true)}
          style={{
            padding: '14px 0',
            borderRadius: 10,
            border: 'none',
            background: 'var(--amber)',
            color: '#1a1204',
            fontWeight: 700,
            fontSize: 15,
          }}
        >
          + Nueva auditoría
        </button>
      ) : (
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 14 }}>Nueva auditoría</div>

          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
              Punto de venta
            </label>
            <input
              value={pdv}
              onChange={(e) => setPdv(e.target.value)}
              placeholder="Ej. PDV Barranquilla Norte"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--surface-raised)',
                color: 'var(--text)',
                fontSize: 15,
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                Bodega Maderas
              </label>
              <input
                inputMode="numeric"
                value={bodegaMadera}
                onChange={(e) => setBodegaMadera(e.target.value)}
                placeholder="Ej. 51601"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--surface-raised)',
                  color: 'var(--text)',
                  fontSize: 15,
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                Bodega Ferretería
              </label>
              <input
                inputMode="numeric"
                value={bodegaFerreteria}
                onChange={(e) => setBodegaFerreteria(e.target.value)}
                placeholder="Ej. 51602"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--surface-raised)',
                  color: 'var(--text)',
                  fontSize: 15,
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button
              onClick={crear}
              disabled={creandoEnCurso}
              style={{
                flex: 1,
                padding: '10px 0',
                borderRadius: 8,
                border: 'none',
                background: 'var(--amber)',
                color: '#1a1204',
                fontWeight: 700,
              }}
            >
              {creandoEnCurso ? 'Creando…' : 'Empezar conteo'}
            </button>
            <button
              onClick={() => setCreando(false)}
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'none',
                color: 'var(--text-muted)',
                fontWeight: 600,
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div>
        <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>
          HISTORIAL DE AUDITORÍAS
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {auditorias.map((a) => (
            <button
              key={a.id}
              onClick={() => onEntrar(a)}
              style={{
                textAlign: 'left',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '12px 14px',
                color: 'var(--text)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: 14.5 }}>{a.pdv}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  {new Date(a.fechaInicio).toLocaleDateString('es-CO', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}{' '}
                  · Bodegas {a.bodegaMadera || '—'} / {a.bodegaFerreteria || '—'}
                </div>
              </div>
              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: 999,
                  background: a.estado === 'abierta' ? '#f2a93b22' : '#4caf7d22',
                  color: a.estado === 'abierta' ? 'var(--amber)' : 'var(--ok)',
                }}
              >
                {a.estado === 'abierta' ? 'En curso' : 'Cerrada'}
              </span>
            </button>
          ))}
          {auditorias.length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: 13.5 }}>
              Aún no has creado ninguna auditoría. Toca "+ Nueva auditoría" para empezar.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
