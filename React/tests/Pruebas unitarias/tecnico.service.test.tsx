import {
  obtenerTecnicos,
  insertarTecnico,
  actualizarTecnico,
  eliminarTecnico,
  habilitarTecnico,
} from '../../src/services/tecnico.service';
import { BaseApiService } from '../../src/services/base.service';

// 1. MOCK DE BaseApiService (jest.fn DENTRO de la fábrica)
jest.mock('../../src/services/base.service', () => {
  const instance = {
    obtenerTodos: jest.fn(),
    crear: jest.fn(),
    actualizar: jest.fn(),
    eliminar: jest.fn(),
    http: {
      put: jest.fn(),
    },
  };
  return {
    __esModule: true,
    BaseApiService: jest.fn(() => instance),
  };
});

// Instancia creada por tecnicoService al cargarse el módulo
const base = (BaseApiService as unknown as jest.Mock).mock.results[0].value;

// ==================== DATOS DE PRUEBA ====================
const mockTecnico = {
  numero_documento: '5001',
  id_usuario: 42,
  id_tipo_documento: 2,
  nombre: 'Carlos Ruiz',
  usuario: 'carlosr',
  correo: 'carlos@test.com',
  telefono: '3005556677',
};

describe('tecnico.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ========== obtenerTecnicos ==========

  // 1. RETROCOMPATIBILIDAD EN ARRAY DIRECTO
  it('debería agregar ID_TECNICOS y Nombre cuando data es array', async () => {
    base.obtenerTodos.mockResolvedValue({ data: [mockTecnico] });

    const res = await obtenerTecnicos();

    expect(res.data[0]).toEqual({
      ...mockTecnico,
      ID_TECNICOS: '42', // id_usuario tiene prioridad
      Nombre: 'Carlos Ruiz',
    });
  });

  // 2. PRIORIDAD: id_usuario SOBRE numero_documento
  it('debería usar numero_documento solo si no hay id_usuario', async () => {
    const sinIdUsuario = { ...mockTecnico, id_usuario: undefined };
    base.obtenerTodos.mockResolvedValue({ data: [sinIdUsuario] });

    const res = await obtenerTecnicos();

    expect(res.data[0].ID_TECNICOS).toBe('5001');
  });

  // 3. ARRAY ANIDADO EN data.data
  it('debería aplicar retrocompatibilidad en data.data', async () => {
    base.obtenerTodos.mockResolvedValue({ data: { data: [mockTecnico] } });

    const res = await obtenerTecnicos();

    expect(res.data.data[0].ID_TECNICOS).toBe('42');
    expect(res.data.data[0].Nombre).toBe('Carlos Ruiz');
  });

  // 4. ARRAY ANIDADO EN data.tecnicos
  it('debería aplicar retrocompatibilidad en data.tecnicos', async () => {
    base.obtenerTodos.mockResolvedValue({ data: { tecnicos: [mockTecnico] } });

    const res = await obtenerTecnicos();

    expect(res.data.tecnicos[0].Nombre).toBe('Carlos Ruiz');
  });

  // 5. RESPUESTA SIN DATA
  it('debería retornar la respuesta sin modificar si no hay data', async () => {
    base.obtenerTodos.mockResolvedValue({ status: 200 });

    const res = await obtenerTecnicos();

    expect(res).toEqual({ status: 200 });
  });

  // ========== CRUD básico ==========

  // 6. INSERTAR TÉCNICO
  it('debería delegar en crear con el payload', async () => {
    base.crear.mockResolvedValue({ data: { success: true } });

    await insertarTecnico(mockTecnico);

    expect(base.crear).toHaveBeenCalledWith(mockTecnico);
  });

  // 7. ACTUALIZAR TÉCNICO
  it('debería delegar en actualizar con ID y payload', async () => {
    base.actualizar.mockResolvedValue({ data: { success: true } });

    await actualizarTecnico('5001', { ...mockTecnico, nombre: 'Editado' });

    expect(base.actualizar).toHaveBeenCalledWith(
      '5001',
      expect.objectContaining({ nombre: 'Editado' })
    );
  });

  // 8. ELIMINAR TÉCNICO
  it('debería delegar en eliminar con el ID', async () => {
    base.eliminar.mockResolvedValue({ data: { success: true } });

    await eliminarTecnico('5001');

    expect(base.eliminar).toHaveBeenCalledWith('5001');
  });

  // 9. HABILITAR TÉCNICO
  it('debería hacer PUT a /tecnicos/actualizar/:id con estado Activo', async () => {
    base.http.put.mockResolvedValue({ data: { success: true } });

    await habilitarTecnico('5001');

    expect(base.http.put).toHaveBeenCalledWith('/tecnicos/actualizar/5001', { estado: 'Activo' });
  });

  // 10. PROPAGACIÓN DE ERRORES
  it('debería propagar errores desde BaseApiService', async () => {
    base.obtenerTodos.mockRejectedValue(new Error('Error de red'));

    await expect(obtenerTecnicos()).rejects.toThrow('Error de red');
  });
});