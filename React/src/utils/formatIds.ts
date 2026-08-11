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
