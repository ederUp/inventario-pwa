import Dexie, { Table } from 'dexie';
import { Auditoria, EntradaConteo, Existencia } from './types';

class InventarioDB extends Dexie {
  existencias!: Table<Existencia, string>;
  entradas!: Table<EntradaConteo, string>;
  auditorias!: Table<Auditoria, string>;

  constructor() {
    super('inventario-conteo-db');
    this.version(2).stores({
      existencias: 'referencia, categoria',
      entradas: 'id, referencia, auditoriaId, sincronizado, [auditoriaId+categoria]',
      auditorias: 'id, estado, fechaInicio, sincronizado',
    });
  }
}

export const db = new InventarioDB();

export function getDeviceId(): string {
  const key = 'inventario_device_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}
