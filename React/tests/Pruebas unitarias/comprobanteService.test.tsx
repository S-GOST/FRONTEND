import { Mock, vi, describe, it, beforeEach, expect } from 'vitest';
import {
  obtenerComprobantes,
  generarComprobante,
  obtenerMisComprobantes,
  pagarComprobante,
} from '../../src/services/comprobanteService';
import { BaseApiService } from '../../src/services/base.service';

// MOCK CORREGIDO: Usamos una función constructora simple sin llamadas a vi.fn() dentro
vi.mock('../../src/services/base.service', () => {
  // Creamos un objeto mock con métodos vacíos
  const mockInstance = {
    obtenerTodos: vi.fn(),
    crear: vi.fn(),
    actualizar: vi.fn(),
    eliminar: vi.fn(),
  };

  return {
    __esModule: true,
    // Devolvemos una clase mock que devuelve nuestro objeto mock
    BaseApiService: class {
      constructor() {
        // Asignamos los métodos mockeados a la instancia
        Object.assign(this, mockInstance);
      }
    },
  };
});

// Mock de axios para las funciones que no usan BaseApiService directamente
vi.mock('../../src/config/axios', () => ({
  __esModule: true,
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('comprobanteService', () => {
  let baseInstance: any;
  let apiClient: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Obtenemos la instancia mockeada correctamente
    const mockResults = (BaseApiService as Mock).mock.results;
    if (mockResults.length > 0) {
      baseInstance = mockResults[0].value;
    } else {
      // Fallback si no se ha instanciado aún
      baseInstance = new (BaseApiService as any)();
    }

    const axiosModule = await import('../../src/config/axios');
    apiClient = axiosModule.default;
  });

  // 1. LISTAR TODOS LOS COMPROBANTES
  it('debería delegar en obtenerTodos del BaseApiService', async () => {
    baseInstance.obtenerTodos.mockResolvedValue({ data: [] });
    await obtenerComprobantes();
    expect(baseInstance.obtenerTodos).toHaveBeenCalled();
  });

  // 2. GENERAR CON MÉTODO DE PAGO
  it('debería generar un comprobante con método de pago especificado', async () => {
    apiClient.post.mockResolvedValue({ data: { id_comprobante: 5, estado: 'Pagado' } });
    const result = await generarComprobante(3, 'Nequi');
    
    expect(apiClient.post).toHaveBeenCalledWith('/comprobantes/generar/3', { metodo_pago: 'Nequi' });
    expect(result).toEqual({ id_comprobante: 5, estado: 'Pagado' });
  });

  // 3. GENERAR SIN MÉTODO DE PAGO
  it('debería generar sin método de pago si no se especifica', async () => {
    apiClient.post.mockResolvedValue({ data: { id_comprobante: 6 } });
    await generarComprobante(4);
    
    expect(apiClient.post).toHaveBeenCalledWith('/comprobantes/generar/4', { metodo_pago: undefined });
  });

  // 4. OBTENER MIS COMPROBANTES (CLIENTE)
  it('debería obtener los comprobantes del cliente autenticado', async () => {
    apiClient.get.mockResolvedValue({ data: [{ id_orden: 10, total_pagar: 250000 }] });
    const result = await obtenerMisComprobantes();
    
    expect(apiClient.get).toHaveBeenCalledWith('/comprobantes/mis-comprobantes');
    expect(result).toEqual([{ id_orden: 10, total_pagar: 250000 }]);
  });

  // 5. PAGAR CON MÉTODO ESPECÍFICO
  it('debería marcar como pagado con el método seleccionado', async () => {
    apiClient.put.mockResolvedValue({ data: { success: true } });
    await pagarComprobante(7, 'Daviplata');
    
    expect(apiClient.put).toHaveBeenCalledWith('/comprobantes/pagar/7', { metodo_pago: 'Daviplata' });
  });

  // 6. PAGAR SIN MÉTODO
  it('debería permitir pagar sin especificar método', async () => {
    apiClient.put.mockResolvedValue({ data: { success: true } });
    await pagarComprobante(8);
    
    expect(apiClient.put).toHaveBeenCalledWith('/comprobantes/pagar/8', { metodo_pago: undefined });
  });

  // 7. ID COMO STRING
  it('debería aceptar ID como string en pagar', async () => {
    apiClient.put.mockResolvedValue({ data: { success: true } });
    await pagarComprobante('COMP-001', 'Tarjeta');
    
    expect(apiClient.put).toHaveBeenCalledWith('/comprobantes/pagar/COMP-001', { metodo_pago: 'Tarjeta' });
  });
});