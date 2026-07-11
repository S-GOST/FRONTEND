import { Service, SearchSuggestion } from '../types';

export const servicesData: Service[] = [
  {
    id: '5',
    name: 'Reparacion por daños',
    category: 'Reparaciones',
    price: 200000.00,
    description: 'Reparación integral de daños estructurales y funcionales causados por accidentes o uso intensivo.',
    icon: 'bi-tools',
  },
  {
    id: '6',
    name: 'Mantenimiento preventivo',
    category: 'Mantenimiento',
    price: 212000.00,
    description: 'Inspecciones programadas y mantenimiento regular para prevenir fallos y optimizar el rendimiento.',
    icon: 'bi-shield-check',
  },
  {
    id: '7',
    name: 'Instalaciones de accesorios',
    category: 'Instalaciones',
    price: 300000.00,
    description: 'Instalación de accesorios estéticos y funcionales para personalizar tu motocicleta.',
    icon: 'bi-wrench',
  },
  {
    id: '8',
    name: 'Diagnosticos motor',
    category: 'Diagnósticos',
    price: 600000.00,
    description: 'Análisis y diagnóstico avanzado de motores para encontrar problemas de rendimiento y emisiones.',
    icon: 'bi-speedometer2',
  }
];

export const searchSuggestionsData: SearchSuggestion[] = servicesData.map(service => ({
  id: service.id,
  name: service.name,
  category: service.category,
  icon: service.icon,
  price: service.price.toFixed(2),
}));