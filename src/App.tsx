import { useEffect, useState } from 'react';
import ConteoScreen from './screens/ConteoScreen';
import ResumenScreen from './screens/ResumenScreen';
import AuditoriasScreen from './screens/AuditoriasScreen';
import EstadoSync from './components/EstadoSync';
import { cerrarAuditoria } from './lib/auditorias';
import { refrescarExistencias, ultimaActualizacion } from './lib/existenciasApi';
import { iniciarSyncEnSegundoPlano } from './lib/sync';
import { Auditoria, Categoria } from './lib/types';

type Vista = 'conteo' | 'resumen';

export default function App() {
  const [auditoriaActual, setAuditoriaActual] = useState<Auditoria | null>(null);
  const [categoria, setCategoria] = useState<Categoria>('madera');
  const [vista, setVista] = useState<Vista>('conteo');
  const [avisoExistencias, setAvisoExistencias] = useState<string | null>(null);

  useEffect(() => {
    const detener = iniciarSyncEnSegundoPlano(auditoriaActual?.id ?? null);
    return detener;
  }, [auditoriaActual?.id]);

  useEffect(() => {
    if (!auditoriaActual) return;
    refrescarExistencias(auditoriaActual.bodegaMadera, auditoriaActual.bodegaFerreteria).then((r) => {
      setAvisoExistencias(r.ok ? null : r.error ?? 'No se pudo actualizar existencias.');
    });
  }, [auditoriaActual]);

  async function salirDeAuditoria() {
    setAuditoriaActual(null);
    setVista('conteo');
  }

  async function cerrarYSalir() {
    if (!auditoriaActual) return;
    await cerrarAuditoria(auditoriaActual.id);
    salirDeAuditoria();
  }

  if (!auditoriaActual) {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', minHeight: '100%' }}>
        <header style={{ padding: '18px 16px 4px' }}>
          <h1 style={{ fontSize: 18, margin: 0, fontWeight: 800 }}>Auditorías de inventario</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Elige una auditoría para continuar o crea una nueva.
          </p>
        </header>
        <AuditoriasScreen onEntrar={setAuditoriaActual} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', minHeight: '100%', paddingBottom: 90 }}>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'var(--bg)',
          borderBottom: '1px solid var(--border)',
          padding: '14px 16px 10px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <button
              onClick={salirDeAuditoria}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 12.5, padding: 0 }}
            >
              ← Auditorías
            </button>
            <h1 style={{ fontSize: 16, margin: '4px 0 0', fontWeight: 800 }}>{auditoriaActual.pdv}</h1>
            <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
              {new Date(auditoriaActual.fechaInicio).toLocaleDateString('es-CO')} · existencias act.{' '}
              {ultimaActualizacion() ? new Date(ultimaActualizacion()!).toLocaleTimeString('es-CO') : '—'}
            </span>
          </div>
          <EstadoSync />
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          {(['madera', 'ferreteria'] as Categoria[]).map((c) => (
            <button
              key={c}
              onClick={() => setCategoria(c)}
              style={{
                flex: 1,
                padding: '9px 0',
                borderRadius: 8,
                border: `1px solid ${categoria === c ? 'var(--amber)' : 'var(--border)'}`,
                background: categoria === c ? 'var(--amber-dim)' : 'var(--surface)',
                color: categoria === c ? 'var(--amber)' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: 13.5,
              }}
            >
              {c === 'madera' ? 'Maderas' : 'Ferretería'}
            </button>
          ))}
        </div>

        {auditoriaActual.estado === 'abierta' && (
          <button
            onClick={cerrarYSalir}
            style={{
              marginTop: 10,
              width: '100%',
              padding: '8px 0',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'none',
              color: 'var(--text-muted)',
              fontSize: 12.5,
              fontWeight: 600,
            }}
          >
            Cerrar esta auditoría
          </button>
        )}
      </header>

      {avisoExistencias && (
        <div
          style={{
            margin: 16,
            padding: '10px 14px',
            borderRadius: 8,
            background: '#e05a4e1a',
            border: '1px solid #e05a4e55',
            color: 'var(--alert)',
            fontSize: 13,
          }}
        >
          No se pudieron traer existencias del API: {avisoExistencias}. Usando el último dato guardado en
          este dispositivo (si lo hay).
        </div>
      )}

      {vista === 'conteo' ? (
        <ConteoScreen categoria={categoria} auditoriaId={auditoriaActual.id} />
      ) : (
        <ResumenScreen categoria={categoria} auditoriaId={auditoriaActual.id} />
      )}

      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'var(--surface)',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          maxWidth: 640,
          margin: '0 auto',
        }}
      >
        {(
          [
            ['conteo', 'Contar'],
            ['resumen', 'Diferencias'],
          ] as [Vista, string][]
        ).map(([v, label]) => (
          <button
            key={v}
            onClick={() => setVista(v)}
            style={{
              flex: 1,
              padding: '14px 0',
              background: 'none',
              border: 'none',
              borderTop: `2px solid ${vista === v ? 'var(--amber)' : 'transparent'}`,
              color: vista === v ? 'var(--amber)' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: 13.5,
            }}
          >
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}
