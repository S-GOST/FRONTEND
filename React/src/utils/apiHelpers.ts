/**
 * Extrae un array de objetos desde diferentes formatos de respuesta del backend.
 * Útil porque el backend a veces retorna { data: [...] }, { nombreEntidad: [...] }, o directamente [...].
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const extractArray = <T = any>(payload: unknown): T[] => {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    // Busca la propiedad 'data'
    if (Array.isArray(obj.data)) return obj.data as T[];
    // Busca cualquier otra propiedad que sea un array en el primer nivel
    const firstArrayValue = Object.values(obj).find(val => Array.isArray(val));
    if (firstArrayValue) return firstArrayValue as T[];
  }
  return [];
};
