import axios from 'axios';

const API_URL = 'http://localhost:3000/api/productos';

export const obtenerProductos = () => axios.get(`${API_URL}/obtener`);
export const eliminarProducto = (id) => axios.delete(`${API_URL}/eliminar/${id}`);
// Agrega estas para el futuro
export const crearProducto = (data) => axios.post(`${API_URL}/crear`, data);
export const actualizarProducto = (id, data) => axios.put(`${API_URL}/actualizar/${id}`, data);