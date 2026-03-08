import axios from "axios";

const API = "http://localhost:3000/api/admins";

export const obtenerAdmins = () => axios.get(`${API}/obtener`);

export const crearAdmin = (data) => axios.post(`${API}/insertar`, data);

export const eliminarAdmin = (id) => axios.delete(`${API}/eliminar/${id}`);

export const actualizarAdmin = (id, data) =>
  axios.put(`${API}/actualizar/${id}`, data);