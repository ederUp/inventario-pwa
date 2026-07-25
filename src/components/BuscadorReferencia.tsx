import { useEffect, useRef, useState } from 'react';

interface Props {
  valor: string;
  onCambio: (v: string) => void;
}

// Detecta si el navegador soporta BarcodeDetector nativo (Chrome/Android/algunos iOS).
// Si no está disponible, el input de texto sigue funcionando perfecto con
// lectores de código de barras tipo "teclado" (los más comunes en bodega),
// que solo escriben el código y presionan Enter.
const soportaCamara = typeof window !== 'undefined' && 'BarcodeDetector' in window;

export default function BuscadorReferencia({ valor, onCambio }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [escaneando, setEscaneando] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!escaneando || !videoRef.current) return;
    let activo = true;
    let stream: MediaStream;

    (async () => {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (!activo) return;
      videoRef.current!.srcObject = stream;
      await videoRef.current!.play();

      // @ts-expect-error BarcodeDetector aún no está en los tipos estándar de TS
      const detector = new window.BarcodeDetector();
      const tick = async () => {
        if (!activo || !videoRef.current) return;
        try {
          const codigos = await detector.detect(videoRef.current);
          if (codigos[0]) {
            onCambio(codigos[0].rawValue);
            setEscaneando(false);
            return;
          }
        } catch {
          /* frame no válido aún, seguimos intentando */
        }
        requestAnimationFrame(tick);
      };
      tick();
    })();

    return () => {
      activo = false;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [escaneando, onCambio]);

  return (
    <div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          ref={inputRef}
          value={valor}
          onChange={(e) => onCambio(e.target.value)}
          placeholder="Filtrar por referencia, línea o descripción (opcional)…"
          style={{
            flex: 1,
            padding: '14px 16px',
            borderRadius: 10,
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            color: 'var(--text)',
            fontSize: 16,
          }}
        />
        {soportaCamara && (
          <button
            onClick={() => setEscaneando((s) => !s)}
            style={{
              padding: '0 16px',
              borderRadius: 10,
              border: '1px solid var(--border)',
              background: escaneando ? 'var(--amber-dim)' : 'var(--surface)',
              color: escaneando ? 'var(--amber)' : 'var(--text-muted)',
              fontWeight: 600,
            }}
          >
            {escaneando ? 'Cerrar' : '⎘ Escanear'}
          </button>
        )}
      </div>
      {escaneando && (
        <video
          ref={videoRef}
          muted
          playsInline
          style={{
            width: '100%',
            marginTop: 10,
            borderRadius: 10,
            border: '1px solid var(--border)',
            maxHeight: 260,
            objectFit: 'cover',
          }}
        />
      )}
    </div>
  );
}
