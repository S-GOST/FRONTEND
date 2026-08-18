import { useEffect, useRef } from 'react';

export const useInactivityTimer = (timeoutMs: number, onTimeout: () => void, isActive: boolean = true) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isActive) return;

    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onTimeout();
      }, timeoutMs);
    };

    // Eventos que reinician el temporizador
    const events = ['mousemove', 'mousedown', 'keypress', 'touchmove', 'scroll'];

    const handleUserActivity = () => {
      resetTimer();
    };

    // Iniciar temporizador por primera vez
    resetTimer();

    // Suscribirse a los eventos
    events.forEach(event => window.addEventListener(event, handleUserActivity));

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach(event => window.removeEventListener(event, handleUserActivity));
    };
  }, [timeoutMs, onTimeout, isActive]);
};
