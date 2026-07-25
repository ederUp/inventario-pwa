// Proxy hacia tu API real de existencias.
//
// Por qué existe este archivo: el navegador bloquea las llamadas directas
// desde tu app (en vercel.app) hacia sam.madecentro.com si ese servidor no
// autoriza explícitamente ese origen (política CORS). Al llamar desde aquí
// (una función que corre en el servidor de Vercel, no en el navegador),
// esa restricción no aplica: el navegador solo habla con tu propio dominio,
// y este archivo es quien reenvía la petición a sam.madecentro.com "puerta
// a puerta" entre servidores.
//
// Configura en Vercel (Project -> Settings -> Environment Variables), SIN
// el prefijo VITE_ (para que NO queden expuestas en el código del navegador):
//   EXISTENCIAS_API_URL   = https://sam.madecentro.com/APIS/WebApiNode_TRASLADOS_INVENTARIO
//   EXISTENCIAS_API_TOKEN = (si tu API lo requiere; opcional)

export default async function handler(req, res) {
  const bodega = req.query.bodega;
  if (!bodega) {
    res.status(400).json({ error: 'Falta el parámetro "bodega".' });
    return;
  }

  const base = process.env.EXISTENCIAS_API_URL;
  if (!base) {
    res.status(500).json({
      error: 'EXISTENCIAS_API_URL no está configurada en Vercel (Settings -> Environment Variables).',
    });
    return;
  }

  const cacheBuster = Math.floor(Math.random() * 100000);
  const url = `${base.replace(/\/$/, '')}/pos/solicitud_tr/get_existencias_referencias_bodega_solicitudes_tr/${bodega}?${cacheBuster}`;

  try {
    const headers = {};
    if (process.env.EXISTENCIAS_API_TOKEN) {
      headers.Authorization = `Bearer ${process.env.EXISTENCIAS_API_TOKEN}`;
    }
    const respuesta = await fetch(url, { headers });
    if (!respuesta.ok) {
      res.status(502).json({ error: `La API de existencias respondió HTTP ${respuesta.status}` });
      return;
    }
    const data = await respuesta.json();
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json(data);
  } catch (err) {
    res.status(502).json({ error: `No se pudo contactar la API de existencias: ${String(err)}` });
  }
}
