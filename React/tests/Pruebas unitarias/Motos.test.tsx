import { Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TableMotos from '../../src/componentes/TableMotos/Motos';
import * as motoService from '../../src/services/moto.service';
import * as clienteService from '../../src/services/cliente.service';
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
Mock('../../src/services/moto.service');
Mock('../../src/services/cliente.service');

// ==================== DATOS DE PRUEBA ====================
const mockMotos = [
  { ID_MOTOS: 1, ID_CLIENTES: 100, Placa: 'ABC12D', Modelo: 'Duke 390', Marca: 'KTM', Recorrido: 15000 },
  { ID_MOTOS: 2, ID_CLIENTES: 200, Placa: 'XYZ34E', Modelo: 'FZ 2.0', Marca: 'Yamaha', Recorrido: 8000 },
];

const mockClientes = [
  { ID_CLIENTES: 100, Nombre: 'Juan Pérez' },
  { ID_CLIENTES: 200, Nombre: 'María Gómez' },
];

describe('TableMotos Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    jest.mocked(motoService.obtenerMotos).mockResolvedValue({ data: mockMotos } as any);
    jest.mocked(clienteService.obtenerClientes).mockResolvedValue({ data: mockClientes } as any);
  });

  // 1. RENDERIZADO INICIAL
  it('debería renderizar el título, buscador y botones de acción', async () => {
    render(<TableMotos />);

    expect(screen.getByText('Gestión de Motos')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/buscar por id, placa, modelo/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /nueva moto/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
  });

  // 2. ESTADO DE CARGA
  it('debería mostrar "Cargando motos..." mientras consulta la API', () => {
    jest.mocked(motoService.obtenerMotos).mockImplementation(() => new Promise(() => {}));
    render(<TableMotos />);
    expect(screen.getByText(/cargando motos/i)).toBeInTheDocument();
  });

  // 3. TABLA CON DATOS Y RECORRIDO FORMATEADO
  it('debería mostrar las motos con el recorrido formateado en es-CO', async () => {
    render(<TableMotos />);

    await waitFor(() => {
      expect(screen.getByText('ABC12D')).toBeInTheDocument();
      expect(screen.getByText('XYZ34E')).toBeInTheDocument();
    });

    expect(screen.getByText('Duke 390')).toBeInTheDocument();
    expect(screen.getByText('KTM')).toBeInTheDocument();
    expect(screen.getByText(`${new Intl.NumberFormat('es-CO').format(15000)} km`)).toBeInTheDocument();
  });

  // 4. BÚSQUEDA POR PLACA
  it('debería filtrar motos al buscar por placa', async () => {
    render(<TableMotos />);
    await waitFor(() => expect(screen.getByText('ABC12D')).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText(/buscar por id, placa/i), { target: { value: 'ABC12D' } });
    fireEvent.click(screen.getByTitle('Buscar'));

    await waitFor(() => {
      expect(screen.getByText('ABC12D')).toBeInTheDocument();
      expect(screen.queryByText('XYZ34E')).not.toBeInTheDocument();
    });
  });

  // 5. BOTÓN RESET
  it('debería limpiar la búsqueda con Reset', async () => {
    render(<TableMotos />);
    await waitFor(() => expect(screen.getByText('ABC12D')).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText(/buscar por id, placa/i), { target: { value: 'ABC12D' } });
    fireEvent.click(screen.getByTitle('Buscar'));
    fireEvent.click(screen.getByRole('button', { name: /reset/i }));

    await waitFor(() => {
      expect(screen.getByText('XYZ34E')).toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText(/buscar por id, placa/i)).toHaveValue('');
  });

  // 6. MODAL DE CREACIÓN CON CLIENTES CARGADOS
  it('debería abrir el modal de creación y cargar los clientes en el select', async () => {
    render(<TableMotos />);
    fireEvent.click(screen.getByRole('button', { name: /nueva moto/i }));

    expect(screen.getByText('Registrar Nueva Moto')).toBeInTheDocument();

    // Los clientes se cargan en el select
    await waitFor(() => {
      expect(screen.getByText(/100 - Juan Pérez/)).toBeInTheDocument();
      expect(screen.getByText(/200 - María Gómez/)).toBeInTheDocument();
    });
  });

  // 7. VALIDACIÓN NUMÉRICA DEL ID MOTO
  it('debería filtrar caracteres no numéricos en el ID de la moto', async () => {
    render(<TableMotos />);
    fireEvent.click(screen.getByRole('button', { name: /nueva moto/i }));

    const idInput = screen.getByPlaceholderText('Ej: 1, 2, 10...');
    fireEvent.change(idInput, { target: { value: '12abc' } });

    expect(idInput).toHaveValue('12');
    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Solo números permitidos', toast: true })
    );
  });

  // 8. VALIDACIÓN DE CAMPOS OBLIGATORIOS
  it('debería mostrar alerta si faltan campos obligatorios', async () => {
    render(<TableMotos />);
    fireEvent.click(screen.getByRole('button', { name: /nueva moto/i }));

    const modal = screen.getByText('Registrar Nueva Moto').closest('.modal-container') as HTMLElement;
    fireEvent.submit(modal.querySelector('form')!);

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Datos incompletos', text: 'El ID de la moto es obligatorio.', icon: 'warning' })
      );
      expect(motoService.insertarMoto).not.toHaveBeenCalled();
    });
  });

  // 9. CREAR MOTO EXITOSAMENTE
  it('debería registrar la moto con la placa en mayúsculas', async () => {
    jest.mocked(motoService.insertarMoto).mockResolvedValue({ data: { success: true } } as any);
    render(<TableMotos />);
    fireEvent.click(screen.getByRole('button', { name: /nueva moto/i }));

    const modal = screen.getByText('Registrar Nueva Moto').closest('.modal-container') as HTMLElement;

    fireEvent.change(modal.querySelector('input[name="ID_MOTOS"]')!, { target: { value: '3' } });
    fireEvent.change(modal.querySelector('select[name="ID_CLIENTES"]')!, { target: { value: '100' } });
    fireEvent.change(modal.querySelector('input[name="Placa"]')!, { target: { value: 'nueva99' } });
    fireEvent.change(modal.querySelector('input[name="Modelo"]')!, { target: { value: 'Duke 200' } });
    fireEvent.change(modal.querySelector('input[name="Marca"]')!, { target: { value: 'ktm' } });
    fireEvent.change(modal.querySelector('input[name="Recorrido"]')!, { target: { value: '5000' } });

    fireEvent.submit(modal.querySelector('form')!);

    await waitFor(() => {
      expect(motoService.insertarMoto).toHaveBeenCalledWith(
        expect.objectContaining({
          ID_MOTOS: '3',
          ID_CLIENTES: '100',
          Placa: 'NUEVA99', // Mayúsculas
          Modelo: 'Duke 200',
          Marca: 'ktm',
          Recorrido: 5000,
        })
      );
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Moto registrada', icon: 'success' })
      );
    });

    // El modal se cierra
    await waitFor(() => {
      expect(screen.queryByText('Registrar Nueva Moto')).not.toBeInTheDocument();
    });
  });

  // 10. CREAR MOTO CON RESPUESTA FALLIDA
  it('debería mostrar error si el backend responde sin éxito', async () => {
    jest.mocked(motoService.insertarMoto).mockResolvedValue({ data: { success: false } } as any);
    render(<TableMotos />);
    fireEvent.click(screen.getByRole('button', { name: /nueva moto/i }));

    const modal = screen.getByText('Registrar Nueva Moto').closest('.modal-container') as HTMLElement;
    fireEvent.change(modal.querySelector('input[name="ID_MOTOS"]')!, { target: { value: '3' } });
    fireEvent.change(modal.querySelector('select[name="ID_CLIENTES"]')!, { target: { value: '100' } });
    fireEvent.change(modal.querySelector('input[name="Placa"]')!, { target: { value: 'ABC999' } });
    fireEvent.change(modal.querySelector('input[name="Modelo"]')!, { target: { value: 'Duke' } });
    fireEvent.change(modal.querySelector('input[name="Marca"]')!, { target: { value: 'KTM' } });

    fireEvent.submit(modal.querySelector('form')!);

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Error', text: 'No se pudo registrar la moto.', icon: 'error' })
      );
    });
  });

  // 11. MODAL DE EDICIÓN CON ID SOLO LECTURA
  it('debería abrir el modal de edición con datos y el ID bloqueado', async () => {
    render(<TableMotos />);
    await waitFor(() => expect(screen.getByText('ABC12D')).toBeInTheDocument());

    fireEvent.click(screen.getAllByRole('button', { name: /editar/i })[0]);

    expect(screen.getByText('Editar Moto')).toBeInTheDocument();
    const modal = screen.getByText('Editar Moto').closest('.modal-container') as HTMLElement;

    const idInput = modal.querySelector('input[name="ID_MOTOS"]') as HTMLInputElement;
    expect(idInput).toHaveValue('1');
    expect(idInput).toHaveAttribute('readonly');
    expect(modal.querySelector('input[name="Placa"]')).toHaveValue('ABC12D');
  });

  // 12. ACTUALIZAR MOTO
  it('debería actualizar la moto y mostrar alerta de éxito', async () => {
    jest.mocked(motoService.actualizarMoto).mockResolvedValue({ data: { success: true } } as any);
    render(<TableMotos />);
    await waitFor(() => expect(screen.getByText('ABC12D')).toBeInTheDocument());

    fireEvent.click(screen.getAllByRole('button', { name: /editar/i })[0]);
    const modal = screen.getByText('Editar Moto').closest('.modal-container') as HTMLElement;

    fireEvent.change(modal.querySelector('input[name="Placa"]')!, { target: { value: 'EDITADA1' } });
    fireEvent.submit(modal.querySelector('form')!);

    await waitFor(() => {
      expect(motoService.actualizarMoto).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({ Placa: 'EDITADA1' })
      );
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Cambios guardados', icon: 'success' })
      );
    });
  });

  // 13. ELIMINAR MOTO
  it('debería eliminar la moto tras confirmar y quitarla de la tabla', async () => {
    jest.mocked(motoService.eliminarMoto).mockResolvedValue({ data: { success: true } } as any);
    render(<TableMotos />);
    await waitFor(() => expect(screen.getByText('ABC12D')).toBeInTheDocument());

    fireEvent.click(screen.getAllByRole('button', { name: /eliminar/i })[0]);

    await waitFor(() => {
      expect(motoService.eliminarMoto).toHaveBeenCalledWith(1);
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Eliminada', icon: 'success' })
      );
    });

    // La fila desaparece de la tabla (actualización local)
    await waitFor(() => {
      expect(screen.queryByText('ABC12D')).not.toBeInTheDocument();
    });
  });

  // 14. ELIMINAR CANCELADO
  it('no debería eliminar si se cancela la confirmación', async () => {
    jest.mocked(Swal.fire).mockResolvedValueOnce({ isConfirmed: false } as any);
    render(<TableMotos />);
    await waitFor(() => expect(screen.getByText('ABC12D')).toBeInTheDocument());

    fireEvent.click(screen.getAllByRole('button', { name: /eliminar/i })[0]);

    await waitFor(() => {
      expect(motoService.eliminarMoto).not.toHaveBeenCalled();
      expect(screen.getByText('ABC12D')).toBeInTheDocument();
    });
  });
});



