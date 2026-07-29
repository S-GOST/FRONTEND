import apiClient from '../config/axios';

export interface InformePayload {
  id_orden: number;
  id_tecnico: number;
  diagnostico?: string;
  trabajo_realizado?: string;
  recomendaciones?: string;
}

export interface InformeRecord {
  id_informe: number;
  id_orden: number;
  id_tecnico: number;
  diagnostico?: string;
  trabajo_realizado?: string;
  recomendaciones?: string;
  fecha?: string;
}

export const obtenerInformes = async () => {
  const res = await apiClient.get('/informes/obtener');
  return res.data;
};

export const obtenerInformePorId = async (id: number) => {
  const res = await apiClient.get(`/informes/buscar/${id}`);
  return res.data;
};

export const crearInforme = async (data: InformePayload) => {
  const res = await apiClient.post('/informes/insertar', data);
  return res.data;
};

export const actualizarInforme = async (id: number, data: Partial<InformePayload>) => {
  const res = await apiClient.put(`/informes/actualizar/${id}`, data);
  return res.data;
};

export const eliminarInforme = async (id: number) => {
  const res = await apiClient.delete(`/informes/eliminar/${id}`);
  return res.data;
};

// HU-004.1
export const obtenerMisInformes = async () => {
  const res = await apiClient.get('/informes/mis-informes');
  return res.data;
};

export const generarReporte = async (fecha_inicio: string, fecha_fin: string) => {
  const res = await apiClient.post('/informes/generar-reporte', { fecha_inicio, fecha_fin });
  return res.data;
};
