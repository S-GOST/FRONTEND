import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TableProductos from '../../src/componentes/TableProductos/productos';
import { 
  obtenerProductos, 
  insertarProducto, 
  eliminarProducto, 
  habilitarProducto 
} from '../../src/services/producto.service';
import { obtenerCategoriasPorTipo } from '../../src/services/categoria.service';
import { MemoryRouter } from 'react-router-dom';
import Swal from 'sweetalert2';

vi.mock('../../src/services/producto.service', () => ({
  obtenerProductos: vi.fn(),
  insertarProducto: vi.fn(),
  eliminarProducto: vi.fn(),
  habilitarProducto: vi.fn()
}));

vi.mock('../../src/services/categoria.service', () => ({
  obtenerCategoriasPorTipo: vi.fn()
}));

vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn()
  }
}));

describe('TableProductos', () => {
  const mockProductos = [
    { ID_PRODUCTOS: 1, ID_CATEGORIA: 1, Marca: 'Marca A', Nombre: 'Prod A', precio_costo: 10, precio_venta: 20, stock: 5, stock_minimo: 2, Estado: 'Disponibles', categoria_nombre: 'Cat 1' },
    { ID_PRODUCTOS: 2, ID_CATEGORIA: 2, Marca: 'Marca B', Nombre: 'Prod B', precio_costo: 15, precio_venta: 30, stock: 0, stock_minimo: 5, Estado: 'Inactivo', categoria_nombre: 'Cat 2' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(obtenerProductos).mockResolvedValue({ data: { success: true, data: mockProductos } } as any);
    vi.mocked(obtenerCategoriasPorTipo).mockResolvedValue({ data: [{ ID_CATEGORIA: 1, nombre: 'Cat 1' }, { ID_CATEGORIA: 2, nombre: 'Cat 2' }] } as any);
  });

  const renderComponent = () => render(
    <MemoryRouter>
      <TableProductos />
    </MemoryRouter>
  );

  it('should render the list of products', async () => {
    renderComponent();
    expect(screen.getByText('Cargando productos...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByText('Cargando productos...')).not.toBeInTheDocument();
    });
    
    expect(screen.getByText('Prod A')).toBeInTheDocument();
    expect(screen.getByText('Prod B')).toBeInTheDocument();
  });

  it('should filter products by search term', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Prod A')).toBeInTheDocument();
    });
    
    const searchInput = screen.getByPlaceholderText(/Buscar por nombre/i);
    fireEvent.change(searchInput, { target: { value: 'Marca B' } });
    
    const searchBtn = screen.getByTitle('Buscar');
    fireEvent.click(searchBtn);
    
    expect(screen.queryByText('Prod A')).not.toBeInTheDocument();
    expect(screen.getByText('Prod B')).toBeInTheDocument();
  });

  it('should handle creating a new product', async () => {
    vi.mocked(insertarProducto).mockResolvedValueOnce({ data: { success: true } } as any);
    
    renderComponent();
    await waitFor(() => expect(screen.getByText('Prod A')).toBeInTheDocument());
    
    fireEvent.click(screen.getByText(/Nuevo Producto/i));
    
    await waitFor(() => {
      expect(screen.getByText('Crear Producto')).toBeInTheDocument();
    });
    
    fireEvent.change(screen.getByLabelText('ID Producto'), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText('Categoría'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Marca'), { target: { value: 'NuevaMarca' } });
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'NuevoProd' } });
    fireEvent.change(screen.getByLabelText('Precio de Costo'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Precio de Venta'), { target: { value: '20' } });
    fireEvent.change(screen.getByLabelText('Stock'), { target: { value: '50' } });
    fireEvent.change(screen.getByLabelText('Stock Mínimo'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'Disponibles' } });
    
    fireEvent.click(screen.getByText('Guardar'));
    
    await waitFor(() => {
      expect(insertarProducto).toHaveBeenCalled();
    });
  });

  it('should handle disabling a product', async () => {
    vi.mocked(Swal.fire).mockResolvedValueOnce({ isConfirmed: true } as any);
    vi.mocked(eliminarProducto).mockResolvedValueOnce({ data: { success: true } } as any);
    
    renderComponent();
    await waitFor(() => expect(screen.getByText('Prod A')).toBeInTheDocument());
    
    const disableBtns = screen.getAllByText('Inhabilitar');
    fireEvent.click(disableBtns[0]);
    
    await waitFor(() => {
      expect(eliminarProducto).toHaveBeenCalledWith(1);
    });
  });

  it('should handle enabling a product', async () => {
    vi.mocked(Swal.fire).mockResolvedValueOnce({ isConfirmed: true } as any);
    vi.mocked(habilitarProducto).mockResolvedValueOnce({ data: { success: true } } as any);
    
    renderComponent();
    await waitFor(() => expect(screen.getByText('Prod B')).toBeInTheDocument());
    
    const enableBtns = screen.getAllByText('Habilitar');
    fireEvent.click(enableBtns[0]);
    
    await waitFor(() => {
      expect(habilitarProducto).toHaveBeenCalledWith(2);
    });
  });
});
