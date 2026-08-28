import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Cart from '../../src/componentes/Cart';
import { BrowserRouter } from 'react-router-dom';

// 1. MOCK DE DEPENDENCIAS Y SERVICIOS
// Como Cart hace peticiones a la base de datos (APIs), simulamos las respuestas
// para que la prueba sea rápida y no dependa del backend real.
vi.mock('../../src/services/producto.service', () => ({
  obtenerProductos: vi.fn(() => Promise.resolve({ data: [] }))
}));

vi.mock('../../src/services/servicio.service', () => ({
  obtenerServicios: vi.fn(() => Promise.resolve({ data: [] }))
}));

vi.mock('../../src/services/moto.service', () => ({
  obtenerMotos: vi.fn(() => Promise.resolve({ data: [] }))
}));

describe('Componente Cart (Carrito de compras)', () => {
  beforeEach(() => {
    // Limpiamos el localStorage antes de cada prueba para evitar que 
    // datos residuales afecten otras pruebas.
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('debe renderizar el título y mostrar que el carrito está vacío inicialmente', async () => {
    // Envolvemos Cart en BrowserRouter porque usa <Link> y useNavigate internamente
    render(
      <BrowserRouter>
        <Cart />
      </BrowserRouter>
    );

    // Verificamos que el título principal esté presente
    expect(screen.getByText(/TU CARRITO DE COMPRAS/i)).toBeInTheDocument();
    
    // Al estar el localStorage vacío, debe mostrar el mensaje de carrito vacío
    expect(screen.getByText(/Tu carrito está vacío/i)).toBeInTheDocument();
  });

  it('debe cargar y renderizar los items si existen en el localStorage', () => {
    // 1. PREPARACIÓN: Simulamos que el usuario ya tenía algo guardado en el carrito
    const mockCart = [
      {
        id: 'prod_1',
        name: 'Aceite Motul 7100',
        price: 85000,
        quantity: 2,
        category: 'Aceites',
        type: 'producto',
        icon: 'droplet'
      }
    ];
    // Lo inyectamos en el Storage del navegador virtual
    localStorage.setItem('ktmCart', JSON.stringify(mockCart));

    // 2. EJECUCIÓN: Renderizamos el componente
    render(
      <BrowserRouter>
        <Cart />
      </BrowserRouter>
    );

    // 3. VALIDACIÓN:
    // Debe mostrar el nombre del producto
    expect(screen.getAllByText(/Aceite Motul 7100/i)[0]).toBeInTheDocument();
    
    // Debe mostrar la sección de resumen ya que hay items
    expect(screen.getByText(/RESUMEN DEL PEDIDO/i)).toBeInTheDocument();
    
    // Verificamos que el mensaje de "carrito vacío" ya no esté en la pantalla
    expect(screen.queryByText(/Tu carrito está vacío/i)).not.toBeInTheDocument();
  });
});




