import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { Categoria } from '../lib/types';

/**
 * TODAS las existencias de una categoría (ya vienen filtradas a > 0 desde
 * el adaptador), opcionalmente filtradas por texto. Se ordenan por línea →
 * sublínea → descripción, que es como recorres físicamente la bodega
 * (agrupado visualmente, no alfabético puro por referencia).
 */
export function useExistencias(categoria: Categoria, filtroTexto: string) {
  return useLiveQuery(async () => {
    const todas = await db.existencias.where('categoria').equals(categoria).toArray();
    const texto = filtroTexto.trim().toLowerCase();
    const filtradas = texto
      ? todas.filter(
          (e) =>
            e.referencia.toLowerCase().includes(texto) ||
            e.descripcion.toLowerCase().includes(texto) ||
            e.linea.toLowerCase().includes(texto) ||
            e.sublinea.toLowerCase().includes(texto)
        )
      : todas;
    return filtradas.sort(
      (a, b) =>
        a.linea.localeCompare(b.linea) ||
        a.sublinea.localeCompare(b.sublinea) ||
        a.descripcion.localeCompare(b.descripcion)
    );
  }, [categoria, filtroTexto]);
}

export function useEntradasDeReferencia(referencia: string, auditoriaId: string) {
  return useLiveQuery(
    () =>
      db.entradas
        .where('referencia')
        .equals(referencia)
        .and((e) => e.auditoriaId === auditoriaId)
        .sortBy('creado_en'),
    [referencia, auditoriaId]
  );
}

export function useConteoPendientes() {
  return useLiveQuery(
    () => Promise.all([db.entradas.where('sincronizado').equals(0).count(), db.auditorias.where('sincronizado').equals(0).count()]).then(([a, b]) => a + b),
    []
  );
}

export function useEntradasDeAuditoria(auditoriaId: string, categoria: Categoria) {
  return useLiveQuery(
    () => db.entradas.where('[auditoriaId+categoria]').equals([auditoriaId, categoria]).toArray(),
    [auditoriaId, categoria]
  );
}

export function useTodasLasExistencias(categoria: Categoria) {
  return useLiveQuery(() => db.existencias.where('categoria').equals(categoria).toArray(), [categoria]);
}

export function useAuditorias() {
  return useLiveQuery(() => db.auditorias.orderBy('fechaInicio').reverse().toArray(), []);
}

export function useAuditoria(id: string | null) {
  return useLiveQuery(() => (id ? db.auditorias.get(id) : undefined), [id]);
}
