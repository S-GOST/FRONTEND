import { useState, useEffect, useMemo, useCallback } from 'react';
import { Service, CartItem } from '../types';

/**
 * Hook personalizado para gestionar el carrito de compras.
 * Centraliza toda la lógica de carrito que antes estaba dispersa en App.tsx.
 */
export function useCart() {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const savedCart = localStorage.getItem('ktmCart');
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (error) {
      console.error('Error al leer el carrito desde localStorage:', error);
    }
    return [];
  });

  // Persistir el carrito en localStorage cada vez que cambie
  useEffect(() => {
    localStorage.setItem('ktmCart', JSON.stringify(cart));
  }, [cart]);

  // Sincronizar el carrito cuando otras pestañas o componentes lo modifican
  useEffect(() => {
    const syncCartFromStorage = () => {
      try {
        const savedCart = localStorage.getItem('ktmCart');
        if (savedCart) {
          const parsed = JSON.parse(savedCart);
          setCart(Array.isArray(parsed) ? parsed : []);
        } else {
          setCart([]);
        }
      } catch (e) {
        console.error('Error al sincronizar el carrito:', e);
      }
    };

    // Escuchar el evento personalizado disparado por Cart.tsx
    window.addEventListener('cartUpdated', syncCartFromStorage);
    // Escuchar cambios de localStorage entre pestañas
    window.addEventListener('storage', (e: StorageEvent) => {
      if (e.key === 'ktmCart') syncCartFromStorage();
    });

    return () => {
      window.removeEventListener('cartUpdated', syncCartFromStorage);
      window.removeEventListener('storage', syncCartFromStorage);
    };
  }, []);

  // Agregar un servicio o producto al carrito
  const addToCart = useCallback((service: Service) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === service.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === service.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...service, quantity: 1 }];
    });
  }, []);

  // Cantidad total de items en el carrito (memoizado para evitar recálculos)
  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  return { cart, addToCart, cartCount };
}
