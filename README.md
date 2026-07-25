# Conteo de Inventario — PWA (Maderas / Ferretería)

App instalable en tablet, celular o PC para hacer el barrido físico de
bodega tal como lo haces hoy: recorres visualmente las referencias
(por línea/color), sumas cantidades por ubicación hasta cuadrar contra el
sistema, y cada auditoría queda guardada por fecha y punto de venta para
poder consultarla después.

## Cómo se traduce tu proceso a la app

| Tu proceso | En la app |
|---|---|
| Barrido visual por color/línea de melamina | Lista completa (no buscador obligatorio) agrupada por línea/sublínea, con scroll |
| Solo referencias con existencia | El adaptador filtra a `cant_existencia > 0` (`src/lib/existenciasApi.ts`) |
| Escribir `=17+15+2` en la celda de conteo | Cada `+N` es un registro individual ("hallazgo"), visible como cinta `17 + 15 + 2 = 34` |
| Columnas D–L (Conteo Enter/Media, Físicas Cedi, Mal Corte, etc.) | Selector de columna dentro de cada fila expandida |
| Fórmula `=(D+E+F+G+H-I-J+K-L)-C` | `calcularDiferencia()` en `src/lib/formulas.ts` |
| Un archivo Excel por auditoría/punto de venta | Una **auditoría** (fecha + PDV + bodegas), consultable después desde el historial |

## Flujo de uso

1. Abres la app → pantalla de **Auditorías**: historial de auditorías pasadas + botón "+ Nueva auditoría".
2. Al crear una, indicas el **punto de venta** y el **número de bodega** de Maderas y de Ferretería (el API entrega existencias por bodega, no por categoría — ver conversación anterior).
3. Entras a la auditoría → pestaña **Contar**: lista completa de referencias con existencia, agrupada por línea. Tocas una para expandirla ahí mismo, eliges la columna, agregas la cantidad encontrada, y sigues bajando por la lista sin perder el lugar.
4. Pestaña **Diferencias**: cuadratura en tiempo real de esa auditoría.
5. "Cerrar esta auditoría" la marca como cerrada (queda igual en el historial, de solo lectura).
6. Desde el historial puedes volver a abrir cualquier auditoría —abierta o cerrada— y ver/seguir su detalle.

## Arquitectura

```
┌─────────────┐   proxy same-origin   ┌──────────────┐
│  Tu API de  │ ──/api/existencias──▶ │  IndexedDB   │◀── UI React
│  existencias│  (evita CORS)         │  (Dexie)     │
└─────────────┘                       └──────┬───────┘
                                              │ sync en 2do plano
                                              ▼
                                       ┌──────────────┐
                                       │  Supabase    │  auditorias +
                                       │  (Postgres)  │  conteos_detalle
                                       └──────────────┘
```

- **PWA** (no Flutter/nativa): un solo código para PC/tablet/celular, instalable desde el navegador, funciona offline (Service Worker + IndexedDB).
- **Proxy `/api/existencias`** (función serverless en Vercel): el navegador nunca llama directo a tu API externa, así se evita el bloqueo de CORS. La URL/token de tu API viven solo en variables de servidor (`EXISTENCIAS_API_URL`, sin prefijo `VITE_`).
- **Supabase**: guarda tanto las auditorías como cada hallazgo de conteo, para que el historial se vea igual en cualquier dispositivo.

## Puesta en marcha

```bash
npm install
cp .env.example .env
```

1. En Vercel (o tu `.env` para pruebas locales con `vercel dev`), configura:
   - `EXISTENCIAS_API_URL`, `EXISTENCIAS_API_TOKEN` (variables de servidor, sin `VITE_`)
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
2. En el **SQL Editor** de Supabase, ejecuta `supabase/schema.sql`.
   - **Si ya tenías la versión anterior** (sin auditorías) corriendo en Supabase: lo más simple es borrar las tablas viejas y volver a correr el script completo, ya que es un prototipo sin datos de producción todavía:
     ```sql
     drop table if exists conteos_detalle;
     drop view if exists conteos_totales;
     ```
     y luego corre `supabase/schema.sql` de nuevo.
3. `npm run dev` (o `vercel dev` si quieres probar también el proxy `/api` localmente).
4. Para producción: `git push` → Vercel construye y despliega automáticamente.

## Cosas que probablemente quieras ajustar conmigo después

- **Comparar auditorías entre sí** (misma tienda, distintas fechas): hoy cada auditoría es independiente; si quieres ver la evolución de diferencias de un mismo PDV a lo largo del tiempo, puedo agregar esa vista.
- **Cerrar auditoría con validación**: hoy "cerrar" es solo un cambio de estado; si necesitas que exija un mínimo de referencias contadas, o generar un PDF/reporte al cerrar, lo agregamos.
- **Exportar a Excel** el detalle de una auditoría cerrada, si sigues necesitando entregar el archivo en el formato actual.
- **Escaneo por cámara / lector de código de barras**: ya funciona (ver `BuscadorReferencia.tsx`), pero ahora que el flujo principal es "lista + scroll" en vez de "buscar", puede que ya no lo necesites tanto — dime si prefieres quitarlo para simplificar.
