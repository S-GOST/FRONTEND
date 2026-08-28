import { renderHook, act } from '@testing-library/react';
import { useCart } from '../../src/hooks/useCart';
import { vi, describe, it, beforeEach, expect } from 'vitest';

// ==================== DATOS DE PRUEBA ====================
const mockService = {
  id: 1,
  nombre: 'Cambio de aceite',
  precio: 50000,
} as any;

const mockService2 = {
  id: 2,
  nombre: 'Alineación',
  precio: 30000,
} as any;

describe('useCart Hook', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks(); // ✅ Cambio: jest -> vi
  });

  // 1. CARRITO VACÍO POR DEFECTO
  it('debería iniciar con carrito vacío si no hay datos en localStorage', () => {
    const { result } = renderHook(() => useCart());

    expect(result.current.cart).toEqual([]);
    expect(result.current.cartCount).toBe(0);
  });

  // 2. CARGA INICIAL DESDE LOCALSTORAGE
  it('debería cargar el carrito guardado en localStorage al iniciar', () => {
    const savedCart = [{ ...mockService, quantity: 3 }];
    localStorage.setItem('ktmCart', JSON.stringify(savedCart));

    const { result } = renderHook(() => useCart());

    expect(result.current.cart).toEqual(savedCart);
    expect(result.current.cartCount).toBe(3);
  });

  // 3. JSON INVÁLIDO EN LOCALSTORAGE
  it('debería iniciar vacío si el JSON guardado está corrupto', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {}); // ✅ Cambio: jest -> vi
    localStorage.setItem('ktmCart', '{json-invalido');

    const { result } = renderHook(() => useCart());

    expect(result.current.cart).toEqual([]);
    consoleSpy.mockRestore();
  });

  // 4. JSON NO ARRAY EN LOCALSTORAGE
  it('debería iniciar vacío si lo guardado no es un array', () => {
    localStorage.setItem('ktmCart', JSON.stringify({ id: 1 }));

    const { result } = renderHook(() => useCart());

    expect(result.current.cart).toEqual([]);
  });

  // 5. AGREGAR ITEM NUEVO
  it('debería agregar un item nuevo con cantidad 1', () => {
    const { result } = renderHook(() => useCart());

    act(() => {
      result.current.addToCart(mockService);
    });

    expect(result.current.cart).toHaveLength(1);
    expect(result.current.cart[0]).toEqual({ ...mockService, quantity: 1 });
  });

  // 6. AGREGAR ITEM EXISTENTE INCREMENTA CANTIDAD
  it('debería incrementar la cantidad si el item ya existe', () => {
    const { result } = renderHook(() => useCart());

    act(() => {
      result.current.addToCart(mockService);
    });
    act(() => {
      result.current.addToCart(mockService);
    });

    expect(result.current.cart).toHaveLength(1);
    expect(result.current.cart[0].quantity).toBe(2);
  });

  // 7. AGREGAR VARIOS ITEMS DIFERENTES
  it('debería mantener items separados si son diferentes', () => {
    const { result } = renderHook(() => useCart());

    act(() => {
      result.current.addToCart(mockService);
    });
    act(() => {
      result.current.addToCart(mockService2);
    });

    expect(result.current.cart).toHaveLength(2);
  });

  // 8. CÁLCULO DE CARTCOUNT
  it('debería calcular la cantidad total sumando todas las cantidades', () => {
    localStorage.setItem('ktmCart', JSON.stringify([
      { ...mockService, quantity: 2 },
      { ...mockService2, quantity: 3 },
    ]));

    const { result } = renderHook(() => useCart());

    expect(result.current.cartCount).toBe(5);
  });

  // 9. PERSISTENCIA AUTOMÁTICA EN LOCALSTORAGE
  it('debería guardar el carrito en localStorage cada vez que cambia', () => {
    const { result } = renderHook(() => useCart());

    act(() => {
      result.current.addToCart(mockService);
    });

    const stored = JSON.parse(localStorage.getItem('ktmCart') || '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe(1);
    expect(stored[0].quantity).toBe(1);
  });

  // 10. SINCRONIZACIÓN CON EVENTO "cartUpdated"
  it('debería sincronizar el carrito al recibir el evento cartUpdated', () => {
    const { result } = renderHook(() => useCart());
    expect(result.current.cart).toEqual([]);

    // Otra pestaña/componente modifica el localStorage
    localStorage.setItem('ktmCart', JSON.stringify([{ ...mockService2, quantity: 5 }]));

    act(() => {
      window.dispatchEvent(new Event('cartUpdated'));
    });

    expect(result.current.cart).toHaveLength(1);
    expect(result.current.cart[0].quantity).toBe(5);
  });

  // 11. SINCRONIZACIÓN CON EVENTO "storage" (OTRA PESTAÑA)
  it('debería sincronizar el carrito al recibir un evento storage con la clave ktmCart', () => {
    const { result } = renderHook(() => useCart());

    localStorage.setItem('ktmCart', JSON.stringify([{ ...mockService, quantity: 7 }]));

    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'ktmCart' }));
    });

    expect(result.current.cart).toHaveLength(1);
    expect(result.current.cart[0].quantity).toBe(7);
  });

  // 12. IGNORA EVENTOS STORAGE DE OTRAS CLAVES
  it('no debería sincronizar si el evento storage es de otra clave', () => {
    const { result } = renderHook(() => useCart());

    localStorage.setItem('ktmCart', JSON.stringify([{ ...mockService, quantity: 7 }]));

    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'otraClave' }));
    });

    expect(result.current.cart).toEqual([]);
  });
});


