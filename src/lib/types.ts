// Categorías tal como en tus hojas "Sheet 1 MADERAS" / "Sheet 2 Ferreteria"
export type Categoria = 'madera' | 'ferreteria';

// Cada "columna" de ajuste que existía en tus hojas MADERA / FERRETERIA.
export type ColumnaAjuste =
  | 'conteo_entero'
  | 'conteo_media'
  | 'conteo'
  | 'fisicas_cedi'
  | 'mal_corte'
  | 'averiadas_pdte_tipo_b'
  | 'facturadas_pdte_corte'
  | 'pdte_entregar'
  | 'pdte_recoger'
  | 'pdte_ingresar_ts';

// Signo con el que cada columna entra a la fórmula de diferencia.
// (D+E+F+G+H - I - J + K - L) - C  [MADERA]  /  (D+E+F+G - H - I + J - K) - C  [FERRETERIA]
export const SIGNO_COLUMNA: Record<ColumnaAjuste, 1 | -1> = {
  conteo_entero: 1,
  conteo_media: 1,
  conteo: 1,
  fisicas_cedi: 1,
  mal_corte: 1,
  averiadas_pdte_tipo_b: 1,
  facturadas_pdte_corte: -1,
  pdte_entregar: -1,
  pdte_recoger: 1,
  pdte_ingresar_ts: -1,
};

export const COLUMNAS_POR_CATEGORIA: Record<Categoria, ColumnaAjuste[]> = {
  madera: [
    'conteo_entero',
    'conteo_media',
    'fisicas_cedi',
    'mal_corte',
    'averiadas_pdte_tipo_b',
    'facturadas_pdte_corte',
    'pdte_entregar',
    'pdte_recoger',
    'pdte_ingresar_ts',
  ],
  ferreteria: [
    'conteo',
    'fisicas_cedi',
    'mal_corte',
    'averiadas_pdte_tipo_b',
    'facturadas_pdte_corte',
    'pdte_entregar',
    'pdte_recoger',
    'pdte_ingresar_ts',
  ],
};

export const ETIQUETA_COLUMNA: Record<ColumnaAjuste, string> = {
  conteo_entero: 'Conteo físico (enteros)',
  conteo_media: 'Conteo físico (medias)',
  conteo: 'Conteo físico',
  fisicas_cedi: 'Físicas Cedi',
  mal_corte: 'Mal corte',
  averiadas_pdte_tipo_b: 'Averiadas pdte. tipo B',
  facturadas_pdte_corte: 'Facturadas pdte. corte',
  pdte_entregar: 'Pendiente entregar',
  pdte_recoger: 'Pendiente recoger',
  pdte_ingresar_ts: 'Pendiente ingresar TS',
};

// Una referencia tal como la trae tu API de existencias.
// Se agregan grupo/línea/sublínea porque el barrido físico se hace
// visualmente por esas agrupaciones (ej. color de melamina), no por
// texto escrito.
export interface Existencia {
  referencia: string;
  descripcion: string;
  categoria: Categoria;
  grupo: string;
  linea: string;
  sublinea: string;
  cant_existencia: number;
  costo_unitario: number;
}

// Una auditoría = una visita de conteo a un punto de venta en una fecha.
// Es la unidad que se guarda y se puede consultar después.
export interface Auditoria {
  id: string;
  pdv: string; // nombre o código del punto de venta auditado
  bodegaMadera: string;
  bodegaFerreteria: string;
  fechaInicio: string; // ISO
  fechaCierre?: string; // ISO, si ya se cerró
  estado: 'abierta' | 'cerrada';
  dispositivo: string; // quién/qué dispositivo la creó
  sincronizado: 0 | 1;
}

// Una entrada individual de conteo = un hallazgo en una ubicación,
// dentro de una auditoría concreta (no de "el mes" en general).
export interface EntradaConteo {
  id: string;
  auditoriaId: string;
  categoria: Categoria;
  referencia: string;
  columna: ColumnaAjuste;
  cantidad: number;
  dispositivo: string;
  nota?: string;
  creado_en: string; // ISO timestamp
  sincronizado: 0 | 1;
}

export interface TotalesReferencia {
  referencia: string;
  porColumna: Partial<Record<ColumnaAjuste, number>>;
  diferencia: number;
  costoTotalDiferencia: number;
}
