import { Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Servicios from '../../src/componentes/TableServicios/Servicios';
import * as servicioService from '../../src/services/servicio.service';
import * as categoriaService from '../../src/services/categoria.service';
import Swal from 'sweetalert2';

// 1. MOCKS DE MÓDULOS EXTERNOS
vi.mock('sweetalert2', () => ({
  fire: vi.fn().mockResolvedValue({ isConfirmed: true }),
}));

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
    jest.mocked(servicioService.obtenerServicios).mockResolvedValue({ data: mockServicios } as any);
    jest.mocked(categoriaService.obtenerCategoriasPorTipo).mockResolvedValue({ data: mockCategorias } as any);
  });

  // 1. RENDERIZADO INICIAL
  it('debería renderizar el título, buscador y botones de acción', async () => {
    render(<Servicios />);

    expect(screen.getByText('Gestión de Servicios')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/buscar por nombre, categoría o id/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /nuevo servicio/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
  });

  // 2. ESTADO DE CARGA
  it('debería mostrar "Cargando servicios..." mientras consulta la API', () => {
    jest.mocked(servicioService.obtenerServicios).mockImplementation(() => new Promise(() => {}));
    render(<Servicios />);
    expect(screen.getByText(/cargando servicios/i)).toBeInTheDocument();
  });

  // 3. ESTADO VACÍO
  it('debería mostrar mensaje cuando no hay servicios', async () => {
    jest.mocked(servicioService.obtenerServicios).mockResolvedValue({ data: [] } as any);
    render(<Servicios />);

    await waitFor(() => {
      expect(screen.getByText(/no hay servicios registrados/i)).toBeInTheDocument();
    });
  });

  // 4. ERROR AL CARGAR
  it('debería mostrar alerta de error si falla la carga', async () => {
    jest.mocked(servicioService.obtenerServicios).mockRejectedValue(new Error('Fallo'));
    render(<Servicios />);

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Error', text: 'No se pudieron cargar los servicios.', icon: 'error' })
      );
    });
  });

  // 5. TABLA CON DATOS, CATEGORÍAS Y PRECIOS
  it('debería mostrar servicios con categoría resuelta y precio formateado', async () => {
    render(<Servicios />);

    await waitFor(() => {
      expect(screen.getByText('Mantenimiento General')).toBeInTheDocument();
      expect(screen.getByText('Diagnóstico')).toBeInTheDocument();
    });

    // Categoría directa y por lookup (ID_CATEGORIA 40 → Reparación)
    expect(screen.getByText('Mantenimiento')).toBeInTheDocument();
    expect(screen.getByText('Reparación')).toBeInTheDocument();

    // Precios con "$"
    expect(screen.getByText(`$${(150000).toLocaleString()}`)).toBeInTheDocument();
    expect(screen.getByText(`$${(50000).toLocaleString()}`)).toBeInTheDocument();
  });

  // 6. BADGES DE ESTADO
  it('debería asignar la clase de badge correcta según el estado', async () => {
    render(<Servicios />);

    await waitFor(() => {
      expect(screen.getByText('Disponible')).toHaveClass('estado-badge bg-success');
      expect(screen.getByText('Inactivo')).toHaveClass('estado-badge bg-secondary');
    });
  });

  // 7. BÚSQUEDA POR NOMBRE
  it('debería filtrar servicios al buscar por nombre', async () => {
    render(<Servicios />);
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
    render(<Servicios />);
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
    render(<Servicios />);
    fireEvent.click(screen.getByRole('button', { name: /nuevo servicio/i }));

    expect(screen.getByText('Crear Servicio')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Reparación')).toBeInTheDocument();
    });
  });

  // 10. VALIDACIÓN SOLO LETRAS EN NOMBRE
  it('debería filtrar números en el nombre con toast de advertencia', async () => {
    render(<Servicios />);
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
    render(<Servicios />);
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
    render(<Servicios />);
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
    render(<Servicios />);
    fireEvent.click(screen.getByRole('button', { name: /nuevo servicio/i }));

    const modal = screen.getByText('Crear Servicio').closest('.modal-container') as HTMLElement;
    fireEvent.change(modal.querySelector('input[name="ID_SERVICIOS"]')!, { target: { value: '3' } });
    fireEvent.change(modal.querySelector('select[name="ID_CATEGORIA"]')!, { target: { value: '30' } });
    fireEvent.change(modal.querySelector('input[name="Nombre"]')!, { target: { value: 'Lavado' } });
    fireEvent.change(modal.querySelector('input[name="Precio"]')!, { target: { value: '0' } });

    fireEvent.submit(modal.querySelector('form')!);

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ text: 'Debe ingresar un precio válido mayor a 0.', icon: 'warning' })
      );
    });
  });

  // 14. CREAR SERVICIO EXITOSAMENTE
  it('debería crear el servicio con categoría y precio como números', async () => {
    jest.mocked(servicioService.insertarServicio).mockResolvedValue({ data: { success: true } } as any);
    render(<Servicios />);
    fireEvent.click(screen.getByRole('button', { name: /nuevo servicio/i }));

    const modal = screen.getByText('Crear Servicio').closest('.modal-container') as HTMLElement;
    fireEvent.change(modal.querySelector('input[name="ID_SERVICIOS"]')!, { target: { value: '3' } });
    fireEvent.change(modal.querySelector('select[name="ID_CATEGORIA"]')!, { target: { value: '30' } });
    fireEvent.change(modal.querySelector('input[name="Nombre"]')!, { target: { value: 'Lavado' } });
    fireEvent.change(modal.querySelector('input[name="Precio"]')!, { target: { value: '30000' } });

    fireEvent.submit(modal.querySelector('form')!);

    await waitFor(() => {
      expect(servicioService.insertarServicio).toHaveBeenCalledWith(
        expect.objectContaining({
          ID_SERVICIOS: '3',
          ID_CATEGORIA: 30, // Number
          Nombre: 'Lavado',
          Estado: 'Disponible',
          Precio: 30000, // Number
        })
      );
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Servicio creado', icon: 'success' })
      );
    });
  });

  // 15. EDITAR SERVICIO
  it('debería abrir la edición con datos y actualizar correctamente', async () => {
    jest.mocked(servicioService.actualizarServicio).mockResolvedValue({ data: { success: true } } as any);
    render(<Servicios />);
    await waitFor(() => expect(screen.getByText('Mantenimiento General')).toBeInTheDocument());

    fireEvent.click(screen.getAllByTitle('Editar')[0]);

    expect(screen.getByText('Editar Servicio')).toBeInTheDocument();
    const modal = screen.getByText('Editar Servicio').closest('.modal-container') as HTMLElement;
    expect(modal.querySelector('input[name="Nombre"]')).toHaveValue('Mantenimiento General');

    fireEvent.change(modal.querySelector('input[name="Nombre"]')!, { target: { value: 'Mantenimiento Premium' } });
    fireEvent.submit(modal.querySelector('form')!);

    await waitFor(() => {
      expect(servicioService.actualizarServicio).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({ Nombre: 'Mantenimiento Premium' })
      );
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Cambios guardados', icon: 'success' })
      );
    });
  });

  // 16. INHABILITAR SERVICIO
  it('debería inhabilitar el servicio y actualizar el estado localmente', async () => {
    jest.mocked(servicioService.eliminarServicio).mockResolvedValue({ data: { success: true } } as any);
    render(<Servicios />);
    await waitFor(() => expect(screen.getByText('Mantenimiento General')).toBeInTheDocument());

    fireEvent.click(screen.getAllByTitle('Inhabilitar')[0]);

    await waitFor(() => {
      expect(servicioService.eliminarServicio).toHaveBeenCalledWith('1');
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
    render(<Servicios />);
    await waitFor(() => expect(screen.getByText('Mantenimiento General')).toBeInTheDocument());

    fireEvent.click(screen.getAllByTitle('Inhabilitar')[0]);

    await waitFor(() => {
      expect(servicioService.eliminarServicio).not.toHaveBeenCalled();
    });
  });

  // 18. HABILITAR SERVICIO INACTIVO
  it('debería habilitar el servicio y actualizar el estado localmente', async () => {
    jest.mocked(servicioService.habilitarServicio).mockResolvedValue({ data: { success: true } } as any);
    render(<Servicios />);
    await waitFor(() => expect(screen.getByText('Diagnóstico')).toBeInTheDocument());

    fireEvent.click(screen.getAllByTitle('Habilitar')[0]);

    await waitFor(() => {
      expect(servicioService.habilitarServicio).toHaveBeenCalledWith('2');
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



