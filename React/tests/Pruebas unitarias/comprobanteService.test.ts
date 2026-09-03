import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  obtenerComprobantes, 
  generarComprobante, 
  obtenerMisComprobantes, 
  pagarComprobante 
} from '../../src/services/comprobanteService';
import { apiClient } from '../../src/config/axios';

vi.mock('../../src/config/axios', () => {
  const mockClient = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  };
  return {
    apiClient: mockClient,
    default: mockClient
  };
});

describe('comprobanteService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('obtenerComprobantes debería hacer un GET a /comprobantes/obtener', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [] });
    await obtenerComprobantes();
    expect(apiClient.get).toHaveBeenCalledWith('/comprobantes/obtener');
  });

  it('generarComprobante debería hacer un POST a /comprobantes/generar/:idInforme', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { success: true } });
    const res = await generarComprobante(1, 'Efectivo');
    expect(apiClient.post).toHaveBeenCalledWith('/comprobantes/generar/1', { metodo_pago: 'Efectivo' });
    expect(res.success).toBe(true);
  });

  it('obtenerMisComprobantes debería hacer un GET a /comprobantes/mis-comprobantes', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { data: [] } });
    const res = await obtenerMisComprobantes();
    expect(apiClient.get).toHaveBeenCalledWith('/comprobantes/mis-comprobantes');
    expect(res.data).toBeDefined();
  });

  it('pagarComprobante debería hacer un PUT a /comprobantes/pagar/:id', async () => {
    vi.mocked(apiClient.put).mockResolvedValue({ data: { success: true } });
    const res = await pagarComprobante(1, 'Tarjeta');
    expect(apiClient.put).toHaveBeenCalledWith('/comprobantes/pagar/1', { metodo_pago: 'Tarjeta' });
    expect(res.success).toBe(true);
  });
});
