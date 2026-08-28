import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ClienteHistorial from '../../src/componentes/TableCliente/ClienteHistorial';
import * as historialService from '../../src/services/historial.service';
import Swal from 'sweetalert2';

// 1. MOCKS DE MÓDULOS EXTERNOS
jest.mock('sweetalert2', () => ({
  fire: jest.fn(),
}));

// 2. MOCKS DE SERVICIOS (mismas rutas que los imports)
jest.mock('../../src/services/historial.service');

// ==================== DATOS DE PRUEBA ====================
const mockHistorial = [
  {
    id_historial: 1,
    fecha_registro: '2026-08-01T10:30:00',
    accion: 'Pago realizado',
    tabla_afectada: 'comprobantes',
    descripcion: 'Pagó el comprobante COMP-001',
  },
  {
    id_historial: 2,
    fecha_registro: '2026-08-02T08:00:00',
    accion: 'Creación',
    tabla_afectada: 'ordenes',
    descripcion: 'Creó una orden de servicio',
  },
  {
    id_historial: 3,
    fecha_registro: '2026-08-03T09:00:00',
    accion: 'Actualización',
    tabla_afectada: 'motos',
    descripcion: 'Actualizó los datos de su moto',
  },
  {
    id_historial: 4,
    fecha_registro: '',
    accion: 'Eliminación',
    tabla_afectada: '',
    descripcion: '',
  },
];

// Misma configuración de fecha que usa el componente
const formatFechaEsperada = (fecha: string) =>
  new Date(fecha).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

describe('ClienteHistorial Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(historialService.obtenerMiHistorial).mockResolvedValue({
      data: mockHistorial,
    } as any);
  });

  // 1. RENDERIZADO INICIAL
  it('debería renderizar el título de la página', () => {
    render(<ClienteHistorial />);
    expect(screen.getByText('Mi Historial')).toBeInTheDocument();
  });

  // 2. ESTADO DE CARGA
  it('debería mostrar "Cargando historial..." mientras consulta la API', () => {
    jest.mocked(historialService.obtenerMiHistorial).mockImplementation(() => new Promise(() => {}));
    render(<ClienteHistorial />);
    expect(screen.getByText(/cargando historial/i)).toBeInTheDocument();
  });

  // 3. ESTADO VACÍO
  it('debería mostrar mensaje cuando no hay actividad registrada', async () => {
    jest.mocked(historialService.obtenerMiHistorial).mockResolvedValue({ data: [] } as any);
    render(<ClienteHistorial />);

    await waitFor(() => {
      expect(screen.getByText(/aún no tienes actividad registrada/i)).toBeInTheDocument();
    });
  });

  // 4. ERROR AL CARGAR
  it('debería mostrar alerta de error si falla la carga', async () => {
    jest.mocked(historialService.obtenerMiHistorial).mockRejectedValue(new Error('Fallo'));
    render(<ClienteHistorial />);

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error',
          text: 'No se pudo cargar tu historial',
          icon: 'error',
        })
      );
    });
  });

  // 5. TABLA CON DATOS Y ENCABEZADOS
  it('debería mostrar la tabla con encabezados y los registros', async () => {
    render(<ClienteHistorial />);

    await waitFor(() => {
      expect(screen.getByText('Fecha')).toBeInTheDocument();
      expect(screen.getByText('Acción')).toBeInTheDocument();
      expect(screen.getByText('Tabla')).toBeInTheDocument();
      expect(screen.getByText('Descripción')).toBeInTheDocument();
    });

    // Registros visibles
    expect(screen.getByText('Pago realizado')).toBeInTheDocument();
    expect(screen.getByText('Creación')).toBeInTheDocument();
    expect(screen.getByText('Actualización')).toBeInTheDocument();
    expect(screen.getByText('Eliminación')).toBeInTheDocument();
    expect(screen.getByText('comprobantes')).toBeInTheDocument();
  });

  // 6. CLASES DE BADGES SEGÚN LA ACCIÓN
  it('debería asignar la clase de badge correcta según el tipo de acción', async () => {
    render(<ClienteHistorial />);

    await waitFor(() => {
      expect(screen.getByText('Pago realizado')).toHaveClass('historial-badge pago');
      expect(screen.getByText('Creación')).toHaveClass('historial-badge creacion');
      expect(screen.getByText('Actualización')).toHaveClass('historial-badge modificacion');
      expect(screen.getByText('Eliminación')).toHaveClass('historial-badge eliminacion');
    });
  });

  // 7. FORMATO DE FECHA
  it('debería formatear las fechas en locale es-CO', async () => {
    render(<ClienteHistorial />);

    await waitFor(() => {
      expect(
        screen.getByText(formatFechaEsperada('2026-08-01T10:30:00'))
      ).toBeInTheDocument();
      expect(
        screen.getByText(formatFechaEsperada('2026-08-02T08:00:00'))
      ).toBeInTheDocument();
    });
  });

  // 8. VALORES VACÍOS → GUION
  it('debería mostrar "—" cuando faltan fecha, tabla o descripción', async () => {
    render(<ClienteHistorial />);

    await waitFor(() => {
      // El registro 4 tiene fecha, tabla y descripción vacías
      expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(3);
    });
  });

  // 9. DESCRIPCIÓN COMO TOOLTIP
  it('debería incluir la descripción completa como atributo title', async () => {
    render(<ClienteHistorial />);

    await waitFor(() => {
      const descripcion = screen.getByText('Pagó el comprobante COMP-001');
      expect(descripcion).toHaveAttribute('title', 'Pagó el comprobante COMP-001');
    });
  });
});