import { Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ReporteInventario from '../../src/componentes/TableAdmin/ReporteInventario';
import { obtenerReporteInventario } from '../../src/services/informe.service';
import { obtenerCategoriasPorTipo } from '../../src/services/categoria.service';
import Swal from 'sweetalert2';

// Mock de servicios (RUTAS DEBEN COINCIDIR CON LOS IMPORTS)
Mock('../../src/services/informe.service');
Mock('../../src/services/categoria.service');

// Mock de SweetAlert2
Mock('sweetalert2', () => ({
  fire: vi.fn(),
}));

// Helper para fechas
const getHace30Dias = () => {
  const hoy = new Date();
  const hace30 = new Date();
  hace30.setDate(hoy.getDate() - 30);
  return hace30.toISOString().split('T')[0];
};

const getHoy = () => new Date().toISOString().split('T')[0];

describe('ReporteInventario Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock de categorías por defecto
    jest.mocked(obtenerCategoriasPorTipo).mockResolvedValue({
      data: {
        success: true,
        data: [
          { ID_CATEGORIA: 1, nombre: 'Categoría 1' },
          { ID_CATEGORIA: 2, nombre: 'Categoría 2' }
        ]
      }
    } as any);
  });

  // 1. PRUEBA DE RENDERIZADO INICIAL
  it('debería renderizar el componente con valores por defecto', async () => {
    render(<ReporteInventario />);
    
    expect(screen.getByText(/inventario de productos/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/categoría/i)).toHaveValue('');
    expect(screen.getByLabelText(/uso desde/i)).toHaveValue(getHace30Dias());
    expect(screen.getByLabelText(/uso hasta/i)).toHaveValue(getHoy());
    expect(screen.getByRole('button', { name: /generar reporte/i })).toBeInTheDocument();
    
    await waitFor(() => {
      expect(obtenerCategoriasPorTipo).toHaveBeenCalledWith('PRODUCTO');
      expect(obtenerCategoriasPorTipo).toHaveBeenCalledWith('SERVICIO');
    });
  });

  // 2. PRUEBA DE CARGA DE CATEGORÍAS
  it('debería cargar categorías de productos y servicios al montar', async () => {
    const mockCategoriasProducto = [
      { ID_CATEGORIA: 1, nombre: 'Repuestos' },
      { ID_CATEGORIA: 2, nombre: 'Accesorios' }
    ];

    const mockCategoriasServicio = [
      { ID_CATEGORIA: 3, nombre: 'Mantenimiento' },
      { ID_CATEGORIA: 4, nombre: 'Reparación' }
    ];

    const mockCategorias = obtenerCategoriasPorTipo as Mock;

    mockCategorias
      .mockResolvedValueOnce({ data: { success: true, data: mockCategoriasProducto } })
      .mockResolvedValueOnce({ data: { success: true, data: mockCategoriasServicio } });

    render(<ReporteInventario />);

    await waitFor(() => {
      const select = screen.getByLabelText(/categoría/i);
      expect(select).toBeInTheDocument();
      expect(screen.getByText('Repuestos')).toBeInTheDocument();
      expect(screen.getByText('Mantenimiento')).toBeInTheDocument();
    });
  });

  // 3. PRUEBA DE VALIDACIÓN - FECHAS INCOMPLETAS
  it('debería mostrar alerta si solo se selecciona una fecha', async () => {
    render(<ReporteInventario />);
    
    fireEvent.change(screen.getByLabelText(/uso desde/i), { target: { value: '2026-08-01' } });
    
    const btnGenerar = screen.getByRole('button', { name: /generar reporte/i });
    fireEvent.click(btnGenerar);
    
    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        'Campos Incompletos',
        'Debes seleccionar ambas fechas para el rango.',
        'warning'
      );
    });
  });

  // 4. PRUEBA DE VALIDACIÓN - FECHA INICIO > FECHA FIN
  it('debería mostrar alerta si fecha inicio es mayor a fecha fin', async () => {
    render(<ReporteInventario />);
    
    fireEvent.change(screen.getByLabelText(/uso desde/i), { target: { value: '2026-09-01' } });
    fireEvent.change(screen.getByLabelText(/uso hasta/i), { target: { value: '2026-08-01' } });
    
    const btnGenerar = screen.getByRole('button', { name: /generar reporte/i });
    fireEvent.click(btnGenerar);
    
    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        'Fechas Inválidas',
        'La "fecha desde" no puede ser mayor a la "fecha hasta".',
        'warning'
      );
    });
  });

  // 5. PRUEBA DE LLAMADA A API EXITOSA
  it('debería llamar a la API y mostrar datos del reporte', async () => {
    const mockData = {
      total_venta: 1500000,
      total_costo: 800000,
      alertas_stock: [
        { id: 1, nombre: 'Aceite Motor', stock: 2, minimo: 5 }
      ],
      masUsados: [
        { ID_PRODUCTOS: 1, Nombre: 'Filtro de Aire', total_usado: 15 }
      ],
      masUsadosServicios: [
        { ID_SERVICIOS: 1, nombre: 'Mantenimiento Preventivo', Precio: 150000, total_usado: 10, total_generado: 1500000 }
      ]
    };

    jest.mocked(obtenerReporteInventario).mockResolvedValue({
      success: true,
      data: mockData
    } as any);

    render(<ReporteInventario />);
    
    const btnGenerar = screen.getByRole('button', { name: /generar reporte/i });
    fireEvent.click(btnGenerar);
    
    await waitFor(() => {
      expect(obtenerReporteInventario).toHaveBeenCalled();
    });
    
    await waitFor(() => {
      expect(screen.getByText('$1.500.000')).toBeInTheDocument();
      expect(screen.getByText('$800.000')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Aceite Motor')).toBeInTheDocument();
    expect(screen.getByText('Filtro de Aire')).toBeInTheDocument();
    expect(screen.getByText('Mantenimiento Preventivo')).toBeInTheDocument();
  });

  // 6. PRUEBA DE ESTADO SIN DATOS
  it('debería mostrar mensaje cuando no hay datos', async () => {
    jest.mocked(obtenerReporteInventario).mockResolvedValue({
      success: true,
      data: null
    } as any);

    render(<ReporteInventario />);
    
    const btnGenerar = screen.getByRole('button', { name: /generar reporte/i });
    fireEvent.click(btnGenerar);
    
    await waitFor(() => {
      expect(screen.getByText(/no hay productos registrados/i)).toBeInTheDocument();
    });
  });

  // 7. PRUEBA DE ERROR 404
  it('debería manejar error 404 mostrando sin datos', async () => {
    const error = { response: { status: 404 } };
    jest.mocked(obtenerReporteInventario).mockRejectedValue(error);

    render(<ReporteInventario />);
    
    const btnGenerar = screen.getByRole('button', { name: /generar reporte/i });
    fireEvent.click(btnGenerar);
    
    await waitFor(() => {
      expect(screen.getByText(/no hay productos registrados/i)).toBeInTheDocument();
    });
  });

  // 8. PRUEBA DE ERROR GENÉRICO
  it('debería mostrar alerta de error cuando falla la consulta', async () => {
    const error = { 
      response: { 
        status: 500, 
        data: { message: 'Error del servidor' } 
      } 
    };
    jest.mocked(obtenerReporteInventario).mockRejectedValue(error);

    render(<ReporteInventario />);
    
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

  // 9. PRUEBA DE FILTRO DE CATEGORÍA
  it('debería permitir seleccionar una categoría', async () => {
    render(<ReporteInventario />);
    
    await waitFor(() => {
      expect(obtenerCategoriasPorTipo).toHaveBeenCalled();
    });
    
    const select = screen.getByLabelText(/categoría/i);
    fireEvent.change(select, { target: { value: '1' } });
    
    expect(select).toHaveValue('1');
  });

  // 10. PRUEBA DE ALERTAS DE STOCK
  it('debería mostrar tabla de alertas cuando hay stock bajo', async () => {
    const mockData = {
      total_venta: 100000,
      alertas_stock: [
        { id: 1, nombre: 'Bujía', stock: 1, minimo: 10 },
        { id: 2, nombre: 'Filtro', stock: 0, minimo: 5 }
      ],
      masUsados: [],
      masUsadosServicios: []
    };

    jest.mocked(obtenerReporteInventario).mockResolvedValue({
      success: true,
      data: mockData
    } as any);

    render(<ReporteInventario />);
    
    fireEvent.click(screen.getByRole('button', { name: /generar reporte/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/alertas: stock bajo o agotado/i)).toBeInTheDocument();
      expect(screen.getByText('Bujía')).toBeInTheDocument();
      expect(screen.getByText('Filtro')).toBeInTheDocument();
    });
  });

  // 11. PRUEBA DE SIN ALERTAS DE STOCK
  it('debería mostrar mensaje de no hay alertas cuando el stock es adecuado', async () => {
    const mockData = {
      total_venta: 100000,
      alertas_stock: [],
      masUsados: [],
      masUsadosServicios: []
    };

    jest.mocked(obtenerReporteInventario).mockResolvedValue({
      success: true,
      data: mockData
    } as any);

    render(<ReporteInventario />);
    
    fireEvent.click(screen.getByRole('button', { name: /generar reporte/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/no hay alertas de stock/i)).toBeInTheDocument();
    });
  });

  // 12. PRUEBA DE PRODUCTOS MÁS USADOS
  it('debería mostrar tabla de productos más usados', async () => {
    const mockData = {
      total_venta: 100000,
      alertas_stock: [],
      masUsados: [
        { ID_PRODUCTOS: 1, Nombre: 'Aceite', total_usado: 50 },
        { ID_PRODUCTOS: 2, Nombre: 'Filtro', total_usado: 30 }
      ],
      masUsadosServicios: []
    };

    jest.mocked(obtenerReporteInventario).mockResolvedValue({
      success: true,
      data: mockData
    } as any);

    render(<ReporteInventario />);
    
    fireEvent.click(screen.getByRole('button', { name: /generar reporte/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/productos más utilizados/i)).toBeInTheDocument();
      expect(screen.getByText('Aceite')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
    });
  });

  // 13. PRUEBA DE SERVICIOS MÁS USADOS
  it('debería mostrar tabla de servicios más usados con total generado', async () => {
    const mockData = {
      total_venta: 2000000,
      alertas_stock: [],
      masUsados: [],
      masUsadosServicios: [
        { ID_SERVICIOS: 1, nombre: 'Mantenimiento', Precio: 200000, total_usado: 10, total_generado: 2000000 }
      ]
    };

    jest.mocked(obtenerReporteInventario).mockResolvedValue({
      success: true,
      data: mockData
    } as any);

    render(<ReporteInventario />);
    
    fireEvent.click(screen.getByRole('button', { name: /generar reporte/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/servicios más utilizados/i)).toBeInTheDocument();
      expect(screen.getByText('Mantenimiento')).toBeInTheDocument();
      expect(screen.getByText('$200.000')).toBeInTheDocument();
      expect(screen.getByText('$2.000.000')).toBeInTheDocument();
    });
  });

  // 14. PRUEBA DE KPI - OCULTAR COSTOS CUANDO HAY CATEGORÍA
  it('no debería mostrar KPI de costos cuando hay una categoría seleccionada', async () => {
    const mockData = {
      total_venta: 100000,
      total_costo: 50000,
      alertas_stock: [],
      masUsados: [],
      masUsadosServicios: []
    };

    jest.mocked(obtenerReporteInventario).mockResolvedValue({
      success: true,
      data: mockData
    } as any);

    render(<ReporteInventario />);
    
    await waitFor(() => {
      const select = screen.getByLabelText(/categoría/i);
      fireEvent.change(select, { target: { value: '1' } });
    });
    
    fireEvent.click(screen.getByRole('button', { name: /generar reporte/i }));
    
    await waitFor(() => {
      expect(screen.getByText('$100.000')).toBeInTheDocument();
      expect(screen.queryByText('$50.000')).not.toBeInTheDocument();
    });
  });

  // 15. PRUEBA DE BOTÓN DESHABILITADO
  it('debería deshabilitar el botón mientras se carga', async () => {
    jest.mocked(obtenerReporteInventario).mockImplementation(
      () => new Promise(() => {})
    );

    render(<ReporteInventario />);
    
    const btnGenerar = screen.getByRole('button', { name: /generar reporte/i });
    fireEvent.click(btnGenerar);
    
    await waitFor(() => {
      expect(btnGenerar).toBeDisabled();
      expect(btnGenerar).toHaveTextContent('Consultando...');
    });
  });

  // 16. PRUEBA DE FORMATO DE MONEDA
  it('debería formatear correctamente los valores en pesos colombianos', async () => {
    const mockData = {
      total_venta: 1234567,
      alertas_stock: [],
      masUsados: [],
      masUsadosServicios: []
    };

    jest.mocked(obtenerReporteInventario).mockResolvedValue({
      success: true,
      data: mockData
    } as any);

    render(<ReporteInventario />);
    
    fireEvent.click(screen.getByRole('button', { name: /generar reporte/i }));
    
    await waitFor(() => {
      expect(screen.getByText('$1.234.567')).toBeInTheDocument();
    });
  });

  // 17. PRUEBA DE OPTGROUPS EN SELECT
  it('debería mostrar optgroups para productos y servicios', async () => {
    const mockProducto = [{ ID_CATEGORIA: 1, nombre: 'Repuestos' }];
    const mockServicio = [{ ID_CATEGORIA: 2, nombre: 'Mantenimiento' }];

    const mockCategorias = obtenerCategoriasPorTipo as Mock;

    mockCategorias
      .mockResolvedValueOnce({ data: { success: true, data: mockProducto } })
      .mockResolvedValueOnce({ data: { success: true, data: mockServicio } });

    render(<ReporteInventario />);

    await waitFor(() => {
      const select = screen.getByLabelText(/categoría/i);
      expect(select).toBeInTheDocument();

      const optgroups = select.querySelectorAll('optgroup');
      expect(optgroups).toHaveLength(2);
      expect(optgroups[0]).toHaveAttribute('label', '📦 Productos');
      expect(optgroups[1]).toHaveAttribute('label', '🔧 Servicios');
    });
  });
});



