import { Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Categorias from '../../src/componentes/TableCategorias/Categorias';
import * as categoriaService from '../../src/services/categoria.service';
import Swal from 'sweetalert2';

// 1. MOCKS DE MÓDULOS EXTERNOS
Mock('sweetalert2', () => ({
  fire: vi.fn().mockResolvedValue({ isConfirmed: true }),
}));

// Mock del componente FormattedId para simplificar
Mock('../../src/componentes/FormattedId', () => ({
  FormattedId: ({ value }: any) => <span data-testid="formatted-id">{value}</span>,
}));

// 2. MOCKS DE SERVICIOS (mismas rutas que los imports)
Mock('../../src/services/categoria.service');

// ==================== DATOS DE PRUEBA ====================
const mockCategorias = [
  { ID_CATEGORIA: 1, nombre: 'Repuestos', tipo: 'PRODUCTO', descripcion: 'Repuestos de moto', estado: 'Activo' },
  { ID_CATEGORIA: 2, nombre: 'Mantenimiento', tipo: 'SERVICIO', descripcion: '', estado: 'Inactivo' },
];

describe('Categorias Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    jest.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as any);
    jest.mocked(categoriaService.obtenerCategorias).mockResolvedValue({ data: mockCategorias } as any);
  });

  // 1. RENDERIZADO INICIAL
  it('debería renderizar el título, buscador y botones de acción', async () => {
    render(<Categorias />);

    expect(screen.getByText('Gestión de Categorías')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/buscar por nombre, tipo o descripción/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /nueva categoría/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
  });

  // 2. ESTADO DE CARGA
  it('debería mostrar "Cargando categorías..." mientras consulta la API', () => {
    jest.mocked(categoriaService.obtenerCategorias).mockImplementation(() => new Promise(() => {}));
    render(<Categorias />);
    expect(screen.getByText(/cargando categorías/i)).toBeInTheDocument();
  });

  // 3. TABLA CON DATOS
  it('debería mostrar las categorías con tipo y estado en badges', async () => {
    render(<Categorias />);

    await waitFor(() => {
      expect(screen.getByText('Repuestos')).toBeInTheDocument();
      expect(screen.getByText('Mantenimiento')).toBeInTheDocument();
    });

    expect(screen.getByText('PRODUCTO')).toBeInTheDocument();
    expect(screen.getByText('SERVICIO')).toBeInTheDocument();
    expect(screen.getByText('Activo')).toBeInTheDocument();
    expect(screen.getByText('Inactivo')).toBeInTheDocument();
  });

  // 4. ESTADO VACÍO
  it('debería mostrar mensaje cuando no hay categorías', async () => {
    jest.mocked(categoriaService.obtenerCategorias).mockResolvedValue({ data: [] } as any);
    render(<Categorias />);

    await waitFor(() => {
      expect(screen.getByText(/no hay categorías registradas/i)).toBeInTheDocument();
    });
  });

  // 5. ERROR AL CARGAR
  it('debería mostrar alerta de error si falla la carga', async () => {
    jest.mocked(categoriaService.obtenerCategorias).mockRejectedValue(new Error('Fallo'));
    render(<Categorias />);

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Error', text: 'No se pudieron cargar las categorías.', icon: 'error' })
      );
    });
  });

  // 6. BÚSQUEDA POR NOMBRE
  it('debería filtrar categorías al buscar por nombre', async () => {
    render(<Categorias />);
    await waitFor(() => expect(screen.getByText('Repuestos')).toBeInTheDocument());

    const searchInput = screen.getByPlaceholderText(/buscar por nombre/i);
    fireEvent.change(searchInput, { target: { value: 'Repuestos' } });
    fireEvent.click(screen.getByTitle('Buscar'));

    await waitFor(() => {
      expect(screen.getByText('Repuestos')).toBeInTheDocument();
      expect(screen.queryByText('Mantenimiento')).not.toBeInTheDocument();
    });
  });

  // 7. BÚSQUEDA CON TECLA ENTER
  it('debería buscar al presionar Enter en el campo de búsqueda', async () => {
    render(<Categorias />);
    await waitFor(() => expect(screen.getByText('Repuestos')).toBeInTheDocument());

    const searchInput = screen.getByPlaceholderText(/buscar por nombre/i);
    fireEvent.change(searchInput, { target: { value: 'SERVICIO' } });
    fireEvent.keyDown(searchInput, { key: 'Enter' });

    await waitFor(() => {
      expect(screen.queryByText('Repuestos')).not.toBeInTheDocument();
      expect(screen.getByText('Mantenimiento')).toBeInTheDocument();
    });
  });

  // 8. BOTÓN RESET
  it('debería limpiar la búsqueda y mostrar todo con Reset', async () => {
    render(<Categorias />);
    await waitFor(() => expect(screen.getByText('Repuestos')).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText(/buscar por nombre/i), { target: { value: 'Repuestos' } });
    fireEvent.click(screen.getByTitle('Buscar'));
    await waitFor(() => expect(screen.queryByText('Mantenimiento')).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /reset/i }));

    await waitFor(() => {
      expect(screen.getByText('Mantenimiento')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/buscar por nombre/i)).toHaveValue('');
    });
  });

  // 9. ABRIR MODAL DE CREACIÓN
  it('debería abrir el modal de creación con el formulario vacío', async () => {
    render(<Categorias />);

    fireEvent.click(screen.getByRole('button', { name: /nueva categoría/i }));

    expect(screen.getByText('Crear Categoría')).toBeInTheDocument();
    const modal = screen.getByText('Crear Categoría').closest('.modal-container') as HTMLElement;
    expect(modal.querySelector('input[name="nombre"]')).toHaveValue('');
    expect(modal.querySelector('select[name="tipo"]')).toHaveValue('PRODUCTO');
  });

  // 10. VALIDACIÓN: NOMBRE OBLIGATORIO
  it('debería mostrar alerta si se guarda sin nombre', async () => {
    render(<Categorias />);
    fireEvent.click(screen.getByRole('button', { name: /nueva categoría/i }));

    const modal = screen.getByText('Crear Categoría').closest('.modal-container') as HTMLElement;
    fireEvent.submit(modal.querySelector('form')!);

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Datos incompletos', icon: 'warning' })
      );
      expect(categoriaService.insertarCategoria).not.toHaveBeenCalled();
    });
  });

  // 11. VALIDACIÓN: SOLO LETRAS EN NOMBRE
  it('debería filtrar números y símbolos en el campo nombre', async () => {
    render(<Categorias />);
    fireEvent.click(screen.getByRole('button', { name: /nueva categoría/i }));

    const modal = screen.getByText('Crear Categoría').closest('.modal-container') as HTMLElement;
    const nombreInput = modal.querySelector('input[name="nombre"]') as HTMLInputElement;

    fireEvent.change(nombreInput, { target: { value: 'Frenos123!!!' } });

    // El valor queda solo con letras
    expect(nombreInput).toHaveValue('Frenos');
    // Y muestra el toast de advertencia
    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Solo letras permitidas', toast: true })
    );
  });

  // 12. CREAR CATEGORÍA EXITOSAMENTE
  it('debería crear la categoría y recargar la lista', async () => {
    jest.mocked(categoriaService.insertarCategoria).mockResolvedValue({ data: { success: true } } as any);
    render(<Categorias />);
    fireEvent.click(screen.getByRole('button', { name: /nueva categoría/i }));

    const modal = screen.getByText('Crear Categoría').closest('.modal-container') as HTMLElement;
    fireEvent.change(modal.querySelector('input[name="nombre"]')!, { target: { value: 'Frenos' } });
    fireEvent.change(modal.querySelector('select[name="tipo"]')!, { target: { value: 'SERVICIO' } });
    fireEvent.change(modal.querySelector('textarea[name="descripcion"]')!, { target: { value: 'Sistema de frenos' } });

    fireEvent.submit(modal.querySelector('form')!);

    await waitFor(() => {
      expect(categoriaService.insertarCategoria).toHaveBeenCalledWith(
        expect.objectContaining({ nombre: 'Frenos', tipo: 'SERVICIO', descripcion: 'Sistema de frenos' })
      );
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Categoría creada', icon: 'success' })
      );
    });
  });

  // 13. CREAR CATEGORÍA CON RESPUESTA FALLIDA
  it('debería mostrar error si el backend responde sin éxito', async () => {
    jest.mocked(categoriaService.insertarCategoria).mockResolvedValue({ data: { success: false } } as any);
    render(<Categorias />);
    fireEvent.click(screen.getByRole('button', { name: /nueva categoría/i }));

    const modal = screen.getByText('Crear Categoría').closest('.modal-container') as HTMLElement;
    fireEvent.change(modal.querySelector('input[name="nombre"]')!, { target: { value: 'Frenos' } });
    fireEvent.submit(modal.querySelector('form')!);

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Error', text: 'No se pudo crear la categoría.', icon: 'error' })
      );
    });
  });

  // 14. ABRIR MODAL DE EDICIÓN CON DATOS
  it('debería abrir el modal de edición con los datos y el ID deshabilitado', async () => {
    render(<Categorias />);
    await waitFor(() => expect(screen.getByText('Repuestos')).toBeInTheDocument());

    fireEvent.click(screen.getAllByTitle('Editar')[0]);

    expect(screen.getByText('Editar Categoría')).toBeInTheDocument();
    const modal = screen.getByText('Editar Categoría').closest('.modal-container') as HTMLElement;

    const idInput = modal.querySelector('input[title="El ID no se puede modificar"]') as HTMLInputElement;
    expect(idInput).toHaveValue('1');
    expect(idInput).toBeDisabled();
    expect(modal.querySelector('input[name="nombre"]')).toHaveValue('Repuestos');
  });

  // 15. ACTUALIZAR CATEGORÍA
  it('debería actualizar la categoría con el ID correcto', async () => {
    jest.mocked(categoriaService.actualizarCategoria).mockResolvedValue({ data: { success: true } } as any);
    render(<Categorias />);
    await waitFor(() => expect(screen.getByText('Repuestos')).toBeInTheDocument());

    fireEvent.click(screen.getAllByTitle('Editar')[0]);
    const modal = screen.getByText('Editar Categoría').closest('.modal-container') as HTMLElement;

    fireEvent.change(modal.querySelector('input[name="nombre"]')!, { target: { value: 'Repuestos Editado' } });
    fireEvent.submit(modal.querySelector('form')!);

    await waitFor(() => {
      expect(categoriaService.actualizarCategoria).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ nombre: 'Repuestos Editado' })
      );
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Cambios guardados', icon: 'success' })
      );
    });
  });

  // 16. INHABILITAR CATEGORÍA
  it('debería inhabilitar la categoría tras confirmar y actualizar el estado local', async () => {
    jest.mocked(categoriaService.eliminarCategoria).mockResolvedValue({ data: { success: true } } as any);
    render(<Categorias />);
    await waitFor(() => expect(screen.getByText('Repuestos')).toBeInTheDocument());

    fireEvent.click(screen.getAllByTitle('Inhabilitar')[0]);

    await waitFor(() => {
      expect(categoriaService.eliminarCategoria).toHaveBeenCalledWith(1);
    });

    // El estado local cambia a Inactivo y aparece el botón Habilitar
    await waitFor(() => {
      expect(screen.getAllByText('Inactivo').length).toBe(2);
      expect(screen.getByTitle('Habilitar')).toBeInTheDocument();
    });
  });

  // 17. INHABILITAR CANCELADO
  it('no debería inhabilitar si se cancela la confirmación', async () => {
    jest.mocked(Swal.fire).mockResolvedValueOnce({ isConfirmed: false } as any);
    render(<Categorias />);
    await waitFor(() => expect(screen.getByText('Repuestos')).toBeInTheDocument());

    fireEvent.click(screen.getAllByTitle('Inhabilitar')[0]);

    await waitFor(() => {
      expect(categoriaService.eliminarCategoria).not.toHaveBeenCalled();
    });
  });

  // 18. CONFLICTO 409 AL INHABILITAR (dependencias asociadas)
  it('debería pedir segunda confirmación y forzar inhabilitar en error 409', async () => {
    jest.mocked(categoriaService.eliminarCategoria)
      .mockRejectedValueOnce({ response: { status: 409, data: { message: 'Tiene productos asociados' } } })
      .mockResolvedValueOnce({ data: { success: true } } as any);

    render(<Categorias />);
    await waitFor(() => expect(screen.getByText('Repuestos')).toBeInTheDocument());

    fireEvent.click(screen.getAllByTitle('Inhabilitar')[0]);

    await waitFor(() => {
      // Segunda llamada con el flag "true" para forzar
      expect(categoriaService.eliminarCategoria).toHaveBeenCalledWith(1, true);
    });
  });

  // 19. HABILITAR CATEGORÍA INACTIVA
  it('debería habilitar una categoría inactiva tras confirmar', async () => {
    jest.mocked(categoriaService.habilitarCategoria).mockResolvedValue({ data: { success: true } } as any);
    render(<Categorias />);
    await waitFor(() => expect(screen.getByText('Mantenimiento')).toBeInTheDocument());

    fireEvent.click(screen.getByTitle('Habilitar'));

    await waitFor(() => {
      expect(categoriaService.habilitarCategoria).toHaveBeenCalledWith(2);
    });

    // El estado local cambia a Activo
    await waitFor(() => {
      expect(screen.getAllByText('Activo').length).toBe(2);
    });
  });
});



