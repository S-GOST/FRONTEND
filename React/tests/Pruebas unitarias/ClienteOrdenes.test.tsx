import { MemoryRouter } from 'react-router-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import ClienteOrdenes from '../../src/componentes/TableCliente/ClienteOrdenes';
import * as ordenService from '../../src/services/ordenServicioService';

// 1. VARIABLES DE MOCK
const mockNavigate = vi.fn();

// 2. MOCKS DE MÓDULOS EXTERNOS
vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom') as any),
  useNavigate: () => mockNavigate,
}));

// 3. MOCKS DE SERVICIOS
vi.mock('../../src/services/ordenServicioService');

// ==================== DATOS DE PRUEBA COMPLETOS ====================
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
    Fecha_inicio: '2026-07-10',
    Fecha_estimada: null, // Null para probar fallback
    Fecha_fin: '2026-07-15',
    Estado: 'Completado',
    total: 80000,
    PlacaMoto: 'XYZ34E',
    MarcaMoto: null, // Sin marca para probar fallback
    ModeloMoto: null,
    detalles: [], // Sin detalles para probar ese caso
  },
];

describe('ClienteOrdenes Component - Core Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ordenService.obtenerMisOrdenes).mockResolvedValue({ data: mockOrdenes } as any);
  });

  // 1. CARGA EXITOSA Y VISUALIZACIÓN DE LISTA
  it('debería cargar las órdenes, mostrar conteo correcto y renderizar tarjetas con datos formateados', async () => {
    render(<MemoryRouter><ClienteOrdenes /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByText('Mis Órdenes de Servicio')).toBeInTheDocument();
      expect(screen.getByText('2 órdenes encontradas')).toBeInTheDocument();

      // Verificar IDs formateados
      expect(screen.getByText('#0001')).toBeInTheDocument();
      expect(screen.getByText('#0002')).toBeInTheDocument();
    });

    // Orden 1: Datos completos (Marca + Modelo)
    expect(screen.getByText('KTM Duke 390')).toBeInTheDocument();
    expect(screen.getByText('(ABC12D)')).toBeInTheDocument();
    expect(screen.getByText('En proceso')).toBeInTheDocument();
    expect(screen.getAllByText(/250\.000/)[0]).toBeInTheDocument();

    // Orden 2: Fallbacks (Solo placa, sin marca/modelo) y estado completado
    expect(screen.getByText('XYZ34E')).toBeInTheDocument();
    expect(screen.getByText('Completado')).toBeInTheDocument();
    expect(screen.getAllByText(/80\.000/)[0]).toBeInTheDocument();
  });

  // 3. NAVEGACIÓN AL DASHBOARD
  it('debería navegar al dashboard del cliente al hacer clic en "Volver"', async () => {
    render(<MemoryRouter><ClienteOrdenes /></MemoryRouter>);
    await waitFor(() => expect(screen.getByRole('button', { name: /volver al panel/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /volver al panel/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/cliente/dashboard');
  });

  // 4. INTERACCIÓN: EXPANDIR DETALLES CON DATOS
  it('debería mostrar el detalle completo (tabla de servicios/productos) al expandir una orden con datos', async () => {
    render(<MemoryRouter><ClienteOrdenes /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText('#0001')).toBeInTheDocument());

    fireEvent.click(screen.getByText('#0001'));

    await waitFor(() => {
      expect(screen.getByText('Detalle de la orden')).toBeInTheDocument();
      expect(screen.getByText('Información')).toBeInTheDocument();
    });

    // Validar contenido de la tabla de detalles
    expect(screen.getByText('Mantenimiento')).toBeInTheDocument();
    expect(screen.getByText('Aceite')).toBeInTheDocument();
    expect(screen.getByText('30 días')).toBeInTheDocument(); // Garantía

    // Precios en detalle
    expect(screen.getAllByText(/150\.000/)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/100\.000/)[0]).toBeInTheDocument();
  });

  // 5. INTERACCIÓN: ORDEN SIN DETALLES Y FECHAS NULAS
  it('debería manejar correctamente órdenes sin detalles y fechas nulas (mostrando fallbacks)', async () => {
    render(<MemoryRouter><ClienteOrdenes /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText('#0002')).toBeInTheDocument());

    fireEvent.click(screen.getByText('#0002'));

    await waitFor(() => {
      expect(screen.getByText(/fecha inicio:/i)).toBeInTheDocument();
      // No debe aparecer la tabla de detalles porque el array está vacío
      expect(screen.queryByText('Detalle de la orden')).not.toBeInTheDocument();
      expect(screen.queryByText('Servicio')).not.toBeInTheDocument();

      // Verificar fallback de fecha estimada null (asumiendo que muestra "—" o similar)
      // Ajusta el selector según tu implementación real del fallback
      const placeholders = screen.getAllByText('—');
      expect(placeholders.length).toBeGreaterThan(0);
    });
  });
});