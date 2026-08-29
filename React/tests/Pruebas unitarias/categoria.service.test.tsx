import { Mock } from 'vitest';
import {
  obtenerCategorias,
  insertarCategoria,
  actualizarCategoria,
  eliminarCategoria,
  habilitarCategoria,
  obtenerCategoriasPorTipo,
} from '../../src/services/categoria.service';
import { BaseApiService } from '../../src/services/base.service';
import apiClient from '../../src/config/axios';

// 1. MOCK DE BaseApiService (los vi.fn DENTRO de la fábrica para evitar errores de hoisting)
vi.mock('../../src/services/base.service', () => {
  const instance = {
    obtenerTodos: vi.fn(),
    crear: vi.fn(),
    actualizar: vi.fn(),
    eliminar: vi.fn(),
  };
  return {
    __esModule: true,
    BaseApiService: vi.fn(function() { Object.assign(this, instance); return this; }),
  };
});

// 2. MOCK DEL CLIENTE AXIOS
vi.mock('../../src/config/axios', () => ({
  __esModule: true,
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// Instancia creada por categoria.service al cargarse el módulo
const base = (BaseApiService as unknown as Mock).mock.results[0].value;

describe('categoria.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. OBTENER CATEGORÍAS
  it('debería delegar en obtenerTodos del BaseApiService', async () => {
    base.obtenerTodos.mockResolvedValue({ data: [] });

    await obtenerCategorias();

    expect(base.obtenerTodos).toHaveBeenCalled();
  });

  // 2. INSERTAR CATEGORÍA
  it('debería delegar en crear con el payload', async () => {
    base.crear.mockResolvedValue({ data: { success: true } });
    const payload = { nombre: 'Repuestos', tipo: 'PRODUCTO' };

    await insertarCategoria(payload);

    expect(base.crear).toHaveBeenCalledWith(payload);
  });

  // 3. ACTUALIZAR CATEGORÍA
  it('debería delegar en actualizar con el ID y el payload', async () => {
    base.actualizar.mockResolvedValue({ data: { success: true } });

    await actualizarCategoria(3, { nombre: 'Editado' });

    expect(base.actualizar).toHaveBeenCalledWith(
      3,
      expect.objectContaining({ nombre: 'Editado' })
    );
  });

  // 4. ELIMINAR SIN FORCE
  it('debería eliminar con la ruta básica sin force', async () => {
    (apiClient.delete as Mock).mockResolvedValue({ data: {} });

    await eliminarCategoria(5);

    expect(apiClient.delete).toHaveBeenCalledWith('/categorias/eliminar/5');
  });

  // 5. ELIMINAR CON FORCE
  it('debería agregar ?force=true cuando force es verdadero', async () => {
    (apiClient.delete as Mock).mockResolvedValue({ data: {} });

    await eliminarCategoria(5, true);

    expect(apiClient.delete).toHaveBeenCalledWith('/categorias/eliminar/5?force=true');
  });

  // 6. HABILITAR CATEGORÍA
  it('debería hacer PUT a /categorias/habilitar/:id', async () => {
    (apiClient.put as Mock).mockResolvedValue({ data: {} });

    await habilitarCategoria(7);

    expect(apiClient.put).toHaveBeenCalledWith('/categorias/habilitar/7');
  });

  // 7. CATEGORÍAS POR TIPO PRODUCTO
  it('debería consultar las categorías de tipo PRODUCTO', async () => {
    (apiClient.get as Mock).mockResolvedValue({ data: [] });

    await obtenerCategoriasPorTipo('PRODUCTO');

    expect(apiClient.get).toHaveBeenCalledWith('/categorias/tipo/PRODUCTO');
  });

  // 8. CATEGORÍAS POR TIPO SERVICIO
  it('debería consultar las categorías de tipo SERVICIO', async () => {
    (apiClient.get as Mock).mockResolvedValue({ data: [] });

    await obtenerCategoriasPorTipo('SERVICIO');

    expect(apiClient.get).toHaveBeenCalledWith('/categorias/tipo/SERVICIO');
  });
});



