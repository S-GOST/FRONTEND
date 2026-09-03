import { describe, it, expect } from 'vitest';
import { servicesData, searchSuggestionsData } from '../../src/utils/constants';
describe('Constants - servicesData', () => {
  // 1. CANTIDAD DE SERVICIOS
  it('debería contener exactamente 4 servicios', () => {
    expect(servicesData).toHaveLength(4);
  });

  // 2. ESTRUCTURA COMPLETA DE CADA SERVICIO
  it('cada servicio debería tener todos los campos requeridos', () => {
    servicesData.forEach((service) => {
      expect(service).toHaveProperty('id');
      expect(service).toHaveProperty('name');
      expect(service).toHaveProperty('category');
      expect(service).toHaveProperty('price');
      expect(service).toHaveProperty('description');
      expect(service).toHaveProperty('icon');
    });
  });

  // 3. CAMPOS NO VACÍOS
  it('debería tener IDs, nombres, categorías e iconos no vacíos', () => {
    servicesData.forEach((service) => {
      expect(String(service.id).trim()).not.toBe('');
      expect(service.name.trim()).not.toBe('');
      expect(service.category.trim()).not.toBe('');
      expect(service.icon.trim()).not.toBe('');
      expect(service.description.trim()).not.toBe('');
    });
  });

  // 4. PRECIOS VÁLIDOS
  it('debería tener precios numéricos mayores a 0', () => {
    servicesData.forEach((service) => {
      expect(typeof service.price).toBe('number');
      expect(service.price).toBeGreaterThan(0);
    });
  });

  // 5. IDS ÚNICOS
  it('debería tener IDs únicos sin duplicados', () => {
    const ids = servicesData.map((s) => s.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  // 6. DATOS ESPECÍFICOS CONOCIDOS
  it('debería mantener los valores esperados del primer servicio', () => {
    const first = servicesData[0];
    expect(first.id).toBe('5');
    expect(first.name).toBe('Reparacion por daños');
    expect(first.category).toBe('Reparaciones');
    expect(first.price).toBe(200000.0);
  });
});

describe('Constants - searchSuggestionsData', () => {
  // 7. DERIVADO DE SERVICESDATA
  it('debería tener la misma cantidad de elementos que servicesData', () => {
    expect(searchSuggestionsData).toHaveLength(servicesData.length);
  });

  // 8. MAPEO CORRECTO DE CAMPOS
  it('debería mapear id, name, category e icon desde servicesData', () => {
    servicesData.forEach((service, index) => {
      const suggestion = searchSuggestionsData[index];
      expect(suggestion.id).toBe(service.id);
      expect(suggestion.name).toBe(service.name);
      expect(suggestion.category).toBe(service.category);
      expect(suggestion.icon).toBe(service.icon);
    });
  });

  // 9. PRECIO FORMATEADO COMO STRING CON 2 DECIMALES
  it('debería convertir el precio a string con 2 decimales', () => {
    servicesData.forEach((service, index) => {
      const suggestion = searchSuggestionsData[index];
      expect(typeof suggestion.price).toBe('string');
      expect(suggestion.price).toBe(service.price.toFixed(2));
    });
  });

  // 10. FORMATO DE PRECIO VÁLIDO
  it('debería cumplir el formato numérico con punto decimal', () => {
    searchSuggestionsData.forEach((suggestion) => {
      expect(suggestion.price).toMatch(/^\d+\.\d{2}$/);
    });
  });
});


