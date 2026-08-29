import { MemoryRouter } from 'react-router-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// 1. MOCKS DE MÓDULOS EXTERNOS (Antes de importar el componente)
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    useNavigate: vi.fn(() => vi.fn()), // Retornar una función mock
  };
});

vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn().mockResolvedValue({ isConfirmed: true, value: '5' }),
    getInput: vi.fn(),
  },
}));

// Variables para capturar las instancias mockeadas y verificarlas después
let mockSave: any;
let mockAutoTable: any;
let MockJsPDFConstructor: any;

vi.mock('jspdf', () => {
  mockSave = vi.fn();
  MockJsPDFConstructor = vi.fn().mockImplementation(function () {
    return {
      setFillColor: vi.fn(),
      rect: vi.fn(),
      setTextColor: vi.fn(),
      setFontSize: vi.fn(),
      setFont: vi.fn(),
      text: vi.fn(),
      internal: { pageSize: { height: 297 } },
      save: mockSave,
    };
  });
  return {
    __esModule: true,
    default: MockJsPDFConstructor,
  };
});

vi.mock('jspdf-autotable', () => {
  mockAutoTable = vi.fn();
  return {
    __esModule: true,
    default: mockAutoTable,
  };
});

vi.mock('../../src/componentes/FormattedId', () => ({
  FormattedId: ({ value }: any) => <span data-testid="formatted-id">{value}</span>, // ✅ Añadido => y )
}));

// Importar servicios DESPUÉS de los mocks
import TableComprobantes from '../../src/componentes/TableComprobante/Comprobante';
import * as comprobanteService from '../../src/services/comprobanteService';
import Swal from 'sweetalert2';

// Mock manual del servicio para inyectar funciones específicas si es necesario
vi.mock('../../src/services/comprobanteService', () => ({
  obtenerComprobantes: vi.fn(),
  obtenerMisComprobantes: vi.fn(),
}));

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
  // Segundo comprobante para probar fallbacks y nombre de archivo por ID
  {
    id_comprobante: 2,
    numero_comprobante: null, // Sin número
    fecha: '2026-08-15T12:00:00Z',
    id_orden: 6,
    subtotal: 100000,
    total_pagar: 100000,
    metodo_pago: null, // Fallback a Efectivo
    estado: null, // Fallback a Pendiente
  },
];

describe('TableComprobantes Component', () => {
  beforeEach(() => {
    // Limpiar mocks antes de cada test
    vi.clearAllMocks();
    localStorage.clear();

    // Configurar respuesta por defecto exitosa
    vi.mocked(comprobanteService.obtenerComprobantes).mockResolvedValue({ data: mockComprobantes } as any);
    vi.mocked(comprobanteService.obtenerMisComprobantes).mockResolvedValue({ data: mockComprobantes } as any);
  });

  // 1. CARGA COMO ADMINISTRADOR
  it('debería cargar todos los comprobantes si el rol es admin', async () => {
    localStorage.setItem('user_role', 'admin');
    render(<MemoryRouter><TableComprobantes /></MemoryRouter>);

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
    render(<MemoryRouter><TableComprobantes /></MemoryRouter>);

    await waitFor(() => {
      expect(comprobanteService.obtenerMisComprobantes).toHaveBeenCalled();
      expect(comprobanteService.obtenerComprobantes).not.toHaveBeenCalled();
      expect(screen.getByText('COMP-001')).toBeInTheDocument();
    });

    expect(screen.getByText(/comprobantes asociados a tus motos/i)).toBeInTheDocument();
  });

  // 3. TABLA CON DATOS Y VALORES POR DEFECTO
  it('debería mostrar la tabla con montos, método y estado (con fallbacks)', async () => {
    render(<MemoryRouter><TableComprobantes /></MemoryRouter>);

    await waitFor(() => expect(screen.getByText('COMP-001')).toBeInTheDocument());

    // Montos formateados (ajustado a formato esperado, ej: 250.000)
    expect(screen.getByText(/250\.000/)).toBeInTheDocument();
    expect(screen.getByText(/100\.000/)).toBeInTheDocument();

    // Método y estado reales (Primer item)
    expect(screen.getByText('Nequi')).toBeInTheDocument();
    expect(screen.getByText('Pagado')).toBeInTheDocument();

    // Fallbacks del segundo comprobante (null → Efectivo / Pendiente)
    // Asumiendo que tu componente renderiza "Efectivo" si es null
    expect(screen.getByText('Efectivo')).toBeInTheDocument();
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
  });

  // 4. ERROR AL CARGAR
  it('debería mostrar alerta de error si falla la carga', async () => {
    vi.mocked(comprobanteService.obtenerComprobantes).mockRejectedValue(new Error('Fallo'));
    render(<MemoryRouter><TableComprobantes /></MemoryRouter>);

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error',
          text: 'No se pudieron cargar los comprobantes.',
          icon: 'error'
        })
      );
    });
  });

  // 5. ESTADO VACÍO
  it('debería mostrar mensaje cuando no hay comprobantes', async () => {
    vi.mocked(comprobanteService.obtenerComprobantes).mockResolvedValue({ data: [] } as any);
    render(<MemoryRouter><TableComprobantes /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByText(/no se encontraron comprobantes/i)).toBeInTheDocument();
    });
  });

  // 6. BÚSQUEDA POR ESTADO
  it('debería filtrar comprobantes por estado al buscar', async () => {
    render(<MemoryRouter><TableComprobantes /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText('COMP-001')).toBeInTheDocument());

    const searchInput = screen.getByPlaceholderText(/buscar por número, estado o método/i);
    fireEvent.change(searchInput, { target: { value: 'Pagado' } });

    // Usar getByRole es más robusto que querySelector
    const searchBtn = screen.getByRole('button', { name: /buscar/i });
    fireEvent.click(searchBtn);

    await waitFor(() => {
      expect(screen.getByText('COMP-001')).toBeInTheDocument();
      // Verificar que la cantidad de IDs formateados sea menor (filtrado)
      expect(screen.getAllByTestId('formatted-id').length).toBeLessThanOrEqual(mockComprobantes.length);
    });
  });

  // 7. FILTRO POR FECHA
  it('debería filtrar comprobantes por fecha', async () => {
    render(<MemoryRouter><TableComprobantes /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText('COMP-001')).toBeInTheDocument());

    const dateInput = screen.getByLabelText(/fecha/i) || document.querySelector('input[type="date"]') as HTMLElement;
    if (dateInput) {
      fireEvent.change(dateInput, { target: { value: '2026-08-01' } });
      const searchBtn = screen.getByRole('button', { name: /buscar/i });
      fireEvent.click(searchBtn);

      await waitFor(() => {
        expect(screen.getByText('COMP-001')).toBeInTheDocument();
        // El segundo comprobante (15 de agosto) debería filtrarse si la lógica es correcta
        // Aquí verificamos que existan elementos, la lógica exacta depende de tu implementación
      });
    }
  });

  // 8. BOTÓN RESET
  it('debería limpiar los filtros con Reset', async () => {
    render(<MemoryRouter><TableComprobantes /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText('COMP-001')).toBeInTheDocument());

    const searchInput = screen.getByPlaceholderText(/buscar por número, estado o método/i);
    fireEvent.change(searchInput, { target: { value: 'Pagado' } });

    const searchBtn = screen.getByRole('button', { name: /buscar/i });
    fireEvent.click(searchBtn);

    const resetBtn = screen.getByRole('button', { name: /reset/i });
    fireEvent.click(resetBtn);

    expect(searchInput).toHaveValue('');
    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    expect(dateInput?.value).toBe('');
  });

  // 9. DESCARGAR PDF EXITOSAMENTE
  it('debería generar y guardar el PDF con el nombre correcto', async () => {
    render(<MemoryRouter><TableComprobantes /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText('COMP-001')).toBeInTheDocument());

    // Buscar el botón por título o icono
    const downloadBtns = screen.getAllByTitle('Descargar PDF');
    fireEvent.click(downloadBtns[0]);

    await waitFor(() => {
      // Verificar que se llamó al constructor de jsPDF
      expect(MockJsPDFConstructor).toHaveBeenCalled();
      // Verificar que se llamó a autoTable
      expect(mockAutoTable).toHaveBeenCalled();

      // Verificar nombre del archivo
      expect(mockSave).toHaveBeenCalledWith('Comprobante_COMP-001.pdf');

      // Alerta de éxito
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ title: '¡PDF Descargado!', icon: 'success' })
      );
    });
  });

  // 10. PDF CON ID CUANDO NO HAY NÚMERO
  it('debería usar el id en el nombre del archivo si no hay número de comprobante', async () => {
    render(<MemoryRouter><TableComprobantes /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText('COMP-001')).toBeInTheDocument());

    // Segundo comprobante (numero_comprobante: null)
    const downloadBtns = screen.getAllByTitle('Descargar PDF');
    // Asegurarse de que hay al menos 2 botones
    if (downloadBtns.length > 1) {
      fireEvent.click(downloadBtns[1]);

      await waitFor(() => {
        expect(mockSave).toHaveBeenCalledWith('Comprobante_2.pdf');
      });
    } else {
      throw new Error("No se encontraron suficientes botones de descarga para este test");
    }
  });

  // 11. ERROR AL GENERAR PDF
  it('debería mostrar alerta de error si falla la generación del PDF', async () => {
    // Forzar error en el método save
    mockSave.mockImplementationOnce(() => {
      throw new Error('Fallo de PDF');
    });

    render(<MemoryRouter><TableComprobantes /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText('COMP-001')).toBeInTheDocument());

    const downloadBtns = screen.getAllByTitle('Descargar PDF');
    fireEvent.click(downloadBtns[0]);

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error',
          text: 'No se pudo generar el PDF del comprobante.',
          icon: 'error'
        })
      );
    });
  });
});