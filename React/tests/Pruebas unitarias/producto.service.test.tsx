import { Mock, vi, describe, it, expect, beforeEach } from 'vitest';
import {
  obtenerProductos,
  insertarProducto,
  actualizarProducto,
  eliminarProducto,
  habilitarProducto,
} from '../../src/services/producto.service';
import { BaseApiService } from '../../src/services/base.service';

const mockBaseInstance = {
  obtenerTodos: vi.fn(),
  crear: vi.fn(),
  actualizar: vi.fn(),
  eliminar: vi.fn(),
};

vi.mock('../../src/services/base.service', () => {
  return {
    __esModule: true,
    BaseApiService: vi.fn(() => mockBaseInstance),
  };
});

vi.mock('../../src/config/axios', () => ({
  __esModule: true,
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const base = mockBaseInstance;

describe('producto.service', () => {
  let apiClient: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const axiosModule = await import('../../src/config/axios');
    apiClient = axiosModule.default;
  });

  // 1. OBTENER PRODUCTOS
  it('debería delegar en obtenerTodos del BaseApiService', async () => {
    base.obtenerTodos.mockResolvedValue({ data: [] });
    await obtenerProductos();
    expect(base.obtenerTodos).toHaveBeenCalled();
  });

  // 2. INSERTAR PRODUCTO CON NORMALIZACIÓN
  it('debería normalizar ID_CATEGORIA y precio_venta antes de crear', async () => {
    base.crear.mockResolvedValue({ data: { success: true } });
    const mockPayload = {
      ID_PRODUCTOS: '5',
      ID_CATEGORIA: '30',
      Marca: 'KTM',
      Nombre: 'Aceite Sintético',
      precio_costo: 40000,
      precio_venta: 50000,
      stock: 10,
      stock_minimo: 2, 
      Estado: 'Disponible',
    };
    await insertarProducto(mockPayload as any);
    expect(base.crear).toHaveBeenCalledWith({
      ...mockPayload,
      ID_CATEGORIA: 30,
      precio_costo: 40000,
      precio_venta: 50000,
      stock: 10,
      stock_minimo: 2,
      Precio_Costo: 40000,
      precioCosto: 40000,
      Precio_Venta: 50000,
      Stock: 10,
      Stock_Minimo: 2
    });
  });

  // 3. ACTUALIZAR PRODUCTO CON NORMALIZACIÓN
  it('debería normalizar los datos antes de actualizar', async () => {
    base.actualizar.mockResolvedValue({ data: { success: true } });
    const mockPayload = {
      ID_PRODUCTOS: '5',
      ID_CATEGORIA: '40',
      Marca: 'KTM',
      Nombre: 'Aceite Sintético',
      precio_venta: 75000, 
      precio_costo: 60000, 
      stock: 15, 
      stock_minimo: 3, 
      Estado: 'Disponible',
    };
    await actualizarProducto('5', mockPayload as any);
    expect(base.actualizar).toHaveBeenCalledWith(
      '5',
      expect.objectContaining({
        ID_CATEGORIA: 40,
        precio_venta: 75000,
        Precio_Venta: 75000
      })
    );
  });

  // 4. ELIMINAR PRODUCTO CON ID STRING
  it('debería delegar en eliminar con ID string', async () => {
    base.eliminar.mockResolvedValue({ data: { success: true } });
    await eliminarProducto('PROD-001');
    expect(base.eliminar).toHaveBeenCalledWith('PROD-001');
  });

  // 5. ELIMINAR PRODUCTO CON ID NUMÉRICO
  it('debería aceptar ID numérico en eliminar', async () => {
    base.eliminar.mockResolvedValue({ data: { success: true } });
    await eliminarProducto(123);
    expect(base.eliminar).toHaveBeenCalledWith(123);
  });

  // 6. HABILITAR PRODUCTO
  it('debería hacer PUT a /productos/habilitar/:id', async () => {
    apiClient.put.mockResolvedValue({ data: { success: true } });
    await habilitarProducto('PROD-002');
    expect(apiClient.put).toHaveBeenCalledWith('/productos/habilitar/PROD-002');
  });

  // 7. PROPAGACIÓN DE ERRORES
  it('debería propagar errores desde BaseApiService', async () => {
    base.obtenerTodos.mockRejectedValue(new Error('Error de red'));
    await expect(obtenerProductos()).rejects.toThrow('Error de red');
  });

  // 8. ERROR EN HABILITAR
  it('debería propagar errores desde apiClient.put', async () => {
    apiClient.put.mockRejectedValue(new Error('Sin autorización'));
    await expect(habilitarProducto('PROD-003')).rejects.toThrow('Sin autorización');
  });
});



