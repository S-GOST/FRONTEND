import axios from 'axios';

const API_URL = 'http://localhost:3000/api/admins';

interface LoginResponse {
  token?: string;
  nombre?: string;
}

interface AdminPayload {
  Nombre: string;
  Correo: string;
  TipoDocumento: string;
  Telefono: string;
  usuario: string;
  contrasena?: string;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('user_token');

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const loginService = async (usuario: string, contrasena: string) => {
  const response = await axios.post<LoginResponse>(`${API_URL}/login`, { usuario, contrasena });

  if (response.data.token) {
    localStorage.setItem('user_token', response.data.token);
    localStorage.setItem('user_name', response.data.nombre ?? '');
  }

  return response.data;
};

export const logout = () => {
  localStorage.removeItem('user_token');
  localStorage.removeItem('user_name');
  window.location.href = '/login';
};

export const obtenerAdmins = async () => {
  return await axios.get(`${API_URL}/obtener`, getAuthHeaders());
};

export const obtenerAdminPorId = async (id: string | number) => {
  return await axios.get(`${API_URL}/buscar/${id}`, getAuthHeaders());
};

export const crearAdmin = async (datosAdmin: AdminPayload) => {
  return await axios.post(`${API_URL}/insertar`, datosAdmin, getAuthHeaders());
};

export const actualizarAdmin = async (id: string | number, datosActualizados: AdminPayload) => {
  return await axios.put(`${API_URL}/actualizar/${id}`, datosActualizados, getAuthHeaders());
};

export const eliminarAdmin = async (id: string | number) => {
  return await axios.delete(`${API_URL}/eliminar/${id}`, getAuthHeaders());
};
