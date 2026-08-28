import { Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TableComprobantes from '../../src/componentes/TableComprobante/Comprobante';
import * as comprobanteService from '../../src/services/comprobanteService';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// 1. VARIABLES DE MOCK
const mockSave = vi.fn();

// 2. MOCKS DE MÓDULOS EXTERNOS
Mock('sweetalert2', () => ({
  fire: vi.fn(),
}));

// Mock de jsPDF para no generar PDFs reales en las pruebas
Mock('jspdf', () => ({
  __esModule: true,
  default: vi.fn().mockImplementation(() => ({
    setFillColor: vi.fn(),
    rect: vi.fn(),
    setTextColor: vi.fn(),
    setFontSize: vi.fn(),
    setFont: vi.fn(),
    text: vi.fn(),
    internal: { pageSize: { height: 297 } },
    save: mockSave,
  })),
}));

Mock('jspdf-autotable', () => ({
  __esModule: true,
  default: vi.fn(),
}));

// Mock del componente FormattedId
Mock('../../src/componentes/FormattedId', () => ({
  FormattedId: ({ value }: any) => <span data-testid="formatted-id">{value}</span>,
}));

// 3. MOCKS DE SERVICIOS (mismas rutas que los imports)
Mock('../../src/services/comprobanteService');

// ==================== DATOS DE PRUEBA ====================
const mockComprobantes = [
  {
    id_comprobante: 1,
    numero_comprobante: 'COMP-001',
    fecha: '2026-08-01T12:00:00Z',
    id_orden: 5,
    subtotal: 200000,
    total_pagar: 250000,
    metodo_pago: 'Nequi',
    estado: 'Pagado',
  },
  {
    id_comprobante: 2,
    numero_comprobante: null,
    fecha: '2026-08-15T12:00:00Z',
    id_orden: 6,
    subtotal: 100000,
    total_pagar: 100000,
    metodo_pago: null,
    estado: null,
  },
];

// Mismo formato de moneda que usa el componente
const formatMoneda = (valor: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(valor);

const MockJsPDF = jsPDF as unknown as Mock;
const mockAutoTable = autoTable as unknown as Mock;

describe('TableComprobantes Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('user_role', 'admin');
    jest.mocked(comprobanteService.obtenerComprobantes).mockResolvedValue({ data: mockComprobantes } as any);
    jest.mocked(comprobanteService.obtenerMisComprobantes).mockResolvedValue({ data: mockComprobantes } as any);
  });

  afterEach(() => {
    localStorage.clear();
  });

  // 1. CARGA COMO ADMINISTRADOR
  it('debería cargar todos los comprobantes si el rol es admin', async () => {
    render(<TableComprobantes />);

    await waitFor(() => {
      expect(comprobanteService.obtenerComprobantes).toHaveBeenCalled();
      expect(screen.getByText('COMP-001')).toBeInTheDocument();
    });

    expect(screen.getByText('Historial de Comprobantes (Solo Lectura)')).toBeInTheDocument();
    expect(screen.getByText(/en esta sección puedes consultar todos los comprobantes/i)).toBeInTheDocument();
  });

  // 2. CARGA COMO CLIENTE
  it('debería cargar solo sus comprobantes si el rol es cliente', async () => {
    localStorage.setItem('user_role', 'cliente');
    render(<TableComprobantes />);

    await waitFor(() => {
      expect(comprobanteService.obtenerMisComprobantes).toHaveBeenCalled();
      expect(comprobanteService.obtenerComprobantes).not.toHaveBeenCalled();
      expect(screen.getByText('COMP-001')).toBeInTheDocument();
    });

    expect(screen.getByText(/comprobantes asociados a tus motos/i)).toBeInTheDocument();
  });

  // 3. TABLA CON DATOS Y VALORES POR DEFECTO
  it('debería mostrar la tabla con montos, método y estado (con fallbacks)', async () => {
    render(<TableComprobantes />);

    await waitFor(() => expect(screen.getByText('COMP-001')).toBeInTheDocument());

    // Montos formateados
    expect(screen.getByText(formatMoneda(250000))).toBeInTheDocument();
    expect(screen.getByText(formatMoneda(100000))).toBeInTheDocument();

    // Método y estado reales
    expect(screen.getByText('Nequi')).toBeInTheDocument();
    expect(screen.getByText('Pagado')).toBeInTheDocument();

    // Fallbacks del segundo comprobante (null → Efectivo / Pendiente)
    expect(screen.getByText('Efectivo')).toBeInTheDocument();
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
  });

  // 4. ERROR AL CARGAR
  it('debería mostrar alerta de error si falla la carga', async () => {
    jest.mocked(comprobanteService.obtenerComprobantes).mockRejectedValue(new Error('Fallo'));
    render(<TableComprobantes />);

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Error', text: 'No se pudieron cargar los comprobantes.', icon: 'error' })
      );
    });
  });

  // 5. ESTADO VACÍO
  it('debería mostrar mensaje cuando no hay comprobantes', async () => {
    jest.mocked(comprobanteService.obtenerComprobantes).mockResolvedValue({ data: [] } as any);
    render(<TableComprobantes />);

    await waitFor(() => {
      expect(screen.getByText(/no se encontraron comprobantes/i)).toBeInTheDocument();
    });
  });

  // 6. BÚSQUEDA POR ESTADO
  it('debería filtrar comprobantes por estado al buscar', async () => {
    render(<TableComprobantes />);
    await waitFor(() => expect(screen.getByText('COMP-001')).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText(/buscar por número, estado o método/i), { target: { value: 'Pagado' } });
    fireEvent.click(document.querySelector('.btn-search') as HTMLElement);

    await waitFor(() => {
      expect(screen.getByText('COMP-001')).toBeInTheDocument();
      expect(screen.getAllByTestId('formatted-id').length).toBeLessThan(4);
    });
  });

  // 7. FILTRO POR FECHA
  it('debería filtrar comprobantes por fecha', async () => {
    render(<TableComprobantes />);
    await waitFor(() => expect(screen.getByText('COMP-001')).toBeInTheDocument());

    fireEvent.change(document.querySelector('input[type="date"]') as HTMLElement, { target: { value: '2026-08-01' } });
    fireEvent.click(document.querySelector('.btn-search') as HTMLElement);

    await waitFor(() => {
      expect(screen.getByText('COMP-001')).toBeInTheDocument();
      // El comprobante del 15 de agosto desaparece (su numero es null → formatted-id)
      expect(screen.queryAllByTestId('formatted-id').length).toBeGreaterThan(0);
    });
  });

  // 8. BOTÓN RESET
  it('debería limpiar los filtros con Reset', async () => {
    render(<TableComprobantes />);
    await waitFor(() => expect(screen.getByText('COMP-001')).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText(/buscar por número, estado o método/i), { target: { value: 'Pagado' } });
    fireEvent.click(document.querySelector('.btn-search') as HTMLElement);
    fireEvent.click(screen.getByRole('button', { name: /reset/i }));

    expect(screen.getByPlaceholderText(/buscar por número, estado o método/i)).toHaveValue('');
    expect((document.querySelector('input[type="date"]') as HTMLInputElement).value).toBe('');
  });

  // 9. DESCARGAR PDF EXITOSAMENTE
  it('debería generar y guardar el PDF con el nombre correcto', async () => {
    render(<TableComprobantes />);
    await waitFor(() => expect(screen.getByText('COMP-001')).toBeInTheDocument());

    fireEvent.click(screen.getAllByTitle('Descargar PDF')[0]);

    await waitFor(() => {
      // Se creó el documento y se generó la tabla de montos
      expect(MockJsPDF).toHaveBeenCalled();
      expect(mockAutoTable).toHaveBeenCalled();
      // Se guardó con el nombre del comprobante
      expect(mockSave).toHaveBeenCalledWith('Comprobante_COMP-001.pdf');
      // Alerta de éxito
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ title: '¡PDF Descargado!', icon: 'success' })
      );
    });
  });

  // 10. PDF CON ID CUANDO NO HAY NÚMERO
  it('debería usar el id en el nombre del archivo si no hay número de comprobante', async () => {
    render(<TableComprobantes />);
    await waitFor(() => expect(screen.getByText('COMP-001')).toBeInTheDocument());

    // Segundo comprobante (numero_comprobante: null)
    fireEvent.click(screen.getAllByTitle('Descargar PDF')[1]);

    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledWith('Comprobante_2.pdf');
    });
  });

  // 11. ERROR AL GENERAR PDF
  it('debería mostrar alerta de error si falla la generación del PDF', async () => {
    mockSave.mockImplementationOnce(() => {
      throw new Error('Fallo de PDF');
    });

    render(<TableComprobantes />);
    await waitFor(() => expect(screen.getByText('COMP-001')).toBeInTheDocument());

    fireEvent.click(screen.getAllByTitle('Descargar PDF')[0]);

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Error', text: 'No se pudo generar el PDF del comprobante.', icon: 'error' })
      );
    });
  });
});



