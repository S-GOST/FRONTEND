import { Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TableProductos from '../../src/componentes/TableProductos/productos';
import * as productoService from '../../src/services/producto.service';
import * as categoriaService from '../../src/services/categoria.service';
import Swal from 'sweetalert2';

// 1. MOCKS DE MÓDULOS EXTERNOS
Mock('sweetalert2', () => ({
  fire: vi.fn().mockResolvedValue({ isConfirmed: true }),
}));

// Mock del componente FormattedId
Mock('../../src/componentes/FormattedId', () => ({
  FormattedId: ({ value }: any) => <span data-testid="formatted-id">{value}</span>,
}));

// 2. MOCKS DE SERVICIOS (mismas rutas que los imports)
Mock('../../src/services/producto.service');
Mock('../../src/services/categoria.service');

// ==================== DATOS DE PRUEBA ====================
const mockProductos = [
  { ID_PRODUCTOS: '1', ID_CATEGORIA: '10', Marca: 'KTM', Nombre: 'Aceite Motor', precio_venta: 50000, Estado: 'Disponibles', categoria_nombre: 'Repuestos' },
  { ID_PRODUCTOS: '2', ID_CATEGORIA: '20', Marca: 'Bosch', Nombre: 'Bujía', precio_venta: 15000, Estado: 'Inactivo', categoria_nombre: null },
];

const mockCategorias = [
  { ID_CATEGORIA: 10, nombre: 'Repuestos' },
  { ID_CATEGORIA: 20, nombre: 'Accesorios' },
];

describe('TableProductos Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    jest.mocked(productoService.obtenerProductos).mockResolvedValue({ data: mockProductos } as any);
    jest.mocked(categoriaService.obtenerCategoriasPorTipo).mockResolvedValue({ data: mockCategorias } as any);
  });

  // 1. RENDERIZADO INICIAL
  it('debería renderizar el título, buscador y botones de acción', async () => {
    render(<TableProductos />);

    expect(screen.getByText('Gestión de Productos')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/buscar por nombre, marca/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /nuevo producto/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
  });

  // 2. ESTADO DE CARGA
  it('debería mostrar "Cargando productos..." mientras consulta la API', () => {
    jest.mocked(productoService.obtenerProductos).mockImplementation(() => new Promise(() => {}));
    render(<TableProductos />);
    expect(screen.getByText(/cargando productos/i)).toBeInTheDocument();
  });

  // 3. ESTADO VACÍO
  it('debería mostrar mensaje cuando no hay productos', async () => {
    jest.mocked(productoService.obtenerProductos).mockResolvedValue({ data: [] } as any);
    render(<TableProductos />);

    await waitFor(() => {
      expect(screen.getByText(/no hay productos registrados/i)).toBeInTheDocument();
    });
  });

  // 4. ERROR AL CARGAR
  it('debería mostrar alerta de error si falla la carga', async () => {
    jest.mocked(productoService.obtenerProductos).mockRejectedValue(new Error('Fallo'));
    render(<TableProductos />);

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Error', text: 'No se pudieron cargar los productos.', icon: 'error' })
      );
    });
  });

  // 5. TABLA CON DATOS, CATEGORÍAS Y PRECIOS
  it('debería mostrar productos con categoría resuelta y precio formateado', async () => {
    render(<TableProductos />);

    await waitFor(() => {
      expect(screen.getByText('Aceite Motor')).toBeInTheDocument();
      expect(screen.getByText('Bujía')).toBeInTheDocument();
    });

    // Categoría directa (categoria_nombre) y por lookup (ID_CATEGORIA 20 → Accesorios)
    expect(screen.getByText('Repuestos')).toBeInTheDocument();
    expect(screen.getByText('Accesorios')).toBeInTheDocument();

    // Precios con "$" y formato local
    expect(screen.getByText(`$${(50000).toLocaleString()}`)).toBeInTheDocument();
    expect(screen.getByText(`$${(15000).toLocaleString()}`)).toBeInTheDocument();
  });

  // 6. BADGES DE ESTADO
  it('debería asignar la clase de badge correcta según el estado', async () => {
    render(<TableProductos />);

    await waitFor(() => {
      expect(screen.getByText('Disponibles')).toHaveClass('estado-badge bg-success');
      expect(screen.getByText('Inactivo')).toHaveClass('estado-badge bg-warning');
    });
  });

  // 7. BÚSQUEDA POR MARCA
  it('debería filtrar productos al buscar por marca', async () => {
    render(<TableProductos />);
    await waitFor(() => expect(screen.getByText('Aceite Motor')).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText(/buscar por nombre, marca/i), { target: { value: 'Bosch' } });
    fireEvent.click(screen.getByTitle('Buscar'));

    await waitFor(() => {
      expect(screen.getByText('Bujía')).toBeInTheDocument();
      expect(screen.queryByText('Aceite Motor')).not.toBeInTheDocument();
    });
  });

  // 8. BOTÓN RESET
  it('debería limpiar la búsqueda con Reset', async () => {
    render(<TableProductos />);
    await waitFor(() => expect(screen.getByText('Aceite Motor')).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText(/buscar por nombre, marca/i), { target: { value: 'Bosch' } });
    fireEvent.click(screen.getByTitle('Buscar'));
    fireEvent.click(screen.getByRole('button', { name: /reset/i }));

    await waitFor(() => {
      expect(screen.getByText('Aceite Motor')).toBeInTheDocument();
    });
  });

  // 9. MODAL DE CREACIÓN CON CATEGORÍAS
  it('debería abrir el modal con las categorías de producto en el select', async () => {
    render(<TableProductos />);
    fireEvent.click(screen.getByRole('button', { name: /nuevo producto/i }));

    expect(screen.getByText('Crear Producto')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Repuestos')).toBeInTheDocument();
      expect(screen.getByText('Accesorios')).toBeInTheDocument();
    });
  });

  // 10. VALIDACIÓN SOLO LETRAS
  it('debería filtrar números en Nombre y Marca con toast de advertencia', async () => {
    render(<TableProductos />);
    fireEvent.click(screen.getByRole('button', { name: /nuevo producto/i }));

    const modal = screen.getByText('Crear Producto').closest('.modal-container') as HTMLElement;
    const nombreInput = modal.querySelector('input[name="Nombre"]') as HTMLInputElement;

    fireEvent.change(nombreInput, { target: { value: 'Aceite123' } });

    expect(nombreInput).toHaveValue('Aceite');
    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Solo letras permitidas', toast: true })
    );
  });

  // 11. VALIDACIÓN SOLO NÚMEROS EN ID
  it('debería filtrar letras en el ID del producto', async () => {
    render(<TableProductos />);
    fireEvent.click(screen.getByRole('button', { name: /nuevo producto/i }));

    const modal = screen.getByText('Crear Producto').closest('.modal-container') as HTMLElement;
    const idInput = modal.querySelector('input[name="ID_PRODUCTOS"]') as HTMLInputElement;

    fireEvent.change(idInput, { target: { value: '12ab' } });

    expect(idInput).toHaveValue('12');
    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Solo números permitidos', toast: true })
    );
  });

  // 12. VALIDACIÓN DE CAMPOS OBLIGATORIOS
  it('debería mostrar alerta si falta el ID', async () => {
    render(<TableProductos />);
    fireEvent.click(screen.getByRole('button', { name: /nuevo producto/i }));

    const modal = screen.getByText('Crear Producto').closest('.modal-container') as HTMLElement;
    fireEvent.submit(modal.querySelector('form')!);

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Datos incompletos', text: 'El ID del producto es obligatorio.', icon: 'warning' })
      );
      expect(productoService.insertarProducto).not.toHaveBeenCalled();
    });
  });

  // 13. VALIDACIÓN DE PRECIO MAYOR A 0
  it('debería rechazar precios menores o iguales a 0', async () => {
    render(<TableProductos />);
    fireEvent.click(screen.getByRole('button', { name: /nuevo producto/i }));

    const modal = screen.getByText('Crear Producto').closest('.modal-container') as HTMLElement;
    fireEvent.change(modal.querySelector('input[name="ID_PRODUCTOS"]')!, { target: { value: '3' } });
    fireEvent.change(modal.querySelector('input[name="Marca"]')!, { target: { value: 'KTM' } });
    fireEvent.change(modal.querySelector('input[name="Nombre"]')!, { target: { value: 'Filtro' } });
    fireEvent.change(modal.querySelector('select[name="ID_CATEGORIA"]')!, { target: { value: '10' } });
    fireEvent.change(modal.querySelector('input[name="precio_venta"]')!, { target: { value: '0' } });

    fireEvent.submit(modal.querySelector('form')!);

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ text: 'El precio debe ser un número válido mayor a 0.', icon: 'warning' })
      );
    });
  });

  // 14. CREAR PRODUCTO EXITOSAMENTE
  it('debería crear el producto con categoría y precio como números', async () => {
    jest.mocked(productoService.insertarProducto).mockResolvedValue({ data: { success: true } } as any);
    render(<TableProductos />);
    fireEvent.click(screen.getByRole('button', { name: /nuevo producto/i }));

    const modal = screen.getByText('Crear Producto').closest('.modal-container') as HTMLElement;
    fireEvent.change(modal.querySelector('input[name="ID_PRODUCTOS"]')!, { target: { value: '3' } });
    fireEvent.change(modal.querySelector('select[name="ID_CATEGORIA"]')!, { target: { value: '10' } });
    fireEvent.change(modal.querySelector('input[name="Marca"]')!, { target: { value: 'KTM' } });
    fireEvent.change(modal.querySelector('input[name="Nombre"]')!, { target: { value: 'Filtro' } });
    fireEvent.change(modal.querySelector('input[name="precio_venta"]')!, { target: { value: '25000' } });
    fireEvent.change(modal.querySelector('select[name="Estado"]')!, { target: { value: 'Disponibles' } });

    fireEvent.submit(modal.querySelector('form')!);

    await waitFor(() => {
      expect(productoService.insertarProducto).toHaveBeenCalledWith(
        expect.objectContaining({
          ID_PRODUCTOS: '3',
          ID_CATEGORIA: 10, // Number
          Nombre: 'Filtro',
          Marca: 'KTM',
          precio_venta: 25000, // Number
          Estado: 'Disponibles',
        })
      );
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Producto creado', icon: 'success' })
      );
    });
  });

  // 15. EDITAR PRODUCTO
  it('debería abrir la edición con datos y actualizar correctamente', async () => {
    jest.mocked(productoService.actualizarProducto).mockResolvedValue({ data: { success: true } } as any);
    render(<TableProductos />);
    await waitFor(() => expect(screen.getByText('Aceite Motor')).toBeInTheDocument());

    fireEvent.click(screen.getAllByTitle('Editar')[0]);

    expect(screen.getByText('Editar Producto')).toBeInTheDocument();
    const modal = screen.getByText('Editar Producto').closest('.modal-container') as HTMLElement;
    expect(modal.querySelector('input[name="Nombre"]')).toHaveValue('Aceite Motor');

    fireEvent.change(modal.querySelector('input[name="Nombre"]')!, { target: { value: 'Aceite Sintético' } });
    fireEvent.submit(modal.querySelector('form')!);

    await waitFor(() => {
      expect(productoService.actualizarProducto).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({ Nombre: 'Aceite Sintético' })
      );
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Cambios guardados', icon: 'success' })
      );
    });
  });

  // 16. INHABILITAR PRODUCTO
  it('debería inhabilitar el producto y actualizar el estado localmente', async () => {
    jest.mocked(productoService.eliminarProducto).mockResolvedValue({ data: { success: true } } as any);
    render(<TableProductos />);
    await waitFor(() => expect(screen.getByText('Aceite Motor')).toBeInTheDocument());

    fireEvent.click(screen.getAllByTitle('Inhabilitar')[0]);

    await waitFor(() => {
      expect(productoService.eliminarProducto).toHaveBeenCalledWith('1');
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Inhabilitado', icon: 'success' })
      );
    });

    // El estado local cambia a Inactivo y aparece el botón Habilitar
    await waitFor(() => {
      expect(screen.getAllByText('Inactivo').length).toBe(2);
      expect(screen.getAllByTitle('Habilitar').length).toBe(2);
    });
  });

  // 17. INHABILITAR CANCELADO
  it('no debería inhabilitar si se cancela la confirmación', async () => {
    jest.mocked(Swal.fire).mockResolvedValueOnce({ isConfirmed: false } as any);
    render(<TableProductos />);
    await waitFor(() => expect(screen.getByText('Aceite Motor')).toBeInTheDocument());

    fireEvent.click(screen.getAllByTitle('Inhabilitar')[0]);

    await waitFor(() => {
      expect(productoService.eliminarProducto).not.toHaveBeenCalled();
    });
  });

  // 18. HABILITAR PRODUCTO INACTIVO
  it('debería habilitar el producto y actualizar el estado localmente', async () => {
    jest.mocked(productoService.habilitarProducto).mockResolvedValue({ data: { success: true } } as any);
    render(<TableProductos />);
    await waitFor(() => expect(screen.getByText('Bujía')).toBeInTheDocument());

    fireEvent.click(screen.getAllByTitle('Habilitar')[0]);

    await waitFor(() => {
      expect(productoService.habilitarProducto).toHaveBeenCalledWith('2');
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Habilitado', icon: 'success' })
      );
    });

    // El estado local cambia a Activo (badge bg-success)
    await waitFor(() => {
      expect(screen.getByText('Activo')).toHaveClass('estado-badge bg-success');
    });
  });
});



