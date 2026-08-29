import { MemoryRouter } from 'react-router-dom';
// Mock type not needed in this file
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Servicios from '../../src/componentes/TableServicios/Servicios';
import * as servicioService from '../../src/services/servicio.service';
import * as categoriaService from '../../src/services/categoria.service';
import Swal from 'sweetalert2';

// 1. MOCKS DE MÓDULOS EXTERNOS
vi.mock('sweetalert2', () => ({ default: { fire: vi.fn() } }));

// Mock del componente FormattedId
vi.mock('../../src/componentes/FormattedId', () => ({
  FormattedId: ({ value }: any) => <span data-testid="formatted-id">{value}</span>,
}));

// 2. MOCKS DE SERVICIOS (mismas rutas que los imports)
vi.mock('../../src/services/servicio.service');
vi.mock('../../src/services/categoria.service');

// ==================== DATOS DE PRUEBA ====================
const mockServicios = [
  { ID_SERVICIOS: '1', ID_CATEGORIA: '30', Nombre: 'Mantenimiento General', Estado: 'Disponible', Precio: 150000, categoria_nombre: 'Mantenimiento' },
  { ID_SERVICIOS: '2', ID_CATEGORIA: '40', Nombre: 'Diagnóstico', Estado: 'Inactivo', Precio: 50000, categoria_nombre: null },
];

const mockCategorias = [
  { ID_CATEGORIA: 30, nombre: 'Mantenimiento' },
  { ID_CATEGORIA: 40, nombre: 'Reparación' },
];

describe('Servicios Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(servicioService.obtenerServicios).mockResolvedValue({ data: mockServicios } as any);
    vi.mocked(categoriaService.obtenerCategoriasPorTipo).mockResolvedValue({ data: mockCategorias } as any);
  });

  // 1. RENDERIZADO INICIAL
  it('debería renderizar el título, buscador y botones de acción', async () => {
    render(<MemoryRouter><Servicios /></MemoryRouter>);

    expect(screen.getByText('Gestión de Servicios')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/buscar por nombre, categoría o id/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /nuevo servicio/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
  });

  // 2. ESTADO DE CARGA
  it('debería mostrar "Cargando servicios..." mientras consulta la API', () => {
    vi.mocked(servicioService.obtenerServicios).mockImplementation(() => new Promise(() => {}));
    render(<MemoryRouter><Servicios /></MemoryRouter>);
    expect(screen.getByText(/cargando servicios/i)).toBeInTheDocument();
  });

  // 3. ESTADO VACÍO
  it('debería mostrar mensaje cuando no hay servicios', async () => {
    vi.mocked(servicioService.obtenerServicios).mockResolvedValue({ data: [] } as any);
    render(<MemoryRouter><Servicios /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByText(/no hay servicios registrados/i)).toBeInTheDocument();
    });
  });

  // 4. ERROR AL CARGAR
  it('debería mostrar alerta de error si falla la carga', async () => {
    vi.mocked(servicioService.obtenerServicios).mockRejectedValue(new Error('Fallo'));
    render(<MemoryRouter><Servicios /></MemoryRouter>);

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Error', text: 'No se pudieron cargar los servicios.', icon: 'error' })
      );
    });
  });

  // 5. TABLA CON DATOS, CATEGORÍAS Y PRECIOS
  it('debería mostrar servicios con categoría resuelta y precio formateado', async () => {
    render(<MemoryRouter><Servicios /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByText('Mantenimiento General')).toBeInTheDocument();
      expect(screen.getByText('Diagnóstico')).toBeInTheDocument();
    });

    // Categoría directa y por lookup (ID_CATEGORIA 40 → Reparación)
    expect(screen.getByText('Mantenimiento')).toBeInTheDocument();
    expect(screen.getAllByText('Reparación')[0]).toBeInTheDocument();

    // Precios con "$"
    expect(screen.getByText(`$${(150000).toLocaleString()}`)).toBeInTheDocument();
    expect(screen.getByText(`$${(50000).toLocaleString()}`)).toBeInTheDocument();
  });

  // 6. BADGES DE ESTADO
  it('debería asignar la clase de badge correcta según el estado', async () => {
    render(<MemoryRouter><Servicios /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByText('Disponible')).toHaveClass('estado-badge bg-success');
      expect(screen.getByText('Inactivo')).toHaveClass('estado-badge bg-secondary');
    });
  });

  // 7. BÚSQUEDA POR NOMBRE
  it('debería filtrar servicios al buscar por nombre', async () => {
    render(<MemoryRouter><Servicios /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText('Mantenimiento General')).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText(/buscar por nombre/i), { target: { value: 'Diagnóstico' } });
    fireEvent.click(screen.getByTitle('Buscar'));

    await waitFor(() => {
      expect(screen.getByText('Diagnóstico')).toBeInTheDocument();
      expect(screen.queryByText('Mantenimiento General')).not.toBeInTheDocument();
    });
  });

  // 8. BOTÓN RESET
  it('debería limpiar la búsqueda con Reset', async () => {
    render(<MemoryRouter><Servicios /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText('Mantenimiento General')).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText(/buscar por nombre/i), { target: { value: 'Diagnóstico' } });
    fireEvent.click(screen.getByTitle('Buscar'));
    fireEvent.click(screen.getByRole('button', { name: /reset/i }));

    await waitFor(() => {
      expect(screen.getByText('Mantenimiento General')).toBeInTheDocument();
    });
  });

  // 9. MODAL DE CREACIÓN CON CATEGORÍAS
  it('debería abrir el modal con las categorías de servicio en el select', async () => {
    render(<MemoryRouter><Servicios /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: /nuevo servicio/i }));

    expect(screen.getByText('Crear Servicio')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getAllByText('Reparación')[0]).toBeInTheDocument();
    });
  });

  // 10. VALIDACIÓN SOLO LETRAS EN NOMBRE
  it('debería filtrar números en el nombre con toast de advertencia', async () => {
    render(<MemoryRouter><Servicios /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: /nuevo servicio/i }));

    const modal = screen.getByText('Crear Servicio').closest('.modal-container') as HTMLElement;
    const nombreInput = modal.querySelector('input[name="Nombre"]') as HTMLInputElement;

    fireEvent.change(nombreInput, { target: { value: 'Servicio123' } });

    expect(nombreInput).toHaveValue('Servicio');
    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Solo letras permitidas', toast: true })
    );
  });

  // 11. VALIDACIÓN SOLO NÚMEROS EN ID
  it('debería filtrar letras en el ID del servicio', async () => {
    render(<MemoryRouter><Servicios /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: /nuevo servicio/i }));

    const modal = screen.getByText('Crear Servicio').closest('.modal-container') as HTMLElement;
    const idInput = modal.querySelector('input[name="ID_SERVICIOS"]') as HTMLInputElement;

    fireEvent.change(idInput, { target: { value: '33xx' } });

    expect(idInput).toHaveValue('33');
    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Solo números permitidos', toast: true })
    );
  });

  // 12. VALIDACIÓN DE ID OBLIGATORIO
  it('debería mostrar alerta si falta el ID', async () => {
    render(<MemoryRouter><Servicios /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: /nuevo servicio/i }));

    const modal = screen.getByText('Crear Servicio').closest('.modal-container') as HTMLElement;
    fireEvent.submit(modal.querySelector('form')!);

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Datos incompletos', text: 'El ID del servicio es obligatorio.', icon: 'warning' })
      );
      expect(servicioService.insertarServicio).not.toHaveBeenCalled();
    });
  });

  // 13. VALIDACIÓN DE PRECIO MAYOR A 0
  it('debería rechazar precios menores o iguales a 0', async () => {
    render(<MemoryRouter><Servicios /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: /nuevo servicio/i }));

    const modal = screen.getByText('Crear Servicio').closest('.modal-container') as HTMLElement;
    
    fireEvent.change(modal.querySelector('input[name="ID_SERVICIOS"]')!, { target: { name: 'ID_SERVICIOS', value: '3' } });
    fireEvent.change(modal.querySelector('select[name="ID_CATEGORIA"]')!, { target: { name: 'ID_CATEGORIA', value: '30' } });
    fireEvent.change(modal.querySelector('input[name="Nombre"]')!, { target: { name: 'Nombre', value: 'Lavado' } });
    fireEvent.change(modal.querySelector('input[name="Precio"]')!, { target: { name: 'Precio', value: '0' } });

    vi.mocked(Swal.fire).mockClear();
    fireEvent.submit(modal.querySelector('form')!);

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ text: 'Debe ingresar un precio válido mayor a 0.', icon: 'warning' })
      );
    });
  });

  // 14. CREAR SERVICIO EXITOSAMENTE
  it('debería crear el servicio con categoría y precio como números', async () => {
    vi.mocked(servicioService.insertarServicio).mockResolvedValue({ data: { success: true } } as any);
    render(<MemoryRouter><Servicios /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: /nuevo servicio/i }));

    const modal = screen.getByText('Crear Servicio').closest('.modal-container') as HTMLElement;
    
    fireEvent.change(modal.querySelector('input[name="ID_SERVICIOS"]')!, { target: { name: 'ID_SERVICIOS', value: '3' } });
    fireEvent.change(modal.querySelector('select[name="ID_CATEGORIA"]')!, { target: { name: 'ID_CATEGORIA', value: '30' } });
    fireEvent.change(modal.querySelector('input[name="Nombre"]')!, { target: { name: 'Nombre', value: 'Lavado' } });
    fireEvent.change(modal.querySelector('input[name="Precio"]')!, { target: { name: 'Precio', value: '30000' } });

    vi.mocked(Swal.fire).mockClear();
    fireEvent.submit(modal.querySelector('form')!);

    await waitFor(() => {
      expect(servicioService.insertarServicio).toHaveBeenCalledWith(
        expect.objectContaining({
          ID_SERVICIOS: '3',
          ID_CATEGORIA: 30,
          Nombre: 'Lavado',
          Estado: 'Disponible',
          Precio: 30000,
        })
      );
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Servicio creado', icon: 'success' })
      );
    });
  });
});
