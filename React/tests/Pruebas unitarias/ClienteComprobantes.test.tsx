import { Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ClienteComprobantes from '../../src/componentes/TableCliente/ClienteComprobantes';
import * as comprobanteService from '../../src/services/comprobanteService';
import Swal from 'sweetalert2';

// 1. MOCKS DE MÓDULOS EXTERNOS
vi.mock('sweetalert2', () => ({
  fire: vi.fn().mockResolvedValue({ isConfirmed: true }),
  showValidationMessage: vi.fn(),
}));

// Mock del componente FormattedId para simplificar
vi.mock('../../src/componentes/FormattedId', () => ({
  FormattedId: ({ value }: any) => <span data-testid="formatted-id">{value}</span>,
}));

// 2. MOCKS DE SERVICIOS (mismas rutas que los imports)
vi.mock('../../src/services/comprobanteService');

// ==================== DATOS DE PRUEBA ====================
const mockComprobantes = [
  {
    id_comprobante: 10,
    numero_comprobante: 'COMP-001',
    fecha: '2026-08-01T00:00:00.000Z',
    id_orden: 5,
    fecha_ingreso: '2026-07-28T00:00:00.000Z',
    metodo_pago: null,
    diagnostico: 'Falla en motor',
    trabajo_realizado: 'Cambio de aceite',
    total_pagar: 250000,
    estado: 'Pendiente',
  },
  {
    id_comprobante: 11,
    numero_comprobante: 'COMP-002',
    fecha: '2026-08-10T00:00:00.000Z',
    id_orden: 6,
    fecha_ingreso: null,
    metodo_pago: 'Nequi',
    total_pagar: 180000,
    estado: 'Pagado',
  },
];

describe('ClienteComprobantes Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    jest.mocked(comprobanteService.obtenerMisComprobantes).mockResolvedValue({
      data: mockComprobantes,
    } as any);
  });

  // 1. RENDERIZADO INICIAL
  it('debería renderizar el título de la página', () => {
    render(<ClienteComprobantes />);
    expect(screen.getByText('Mis Comprobantes')).toBeInTheDocument();
  });

  // 2. ESTADO DE CARGA
  it('debería mostrar "Cargando comprobantes..." mientras consulta la API', () => {
    jest.mocked(comprobanteService.obtenerMisComprobantes).mockImplementation(() => new Promise(() => {}));
    render(<ClienteComprobantes />);
    expect(screen.getByText(/cargando comprobantes/i)).toBeInTheDocument();
  });

  // 3. ESTADO VACÍO
  it('debería mostrar mensaje cuando no hay comprobantes', async () => {
    jest.mocked(comprobanteService.obtenerMisComprobantes).mockResolvedValue({ data: [] } as any);
    render(<ClienteComprobantes />);

    await waitFor(() => {
      expect(screen.getByText(/no tienes comprobantes registrados/i)).toBeInTheDocument();
    });
  });

  // 4. ERROR AL CARGAR
  it('debería mostrar alerta de error si falla la carga', async () => {
    jest.mocked(comprobanteService.obtenerMisComprobantes).mockRejectedValue(new Error('Fallo'));
    render(<ClienteComprobantes />);

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error',
          text: 'No se pudieron cargar los comprobantes',
          icon: 'error',
        })
      );
    });
  });

  // 5. TARJETAS DE COMPROBANTES CON DATOS
  it('debería mostrar los comprobantes con su información completa', async () => {
    render(<ClienteComprobantes />);

    await waitFor(() => {
      expect(screen.getByText('COMP-001')).toBeInTheDocument();
      expect(screen.getByText('COMP-002')).toBeInTheDocument();
    });

    // Fechas formateadas (se calculan igual que en el componente)
    expect(screen.getByText(new Date(mockComprobantes[0].fecha).toLocaleDateString())).toBeInTheDocument();

    // Montos formateados
    expect(screen.getByText(`$${(250000).toLocaleString()}`)).toBeInTheDocument();
    expect(screen.getByText(`$${(180000).toLocaleString()}`)).toBeInTheDocument();

    // Diagnóstico y trabajo del comprobante pendiente
    expect(screen.getByText('Falla en motor')).toBeInTheDocument();
    expect(screen.getByText('Cambio de aceite')).toBeInTheDocument();

    // Badges de estado
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
    expect(screen.getByText('Pagado')).toBeInTheDocument();
  });

  // 6. BOTÓN PAGAR SOLO EN PENDIENTES
  it('debería mostrar el botón Pagar solo en comprobantes pendientes', async () => {
    render(<ClienteComprobantes />);
    await waitFor(() => expect(screen.getByText('COMP-001')).toBeInTheDocument());

    // Solo 1 botón "Pagar" (el comprobante pagado no lo tiene)
    const pagarButtons = screen.getAllByRole('button', { name: 'Pagar' });
    expect(pagarButtons).toHaveLength(1);
  });

  // 7. FLUJO DE PAGO EXITOSO
  it('debería procesar el pago con el método seleccionado y recargar la lista', async () => {
    // El Swal del método de pago devuelve el valor seleccionado
    jest.mocked(Swal.fire).mockResolvedValue({ value: 'Nequi' } as any);

    render(<ClienteComprobantes />);
    await waitFor(() => expect(screen.getByText('COMP-001')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Pagar' }));

    await waitFor(() => {
      // 1. Se mostró el selector de método de pago
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Seleccione método de pago', icon: 'question' })
      );
      // 2. Se llamó al servicio con el id y el método
      expect(comprobanteService.pagarComprobante).toHaveBeenCalledWith(10, 'Nequi');
      // 3. Se mostró el éxito
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ title: '¡Pagado!', icon: 'success' })
      );
    });

    // 4. Se recargaron los comprobantes (1 carga inicial + 1 recarga)
    expect(comprobanteService.obtenerMisComprobantes).toHaveBeenCalledTimes(2);
  });

  // 8. PAGO CANCELADO
  it('no debería pagar si el usuario cancela la selección de método', async () => {
    // Sin valor seleccionado (canceló)
    jest.mocked(Swal.fire).mockResolvedValue({ value: undefined } as any);

    render(<ClienteComprobantes />);
    await waitFor(() => expect(screen.getByText('COMP-001')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Pagar' }));

    await waitFor(() => {
      expect(comprobanteService.pagarComprobante).not.toHaveBeenCalled();
    });
  });

  // 9. ERROR AL PROCESAR PAGO
  it('debería mostrar alerta de error si falla el pago', async () => {
    jest.mocked(Swal.fire).mockResolvedValue({ value: 'Efectivo' } as any);
    jest.mocked(comprobanteService.pagarComprobante).mockRejectedValue(new Error('Fallo de pago'));

    render(<ClienteComprobantes />);
    await waitFor(() => expect(screen.getByText('COMP-001')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Pagar' }));

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error',
          text: 'Hubo un error al intentar procesar el pago.',
          icon: 'error',
        })
      );
    });
  });

  // 10. COMPROBANTE SIN NÚMERO USA FormattedId
  it('debería usar FormattedId cuando el comprobante no tiene número', async () => {
    jest.mocked(comprobanteService.obtenerMisComprobantes).mockResolvedValue({
      data: [{ ...mockComprobantes[0], numero_comprobante: null }],
    } as any);

    render(<ClienteComprobantes />);

    await waitFor(() => {
      const ids = screen.getAllByTestId('formatted-id');
      expect(ids.length).toBeGreaterThan(0);
    });
  });

  // 11. FECHA DE INGRESO VACÍA
  it('debería mostrar "—" cuando no hay fecha de ingreso', async () => {
    render(<ClienteComprobantes />);

    await waitFor(() => {
      // El comprobante COMP-002 tiene fecha_ingreso: null
      expect(screen.getAllByText('—').length).toBeGreaterThan(0);
    });
  });
});



