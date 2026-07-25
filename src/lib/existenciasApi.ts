import { db } from './db';
import { Categoria, Existencia } from './types';

/**
 * Adaptador hacia tu API de existencias, vía el proxy /api/existencias
 * (ver api/existencias.js) para evitar el bloqueo de CORS del navegador.
 *
 * Forma real de la respuesta: { "data": [ [ {...fila...} ] ] }.
 * Solo se conservan referencias con existencia > 0, porque así lo
 * necesitas para el barrido físico (no tiene sentido contar ni mostrar
 * lo que el sistema ya sabe que está en cero).
 */

interface FilaExistenciaCruda {
  referencia: string;
  descripcion_referencia: string;
  d_grupo?: string;
  d_linea?: string;
  d_sublinea?: string;
  cant_existencia: number;
  total: number;
  costo_unitario: number;
}

function mapRespuesta(filas: FilaExistenciaCruda[], categoria: Categoria): Existencia[] {
  return filas
    .map((f) => ({
      referencia: String(f.referencia).trim(),
      descripcion: (f.descripcion_referencia ?? '').trim(),
      categoria,
      grupo: (f.d_grupo ?? '').trim(),
      linea: (f.d_linea ?? '').trim(),
      sublinea: (f.d_sublinea ?? '').trim(),
      cant_existencia: Number(f.total ?? f.cant_existencia ?? 0),
      costo_unitario: Number(f.costo_unitario ?? 0),
    }))
    .filter((e) => e.cant_existencia > 0);
}

async function fetchBodega(bodega: string, categoria: Categoria): Promise<Existencia[]> {
  const res = await fetch(`/api/existencias?bodega=${encodeURIComponent(bodega)}`);
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error ?? `Error consultando existencias de la bodega ${bodega}: HTTP ${res.status}`);
  }
  const filas: FilaExistenciaCruda[] = Array.isArray(json?.data?.[0]) ? json.data[0] : [];
  return mapRespuesta(filas, categoria);
}

/**
 * Descarga existencias para las dos bodegas de la auditoría activa
 * (una para Maderas, otra para Ferretería) y refresca la caché local.
 * No filtra por auditoría — la caché de existencias es compartida, ya
 * que refleja el saldo del sistema en este momento, no algo propio de
 * una auditoría en particular.
 */
export async function refrescarExistencias(
  bodegaMadera: string,
  bodegaFerreteria: string
): Promise<{ ok: boolean; error?: string }> {
  if (!bodegaMadera && !bodegaFerreteria) {
    return { ok: false, error: 'La auditoría no tiene bodegas configuradas.' };
  }
  try {
    const resultados = await Promise.all([
      bodegaMadera ? fetchBodega(bodegaMadera, 'madera') : Promise.resolve([]),
      bodegaFerreteria ? fetchBodega(bodegaFerreteria, 'ferreteria') : Promise.resolve([]),
    ]);
    await db.existencias.clear();
    await db.existencias.bulkPut(resultados.flat());
    localStorage.setItem('existencias_actualizado_en', new Date().toISOString());
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export function ultimaActualizacion(): string | null {
  return localStorage.getItem('existencias_actualizado_en');
}
