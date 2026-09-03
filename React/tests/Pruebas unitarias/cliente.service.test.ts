import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  obtenerClientes, 
  insertarCliente, 
  actualizarCliente, 
  eliminarCliente,
  habilitarCliente,
  obtenerClientesPendientes,
  procesarAprobacionCliente
} from '../../src/services/cliente.service';
import { apiClient } from '../../src/config/axios';

vi.mock('../../src/config/axios', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  }
}));

describe('cliente.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('obtenerClientes debería hacer un GET a /clientes y añadir compatibilidad si es array directo', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [{ numero_documento: '123', nombre: 'Test', ciudad: 'Cali' }] });
    const res = await obtenerClientes();
    expect(apiClient.get).toHaveBeenCalledWith('/clientes');
    expect(res.data[0].ID_CLIENTES).toBe('123');
  });

  it('obtenerClientes debería hacer un GET a /clientes y añadir compatibilidad si es data.data', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { data: [{ numero_documento: '123', nombre: 'Test', ciudad: 'Cali' }] } });
    const res = await obtenerClientes();
    expect(res.data.data[0].ID_CLIENTES).toBe('123');
  });

  it('obtenerClientes debería hacer un GET a /clientes y añadir compatibilidad si es data.clientes', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { clientes: [{ id_usuario: '123', nombre: 'Test', ciudad: 'Cali' }] } });
    const res = await obtenerClientes();
    expect(res.data.clientes[0].ID_CLIENTES).toBe('123');
  });

  it('insertarCliente debería hacer un POST a /clientes/insertar', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: {} });
    const payload = { numero_documento: '1', id_tipo_documento: 1, ciudad: 'Cali', nombre: 'Test', usuario: 'test', correo: 'a@a.com', telefono: '123' };
    await insertarCliente(payload);
    expect(apiClient.post).toHaveBeenCalledWith('/clientes/insertar', payload);
  });

  it('actualizarCliente debería hacer un PUT a /clientes/actualizar/:id', async () => {
    vi.mocked(apiClient.put).mockResolvedValue({ data: {} });
    const payload = { numero_documento: '1', id_tipo_documento: 1, ciudad: 'Cali', nombre: 'Test', usuario: 'test', correo: 'a@a.com', telefono: '123' };
    await actualizarCliente(1, payload);
    expect(apiClient.put).toHaveBeenCalledWith('/clientes/actualizar/1', payload);
  });

  it('eliminarCliente debería hacer un DELETE a /clientes/eliminar/:id', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({ data: {} });
    await eliminarCliente(1);
    expect(apiClient.delete).toHaveBeenCalledWith('/clientes/eliminar/1');
  });

  it('habilitarCliente debería hacer un PUT a /clientes/actualizar/:id con estado Activo', async () => {
    vi.mocked(apiClient.put).mockResolvedValue({ data: {} });
    await habilitarCliente(1);
    expect(apiClient.put).toHaveBeenCalledWith('/clientes/actualizar/1', { estado: 'Activo' });
  });

  it('obtenerClientesPendientes debería hacer un GET a /clientes/pendientes y mapear datos', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { data: [{ numero_documento: '123', nombre: 'Test', ciudad: 'Cali' }] } });
    const res = await obtenerClientesPendientes();
    expect(apiClient.get).toHaveBeenCalledWith('/clientes/pendientes');
    expect(res.data.data[0].ID_CLIENTES).toBe('123');
  });

  it('procesarAprobacionCliente debería hacer un PUT a /clientes/aprobacion/:id', async () => {
    vi.mocked(apiClient.put).mockResolvedValue({ data: {} });
    await procesarAprobacionCliente(1, 'Aprobar', 'Motivo');
    expect(apiClient.put).toHaveBeenCalledWith('/clientes/aprobacion/1', { accion: 'Aprobar', justificacion: 'Motivo' });
  });
});
