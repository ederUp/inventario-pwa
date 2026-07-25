import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useConteoPendientes } from '../hooks/useInventarioData';

export default function EstadoSync() {
  const online = useOnlineStatus();
  const pendientes = useConteoPendientes() ?? 0;

  const color = !online ? 'var(--text-muted)' : pendientes > 0 ? 'var(--amber)' : 'var(--ok)';
  const texto = !online
    ? 'Sin conexión · guardando en el dispositivo'
    : pendientes > 0
    ? `Sincronizando… ${pendientes} pendiente${pendientes === 1 ? '' : 's'}`
    : 'Todo sincronizado';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 12.5,
        color,
        fontWeight: 600,
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: color,
          display: 'inline-block',
        }}
      />
      {texto}
    </div>
  );
}
