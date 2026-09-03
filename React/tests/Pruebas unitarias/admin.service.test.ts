import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  obtenerAdmins, 
  insertarAdmin, 
  actualizarAdmin, 
  eliminarAdmin,
  habilitarAdmin
} from '../../src/services/admin.service';
import { apiClient } from '../../src/config/axios';

vi.mock('../../src/config/axios', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  }
}));

describe('admin.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('obtenerAdmins debería hacer un GET a /admins y añadir compatibilidad si es un array', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [{ numero_documento: '123', nombre: 'Test' }] });
    const res = await obtenerAdmins();
    
    expect(apiClient.get).toHaveBeenCalledWith('/admins');
    expect(res.data[0].ID_ADMINISTRADOR).toBe('123');
    expect(res.data[0].Nombre).toBe('Test');
  });

  it('obtenerAdmins debería hacer un GET a /admins y añadir compatibilidad si es data.data', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { data: [{ numero_documento: '123', nombre: 'Test' }] } });
    const res = await obtenerAdmins();
    
    expect(apiClient.get).toHaveBeenCalledWith('/admins');
    expect(res.data.data[0].ID_ADMINISTRADOR).toBe('123');
    expect(res.data.data[0].Nombre).toBe('Test');
  });

  it('obtenerAdmins debería hacer un GET a /admins y añadir compatibilidad si es data.admins', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { admins: [{ numero_documento: '123', nombre: 'Test' }] } });
    const res = await obtenerAdmins();
    
    expect(apiClient.get).toHaveBeenCalledWith('/admins');
    expect(res.data.admins[0].ID_ADMINISTRADOR).toBe('123');
    expect(res.data.admins[0].Nombre).toBe('Test');
  });

  it('insertarAdmin debería hacer un POST a /admins/insertar', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: {} });
    const payload = { numero_documento: '123', id_tipo_documento: 1, nombre: 'Admin', correo: 'a@a.com', telefono: '123', usuario: 'admin', password: '123' };
    await insertarAdmin(payload);
    expect(apiClient.post).toHaveBeenCalledWith('/admins/insertar', payload);
  });

  it('actualizarAdmin debería hacer un PUT a /admins/actualizar/:id', async () => {
    vi.mocked(apiClient.put).mockResolvedValue({ data: {} });
    const payload = { numero_documento: '123', id_tipo_documento: 1, nombre: 'Admin', correo: 'a@a.com', telefono: '123', usuario: 'admin' };
    await actualizarAdmin(1, payload);
    expect(apiClient.put).toHaveBeenCalledWith('/admins/actualizar/1', payload);
  });

  it('eliminarAdmin debería hacer un DELETE a /admins/eliminar/:id', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({ data: {} });
    await eliminarAdmin(1);
    expect(apiClient.delete).toHaveBeenCalledWith('/admins/eliminar/1');
  });

  it('habilitarAdmin debería hacer un PUT a /admins/actualizar/:id con estado Activo', async () => {
    vi.mocked(apiClient.put).mockResolvedValue({ data: {} });
    await habilitarAdmin(1);
    expect(apiClient.put).toHaveBeenCalledWith('/admins/actualizar/1', { estado: 'Activo' });
  });
});
