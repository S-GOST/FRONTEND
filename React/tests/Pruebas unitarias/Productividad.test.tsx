import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Productividad from '../../src/componentes/TableAdmin/Productividad';
import { obtenerReporteProductividad } from '../../src/services/informe.service';
import { MemoryRouter } from 'react-router-dom';
import Swal from 'sweetalert2';

vi.mock('../../src/services/informe.service', () => ({
  obtenerReporteProductividad: vi.fn()
}));

vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn()
  }
}));

describe('Productividad', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <Productividad />
      </MemoryRouter>
    );
  };

  it('should render correctly', () => {
    renderComponent();
    expect(screen.getByText('Productividad de Técnicos')).toBeInTheDocument();
  });

  it('should show warning if dates are missing', async () => {
    renderComponent();
    
    const inputInicio = screen.getByLabelText('Desde');
    fireEvent.change(inputInicio, { target: { value: '' } });
    
    const btn = screen.getByText(/Generar Reporte/i);
    fireEvent.click(btn);
    
    expect(Swal.fire).toHaveBeenCalledWith(
      'Atención',
      'Seleccione ambas fechas.',
      'warning'
    );
  });

  it('should show warning if fecha inicio > fecha fin', async () => {
    renderComponent();
    
    const inputInicio = screen.getByLabelText('Desde');
    const inputFin = screen.getByLabelText('Hasta');
    
    fireEvent.change(inputInicio, { target: { value: '2023-01-31' } });
    fireEvent.change(inputFin, { target: { value: '2023-01-01' } });
    
    const btn = screen.getByText(/Generar Reporte/i);
    fireEvent.click(btn);
    
    expect(Swal.fire).toHaveBeenCalledWith(
      'Atención',
      expect.any(String),
      'warning'
    );
  });

  it('should fetch report data successfully', async () => {
    const mockData = {
      ordenesCompletadas: [{ id_usuario: 1, nombre: 'Tecnico A', total_completadas: 10 }],
      promediosServicios: [{ id_usuario: 1, nombre: 'Tecnico A', servicio: 'Serv A', promedio_minutos: 120 }]
    };
    
    vi.mocked(obtenerReporteProductividad).mockResolvedValueOnce({ data: { success: true, data: mockData } } as any);
    
    renderComponent();
    
    const btn = screen.getByText(/Generar Reporte/i);
    fireEvent.click(btn);
    
    await waitFor(() => {
      expect(obtenerReporteProductividad).toHaveBeenCalled();
    });
    
    expect(screen.getAllByText('Tecnico A')[0]).toBeInTheDocument();
    expect(screen.getByText('2h 0m')).toBeInTheDocument();
  });
});
