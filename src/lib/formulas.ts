import { ColumnaAjuste, EntradaConteo, Existencia, SIGNO_COLUMNA, TotalesReferencia } from './types';

/**
 * Agrupa entradas de conteo por columna y las suma.
 * Esto reemplaza el patrón "=17+15+2" de tu Excel: cada +N era un hallazgo
 * en una ubicación distinta; aquí cada hallazgo es un registro y esta
 * función hace la suma (igual que la fórmula, pero auditable: puedes ver
 * quién/cuándo/en qué dispositivo se registró cada cantidad).
 */
export function agruparPorColumna(entradas: EntradaConteo[]): Partial<Record<ColumnaAjuste, number>> {
  const acc: Partial<Record<ColumnaAjuste, number>> = {};
  for (const e of entradas) {
    acc[e.columna] = (acc[e.columna] ?? 0) + e.cantidad;
  }
  return acc;
}

/**
 * Diferencia = (suma de columnas que suman) - (suma de columnas que restan) - Existencia
 * Los signos vienen de SIGNO_COLUMNA, que replica exactamente:
 *   MADERA:      (D+E+F+G+H - I - J + K - L) - C
 *   FERRETERIA:  (D+E+F+G   - H - I + J - K) - C
 */
export function calcularDiferencia(
  porColumna: Partial<Record<ColumnaAjuste, number>>,
  existencia: number
): number {
  let total = 0;
  for (const [col, cantidad] of Object.entries(porColumna)) {
    const signo = SIGNO_COLUMNA[col as ColumnaAjuste];
    total += signo * (cantidad ?? 0);
  }
  return total - existencia;
}

export function calcularTotalesReferencia(
  referencia: string,
  entradas: EntradaConteo[],
  existencia: Existencia | undefined
): TotalesReferencia {
  const porColumna = agruparPorColumna(entradas);
  const cantExistencia = existencia?.cant_existencia ?? 0;
  const diferencia = calcularDiferencia(porColumna, cantExistencia);
  const costoUnitario = existencia?.costo_unitario ?? 0;
  return {
    referencia,
    porColumna,
    diferencia,
    costoTotalDiferencia: diferencia * costoUnitario,
  };
}
