import { describe, it, expect, vi } from 'vitest';
import {
  obtenerTecnicos,
  insertarTecnico,
  actualizarTecnico,
  eliminarTecnico,
  habilitarTecnico,
  TecnicoPayload
} from '../../src/services/tecnico.service';

vi.mock('../../src/services/base.service', () => {
  return {
    BaseApiService: vi.fn().mockImplementation(() => ({
      obtenerTodos: vi.fn().mockResolvedValue({ data: { data: [{ numero_documento: '1', nombre: 'T1' }] } }),
      crear: vi.fn().mockResolvedValue({ data: {} }),
      actualizar: vi.fn().mockResolvedValue({ data: {} }),
      eliminar: vi.fn().mockResolvedValue({ data: {} }),
      http: {
        put: vi.fn().mockResolvedValue({ data: {} })
      }
    }))
  };
});

describe('tecnico.service', () => {
  const mockPayload: TecnicoPayload = {
    numero_documento: '1',
    id_tipo_documento: 1,
    nombre: 'Tecnico',
    correo: 't@t.com',
    telefono: '123',
    usuario: 't1'
  };

  it('should call obtenerTodos and add compatibility', async () => {
    const res = await obtenerTecnicos();
    expect(res.data.data[0]).toHaveProperty('ID_TECNICOS');
  });

  it('should call crear', async () => {
    const res = await insertarTecnico(mockPayload);
    expect(res.data).toBeDefined();
  });

  it('should call actualizar', async () => {
    const res = await actualizarTecnico('1', mockPayload);
    expect(res.data).toBeDefined();
  });

  it('should call eliminar', async () => {
    const res = await eliminarTecnico('1');
    expect(res.data).toBeDefined();
  });

  it('should call habilitar (http.put)', async () => {
    const res = await habilitarTecnico('1');
    expect(res.data).toBeDefined();
  });
});
