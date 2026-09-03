import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Dashboard from '../../src/componentes/TableAdmin/Dashboard';
import { MemoryRouter } from 'react-router-dom';
import { obtenerAdmins } from '../../src/services/admin.service';
import { obtenerTecnicos } from '../../src/services/tecnico.service';
import { obtenerClientes, obtenerClientesPendientes } from '../../src/services/cliente.service';
import { obtenerOrdenes } from '../../src/services/ordenServicioService';

vi.mock('../../src/services/admin.service', () => ({ obtenerAdmins: vi.fn() }));
vi.mock('../../src/services/tecnico.service', () => ({ obtenerTecnicos: vi.fn() }));
vi.mock('../../src/services/cliente.service', () => ({ 
  obtenerClientes: vi.fn(), 
  obtenerClientesPendientes: vi.fn() 
}));
vi.mock('../../src/services/ordenServicioService', () => ({ obtenerOrdenes: vi.fn() }));
vi.mock('sweetalert2', () => ({ default: { fire: vi.fn() } }));

describe('Dashboard (Admin)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.mocked(obtenerAdmins).mockResolvedValue({ data: [{ id: 1 }] } as any);
    vi.mocked(obtenerTecnicos).mockResolvedValue({ data: [{ id: 1 }, { id: 2 }] } as any);
    vi.mocked(obtenerClientes).mockResolvedValue({ data: [{ id: 1 }, { id: 2 }, { id: 3 }] } as any);
    vi.mocked(obtenerClientesPendientes).mockResolvedValue({ data: [{ id: 4 }] } as any);
    vi.mocked(obtenerOrdenes).mockResolvedValue({ data: [
      { id: 1, Estado: 'Pendiente' },
      { id: 2, Estado: 'En Proceso' },
      { id: 3, Estado: 'Completado' },
      { id: 4, Estado: 'Completado' }
    ] } as any);
  });

  const renderDashboard = () => {
    return render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
  };

  it('should render loading initially and then the dashboard with stats', async () => {
    renderDashboard();
    expect(screen.getByText('Cargando panel administrativo...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByText('Cargando panel administrativo...')).not.toBeInTheDocument();
    });
    
    const usuariosCard = screen.getByText('Usuarios Totales').parentElement;
    expect(usuariosCard).toHaveTextContent('6');
    
    const tecnicosCard = screen.getByText('Técnicos').parentElement;
    expect(tecnicosCard).toHaveTextContent('2');
    
    const clientesCard = screen.getByText('Clientes').parentElement;
    expect(clientesCard).toHaveTextContent('3');
    
    const pendientesCard = screen.getByText('Clientes por Aprobar').parentElement;
    expect(pendientesCard).toHaveTextContent('1');
    
    const ordPendientesCard = screen.getByText('Órdenes Pendientes').parentElement;
    expect(ordPendientesCard).toHaveTextContent('1');
    
    const ordProcesoCard = screen.getByText('En Proceso').parentElement;
    expect(ordProcesoCard).toHaveTextContent('1');
    
    const ordCompletadasCard = screen.getByText('Completadas').parentElement;
    expect(ordCompletadasCard).toHaveTextContent('2');
  });

  it('should handle API errors gracefully', async () => {
    vi.mocked(obtenerAdmins).mockRejectedValueOnce(new Error('Network error'));
    renderDashboard();
    
    await waitFor(() => {
      expect(screen.queryByText('Cargando panel administrativo...')).not.toBeInTheDocument();
    });
    
    const usuariosCard = screen.getByText('Usuarios Totales').parentElement;
    expect(usuariosCard).toHaveTextContent('5');
  });
});
