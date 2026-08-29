import { Mock } from 'vitest';
import {
  obtenerClientes,
  insertarCliente,
  actualizarCliente,
  eliminarCliente,
  habilitarCliente,
  obtenerClientesPendientes,
  procesarAprobacionCliente,
} from '../../src/services/cliente.service';
import { BaseApiService } from '../../src/services/base.service';

// 1. MOCK DE BaseApiService (vi.fn DENTRO de la fábrica → sin errores de hoisting)
vi.mock('../../src/services/base.service', () => {
  const instance = {
    obtenerTodos: vi.fn(),
    crear: vi.fn(),
    actualizar: vi.fn(),
    eliminar: vi.fn(),
    http: {
      get: vi.fn(),
      put: vi.fn(),
    },
  };
  return {
    __esModule: true,
    BaseApiService: vi.fn(function() { Object.assign(this, instance); return this; }),
  };
});

// Instancia creada por cliente.service al cargarse el módulo
const base = (BaseApiService as unknown as Mock).mock.results[0].value;

// ==================== DATOS DE PRUEBA ====================
const mockCliente = {
  numero_documento: '3001',
  id_usuario: 42,
  id_tipo_documento: 2,
  ciudad: 'Bogotá',
  nombre: 'Cliente Uno',
  usuario: 'cli1',
  correo: 'cli@test.com',
  telefono: '3003334455',
};

describe('cliente.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========== obtenerClientes ==========

  // 1. RETROCOMPATIBILIDAD EN ARRAY DIRECTO
  it('debería agregar ID_CLIENTES, Nombre y Ubicacion cuando data es array', async () => {
    base.obtenerTodos.mockResolvedValue({ data: [mockCliente] });

    const res = await obtenerClientes();

    expect(res.data[0]).toEqual({
      ...mockCliente,
      ID_CLIENTES: 42, // id_usuario tiene prioridad
      Nombre: 'Cliente Uno',
      Ubicacion: 'Bogotá',
    });
  });

  // 2. PRIORIDAD: id_usuario SOBRE numero_documento
  it('debería usar numero_documento solo si no hay id_usuario', async () => {
    const sinIdUsuario = { ...mockCliente, id_usuario: undefined };
    base.obtenerTodos.mockResolvedValue({ data: [sinIdUsuario] });

    const res = await obtenerClientes();

    expect(res.data[0].ID_CLIENTES).toBe('3001');
  });

  // 3. ARRAY ANIDADO EN data.data
  it('debería aplicar retrocompatibilidad en data.data', async () => {
    base.obtenerTodos.mockResolvedValue({ data: { data: [mockCliente] } });

    const res = await obtenerClientes();

    expect(res.data.data[0].ID_CLIENTES).toBe(42);
    expect(res.data.data[0].Nombre).toBe('Cliente Uno');
  });

  // 4. ARRAY ANIDADO EN data.clientes
  it('debería aplicar retrocompatibilidad en data.clientes', async () => {
    base.obtenerTodos.mockResolvedValue({ data: { clientes: [mockCliente] } });

    const res = await obtenerClientes();

    expect(res.data.clientes[0].Ubicacion).toBe('Bogotá');
  });

  // 5. RESPUESTA SIN DATA
  it('debería retornar la respuesta sin modificar si no hay data', async () => {
    base.obtenerTodos.mockResolvedValue({ status: 200 });

    const res = await obtenerClientes();

    expect(res).toEqual({ status: 200 });
  });

  // ========== CRUD básico ==========

  // 6. INSERTAR CLIENTE
  it('debería delegar en crear con el payload', async () => {
    base.crear.mockResolvedValue({ data: { success: true } });

    await insertarCliente(mockCliente);

    expect(base.crear).toHaveBeenCalledWith(mockCliente);
  });

  // 7. ACTUALIZAR CLIENTE
  it('debería delegar en actualizar con ID y payload', async () => {
    base.actualizar.mockResolvedValue({ data: { success: true } });

    await actualizarCliente('3001', { ...mockCliente, nombre: 'Editado' });

    expect(base.actualizar).toHaveBeenCalledWith(
      '3001',
      expect.objectContaining({ nombre: 'Editado' })
    );
  });

  // 8. ELIMINAR CLIENTE
  it('debería delegar en eliminar con el ID', async () => {
    base.eliminar.mockResolvedValue({ data: { success: true } });

    await eliminarCliente('3001');

    expect(base.eliminar).toHaveBeenCalledWith('3001');
  });

  // 9. HABILITAR CLIENTE
  it('debería hacer PUT a /clientes/actualizar/:id con estado Activo', async () => {
    base.http.put.mockResolvedValue({ data: { success: true } });

    await habilitarCliente('3001');

    expect(base.http.put).toHaveBeenCalledWith('/clientes/actualizar/3001', { estado: 'Activo' });
  });

  // ========== Aprobación de clientes (RF-007) ==========

  // 10. CLIENTES PENDIENTES CON MAPEO
  it('debería obtener pendientes y aplicar retrocompatibilidad', async () => {
    base.http.get.mockResolvedValue({ data: { data: [mockCliente] } });

    const res = await obtenerClientesPendientes();

    expect(base.http.get).toHaveBeenCalledWith('/clientes/pendientes');
    expect(res.data.data[0].ID_CLIENTES).toBe(42);
    expect(res.data.data[0].Nombre).toBe('Cliente Uno');
    expect(res.data.data[0].Ubicacion).toBe('Bogotá');
  });

  // 11. PENDIENTES SIN DATA ANIDADA
  it('debería retornar sin modificar si pendientes no tiene data.data', async () => {
    base.http.get.mockResolvedValue({ data: [] });

    const res = await obtenerClientesPendientes();

    expect(res.data).toEqual([]);
  });

  // 12. APROBAR CLIENTE
  it('debería enviar acción Aprobar al endpoint de aprobación', async () => {
    base.http.put.mockResolvedValue({ data: { success: true } });

    await procesarAprobacionCliente('3001', 'Aprobar');

    expect(base.http.put).toHaveBeenCalledWith('/clientes/aprobacion/3001', {
      accion: 'Aprobar',
      justificacion: undefined,
    });
  });

  // 13. RECHAZAR CLIENTE CON JUSTIFICACIÓN
  it('debería enviar acción Rechazar con la justificación', async () => {
    base.http.put.mockResolvedValue({ data: { success: true } });

    await procesarAprobacionCliente('3001', 'Rechazar', 'Documento inválido');

    expect(base.http.put).toHaveBeenCalledWith('/clientes/aprobacion/3001', {
      accion: 'Rechazar',
      justificacion: 'Documento inválido',
    });
  });
});



