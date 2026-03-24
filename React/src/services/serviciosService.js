import axios from 'axios';

const API_URL = 'http://localhost:3000/api/servicios';

export const obtenerServicios = () => axios.get(`${API_URL}/obtener`);
export const eliminarServicio = (id) => axios.delete(`${API_URL}/eliminar/${id}`);