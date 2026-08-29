// No MemoryRouter needed for this hook test
import { renderHook, act } from '@testing-library/react';
import { useInactivityTimer } from '../../src/hooks/useInactivityTimer';
import { vi, describe, it, beforeEach, afterEach, expect } from 'vitest';

describe('useInactivityTimer Hook', () => {
  beforeEach(() => {
    // Usamos temporizadores falsos para controlar el tiempo
    vi.useFakeTimers(); // Cambio: jest -> vi
  });

  afterEach(() => {
    vi.useRealTimers(); // Cambio: jest -> vi
    vi.clearAllMocks(); // Cambio: jest -> vi
  });

  // 1. DISPARA EL TIMEOUT SIN ACTIVIDAD
  it('debería llamar onTimeout al cumplirse el tiempo sin actividad', () => {
    const onTimeout = vi.fn(); // Cambio: jest -> vi
    renderHook(() => useInactivityTimer(5000, onTimeout));

    expect(onTimeout).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(5000); // Cambio: jest -> vi
    });

    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  // 2. NO DISPARA ANTES DE TIEMPO
  it('no debería llamar onTimeout antes de cumplirse el tiempo', () => {
    const onTimeout = vi.fn(); // Cambio: jest -> vi
    renderHook(() => useInactivityTimer(5000, onTimeout));

    act(() => {
      vi.advanceTimersByTime(4999); //Cambio: jest -> vi
    });

    expect(onTimeout).not.toHaveBeenCalled();
  });

  // 3. LA ACTIVIDAD REINICIA EL TEMPORIZADOR
  it('debería reiniciar el temporizador con actividad del usuario', () => {
    const onTimeout = vi.fn(); // Cambio: jest -> vi
    renderHook(() => useInactivityTimer(5000, onTimeout));

    // Avanzamos 3 segundos (aún sin disparar)
    act(() => {
      vi.advanceTimersByTime(3000); // Cambio: jest -> vi
    });

    // El usuario mueve el mouse → el timer se reinicia
    act(() => {
      window.dispatchEvent(new Event('mousemove'));
    });

    // Avanzamos 3 segundos más: sin el reset ya habría disparado (6s > 5s)
    act(() => {
      vi.advanceTimersByTime(3000); // Cambio: jest -> vi
    });
    expect(onTimeout).not.toHaveBeenCalled();

    // Completamos los 5 segundos desde el último reset
    act(() => {
      vi.advanceTimersByTime(2000); // Cambio: jest -> vi
    });
    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  // 4. TODOS LOS EVENTOS REINICIAN
  it('debería reiniciar el temporizador con cada tipo de evento', () => {
    const onTimeout = vi.fn(); // Cambio: jest -> vi
    renderHook(() => useInactivityTimer(5000, onTimeout));

    ['mousedown', 'keypress', 'touchmove', 'scroll'].forEach((event) => {
      act(() => {
        vi.advanceTimersByTime(4000); // Cambio: jest -> vi
      });
      act(() => {
        window.dispatchEvent(new Event(event));
      });
    });

    // Después de varios resets seguidos, nunca disparó
    expect(onTimeout).not.toHaveBeenCalled();

    // Sin más actividad, ahora sí dispara
    act(() => {
      vi.advanceTimersByTime(5000); // Cambio: jest -> vi
    });
    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  // 5. INACTIVO NO DISPARA
  it('no debería activar el temporizador si isActive es false', () => {
    const onTimeout = vi.fn(); // Cambio: jest -> vi
    renderHook(() => useInactivityTimer(5000, onTimeout, false));

    act(() => {
      vi.advanceTimersByTime(60000); // Cambio: jest -> vi
    });

    expect(onTimeout).not.toHaveBeenCalled();
  });

  // 6. SE ACTIVA AL CAMBIAR isActive
  it('debería empezar a contar cuando isActive cambia a true', () => {
    const onTimeout = vi.fn(); // Cambio: jest -> vi
    const { rerender } = renderHook(
      ({ active }) => useInactivityTimer(5000, onTimeout, active),
      { initialProps: { active: false } }
    );

    act(() => {
      vi.advanceTimersByTime(10000); // Cambio: jest -> vi
    });
    expect(onTimeout).not.toHaveBeenCalled();

    rerender({ active: true });

    act(() => {
      vi.advanceTimersByTime(5000); // Cambio: jest -> vi
    });
    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  // 7. LIMPIEZA AL DESMONTAR
  it('debería limpiar el temporizador al desmontar el hook', () => {
    const onTimeout = vi.fn(); // Cambio: jest -> vi
    const { unmount } = renderHook(() => useInactivityTimer(5000, onTimeout));

    act(() => {
      vi.advanceTimersByTime(2000); //  Cambio: jest -> vi
    });

    unmount();

    act(() => {
      vi.advanceTimersByTime(60000); // Cambio: jest -> vi
    });

    expect(onTimeout).not.toHaveBeenCalled();
  });

  // 8. ACTIVIDAD CONSTANTE NUNCA DISPARA
  it('no debería disparar si el usuario está siempre activo', () => {
    const onTimeout = vi.fn(); // Cambio: jest -> vi
    renderHook(() => useInactivityTimer(5000, onTimeout));

    // Simulamos actividad cada 2 segundos durante 5 ciclos
    for (let i = 0; i < 5; i++) {
      act(() => {
        vi.advanceTimersByTime(2000); // Cambio: jest -> vi
      });
      act(() => {
        window.dispatchEvent(new Event('mousemove'));
      });
    }

    // 10 segundos "reales" pasaron, pero nunca 5 seguidos sin actividad
    expect(onTimeout).not.toHaveBeenCalled();
  });
});


