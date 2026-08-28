import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Productividad from '../../src/componentes/TableAdmin/Productividad';
import { obtenerReporteProductividad } from '../../src/services/informe.service';
import Swal from 'sweetalert2';

// Mock del servicio
vi.mock('../../services/informe.service');

// Mock de SweetAlert2
vi.mock('sweetalert2', () => ({
  fire: vi.fn(),
}));

// Helper para obtener fecha de hace 30 días
const getHace30Dias = () => {
  const hoy = new Date();
  const hace30 = new Date();
  hace30.setDate(hoy.getDate() - 30);
  return hace30.toISOString().split('T')[0];
};

const getHoy = () => new Date().toISOString().split('T')[0];

describe('Productividad Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. PRUEBA DE RENDERIZADO INICIAL
  it('debería renderizar el componente con valores por defecto', () => {
    render(<Productividad />);
    
    expect(screen.getByText(/productividad de técnicos/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/desde/i)).toHaveValue(getHace30Dias());
    expect(screen.getByLabelText(/hasta/i)).toHaveValue(getHoy());
    expect(screen.getByRole('button', { name: /generar reporte/i })).toBeInTheDocument();
  });

  // 2. PRUEBA DE VALIDACIÓN - FECHAS VACÍAS
  it('debería mostrar alerta si no se seleccionan ambas fechas', async () => {
    render(<Productividad />);
    
    // Limpiar fechas
    fireEvent.change(screen.getByLabelText(/desde/i), { target: { value: '' } });
    
    const btnGenerar = screen.getByRole('button', { name: /generar reporte/i });
    fireEvent.click(btnGenerar);
    
    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        'Atención',
        'Seleccione ambas fechas.',
        'warning'
      );
    });
  });

  // 3. PRUEBA DE VALIDACIÓN - FECHA INICIO > FECHA FIN
  it('debería mostrar alerta si fecha inicio es mayor a fecha fin', async () => {
    render(<Productividad />);
    
    fireEvent.change(screen.getByLabelText(/desde/i), { target: { value: '2026-09-01' } });
    fireEvent.change(screen.getByLabelText(/hasta/i), { target: { value: '2026-08-01' } });
    
    const btnGenerar = screen.getByRole('button', { name: /generar reporte/i });
    fireEvent.click(btnGenerar);
    
    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        'Atención',
        'La fecha de inicio no puede ser mayor a la fecha fin.',
        'warning'
      );
    });
  });

  // 4. PRUEBA DE LLAMADA A API EXITOSA
  it('debería llamar a la API y mostrar datos cuando la consulta es exitosa', async () => {
    const mockData = {
      ordenesCompletadas: [
        { id_usuario: 1, nombre: 'Juan Pérez', total_completadas: 15 },
        { id_usuario: 2, nombre: 'María García', total_completadas: 20 }
      ],
      promediosServicios: [
        { id_usuario: 1, nombre: 'Juan Pérez', servicio: 'Mantenimiento', promedio_minutos: 45 },
        { id_usuario: 1, nombre: 'Juan Pérez', servicio: 'Reparación', promedio_minutos: 120 }
      ]
    };

    jest.mocked(obtenerReporteProductividad).mockResolvedValue({
      data: {
        success: true,
        data: mockData
      }
    } as any);

    render(<Productividad />);
    
    const btnGenerar = screen.getByRole('button', { name: /generar reporte/i });
    fireEvent.click(btnGenerar);
    
    // Verificar loader
    expect(screen.getByText(/calculando métricas/i)).toBeInTheDocument();
    
    await waitFor(() => {
      expect(obtenerReporteProductividad).toHaveBeenCalled();
    });
    
    // Verificar KPIs
    await waitFor(() => {
      expect(screen.getByText('35')).toBeInTheDocument(); // Total órdenes (15+20)
      expect(screen.getByText('2')).toBeInTheDocument(); // Total técnicos
      expect(screen.getByText(/2h 2m/i)).toBeInTheDocument(); // Promedio ((45+120)/2 = 82.5 min)
      expect(screen.getByText('2')).toBeInTheDocument(); // Tipos de servicio
    });
    
    // Verificar tablas
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    expect(screen.getByText('María García')).toBeInTheDocument();
    expect(screen.getByText('Mantenimiento')).toBeInTheDocument();
    expect(screen.getByText('Reparación')).toBeInTheDocument();
  });

  // 5. PRUEBA DE ESTADO SIN DATOS
  it('debería mostrar mensaje de sin datos cuando no hay resultados', async () => {
    jest.mocked(obtenerReporteProductividad).mockResolvedValue({
      data: {
        success: true,
        data: {
          ordenesCompletadas: [],
          promediosServicios: []
        }
      }
    } as any);

    render(<Productividad />);
    
    const btnGenerar = screen.getByRole('button', { name: /generar reporte/i });
    fireEvent.click(btnGenerar);
    
    await waitFor(() => {
      expect(screen.getByText(/no hay órdenes completadas/i)).toBeInTheDocument();
    });
  });

  // 6. PRUEBA DE ERROR 404
  it('debería manejar error 404 mostrando sin datos', async () => {
    const error = { response: { status: 404 } };
    jest.mocked(obtenerReporteProductividad).mockRejectedValue(error);

    render(<Productividad />);
    
    const btnGenerar = screen.getByRole('button', { name: /generar reporte/i });
    fireEvent.click(btnGenerar);
    
    await waitFor(() => {
      expect(screen.getByText(/no hay órdenes completadas/i)).toBeInTheDocument();
    });
  });

  // 7. PRUEBA DE ERROR GENÉRICO
  it('debería mostrar alerta de error cuando falla la consulta', async () => {
    const error = { 
      response: { 
        status: 500, 
        data: { message: 'Error del servidor' } 
      } 
    };
    jest.mocked(obtenerReporteProductividad).mockRejectedValue(error);

    render(<Productividad />);
    
    const btnGenerar = screen.getByRole('button', { name: /generar reporte/i });
    fireEvent.click(btnGenerar);
    
    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        'Error',
        'Error del servidor',
        'error'
      );
    });
  });

  // 8. PRUEBA DE CAMBIO DE FECHAS
  it('debería actualizar las fechas cuando el usuario las cambia', () => {
    render(<Productividad />);
    
    fireEvent.change(screen.getByLabelText(/desde/i), { target: { value: '2026-01-01' } });
    fireEvent.change(screen.getByLabelText(/hasta/i), { target: { value: '2026-01-31' } });
    
    expect(screen.getByLabelText(/desde/i)).toHaveValue('2026-01-01');
    expect(screen.getByLabelText(/hasta/i)).toHaveValue('2026-01-31');
  });

  // 9. PRUEBA DE BOTÓN DESHABILITADO DURANTE CARGA
  it('debería deshabilitar el botón mientras se carga', async () => {
    jest.mocked(obtenerReporteProductividad).mockImplementation(
      () => new Promise(() => {}) // Promesa que nunca se resuelve
    );

    render(<Productividad />);
    
    const btnGenerar = screen.getByRole('button', { name: /generar reporte/i });
    fireEvent.click(btnGenerar);
    
    await waitFor(() => {
      expect(btnGenerar).toBeDisabled();
    });
  });

  // 10. PRUEBA DE FORMATO DE TIEMPO
  it('debería formatear correctamente los tiempos en las tablas', async () => {
    const mockData = {
      ordenesCompletadas: [
        { id_usuario: 1, nombre: 'Juan Pérez', total_completadas: 10 }
      ],
      promediosServicios: [
        { id_usuario: 1, nombre: 'Juan Pérez', servicio: 'Mantenimiento', promedio_minutos: 30 },
        { id_usuario: 1, nombre: 'Juan Pérez', servicio: 'Reparación', promedio_minutos: 90 },
        { id_usuario: 1, nombre: 'Juan Pérez', servicio: 'Diagnóstico', promedio_minutos: 0 }
      ]
    };

    jest.mocked(obtenerReporteProductividad).mockResolvedValue({
      data: {
        success: true,
        data: mockData
      }
    } as any);

    render(<Productividad />);
    
    fireEvent.click(screen.getByRole('button', { name: /generar reporte/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/30 min/i)).toBeInTheDocument();
      expect(screen.getByText(/1h 30m/i)).toBeInTheDocument();
      expect(screen.getByText('—')).toBeInTheDocument(); // Para 0 minutos
    });
  });

  // 11. PRUEBA DE KPIs CON DATOS VACÍOS
  it('debería mostrar ceros en KPIs cuando no hay datos', async () => {
    jest.mocked(obtenerReporteProductividad).mockResolvedValue({
      data: {
        success: true,
        data: {
          ordenesCompletadas: [],
          promediosServicios: []
        }
      }
    } as any);

    render(<Productividad />);
    
    fireEvent.click(screen.getByRole('button', { name: /generar reporte/i }));
    
    await waitFor(() => {
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  // 12. PRUEBA DE RENDERIZADO DE TABLAS
  it('debería mostrar ambas tablas cuando hay datos', async () => {
    const mockData = {
      ordenesCompletadas: [
        { id_usuario: 1, nombre: 'Juan Pérez', total_completadas: 15 }
      ],
      promediosServicios: [
        { id_usuario: 1, nombre: 'Juan Pérez', servicio: 'Mantenimiento', promedio_minutos: 45 }
      ]
    };

    jest.mocked(obtenerReporteProductividad).mockResolvedValue({
      data: {
        success: true,
        data: mockData
      }
    } as any);

    render(<Productividad />);
    
    fireEvent.click(screen.getByRole('button', { name: /generar reporte/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/órdenes completadas por técnico/i)).toBeInTheDocument();
      expect(screen.getByText(/tiempo promedio por servicio/i)).toBeInTheDocument();
    });
  });
});



