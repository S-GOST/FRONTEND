import { describe, it, expect } from 'vitest';
import { extractArray } from '../../src/utils/apiHelpers';

describe('apiHelpers', () => {
  describe('extractArray', () => {
    it('debería retornar el array directamente si el input es un array', () => {
      const input = [1, 2, 3];
      expect(extractArray(input)).toEqual([1, 2, 3]);
    });

    it('debería extraer un array desde la propiedad "data"', () => {
      const input = { data: [{ id: 1 }, { id: 2 }] };
      expect(extractArray(input)).toEqual([{ id: 1 }, { id: 2 }]);
    });

    it('debería extraer el primer array que encuentre si no hay propiedad "data"', () => {
      const input = { 
        status: 200, 
        message: 'ok', 
        clientes: [{ id: 1 }], 
        config: {} 
      };
      expect(extractArray(input)).toEqual([{ id: 1 }]);
    });

    it('debería retornar array vacío si el objeto no tiene arrays', () => {
      const input = { data: 'not an array', value: 42 };
      expect(extractArray(input)).toEqual([]);
    });

    it('debería retornar array vacío si el input es null o indefinido', () => {
      expect(extractArray(null)).toEqual([]);
      expect(extractArray(undefined)).toEqual([]);
    });

    it('debería retornar array vacío si el input es un string', () => {
      expect(extractArray('string')).toEqual([]);
    });
  });
});
