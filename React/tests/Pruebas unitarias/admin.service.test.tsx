
import {
  obtenerAdmins,
  insertarAdmin,
  actualizarAdmin,
  eliminarAdmin,
  habilitarAdmin,
} from '../../src/services/admin.service';
import { vi, describe, it, beforeEach, expect } from 'vitest'; // Importar vi

// 1. MOCKS DE LOS MÉTODOS INTERNOS DE BaseApiService (hoisted para que vi.mock los vea)
const { mockObtenerTodos, mockCrear, mockActualizar, mockEliminar, mockPut } = vi.hoisted(() => ({
  mockObtenerTodos: vi.fn(),
  mockCrear: vi.fn(),
  mockActualizar: vi.fn(),
  mockEliminar: vi.fn(),
  mockPut: vi.fn(),
}));

// 2. MOCK DE LA CLASE BaseApiService (misma ruta que usa admin.service)
vi.mock('../../src/services/base.service', () => ({
  BaseApiService: vi.fn(function(this: any) {
    this.obtenerTodos = mockObtenerTodos;
    this.crear = mockCrear;
    this.actualizar = mockActualizar;
    this.eliminar = mockEliminar;
    this.http = { put: mockPut };
  }),
}));

// ==================== DATOS DE PRUEBA ====================
const mockAdmin = {
  numero_documento: '1001',
  id_tipo_documento: '1',
  nombre: 'Admin Uno',
  correo: 'admin@test.com',
  telefono: '3001112233',
  usuario: 'admin1',
};

describe('admin.service', () => {
  beforeEach(() => {
    vi.clearAllMocks(); // ✅ Cambio: jest -> vi
  });

  // ========== obtenerAdmins ==========

  // 1. ARRAY DIRECTO CON RETROCOMPATIBILIDAD
  it('debería agregar ID_ADMINISTRADOR y Nombre cuando data es un array', async () => {
    mockObtenerTodos.mockResolvedValue({ data: [mockAdmin] });

    const res = await obtenerAdmins();

    expect(res.data[0]).toEqual({
      ...mockAdmin,
      ID_ADMINISTRADOR: '1001',
      Nombre: 'Admin Uno',
    });
  });

  // 2. ARRAY ANIDADO EN data.data
  it('debería aplicar retrocompatibilidad cuando el array está en data.data', async () => {
    mockObtenerTodos.mockResolvedValue({ data: { data: [mockAdmin] } });

    const res = await obtenerAdmins();

    expect(res.data.data[0].ID_ADMINISTRADOR).toBe('1001');
    expect(res.data.data[0].Nombre).toBe('Admin Uno');
  });

  // 3. ARRAY ANIDADO EN data.admins
  it('debería aplicar retrocompatibilidad cuando el array está en data.admins', async () => {
    mockObtenerTodos.mockResolvedValue({ data: { admins: [mockAdmin] } });

    const res = await obtenerAdmins();

    expect(res.data.admins[0].ID_ADMINISTRADOR).toBe('1001');
    expect(res.data.admins[0].Nombre).toBe('Admin Uno');
  });

  // 4. RESPUESTA SIN DATA
  it('debería retornar la respuesta sin modificar si no hay data', async () => {
    mockObtenerTodos.mockResolvedValue({ status: 200 });

    const res = await obtenerAdmins();

    expect(res).toEqual({ status: 200 });
  });

  // ========== insertarAdmin ==========

  // 5. CREAR ADMIN
  it('debería llamar a crear con el payload completo', async () => {
    mockCrear.mockResolvedValue({ data: { success: true } });

    await insertarAdmin(mockAdmin);

    expect(mockCrear).toHaveBeenCalledWith(mockAdmin);
  });

  // ========== actualizarAdmin ==========

  // 6. ACTUALIZAR ADMIN
  it('debería llamar a actualizar con el ID y el payload', async () => {
    mockActualizar.mockResolvedValue({ data: { success: true } });

    await actualizarAdmin('1001', { ...mockAdmin, nombre: 'Editado' });

    expect(mockActualizar).toHaveBeenCalledWith(
      '1001',
      expect.objectContaining({ nombre: 'Editado' })
    );
  });

  // ========== eliminarAdmin ==========

  // 7. ELIMINAR ADMIN
  it('debería llamar a eliminar con el ID', async () => {
    mockEliminar.mockResolvedValue({ data: { success: true } });

    await eliminarAdmin('1001');

    expect(mockEliminar).toHaveBeenCalledWith('1001');
  });

  // ========== habilitarAdmin ==========

  // 8. HABILITAR ADMIN
  it('debería hacer PUT a la ruta de actualizar con estado Activo', async () => {
    mockPut.mockResolvedValue({ data: { success: true } });

    await habilitarAdmin('1001');

    expect(mockPut).toHaveBeenCalledWith('/admins/actualizar/1001', { estado: 'Activo' });
  });

  // 9. PROPAGACIÓN DE ERRORES
  it('debería propagar el error si la API falla', async () => {
    mockObtenerTodos.mockRejectedValue(new Error('Error de red'));

    await expect(obtenerAdmins()).rejects.toThrow('Error de red');
  });
});



