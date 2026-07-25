interface Props {
  diferencia: number;
}

export default function DiffBadge({ diferencia }: Props) {
  const estado = diferencia === 0 ? 'ok' : diferencia > 0 ? 'sobrante' : 'faltante';
  const color = estado === 'ok' ? 'var(--ok)' : estado === 'sobrante' ? 'var(--steel)' : 'var(--alert)';
  const etiqueta = estado === 'ok' ? 'Cuadra' : estado === 'sobrante' ? 'Sobrante' : 'Faltante';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 999,
        background: `${color}22`,
        color,
        fontSize: 13,
        fontWeight: 600,
        border: `1px solid ${color}55`,
      }}
    >
      <span
        className="num"
        style={{ fontWeight: 700 }}
      >
        {diferencia > 0 ? '+' : ''}
        {diferencia}
      </span>
      {etiqueta}
    </span>
  );
}
