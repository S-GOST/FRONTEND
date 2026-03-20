import { Service, SearchSuggestion } from '../types';

export const servicesData: Service[] = [
  // Mantenimiento
  {
    id: 'mantenimiento_preventivo',
    name: 'Mantenimiento Preventivo',
    description: 'Inspecciones programadas y mantenimiento regular para prevenir fallos y optimizar el rendimiento de tu motocicleta.',
    price: 120.00,
    category: 'Mantenimiento',
    icon: 'bi-shield-check'
  },
  {
    id: 'mantenimiento_correctivo',
    name: 'Mantenimiento Correctivo',
    description: 'Reparación de fallas y averías existentes para restaurar la funcionalidad completa de tu motocicleta.',
    price: 200.00,
    category: 'Mantenimiento',
    icon: 'bi-wrench-adjustable'
  },
  {
    id: 'mantenimiento_predictivo',
    name: 'Mantenimiento Predictivo',
    description: 'Monitoreo y análisis avanzado para anticipar fallas y programar intervenciones antes de que ocurran problemas.',
    price: 180.00,
    category: 'Mantenimiento',
    icon: 'bi-graph-up-arrow'
  },
  {
    id: 'mantenimiento_proactivo',
    name: 'Mantenimiento Proactivo',
    description: 'Mejoras continuas y optimización del rendimiento para maximizar la vida útil y el desempeño de tu motocicleta.',
    price: 250.00,
    category: 'Mantenimiento',
    icon: 'bi-lightning-charge'
  },
  // Reparaciones
  {
    id: 'reparaciones_danios',
    name: 'Reparaciones por Daños',
    description: 'Reparación integral de daños estructurales y funcionales causados por accidentes o uso intensivo.',
    price: 350.00,
    category: 'Reparaciones',
    icon: 'bi-tools'
  },
  {
    id: 'motorizacion_transmision',
    name: 'Motorización y Transmisión',
    description: 'Reparación y ajuste de motores, cajas de cambios, embragues y sistemas de transmisión completa.',
    price: 500.00,
    category: 'Reparaciones',
    icon: 'bi-gear'
  },
  {
    id: 'electronica_control',
    name: 'Electrónica y Sistemas de Control',
    description: 'Diagnóstico y reparación de sistemas electrónicos, ECU, inyección electrónica y controles digitales.',
    price: 300.00,
    category: 'Reparaciones',
    icon: 'bi-cpu'
  },
  {
    id: 'carroceria_personalizacion',
    name: 'Carrocería y Personalización',
    description: 'Reparación de carrocería, pintura personalizada y modificaciones estéticas a medida.',
    price: 400.00,
    category: 'Reparaciones',
    icon: 'bi-palette'
  },
  // Diagnósticos
  {
    id: 'diagnostico_emisiones',
    name: 'Diagnóstico de Emisiones y Rendimiento',
    description: 'Análisis de emisiones, consumo de combustible y rendimiento general del motor.',
    price: 150.00,
    category: 'Diagnósticos',
    icon: 'bi-speedometer2'
  },
  {
    id: 'diagnostico_seguridad',
    name: 'Diagnóstico de Seguridad y Dinámica',
    description: 'Evaluación de sistemas de frenos, suspensión, neumáticos y estabilidad dinámica.',
    price: 180.00,
    category: 'Diagnósticos',
    icon: 'bi-shield-check'
  },
  {
    id: 'diagnostico_electrico',
    name: 'Diagnóstico Eléctrico',
    description: 'Comprobación de sistemas eléctricos, batería, alternador y cableado completo.',
    price: 120.00,
    category: 'Diagnósticos',
    icon: 'bi-lightning-charge'
  },
  {
    id: 'diagnostico_mecanico',
    name: 'Diagnóstico Mecánico',
    description: 'Inspección completa de componentes mecánicos, desgastes y ajustes necesarios.',
    price: 160.00,
    category: 'Diagnósticos',
    icon: 'bi-gear-wide'
  },
  // Instalaciones
  {
    id: 'instalacion_personalizada',
    name: 'Instalación Personalizada',
    description: 'Instalación de componentes y accesorios específicos según tus necesidades y preferencias.',
    price: 100.00,
    category: 'Instalaciones',
    icon: 'bi-wrench'
  },
  {
    id: 'instalaciones_seguridad',
    name: 'Instalaciones de Seguridad',
    description: 'Montaje de sistemas de seguridad, alarmas, bloqueadores y dispositivos antitheft.',
    price: 200.00,
    category: 'Instalaciones',
    icon: 'bi-shield-shaded'
  },
  {
    id: 'instalaciones_rendimiento',
    name: 'Instalaciones de Rendimiento',
    description: 'Montaje de componentes para mejorar el rendimiento: escapes, filtros, reprogramaciones.',
    price: 350.00,
    category: 'Instalaciones',
    icon: 'bi-graph-up'
  },
  {
    id: 'accesorios_personalizados',
    name: 'Accesorios Personalizados',
    description: 'Instalación de accesorios estéticos y funcionales para personalizar tu motocicleta.',
    price: 150.00,
    category: 'Instalaciones',
    icon: 'bi-stars'
  }
];

export const searchSuggestionsData: SearchSuggestion[] = servicesData.map(s => ({
  id: s.id,
  name: s.name,
  category: s.category,
  icon: s.icon,
  price: s.price
}));