import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !anonKey) {
  // No lanzamos error duro para que la app siga siendo usable 100% offline
  // (solo local) si aún no has configurado Supabase.
  console.warn(
    'Supabase no configurado: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY faltan en .env. ' +
      'La app funcionará solo localmente, sin sincronizar entre dispositivos.'
  );
}

export const supabase = url && anonKey ? createClient(url, anonKey) : null;
