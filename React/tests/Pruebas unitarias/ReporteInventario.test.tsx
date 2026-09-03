import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReporteInventario from '../../src/componentes/TableAdmin/ReporteInventario';
import { obtenerReporteInventario } from '../../src/services/informe.service';
import { obtenerCategoriasPorTipo } from '../../src/services/categoria.service';
import { MemoryRouter } from 'react-router-dom';
import Swal from 'sweetalert2';

vi.mock('../../src/services/informe.service', () => ({
  obtenerReporteInventario: vi.fn()
}));

vi.mock('../../src/services/categoria.service', () => ({
  obtenerCategoriasPorTipo: vi.fn()
}));

vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn()
  }
}));

describe('ReporteInventario', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(obtenerCategoriasPorTipo).mockResolvedValue({ data: [] } as any);
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <ReporteInventario />
      </MemoryRouter>
    );
  };

  it('should render correctly and fetch categories', async () => {
    renderComponent();
    expect(screen.getByText('Inventario de Productos')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(obtenerCategoriasPorTipo).toHaveBeenCalledWith('PRODUCTO');
      expect(obtenerCategoriasPorTipo).toHaveBeenCalledWith('SERVICIO');
    });
  });

  it('should show warning if fecha inicio > fecha fin', async () => {
    renderComponent();
    
    const inputInicio = screen.getByLabelText('Uso Desde');
    const inputFin = screen.getByLabelText('Uso Hasta');
    
    fireEvent.change(inputInicio, { target: { value: '2023-01-31' } });
    fireEvent.change(inputFin, { target: { value: '2023-01-01' } });
    
    const btn = screen.getByText(/Generar Reporte/i);
    fireEvent.click(btn);
    
    expect(Swal.fire).toHaveBeenCalledWith(
      'Fechas Inválidas',
      expect.any(String),
      'warning'
    );
  });

  it('should show warning if only one date is provided', async () => {
    renderComponent();
    
    const inputInicio = screen.getByLabelText('Uso Desde');
    const inputFin = screen.getByLabelText('Uso Hasta');
    
    fireEvent.change(inputInicio, { target: { value: '2023-01-01' } });
    fireEvent.change(inputFin, { target: { value: '' } });
    
    const btn = screen.getByText(/Generar Reporte/i);
    fireEvent.click(btn);
    
    expect(Swal.fire).toHaveBeenCalledWith(
      'Campos Incompletos',
      expect.any(String),
      'warning'
    );
  });

  it('should fetch report data successfully', async () => {
    const mockData = {
      total_venta: 1000,
      total_costo: 500,
      alertas_stock: [{ id: 1, nombre: 'Prod A', stock: 5, minimo: 10 }],
      masUsados: [{ ID_PRODUCTOS: 1, Nombre: 'Prod B', total_usado: 10 }],
      masUsadosServicios: [{ ID_SERVICIOS: 1, nombre: 'Serv A', Precio: 100, total_usado: 5, total_generado: 500 }]
    };
    
    vi.mocked(obtenerReporteInventario).mockResolvedValueOnce({ data: { success: true, data: mockData } } as any);
    
    renderComponent();
    
    const btn = screen.getByText(/Generar Reporte/i);
    fireEvent.click(btn);
    
    await waitFor(() => {
      expect(obtenerReporteInventario).toHaveBeenCalled();
    });
    
    expect(screen.getByText('Prod A')).toBeInTheDocument();
    expect(screen.getByText('Prod B')).toBeInTheDocument();
    expect(screen.getByText('Serv A')).toBeInTheDocument();
  });
});
