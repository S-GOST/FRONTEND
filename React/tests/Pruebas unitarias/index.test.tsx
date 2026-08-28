import { Service, CartItem, SearchSuggestion } from '../../src/types';

describe('TypeScript Interfaces', () => {
  // ========== PRUEBAS PARA SERVICE ==========

  // 1. SERVICE - OBJETO VÁLIDO
  it('debería crear un objeto Service válido', () => {
    const service: Service = {
      id: '1',
      name: 'Cambio de aceite',
      category: 'Mantenimiento',
      price: 50000,
      description: 'Cambio de aceite sintético',
      icon: 'bi-oil'
    };

    expect(service.id).toBe('1');
    expect(service.name).toBe('Cambio de aceite');
    expect(service.category).toBe('Mantenimiento');
    expect(service.price).toBe(50000);
    expect(service.description).toBe('Cambio de aceite sintético');
    expect(service.icon).toBe('bi-oil');
  });

  // 2. SERVICE - MÚLTIPLES SERVICIOS
  it('debería crear múltiples objetos Service', () => {
    const services: Service[] = [
      {
        id: '1',
        name: 'Cambio de aceite',
        category: 'Mantenimiento',
        price: 50000,
        description: 'Cambio de aceite sintético',
        icon: 'bi-oil'
      },
      {
        id: '2',
        name: 'Revisión de frenos',
        category: 'Reparaciones',
        price: 80000,
        description: 'Revisión completa del sistema de frenos',
        icon: 'bi-disc'
      },
      {
        id: '3',
        name: 'Diagnóstico computarizado',
        category: 'Diagnósticos',
        price: 30000,
        description: 'Escaneo completo del vehículo',
        icon: 'bi-laptop'
      }
    ];

    expect(services).toHaveLength(3);
    expect(services[0].category).toBe('Mantenimiento');
    expect(services[1].category).toBe('Reparaciones');
    expect(services[2].category).toBe('Diagnósticos');
  });

  // 3. SERVICE - FILTRADO POR CATEGORÍA
  it('debería filtrar servicios por categoría', () => {
    const services: Service[] = [
      {
        id: '1',
        name: 'Cambio de aceite',
        category: 'Mantenimiento',
        price: 50000,
        description: 'Cambio de aceite sintético',
        icon: 'bi-oil'
      },
      {
        id: '2',
        name: 'Revisión de frenos',
        category: 'Mantenimiento',
        price: 80000,
        description: 'Revisión completa del sistema de frenos',
        icon: 'bi-disc'
      },
      {
        id: '3',
        name: 'Reparación de motor',
        category: 'Reparaciones',
        price: 150000,
        description: 'Reparación completa del motor',
        icon: 'bi-gear'
      }
    ];

    const mantenimientoServices = services.filter(s => s.category === 'Mantenimiento');
    
    expect(mantenimientoServices).toHaveLength(2);
    expect(mantenimientoServices.every(s => s.category === 'Mantenimiento')).toBe(true);
  });

  // 4. SERVICE - CÁLCULO DE TOTAL
  it('debería calcular el total de precios de servicios', () => {
    const services: Service[] = [
      {
        id: '1',
        name: 'Cambio de aceite',
        category: 'Mantenimiento',
        price: 50000,
        description: 'Cambio de aceite sintético',
        icon: 'bi-oil'
      },
      {
        id: '2',
        name: 'Revisión de frenos',
        category: 'Reparaciones',
        price: 80000,
        description: 'Revisión completa del sistema de frenos',
        icon: 'bi-disc'
      }
    ];

    const total = services.reduce((sum, service) => sum + service.price, 0);
    
    expect(total).toBe(130000);
  });

  // ========== PRUEBAS PARA CARTITEM ==========

  // 5. CARTITEM - OBJETO VÁLIDO
  it('debería crear un objeto CartItem válido', () => {
    const cartItem: CartItem = {
      id: '1',
      name: 'Cambio de aceite',
      category: 'Mantenimiento',
      price: 50000,
      description: 'Cambio de aceite sintético',
      icon: 'bi-oil',
      quantity: 2
    };

    expect(cartItem.id).toBe('1');
    expect(cartItem.name).toBe('Cambio de aceite');
    expect(cartItem.quantity).toBe(2);
    expect(cartItem.price).toBe(50000);
  });

  // 6. CARTITEM - HERENCIA DE SERVICE
  it('debería heredar todas las propiedades de Service', () => {
    const cartItem: CartItem = {
      id: '1',
      name: 'Cambio de aceite',
      category: 'Mantenimiento',
      price: 50000,
      description: 'Cambio de aceite sintético',
      icon: 'bi-oil',
      quantity: 2
    };

    // Verificar que tiene todas las propiedades de Service
    expect(cartItem.id).toBeDefined();
    expect(cartItem.name).toBeDefined();
    expect(cartItem.category).toBeDefined();
    expect(cartItem.price).toBeDefined();
    expect(cartItem.description).toBeDefined();
    expect(cartItem.icon).toBeDefined();
    
    // Verificar propiedad adicional de CartItem
    expect(cartItem.quantity).toBeDefined();
  });

  // 7. CARTITEM - CÁLCULO DE SUBTOTAL
  it('debería calcular el subtotal correctamente', () => {
    const cartItem: CartItem = {
      id: '1',
      name: 'Cambio de aceite',
      category: 'Mantenimiento',
      price: 50000,
      description: 'Cambio de aceite sintético',
      icon: 'bi-oil',
      quantity: 3
    };

    const subtotal = cartItem.price * cartItem.quantity;
    
    expect(subtotal).toBe(150000);
  });

  // 8. CARTITEM - MÚLTIPLES ITEMS EN CARRITO
  it('debería manejar múltiples items en el carrito', () => {
    const cartItems: CartItem[] = [
      {
        id: '1',
        name: 'Cambio de aceite',
        category: 'Mantenimiento',
        price: 50000,
        description: 'Cambio de aceite sintético',
        icon: 'bi-oil',
        quantity: 2
      },
      {
        id: '2',
        name: 'Revisión de frenos',
        category: 'Reparaciones',
        price: 80000,
        description: 'Revisión completa del sistema de frenos',
        icon: 'bi-disc',
        quantity: 1
      }
    ];

    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    expect(totalItems).toBe(3);
    expect(totalPrice).toBe(180000);
  });

  // 9. CARTITEM - ACTUALIZAR CANTIDAD
  it('debería actualizar la cantidad de un item', () => {
    const cartItem: CartItem = {
      id: '1',
      name: 'Cambio de aceite',
      category: 'Mantenimiento',
      price: 50000,
      description: 'Cambio de aceite sintético',
      icon: 'bi-oil',
      quantity: 1
    };

    cartItem.quantity = 5;
    
    expect(cartItem.quantity).toBe(5);
    expect(cartItem.price * cartItem.quantity).toBe(250000);
  });

  // 10. CARTITEM - ELIMINAR ITEM DEL CARRITO
  it('debería eliminar un item del carrito', () => {
    const cartItems: CartItem[] = [
      {
        id: '1',
        name: 'Cambio de aceite',
        category: 'Mantenimiento',
        price: 50000,
        description: 'Cambio de aceite sintético',
        icon: 'bi-oil',
        quantity: 2
      },
      {
        id: '2',
        name: 'Revisión de frenos',
        category: 'Reparaciones',
        price: 80000,
        description: 'Revisión completa del sistema de frenos',
        icon: 'bi-disc',
        quantity: 1
      }
    ];

    const filteredCart = cartItems.filter(item => item.id !== '1');
    
    expect(filteredCart).toHaveLength(1);
    expect(filteredCart[0].id).toBe('2');
  });

  // ========== PRUEBAS PARA SEARCHSUGGESTION ==========

  // 11. SEARCHSUGGESTION - OBJETO VÁLIDO
  it('debería crear un objeto SearchSuggestion válido', () => {
    const suggestion: SearchSuggestion = {
      id: '1',
      name: 'Cambio de aceite',
      category: 'Mantenimiento',
      icon: 'bi-oil',
      price: '50000'
    };

    expect(suggestion.id).toBe('1');
    expect(suggestion.name).toBe('Cambio de aceite');
    expect(suggestion.category).toBe('Mantenimiento');
    expect(suggestion.icon).toBe('bi-oil');
    expect(suggestion.price).toBe('50000');
  });

  // 12. SEARCHSUGGESTION - MÚLTIPLES SUGERENCIAS
  it('debería crear múltiples sugerencias de búsqueda', () => {
    const suggestions: SearchSuggestion[] = [
      {
        id: '1',
        name: 'Cambio de aceite',
        category: 'Mantenimiento',
        icon: 'bi-oil',
        price: '50000'
      },
      {
        id: '2',
        name: 'Revisión de frenos',
        category: 'Reparaciones',
        icon: 'bi-disc',
        price: '80000'
      },
      {
        id: '3',
        name: 'Diagnóstico computarizado',
        category: 'Diagnósticos',
        icon: 'bi-laptop',
        price: '30000'
      }
    ];

    expect(suggestions).toHaveLength(3);
    expect(suggestions.map(s => s.name)).toEqual([
      'Cambio de aceite',
      'Revisión de frenos',
      'Diagnóstico computarizado'
    ]);
  });

  // 13. SEARCHSUGGESTION - FILTRADO POR NOMBRE
  it('debería filtrar sugerencias por nombre', () => {
    const suggestions: SearchSuggestion[] = [
      {
        id: '1',
        name: 'Cambio de aceite',
        category: 'Mantenimiento',
        icon: 'bi-oil',
        price: '50000'
      },
      {
        id: '2',
        name: 'Revisión de frenos',
        category: 'Reparaciones',
        icon: 'bi-disc',
        price: '80000'
      },
      {
        id: '3',
        name: 'Aceite sintético premium',
        category: 'Repuestos',
        icon: 'bi-drop',
        price: '75000'
      }
    ];

    const filteredSuggestions = suggestions.filter(s => 
      s.name.toLowerCase().includes('aceite')
    );
    
    expect(filteredSuggestions).toHaveLength(2);
    expect(filteredSuggestions.every(s => 
      s.name.toLowerCase().includes('aceite')
    )).toBe(true);
  });

  // 14. SEARCHSUGGESTION - FILTRADO POR CATEGORÍA
  it('debería filtrar sugerencias por categoría', () => {
    const suggestions: SearchSuggestion[] = [
      {
        id: '1',
        name: 'Cambio de aceite',
        category: 'Mantenimiento',
        icon: 'bi-oil',
        price: '50000'
      },
      {
        id: '2',
        name: 'Revisión de frenos',
        category: 'Mantenimiento',
        icon: 'bi-disc',
        price: '80000'
      },
      {
        id: '3',
        name: 'Reparación de motor',
        category: 'Reparaciones',
        icon: 'bi-gear',
        price: '150000'
      }
    ];

    const mantenimientoSuggestions = suggestions.filter(s => 
      s.category === 'Mantenimiento'
    );
    
    expect(mantenimientoSuggestions).toHaveLength(2);
    expect(mantenimientoSuggestions.every(s => 
      s.category === 'Mantenimiento'
    )).toBe(true);
  });

  // 15. SEARCHSUGGESTION - CONVERSIÓN DE PRECIO
  it('debería convertir precio de string a number', () => {
    const suggestion: SearchSuggestion = {
      id: '1',
      name: 'Cambio de aceite',
      category: 'Mantenimiento',
      icon: 'bi-oil',
      price: '50000'
    };

    const numericPrice = parseInt(suggestion.price);
    
    expect(numericPrice).toBe(50000);
    expect(typeof numericPrice).toBe('number');
  });

  // 16. SEARCHSUGGESTION - ORDENAMIENTO POR PRECIO
  it('debería ordenar sugerencias por precio', () => {
    const suggestions: SearchSuggestion[] = [
      {
        id: '1',
        name: 'Cambio de aceite',
        category: 'Mantenimiento',
        icon: 'bi-oil',
        price: '50000'
      },
      {
        id: '2',
        name: 'Revisión de frenos',
        category: 'Reparaciones',
        icon: 'bi-disc',
        price: '80000'
      },
      {
        id: '3',
        name: 'Diagnóstico computarizado',
        category: 'Diagnósticos',
        icon: 'bi-laptop',
        price: '30000'
      }
    ];

    const sortedSuggestions = [...suggestions].sort((a, b) => 
      parseInt(a.price) - parseInt(b.price)
    );
    
    expect(sortedSuggestions[0].price).toBe('30000');
    expect(sortedSuggestions[1].price).toBe('50000');
    expect(sortedSuggestions[2].price).toBe('80000');
  });
});


