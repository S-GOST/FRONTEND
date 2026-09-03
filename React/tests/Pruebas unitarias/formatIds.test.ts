import { describe, it, expect } from 'vitest';
import { formatId } from '../../src/utils/formatIds';

describe('formatId', () => {
  it('should return N/A if id is null or empty', () => {
    expect(formatId('cliente', null)).toBe('N/A');
    expect(formatId('cliente', undefined as any)).toBe('N/A');
    expect(formatId('cliente', '')).toBe('N/A');
  });

  it('should handle id 0 correctly', () => {
    expect(formatId('cliente', 0)).toBe('CLI-0000');
  });

  it('should format correctly for known entities', () => {
    expect(formatId('cliente', 1)).toBe('CLI-0001');
    expect(formatId('moto', 12)).toBe('MOTO-0012');
    expect(formatId('orden', 123)).toBe('ORD-0123');
    expect(formatId('admin', 1234)).toBe('ADM-1234');
    expect(formatId('tecnico', 5)).toBe('TEC-0005');
  });

  it('should use default prefix ID for unknown entities', () => {
    expect(formatId('unknown', 42)).toBe('ID-0042');
  });
});
