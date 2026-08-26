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

// RF-0036
export const obtenerReporteProductividad = async (fecha_inicio: string, fecha_fin: string) => {
  const res = await apiClient.get(`/informes/productividad?fecha_inicio=${fecha_inicio}&fecha_fin=${fecha_fin}`);
  return res.data;
};

// RF-0035
export const obtenerReporteInventario = async (fecha_inicio?: string, fecha_fin?: string, categoria?: string) => {
  const params = new URLSearchParams();
  if (fecha_inicio) params.append('fecha_inicio', fecha_inicio);
  if (fecha_fin) params.append('fecha_fin', fecha_fin);
  if (categoria) params.append('categoria', categoria);
  const res = await apiClient.get(`/informes/inventario?${params.toString()}`);
  return res.data;
};
