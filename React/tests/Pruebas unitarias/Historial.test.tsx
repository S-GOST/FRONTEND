import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TableHistorial from '../../src/componentes/Tablehistorial/historial';
import * as historialService from '../../src/services/historial.service';
import Swal from 'sweetalert2';

// 1. MOCKS DE MÓDULOS EXTERNOS
jest.mock('sweetalert2', () => ({
  fire: jest.fn(),
}));

// Mock del componente FormattedId
jest.mock('../../src/componentes/FormattedId', () => ({
  FormattedId: ({ value }: any) => <span data-testid="formatted-id">{value}</span>,
}));

// 2. MOCKS DE SERVICIOS (mismas rutas que los imports)
jest.mock('../../src/services/historial.service');

// ==================== DATOS DE PRUEBA ====================
const mockHistorial = [
  {
    id_historial: 1,
    id_usuario: 10,
    id_registro: 100,
    tabla_afectada: 'clientes',
    accion: 'INSERT',
    descripcion: 'Creó un cliente nuevo',
    fecha_registro: '2026-08-01T10:00:00',
    datos_antes: null,
    datos_despues: JSON.stringify({ nombre: 'Juan' }),
  },
  {
    id_historial: 2,
    id_usuario: 11,
    id_registro: 200,
    tabla_afectada: 'motos',
    accion: 'UPDATE',
    descripcion: 'Actualizó una moto',
    fecha_registro: '2026-08-02T11:00:00',
    datos_antes: { placa: 'ABC12D' },
    datos_despues: { placa: 'XYZ34E' },
  },
  {
    id_historial: 3,
    id_usuario: 12,
    id_registro: 300,
    tabla_afectada: 'ordenes',
    accion: 'DELETE',
    descripcion: '',
    fecha_registro: null,
    datos_antes: null,
    datos_despues: null,
  },
];

describe('TableHistorial Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(historialService.obtenerHistorial).mockResolvedValue({ data: mockHistorial } as any);
  });

  // 1. RENDERIZADO INICIAL
  it('debería renderizar el título y la nota de inmutabilidad', () => {
    render(<TableHistorial />);

    expect(screen.getByText('Registro de Auditoría (Historial)')).toBeInTheDocument();
    expect(screen.getByText(/este registro es inmutable/i)).toBeInTheDocument();
  });

  // 2. ESTADO DE CARGA
  it('debería mostrar "Cargando historial..." mientras consulta la API', () => {
    jest.mocked(historialService.obtenerHistorial).mockImplementation(() => new Promise(() => {}));
    render(<TableHistorial />);
    expect(screen.getByText(/cargando historial/i)).toBeInTheDocument();
  });

  // 3. ESTADO VACÍO
  it('debería mostrar mensaje cuando no hay registros', async () => {
    jest.mocked(historialService.obtenerHistorial).mockResolvedValue({ data: [] } as any);
    render(<TableHistorial />);

    await waitFor(() => {
      expect(screen.getByText(/no hay registros en el historial/i)).toBeInTheDocument();
    });
  });

  // 4. ERROR AL CARGAR
  it('debería mostrar alerta de error si falla la carga', async () => {
    jest.mocked(historialService.obtenerHistorial).mockRejectedValue(new Error('Fallo'));
    render(<TableHistorial />);

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error',
          text: 'No se pudieron cargar los datos del historial.',
          icon: 'error',
        })
      );
    });
  });

  // 5. TABLA CON DATOS Y FALLBACKS
  it('debería mostrar los registros con badges de acción y fallbacks', async () => {
    render(<TableHistorial />);

    await waitFor(() => {
      expect(screen.getByText('clientes')).toBeInTheDocument();
      expect(screen.getByText('motos')).toBeInTheDocument();
      expect(screen.getByText('ordenes')).toBeInTheDocument();
    });

    // Badges de acción
    expect(screen.getByText('INSERT')).toBeInTheDocument();
    expect(screen.getByText('UPDATE')).toBeInTheDocument();
    expect(screen.getByText('DELETE')).toBeInTheDocument();

    // Fechas formateadas (misma lógica que el componente)
    expect(screen.getByText(new Date('2026-08-01T10:00:00').toLocaleString())).toBeInTheDocument();

    // Fallbacks: descripción vacía y fecha nula → '-'
    expect(screen.getAllByText('-').length).toBeGreaterThanOrEqual(2);
  });

  // 6. BÚSQUEDA POR TABLA
  it('debería filtrar registros al buscar por tabla afectada', async () => {
    render(<TableHistorial />);
    await waitFor(() => expect(screen.getByText('clientes')).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText(/buscar por id, tabla, usuario/i), { target: { value: 'motos' } });
    fireEvent.click(document.querySelector('.btn-search') as HTMLElement);

    await waitFor(() => {
      expect(screen.getByText('motos')).toBeInTheDocument();
      expect(screen.queryByText('clientes')).not.toBeInTheDocument();
      expect(screen.queryByText('ordenes')).not.toBeInTheDocument();
    });
  });

  // 7. FILTRO POR ACCIÓN
  it('debería filtrar registros con el selector de acción', async () => {
    render(<TableHistorial />);
    await waitFor(() => expect(screen.getByText('INSERT')).toBeInTheDocument());

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'UPDATE' } });
    fireEvent.click(document.querySelector('.btn-search') as HTMLElement);

    await waitFor(() => {
      expect(screen.getByText('UPDATE')).toBeInTheDocument();
      expect(screen.queryByText('INSERT')).not.toBeInTheDocument();
      expect(screen.queryByText('DELETE')).not.toBeInTheDocument();
    });
  });

  // 8. BOTÓN RESET
  it('debería limpiar búsqueda y filtro con Reset', async () => {
    render(<TableHistorial />);
    await waitFor(() => expect(screen.getByText('INSERT')).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText(/buscar por id, tabla, usuario/i), { target: { value: 'motos' } });
    fireEvent.click(document.querySelector('.btn-search') as HTMLElement);
    fireEvent.click(screen.getByRole('button', { name: /reset/i }));

    expect(screen.getByPlaceholderText(/buscar por id, tabla, usuario/i)).toHaveValue('');
    expect(screen.getByRole('combobox')).toHaveValue('');
    expect(screen.getByText('INSERT')).toBeInTheDocument();
  });

  // 9. MODAL JSON CON SOLO DATOS DESPUÉS
  it('debería mostrar solo "Datos DESPUÉS" cuando no hay datos antes', async () => {
    render(<TableHistorial />);
    await waitFor(() => expect(screen.getByText('INSERT')).toBeInTheDocument());

    fireEvent.click(screen.getAllByTitle('Ver datos antes/después')[0]);

    await waitFor(() => {
      expect(screen.getByText(/detalle de operación \(INSERT\)/i)).toBeInTheDocument();
      expect(screen.getByText(/datos después/i)).toBeInTheDocument();
    });

    // El JSON string se parsea y muestra formateado
    expect(screen.getByText(/"nombre": "Juan"/)).toBeInTheDocument();
    // No hay sección de ANTES
    expect(screen.queryByText(/datos antes/i)).not.toBeInTheDocument();
  });

  // 10. MODAL JSON CON AMBOS DATOS
  it('debería mostrar "Datos ANTES" y "Datos DESPUÉS" cuando existen ambos', async () => {
    render(<TableHistorial />);
    await waitFor(() => expect(screen.getByText('UPDATE')).toBeInTheDocument());

    fireEvent.click(screen.getAllByTitle('Ver datos antes/después')[1]);

    await waitFor(() => {
      expect(screen.getByText(/datos antes/i)).toBeInTheDocument();
      expect(screen.getByText(/datos después/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/"placa": "ABC12D"/)).toBeInTheDocument();
    expect(screen.getByText(/"placa": "XYZ34E"/)).toBeInTheDocument();
  });

  // 11. MODAL JSON SIN DATOS
  it('debería mostrar mensaje cuando no hay datos JSON', async () => {
    render(<TableHistorial />);
    await waitFor(() => expect(screen.getByText('DELETE')).toBeInTheDocument());

    fireEvent.click(screen.getAllByTitle('Ver datos antes/después')[2]);

    await waitFor(() => {
      expect(screen.getByText(/no hay datos json disponibles/i)).toBeInTheDocument();
    });
  });

  // 12. CERRAR MODAL JSON
  it('debería cerrar el modal con el botón ×', async () => {
    render(<TableHistorial />);
    await waitFor(() => expect(screen.getByText('INSERT')).toBeInTheDocument());

    fireEvent.click(screen.getAllByTitle('Ver datos antes/después')[0]);
    await waitFor(() => expect(screen.getByText(/detalle de operación/i)).toBeInTheDocument());

    fireEvent.click(screen.getByText('×'));

    await waitFor(() => {
      expect(screen.queryByText(/detalle de operación/i)).not.toBeInTheDocument();
    });
  });
});