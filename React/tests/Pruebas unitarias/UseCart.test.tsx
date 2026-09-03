import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCart } from '../../src/hooks/useCart';
import { Service } from '../../src/types';

describe('useCart', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  const mockService: Service = {
    id: 1,
    name: 'Test Service',
    description: 'Desc',
    price: 1000,
    icon: 'bi-wrench'
  };

  it('initializes with empty cart if localStorage is empty', () => {
    const { result } = renderHook(() => useCart());
    expect(result.current.cart).toEqual([]);
    expect(result.current.cartCount).toBe(0);
  });

  it('initializes with cart from localStorage', () => {
    localStorage.setItem('ktmCart', JSON.stringify([{ ...mockService, quantity: 2 }]));
    const { result } = renderHook(() => useCart());
    expect(result.current.cart.length).toBe(1);
    expect(result.current.cartCount).toBe(2);
  });

  it('adds a new item to cart', () => {
    const { result } = renderHook(() => useCart());
    act(() => {
      result.current.addToCart(mockService);
    });
    expect(result.current.cart.length).toBe(1);
    expect(result.current.cartCount).toBe(1);
    expect(result.current.cart[0].quantity).toBe(1);
    
    const savedCart = JSON.parse(localStorage.getItem('ktmCart') || '[]');
    expect(savedCart.length).toBe(1);
  });

  it('increments quantity if item already in cart', () => {
    const { result } = renderHook(() => useCart());
    act(() => {
      result.current.addToCart(mockService);
    });
    act(() => {
      result.current.addToCart(mockService);
    });
    expect(result.current.cart.length).toBe(1);
    expect(result.current.cartCount).toBe(2);
    expect(result.current.cart[0].quantity).toBe(2);
  });

  it('syncs across tabs (storage event)', () => {
    const { result } = renderHook(() => useCart());
    
    act(() => {
      localStorage.setItem('ktmCart', JSON.stringify([{ ...mockService, quantity: 3 }]));
      window.dispatchEvent(new StorageEvent('storage', { key: 'ktmCart' }));
    });
    
    expect(result.current.cart.length).toBe(1);
    expect(result.current.cartCount).toBe(3);
  });
});
