// src/utils/formatIds.ts
export const formatId = (entity: string, id: number | string | null): string => {
  if (!id && id !== 0) return 'N/A';
  const num = Number(id).toString().padStart(4, '0');
  
  const prefixes: Record<string, string> = {
    cliente: 'CLI',
    moto: 'MOTO',
    orden: 'ORD',
    admin: 'ADM',
    tecnico: 'TEC',
    servicio: 'SER',
    producto: 'PRO',
    comprobante: 'COM',
    informe: 'INF',
    historial: 'HIS',
    detalle: 'DET',
    comprobantes: 'COM'
  };

  const prefix = prefixes[entity] || 'ID';
  return `${prefix}-${num}`;
};

// Inverso: extraer el número del ID formateado (útil para enviar al backend)
export const parseId = (formattedId: string): number | null => {
  if (!formattedId || formattedId === 'N/A') return null;
  const parts = formattedId.split('-');
  return parts.length > 1 ? parseInt(parts[1], 10) : null;
};