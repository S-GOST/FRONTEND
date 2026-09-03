import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Cart from '../../src/componentes/Cart';
import * as productoService from '../../src/services/producto.service';
import * as servicioService from '../../src/services/servicio.service';
import * as motoService from '../../src/services/moto.service';
import { apiClient } from '../../src/config/axios';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom') as any),
  useNavigate: () => mockNavigate,
}));

vi.mock('../../src/services/producto.service');
vi.mock('../../src/services/servicio.service');
vi.mock('../../src/services/moto.service');
vi.mock('../../src/config/axios');

describe('Cart Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    
    // Mocks por defecto
    vi.mocked(productoService.obtenerProductos).mockResolvedValue({ data: [] } as any);
    vi.mocked(servicioService.obtenerServicios).mockResolvedValue({ data: [] } as any);
    vi.mocked(motoService.obtenerMotos).mockResolvedValue({ data: [] } as any);
  });

  const renderCart = () => render(<MemoryRouter><Cart /></MemoryRouter>);

  it('debería mostrar carrito vacío inicialmente', async () => {
    renderCart();
    expect(screen.getByText('Tu carrito está vacío')).toBeInTheDocument();
  });

  it('debería renderizar productos y servicios desde localStorage', async () => {
    const mockCart = [
      { id: 'prod_1', name: 'Aceite', price: 100, quantity: 1, type: 'producto', category: 'aceite' },
      { id: 'serv_2', name: 'Mantenimiento', price: 50, quantity: 2, type: 'servicio', category: 'mantenimiento' }
    ];
    localStorage.setItem('ktmCart', JSON.stringify(mockCart));

    renderCart();

    await waitFor(() => {
      expect(screen.getAllByText(/Aceite/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Mantenimiento/i).length).toBeGreaterThan(0);
      expect(screen.getByText('RESUMEN DEL PEDIDO')).toBeInTheDocument();
    });
  });

  it('debería permitir aumentar y disminuir cantidades', async () => {
    const mockCart = [
      { id: 'prod_1', name: 'Aceite', price: 100, quantity: 2, type: 'producto', category: 'aceite' }
    ];
    localStorage.setItem('ktmCart', JSON.stringify(mockCart));

    renderCart();

    await waitFor(() => expect(screen.getByText('2')).toBeInTheDocument());

    // Vitest no tiene name en los botones con solo iconos sin aria-label fácilmente
    const buttonsMinus = screen.getAllByRole('button');
    const minus = buttonsMinus.find(b => b.classList.contains('minus'))!;
    
    fireEvent.click(minus);

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem('ktmCart')!);
      expect(stored[0].quantity).toBe(1);
    });
  });

  it('debería mostrar modal de eliminar cuando cantidad baja de 1', async () => {
    const mockCart = [
      { id: 'prod_1', name: 'Aceite', price: 100, quantity: 1, type: 'producto', category: 'aceite' }
    ];
    localStorage.setItem('ktmCart', JSON.stringify(mockCart));

    renderCart();
    await waitFor(() => expect(screen.getAllByText(/Aceite/i).length).toBeGreaterThan(0));

    const buttonsMinus = screen.getAllByRole('button');
    const minus = buttonsMinus.find(b => b.classList.contains('minus'))!;
    
    fireEvent.click(minus);

    await waitFor(() => {
      expect(screen.getByText('Eliminar Producto')).toBeInTheDocument();
    });

    const confirmDelete = screen.getByRole('button', { name: /Eliminar/i });
    fireEvent.click(confirmDelete);

    await waitFor(() => {
      expect(screen.getByText('Tu carrito está vacío')).toBeInTheDocument();
    });
  });

  it('debería redirigir a login si procede al pago sin token', async () => {
    const mockCart = [
      { id: 'prod_1', name: 'Aceite', price: 100, quantity: 1, type: 'producto', category: 'aceite' }
    ];
    localStorage.setItem('ktmCart', JSON.stringify(mockCart));

    renderCart();
    await waitFor(() => expect(screen.getAllByText(/Aceite/i).length).toBeGreaterThan(0));

    const btnPago = screen.getAllByRole('button', { name: /PROCEDER AL PAGO/i })[0];
    fireEvent.click(btnPago);

    expect(screen.getByText('Debes iniciar sesión para proceder al pago')).toBeInTheDocument();
  });

  it('debería abrir modal de checkout si tiene token', async () => {
    localStorage.setItem('user_token', 'token-123');
    localStorage.setItem('user_id', '12345');
    const mockCart = [
      { id: 'prod_1', name: 'Aceite', price: 100, quantity: 1, type: 'producto', category: 'aceite' }
    ];
    localStorage.setItem('ktmCart', JSON.stringify(mockCart));

    const motosDelCliente = [
      { id_moto: 1, id_cliente: '12345', placa: 'ABC123', marca: 'KTM', modelo: 'Duke' }
    ];
    vi.mocked(motoService.obtenerMotos).mockResolvedValue({ data: motosDelCliente } as any);

    renderCart();
    await waitFor(() => expect(screen.getAllByText(/Aceite/i).length).toBeGreaterThan(0));

    const btnPago = screen.getAllByRole('button', { name: /PROCEDER AL PAGO/i })[0];
    fireEvent.click(btnPago);

    await waitFor(() => {
      expect(screen.getByText('Proceder al Pago')).toBeInTheDocument();
    });
  });

  it('debería procesar checkout completo y limpiar carrito', async () => {
    localStorage.setItem('user_token', 'token-123');
    localStorage.setItem('user_id', '12345');
    const mockCart = [
      { id: 'prod_1', name: 'Aceite', price: 100, quantity: 1, type: 'producto', category: 'aceite' }
    ];
    localStorage.setItem('ktmCart', JSON.stringify(mockCart));

    const motosDelCliente = [
      { id_moto: 1, id_cliente: '12345', placa: 'ABC123', marca: 'KTM', modelo: 'Duke', cilindraje: '390', kilometraje: '1000' }
    ];
    vi.mocked(motoService.obtenerMotos).mockResolvedValue({ data: motosDelCliente } as any);
    vi.mocked(apiClient.post).mockResolvedValue({ data: { success: true } } as any);

    renderCart();
    await waitFor(() => expect(screen.getAllByText(/Aceite/i).length).toBeGreaterThan(0));

    fireEvent.click(screen.getAllByRole('button', { name: /PROCEDER AL PAGO/i })[0]);
    await waitFor(() => expect(screen.getByText('¿Confirmar compra?')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Continuar'));
    await waitFor(() => expect(screen.getByText('Selecciona tu moto')).toBeInTheDocument());

    // Seleccionar metodo pago
    const btnEfectivo = screen.getByText('Efectivo');
    fireEvent.click(btnEfectivo);

    fireEvent.click(screen.getAllByRole('button', { name: /Guardar Orden/i })[0]);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalled();
      expect(screen.getByText('¡Orden de servicio creada exitosamente!')).toBeInTheDocument();
      expect(localStorage.getItem('ktmCart')).toBeNull();
    });
  });
});
