import { describe, it, expect } from 'vitest';
import { formatId } from '../../src/utils/formatIds';

describe('Utilidad formatId', () => {
  it('debe formatear correctamente el ID de un cliente', () => {
    expect(formatId('cliente', 1)).toBe('CLI-0001');
    expect(formatId('cliente', 150)).toBe('CLI-0150');
  });

  it('debe manejar IDs pasados como texto', () => {
    expect(formatId('orden', '5')).toBe('ORD-0005');
  });

  it('debe usar el prefijo por defecto "ID" si la entidad no está en la lista', () => {
    expect(formatId('desconocido', 99)).toBe('ID-0099');
  });

  it('debe devolver "N/A" si el ID es null o string vacío', () => {
    expect(formatId('moto', null)).toBe('N/A');
    expect(formatId('moto', '')).toBe('N/A');
  });

  it('debe manejar el ID 0 correctamente (no tomarlo como falsy)', () => {
    expect(formatId('tecnico', 0)).toBe('TEC-0000');
  });
});
