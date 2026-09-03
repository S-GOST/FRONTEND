import { describe, it, expect } from 'vitest';
import { searchSuggestionsData, servicesData } from '../../src/utils/constants';

describe('constants', () => {
  it('debe contener los datos de servicios correctamente exportados', () => {
    expect(servicesData).toBeDefined();
    expect(servicesData.length).toBeGreaterThan(0);
    expect(servicesData[0]).toHaveProperty('id');
    expect(servicesData[0]).toHaveProperty('name');
    expect(servicesData[0]).toHaveProperty('category');
  });

  it('debe mapear searchSuggestionsData a partir de servicesData correctamente', () => {
    expect(searchSuggestionsData).toBeDefined();
    expect(searchSuggestionsData.length).toEqual(servicesData.length);
    expect(searchSuggestionsData[0].price).toEqual(servicesData[0].price.toFixed(2));
  });
});
