import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  obtenerCategorias, 
  insertarCategoria, 
  actualizarCategoria, 
  eliminarCategoria,
  habilitarCategoria,
  obtenerCategoriasPorTipo
} from '../../src/services/categoria.service';
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

describe('categoria.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('obtenerCategorias debería hacer un GET a /categorias', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [] });
    await obtenerCategorias();
    expect(apiClient.get).toHaveBeenCalledWith('/categorias');
  });

  it('insertarCategoria debería hacer un POST a /categorias/insertar', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: {} });
    const payload = { nombre: 'Test', tipo: 'PRODUCTO' };
    await insertarCategoria(payload);
    expect(apiClient.post).toHaveBeenCalledWith('/categorias/insertar', payload);
  });

  it('actualizarCategoria debería hacer un PUT a /categorias/actualizar/:id', async () => {
    vi.mocked(apiClient.put).mockResolvedValue({ data: {} });
    const payload = { nombre: 'Test', tipo: 'PRODUCTO' };
    await actualizarCategoria(1, payload);
    expect(apiClient.put).toHaveBeenCalledWith('/categorias/actualizar/1', payload);
  });

  it('eliminarCategoria debería hacer un DELETE a /categorias/eliminar/:id', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({ data: {} });
    await eliminarCategoria(1);
    expect(apiClient.delete).toHaveBeenCalledWith('/categorias/eliminar/1');
  });

  it('eliminarCategoria debería hacer un DELETE con parámetro force=true si se indica', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({ data: {} });
    await eliminarCategoria(1, true);
    expect(apiClient.delete).toHaveBeenCalledWith('/categorias/eliminar/1?force=true');
  });

  it('habilitarCategoria debería hacer un PUT a /categorias/habilitar/:id', async () => {
    vi.mocked(apiClient.put).mockResolvedValue({ data: {} });
    await habilitarCategoria(1);
    expect(apiClient.put).toHaveBeenCalledWith('/categorias/habilitar/1');
  });

  it('obtenerCategoriasPorTipo debería hacer un GET a /categorias/tipo/:tipo', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [] });
    await obtenerCategoriasPorTipo('PRODUCTO');
    expect(apiClient.get).toHaveBeenCalledWith('/categorias/tipo/PRODUCTO');
  });
});
