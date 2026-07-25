import { db } from './db';
import { supabase } from './supabaseClient';
import { Auditoria, EntradaConteo } from './types';

export async function subirAuditoriasPendientes(): Promise<void> {
  if (!supabase || !navigator.onLine) return;
  const pendientes = await db.auditorias.where('sincronizado').equals(0).toArray();
  if (pendientes.length === 0) return;

  const { error } = await supabase.from('auditorias').upsert(
    pendientes.map((a) => ({
      id: a.id,
      pdv: a.pdv,
      bodega_madera: a.bodegaMadera,
      bodega_ferreteria: a.bodegaFerreteria,
      fecha_inicio: a.fechaInicio,
      fecha_cierre: a.fechaCierre ?? null,
      estado: a.estado,
      dispositivo: a.dispositivo,
    })),
    { onConflict: 'id' }
  );
  if (!error) {
    await db.auditorias.bulkPut(pendientes.map((a) => ({ ...a, sincronizado: 1 as const })));
  }
}

export async function descargarAuditorias(): Promise<void> {
  if (!supabase || !navigator.onLine) return;
  const { data, error } = await supabase.from('auditorias').select('*');
  if (error || !data) return;

  const auditorias: Auditoria[] = data.map((r) => ({
    id: r.id,
    pdv: r.pdv,
    bodegaMadera: r.bodega_madera,
    bodegaFerreteria: r.bodega_ferreteria,
    fechaInicio: r.fecha_inicio,
    fechaCierre: r.fecha_cierre ?? undefined,
    estado: r.estado,
    dispositivo: r.dispositivo,
    sincronizado: 1,
  }));

  // No pisar una auditoría local que todavía no se ha subido (por ejemplo,
  // si se cerró offline hace un segundo): solo sobreescribimos las que ya
  // están sincronizadas o que no existen localmente.
  for (const remota of auditorias) {
    const local = await db.auditorias.get(remota.id);
    if (!local || local.sincronizado === 1) {
      await db.auditorias.put(remota);
    }
  }
}

export async function subirPendientes(): Promise<{ subidas: number; error?: string }> {
  if (!supabase) return { subidas: 0, error: 'Supabase no configurado' };
  if (!navigator.onLine) return { subidas: 0 };

  await subirAuditoriasPendientes();

  const pendientes = await db.entradas.where('sincronizado').equals(0).toArray();
  if (pendientes.length === 0) return { subidas: 0 };

  const { error } = await supabase.from('conteos_detalle').upsert(
    pendientes.map((e) => ({
      id: e.id,
      auditoria_id: e.auditoriaId,
      categoria: e.categoria,
      referencia: e.referencia,
      columna: e.columna,
      cantidad: e.cantidad,
      dispositivo: e.dispositivo,
      nota: e.nota ?? null,
      creado_en: e.creado_en,
    })),
    { onConflict: 'id' }
  );

  if (error) return { subidas: 0, error: error.message };

  await db.entradas.bulkPut(pendientes.map((e) => ({ ...e, sincronizado: 1 as const })));
  return { subidas: pendientes.length };
}

export async function descargarEntradasRemotas(auditoriaId: string): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'Supabase no configurado' };
  if (!navigator.onLine) return { ok: false };

  const { data, error } = await supabase.from('conteos_detalle').select('*').eq('auditoria_id', auditoriaId);
  if (error) return { ok: false, error: error.message };

  const entradas: EntradaConteo[] = (data ?? []).map((r) => ({
    id: r.id,
    auditoriaId: r.auditoria_id,
    categoria: r.categoria,
    referencia: r.referencia,
    columna: r.columna,
    cantidad: Number(r.cantidad),
    dispositivo: r.dispositivo,
    nota: r.nota ?? undefined,
    creado_en: r.creado_en,
    sincronizado: 1,
  }));

  await db.entradas.bulkPut(entradas);
  return { ok: true };
}

let intervalId: ReturnType<typeof setInterval> | null = null;

/**
 * Sincronización en segundo plano. Si se pasa una auditoría activa, también
 * trae sus entradas remotas (para reflejar lo contado desde otros
 * dispositivos); siempre sincroniza la lista de auditorías, para que el
 * historial de auditorías pasadas se vea igual en cualquier dispositivo.
 */
export function iniciarSyncEnSegundoPlano(auditoriaId: string | null, onCambio?: () => void) {
  const correr = async () => {
    await subirPendientes();
    await descargarAuditorias();
    if (auditoriaId) await descargarEntradasRemotas(auditoriaId);
    onCambio?.();
  };

  window.addEventListener('online', correr);
  intervalId = setInterval(correr, 20_000);
  correr();

  return () => {
    window.removeEventListener('online', correr);
    if (intervalId) clearInterval(intervalId);
  };
}
