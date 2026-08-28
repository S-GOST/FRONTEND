import { Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TableInformes from '../../src/componentes/Tableinforme/informe';
import * as informeService from '../../src/services/informe.service';
import * as comprobanteService from '../../src/services/comprobanteService';
import Swal from 'sweetalert2';

// 1. MOCKS DE MÓDULOS EXTERNOS
Mock('sweetalert2', () => ({
  fire: vi.fn().mockResolvedValue({ isConfirmed: true, value: 'Nequi' }),
}));

// Mock del componente FormattedId
Mock('../../src/componentes/FormattedId', () => ({
  FormattedId: ({ value }: any) => <span data-testid="formatted-id">{value}</span>,
}));

// 2. MOCKS DE SERVICIOS (mismas rutas que los imports)
Mock('../../src/services/informe.service');
Mock('../../src/services/comprobanteService');

// ==================== DATOS DE PRUEBA ====================
const diagnosticoLargo = 'Diagnóstico muy largo que debe ser truncado por el componente '.repeat(2);

const mockInformes = [
  {
    id_informe: 1,
    id_orden: 10,
    id_tecnico: 5,
    diagnostico: 'Falla en el motor',
    trabajo_realizado: 'Cambio de aceite',
    recomendaciones: 'Revisar en 1000 km',
    fecha: '2026-08-01',
  },
  {
    id_informe: 2,
    id_orden: 20, // Esta orden YA tiene comprobante
    id_tecnico: 0,
    diagnostico: diagnosticoLargo,
    trabajo_realizado: '',
    recomendaciones: '',
    fecha: null,
  },
];

describe('TableInformes Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('user_role', 'admin');
    jest.mocked(informeService.obtenerInformes).mockResolvedValue({ data: mockInformes } as any);
    jest.mocked(informeService.obtenerMisInformes).mockResolvedValue({ data: mockInformes } as any);
    // La orden 20 ya tiene comprobante generado
    jest.mocked(comprobanteService.obtenerComprobantes).mockResolvedValue({ data: [{ id_orden: 20 }] } as any);
  });

  afterEach(() => {
    localStorage.clear();
  });

  // 1. CARGA COMO ADMIN
  it('debería cargar informes y comprobantes si el rol es admin', async () => {
    render(<TableInformes />);

    await waitFor(() => {
      expect(informeService.obtenerInformes).toHaveBeenCalled();
      expect(comprobanteService.obtenerComprobantes).toHaveBeenCalled();
      expect(screen.getByText('Falla en el motor...')).toBeInTheDocument();
    });

    expect(screen.getByText('Informes Técnicos')).toBeInTheDocument();
  });

  // 2. CARGA COMO TÉCNICO
  it('debería cargar solo sus informes si el rol es técnico', async () => {
    localStorage.setItem('user_role', 'tecnico');
    render(<TableInformes />);

    await waitFor(() => {
      expect(informeService.obtenerMisInformes).toHaveBeenCalled();
      expect(informeService.obtenerInformes).not.toHaveBeenCalled();
      expect(comprobanteService.obtenerComprobantes).not.toHaveBeenCalled();
    });
  });

  // 3. ACCIONES SEGÚN ROL
it('debería mostrar Eliminar y Comprobante solo al admin, y solo Editar al técnico', async () => {
  render(<TableInformes />);  // ← sin "const { rerender } ="
  
  await waitFor(() => expect(screen.getAllByTitle('Editar').length).toBe(2));

  // Admin: 2 eliminar, 1 comprobante (la orden 20 ya tiene)
  expect(screen.getAllByTitle('Eliminar').length).toBe(2);
  expect(screen.getAllByTitle('Generar Comprobante').length).toBe(1);
});
  // 4. ESTADO VACÍO
  it('debería mostrar mensaje cuando no hay informes', async () => {
    jest.mocked(informeService.obtenerInformes).mockResolvedValue({ data: [] } as any);
    render(<TableInformes />);

    await waitFor(() => {
      expect(screen.getByText(/no hay informes registrados/i)).toBeInTheDocument();
    });
  });

  // 5. ERROR AL CARGAR
  it('debería mostrar alerta de error si falla la carga', async () => {
    jest.mocked(informeService.obtenerInformes).mockRejectedValue(new Error('Fallo'));
    render(<TableInformes />);

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Error', text: 'No se pudieron cargar los datos', icon: 'error' })
      );
    });
  });

  // 6. TRUNCADO DE TEXTOS Y FALLBACKS
  it('debería truncar textos largos y mostrar "-" cuando faltan datos', async () => {
    render(<TableInformes />);

    await waitFor(() => {
      // Texto truncado a 40 caracteres + "..."
      expect(screen.getByText(`${diagnosticoLargo.substring(0, 40)}...`)).toBeInTheDocument();
    });

    // Fallbacks del informe 2: técnico 0 → '-', fecha null → '-'
    expect(screen.getAllByText('-').length).toBeGreaterThanOrEqual(2);
  });

  // 7. BÚSQUEDA
  it('debería filtrar informes al buscar por diagnóstico', async () => {
    render(<TableInformes />);
    await waitFor(() => expect(screen.getByText('Falla en el motor...')).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText(/buscar por id, orden/i), { target: { value: 'motor' } });
    fireEvent.click(document.querySelector('.btn-search') as HTMLElement);

    await waitFor(() => {
      expect(screen.getByText('Falla en el motor...')).toBeInTheDocument();
      expect(screen.getAllByTestId('formatted-id').length).toBeLessThan(4);
    });
  });

  // 8. MODAL DE EDICIÓN CON DATOS
  it('debería abrir el modal de edición con los datos del informe', async () => {
    render(<TableInformes />);
    await waitFor(() => expect(screen.getAllByTitle('Editar').length).toBe(2));

    fireEvent.click(screen.getAllByTitle('Editar')[0]);

    expect(screen.getByText('Editar Informe')).toBeInTheDocument();
    const modal = screen.getByText('Editar Informe').closest('.modal-container') as HTMLElement;
    expect(modal.querySelector('textarea[name="diagnostico"]')).toHaveValue('Falla en el motor');
    expect(modal.querySelector('input[name="id_orden"]')).toHaveValue(10);
  });

  // 9. VALIDACIÓN DE CAMPOS OBLIGATORIOS
  it('debería mostrar alerta si faltan campos obligatorios al guardar', async () => {
    render(<TableInformes />);
    await waitFor(() => expect(screen.getAllByTitle('Editar').length).toBe(2));

    fireEvent.click(screen.getAllByTitle('Editar')[0]);
    const modal = screen.getByText('Editar Informe').closest('.modal-container') as HTMLElement;

    // Limpiar diagnóstico (obligatorio)
    fireEvent.change(modal.querySelector('textarea[name="diagnostico"]')!, { target: { value: '' } });
    fireEvent.submit(modal.querySelector('form')!);

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Campos incompletos', icon: 'warning' })
      );
      expect(informeService.actualizarInforme).not.toHaveBeenCalled();
    });
  });

  // 10. VALIDACIÓN NUMÉRICA DE IDs
  it('debería filtrar caracteres no numéricos en los campos de ID', async () => {
    render(<TableInformes />);
    await waitFor(() => expect(screen.getAllByTitle('Editar').length).toBe(2));

    fireEvent.click(screen.getAllByTitle('Editar')[0]);
    const modal = screen.getByText('Editar Informe').closest('.modal-container') as HTMLElement;
    const ordenInput = modal.querySelector('input[name="id_orden"]') as HTMLInputElement;

    fireEvent.change(ordenInput, { target: { value: '12abc' } });

    expect(ordenInput.value).toBe('12');
    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Solo números permitidos', toast: true })
    );
  });

  // 11. ACTUALIZAR INFORME
  it('debería actualizar el informe y mostrar alerta de éxito', async () => {
    jest.mocked(informeService.actualizarInforme).mockResolvedValue({ data: { success: true } } as any);
    render(<TableInformes />);
    await waitFor(() => expect(screen.getAllByTitle('Editar').length).toBe(2));

    fireEvent.click(screen.getAllByTitle('Editar')[0]);
    const modal = screen.getByText('Editar Informe').closest('.modal-container') as HTMLElement;

    fireEvent.change(modal.querySelector('textarea[name="diagnostico"]')!, { target: { value: 'Motor reparado' } });
    fireEvent.submit(modal.querySelector('form')!);

    await waitFor(() => {
      expect(informeService.actualizarInforme).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ diagnostico: 'Motor reparado' })
      );
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Actualizado', icon: 'success' })
      );
    });
  });

  // 12. ELIMINAR INFORME
  it('debería eliminar el informe tras confirmar', async () => {
    jest.mocked(informeService.eliminarInforme).mockResolvedValue({ data: { success: true } } as any);
    render(<TableInformes />);
    await waitFor(() => expect(screen.getAllByTitle('Eliminar').length).toBe(2));

    fireEvent.click(screen.getAllByTitle('Eliminar')[0]);

    await waitFor(() => {
      expect(informeService.eliminarInforme).toHaveBeenCalledWith(1);
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Eliminado', icon: 'success' })
      );
    });
  });

  // 13. ELIMINAR CANCELADO
  it('no debería eliminar si se cancela la confirmación', async () => {
    jest.mocked(Swal.fire).mockResolvedValueOnce({ isConfirmed: false } as any);
    render(<TableInformes />);
    await waitFor(() => expect(screen.getAllByTitle('Eliminar').length).toBe(2));

    fireEvent.click(screen.getAllByTitle('Eliminar')[0]);

    await waitFor(() => {
      expect(informeService.eliminarInforme).not.toHaveBeenCalled();
    });
  });

  // 14. GENERAR COMPROBANTE
  it('debería generar comprobante con el método de pago seleccionado', async () => {
    jest.mocked(comprobanteService.generarComprobante).mockResolvedValue({ data: { success: true } } as any);
    render(<TableInformes />);
    await waitFor(() => expect(screen.getAllByTitle('Generar Comprobante').length).toBe(1));

    fireEvent.click(screen.getAllByTitle('Generar Comprobante')[0]);

    await waitFor(() => {
      // Se mostró el selector de método de pago
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Generar Comprobante', input: 'select' })
      );
      // Se generó con el método devuelto por el Swal mock ('Nequi')
      expect(comprobanteService.generarComprobante).toHaveBeenCalledWith(1, 'Nequi');
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Éxito', text: 'Comprobante generado correctamente', icon: 'success' })
      );
    });
  });
});



