import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OrdenesAsignadas, OrdenUI } from '../../src/componentes/TableTecnico/OrdenesAsignadas';

describe('OrdenesAsignadas', () => {
  const mockOrdenes: OrdenUI[] = [
    { ID_ORDEN_SERVICIO: '1', ClienteNombre: 'Cliente A', Estado: 'Pendiente' },
    { ID_ORDEN_SERVICIO: '2', ClienteNombre: 'Cliente B', Estado: 'En proceso' },
    { ID_ORDEN_SERVICIO: '3', ClienteNombre: 'Cliente C', Estado: 'Completado' }
  ] as OrdenUI[];

  const mockProps = {
    ordenes: mockOrdenes,
    onActualizarEstado: vi.fn(),
    onAbrirInforme: vi.fn(),
    onVerDetalle: vi.fn(),
    getEstadoConfig: (estado: string) => {
      if (estado === 'Pendiente') return { class: 'pendiente', icon: 'icon-p', label: 'Pendiente', next: '' };
      if (estado === 'En proceso') return { class: 'proceso', icon: 'icon-e', label: 'En Proceso', next: '' };
      return { class: 'completada', icon: 'icon-c', label: 'Finalizada', next: '' };
    },
    formatDate: (d: string | null | undefined) => d || '-',
    formatId: (_tipo: string, id: any) => `ORD-${id}`
  };

  it('should render all orders initially', () => {
    render(<OrdenesAsignadas {...mockProps} />);
    expect(screen.getByText('Cliente A')).toBeInTheDocument();
    expect(screen.getByText('Cliente B')).toBeInTheDocument();
    expect(screen.getByText('Cliente C')).toBeInTheDocument();
  });

  it('should filter orders by status using chips', () => {
    render(<OrdenesAsignadas {...mockProps} />);
    
    // En proceso chip
    const procesoChip = screen.getByText('En Proceso').closest('.resumen-chip');
    if (procesoChip) fireEvent.click(procesoChip);
    
    expect(screen.queryByText('Cliente A')).not.toBeInTheDocument();
    expect(screen.getByText('Cliente B')).toBeInTheDocument();
    
    // Todas chip
    const todasChip = screen.getByText('Total').closest('.resumen-chip');
    if (todasChip) fireEvent.click(todasChip);
    
    expect(screen.getByText('Cliente A')).toBeInTheDocument();
    expect(screen.getByText('Cliente B')).toBeInTheDocument();
  });

  it('should filter orders by search term', () => {
    render(<OrdenesAsignadas {...mockProps} />);
    
    const searchInput = screen.getByPlaceholderText(/Buscar por cliente/i);
    fireEvent.change(searchInput, { target: { value: 'Cliente A' } });
    
    expect(screen.getByText('Cliente A')).toBeInTheDocument();
    expect(screen.queryByText('Cliente B')).not.toBeInTheDocument();
  });

  it('should trigger actions correctly', () => {
    render(<OrdenesAsignadas {...mockProps} />);
    
    const startBtn = screen.getByText('Iniciar Trabajo');
    fireEvent.click(startBtn);
    expect(mockProps.onActualizarEstado).toHaveBeenCalledWith('1', 'En proceso');
    
    const reportBtn = screen.getByText('Redactar Informe');
    fireEvent.click(reportBtn);
    expect(mockProps.onAbrirInforme).toHaveBeenCalled();
    
    const detailBtns = screen.getAllByText(/Detalle/i);
    fireEvent.click(detailBtns[0]);
    expect(mockProps.onVerDetalle).toHaveBeenCalled();
  });
});
