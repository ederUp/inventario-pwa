import { db, getDeviceId } from './db';
import { Auditoria } from './types';

const CLAVE_ULTIMA_BODEGA = 'inventario_ultima_bodega';

/** Recuerda la última bodega usada, solo para precargarla al crear la siguiente auditoría. */
export function obtenerUltimaBodega(): { madera: string; ferreteria: string } {
  const guardado = localStorage.getItem(CLAVE_ULTIMA_BODEGA);
  if (guardado) {
    try {
      return JSON.parse(guardado);
    } catch {
      /* ignorar config corrupta */
    }
  }
  return { madera: '', ferreteria: '' };
}

export async function crearAuditoria(datos: {
  pdv: string;
  bodegaMadera: string;
  bodegaFerreteria: string;
}): Promise<Auditoria> {
  const auditoria: Auditoria = {
    id: crypto.randomUUID(),
    pdv: datos.pdv.trim(),
    bodegaMadera: datos.bodegaMadera.trim(),
    bodegaFerreteria: datos.bodegaFerreteria.trim(),
    fechaInicio: new Date().toISOString(),
    estado: 'abierta',
    dispositivo: getDeviceId(),
    sincronizado: 0,
  };
  await db.auditorias.add(auditoria);
  localStorage.setItem(
    CLAVE_ULTIMA_BODEGA,
    JSON.stringify({ madera: auditoria.bodegaMadera, ferreteria: auditoria.bodegaFerreteria })
  );
  return auditoria;
}

export async function cerrarAuditoria(id: string): Promise<void> {
  const actual = await db.auditorias.get(id);
  if (!actual) return;
  await db.auditorias.put({
    ...actual,
    estado: 'cerrada',
    fechaCierre: new Date().toISOString(),
    sincronizado: 0,
  });
}
