import { describe, it, expect, vi } from 'vitest';
import { obtenerTiposDocumento } from '../../src/services/tipoDocumento.service';

vi.mock('../../src/services/base.service', () => {
  return {
    BaseApiService: vi.fn().mockImplementation(() => ({
      obtenerTodos: vi.fn().mockResolvedValue({ data: { data: [{ id_tipo_documento: 1, nombre: 'CC' }] } })
    }))
  };
});

describe('tipoDocumento.service', () => {
  it('should call obtenerTodos', async () => {
    const res = await obtenerTiposDocumento();
    expect(res.data.data).toBeDefined();
    expect(res.data.data[0].nombre).toBe('CC');
  });
});
