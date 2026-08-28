import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ClienteOrdenes from '../../src/componentes/TableCliente/ClienteOrdenes';
import * as ordenService from '../../src/services/ordenServicioService';

// 1. VARIABLES DE MOCK
const mockNavigate = vi.fn();

// 2. MOCKS DE MÓDULOS EXTERNOS
vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// 3. MOCKS DE SERVICIOS (mismas rutas que los imports)
vi.mock('../../src/services/ordenServicioService');

// ==================== DATOS DE PRUEBA ====================
const mockOrdenes = [
  {
    ID_ORDEN_SERVICIO: 1,
    ID_CLIENTES: 100,
    ID_MOTOS: 1,
    Fecha_inicio: '2026-08-01',
    Fecha_estimada: '2026-08-05',
    Fecha_fin: null,
    Estado: 'En proceso',
    total: 250000,
    PlacaMoto: 'ABC12D',
    MarcaMoto: 'KTM',
    ModeloMoto: 'Duke 390',
    detalles: [
      { id_detalle: 1, ID_SERVICIOS: 10, ID_PRODUCTOS: null, cantidad: 1, precio_unitario: 150000, subtotal: 150000, garantia: 30, NombreServicio: 'Mantenimiento', NombreProducto: null },
      { id_detalle: 2, ID_SERVICIOS: null, ID_PRODUCTOS: 20, cantidad: 2, precio_unitario: 50000, subtotal: 100000, garantia: null, NombreServicio: null, NombreProducto: 'Aceite' },
    ],
  },
  {
    ID_ORDEN_SERVICIO: 2,
    ID_CLIENTES: 100,
    ID_MOTOS: 2,
    Fecha_inicio: '2026-07-01',
    Fecha_estimada: null,
    Fecha_fin: '2026-07-03',
    Estado: 'Completado',
    total: 80000,
    PlacaMoto: 'XYZ34E',
    MarcaMoto: null,
    ModeloMoto: null,
    detalles: [],
  },
];

// Mismo formato de precio que usa el componente
const formatPrecio = (valor: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(valor);

describe('ClienteOrdenes Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    jest.mocked(ordenService.obtenerMisOrdenes).mockResolvedValue({ data: mockOrdenes } as any);
  });

  // 1. ESTADO DE CARGA
  it('debería mostrar "Cargando tus órdenes..." mientras consulta la API', () => {
    jest.mocked(ordenService.obtenerMisOrdenes).mockImplementation(() => new Promise(() => {}));
    render(<ClienteOrdenes />);
    expect(screen.getByText(/cargando tus órdenes/i)).toBeInTheDocument();
  });

  // 2. HEADER Y CONTEO EN PLURAL
  it('debería mostrar el título y el conteo de órdenes en plural', async () => {
    render(<ClienteOrdenes />);

    await waitFor(() => {
      expect(screen.getByText('Mis Órdenes de Servicio')).toBeInTheDocument();
      expect(screen.getByText('2 órdenes encontradas')).toBeInTheDocument();
    });
  });

  // 3. CONTEO EN SINGULAR
  it('debería mostrar "1 orden encontrada" cuando hay una sola orden', async () => {
    jest.mocked(ordenService.obtenerMisOrdenes).mockResolvedValue({ data: [mockOrdenes[0]] } as any);
    render(<ClienteOrdenes />);

    await waitFor(() => {
      expect(screen.getByText('1 orden encontrada')).toBeInTheDocument();
    });
  });

  // 4. ESTADO VACÍO
  it('debería mostrar mensaje cuando no hay órdenes registradas', async () => {
    jest.mocked(ordenService.obtenerMisOrdenes).mockResolvedValue({ data: [] } as any);
    render(<ClienteOrdenes />);

    await waitFor(() => {
      expect(screen.getByText(/no tienes órdenes de servicio registradas/i)).toBeInTheDocument();
    });
  });

  // 5. ERROR CON BOTÓN REINTENTAR
  it('debería mostrar error y permitir reintentar la carga', async () => {
    jest.mocked(ordenService.obtenerMisOrdenes)
      .mockRejectedValueOnce(new Error('Fallo'))
      .mockResolvedValueOnce({ data: mockOrdenes } as any);

    render(<ClienteOrdenes />);

    // Aparece el error con el botón Reintentar
    await waitFor(() => {
      expect(screen.getByText(/no se pudieron cargar tus órdenes/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
    });

    // Al reintentar, carga exitosamente
    fireEvent.click(screen.getByRole('button', { name: /reintentar/i }));

    await waitFor(() => {
      expect(screen.queryByText(/no se pudieron cargar tus órdenes/i)).not.toBeInTheDocument();
      expect(screen.getByText('#0001')).toBeInTheDocument();
    });

    expect(ordenService.obtenerMisOrdenes).toHaveBeenCalledTimes(2);
  });

  // 6. TARJETAS DE ÓRDENES
  it('debería mostrar las órdenes con ID, moto, estado y total', async () => {
    render(<ClienteOrdenes />);

    await waitFor(() => {
      // IDs con padding de 4 dígitos
      expect(screen.getByText('#0001')).toBeInTheDocument();
      expect(screen.getByText('#0002')).toBeInTheDocument();
    });

    // Orden 1: Marca + Modelo y placa entre paréntesis
    expect(screen.getByText('KTM Duke 390')).toBeInTheDocument();
    expect(screen.getByText('(ABC12D)')).toBeInTheDocument();

    // Orden 2: sin marca/modelo → muestra la placa
    expect(screen.getByText('XYZ34E')).toBeInTheDocument();

    // Estados y totales
    expect(screen.getByText('En proceso')).toBeInTheDocument();
    expect(screen.getByText('Completado')).toBeInTheDocument();
    expect(screen.getByText(formatPrecio(250000))).toBeInTheDocument();
    expect(screen.getByText(formatPrecio(80000))).toBeInTheDocument();
  });

  // 7. BOTÓN VOLVER AL PANEL
  it('debería navegar al dashboard del cliente con el botón volver', async () => {
    render(<ClienteOrdenes />);

    fireEvent.click(screen.getByRole('button', { name: /volver al panel/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/cliente/dashboard');
  });

  // 8. EXPANDIR DETALLES DE LA ORDEN
  it('debería mostrar los detalles al hacer clic en una orden', async () => {
    render(<ClienteOrdenes />);
    await waitFor(() => expect(screen.getByText('#0001')).toBeInTheDocument());

    fireEvent.click(screen.getByText('#0001'));

    await waitFor(() => {
      expect(screen.getByText('Detalle de la orden')).toBeInTheDocument();
    });

    // Secciones de información y moto
    expect(screen.getByText('Información')).toBeInTheDocument();
    expect(screen.getByText(/placa:/i)).toBeInTheDocument();

    // Tabla de detalles: servicio y producto
    expect(screen.getByText('Servicio')).toBeInTheDocument();
    expect(screen.getByText('Producto')).toBeInTheDocument();
    expect(screen.getByText('Mantenimiento')).toBeInTheDocument();
    expect(screen.getByText('Aceite')).toBeInTheDocument();

    // Cantidades y garantía
    expect(screen.getByText('30 días')).toBeInTheDocument();
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);

    // Precios del detalle
    expect(screen.getByText(formatPrecio(150000))).toBeInTheDocument();
    expect(screen.getByText(formatPrecio(100000))).toBeInTheDocument();
  });

  // 9. COLAPSAR DETALLES
  it('debería ocultar los detalles al hacer clic nuevamente', async () => {
    render(<ClienteOrdenes />);
    await waitFor(() => expect(screen.getByText('#0001')).toBeInTheDocument());

    // Expandir
    fireEvent.click(screen.getByText('#0001'));
    await waitFor(() => expect(screen.getByText('Detalle de la orden')).toBeInTheDocument());

    // Colapsar
    fireEvent.click(screen.getByText('#0001'));
    await waitFor(() => {
      expect(screen.queryByText('Detalle de la orden')).not.toBeInTheDocument();
    });
  });

  // 10. ORDEN SIN DETALLES NO MUESTRA TABLA
  it('no debería mostrar tabla de detalles en órdenes sin detalles', async () => {
    render(<ClienteOrdenes />);
    await waitFor(() => expect(screen.getByText('#0002')).toBeInTheDocument());

    fireEvent.click(screen.getByText('#0002'));

    await waitFor(() => {
      expect(screen.getByText(/fecha inicio:/i)).toBeInTheDocument();
    });

    // La tabla de detalles no aparece porque detalles está vacío
    expect(screen.queryByText('Detalle de la orden')).not.toBeInTheDocument();
  });

  // 11. FECHAS EN LOS DETALLES
  it('debería mostrar "—" para fechas vacías en los detalles', async () => {
    render(<ClienteOrdenes />);
    await waitFor(() => expect(screen.getByText('#0002')).toBeInTheDocument());

    fireEvent.click(screen.getByText('#0002'));

    await waitFor(() => {
      // Fecha estimada null → "—"
      expect(screen.getAllByText('—').length).toBeGreaterThan(0);
    });
  });
});



