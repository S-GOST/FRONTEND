import axios from 'axios';

const API_URL = 'http://localhost:3000/api/admins';

/**
 * Función auxiliar para obtener los headers con el token de seguridad.
 * Se debe usar en todas las peticiones que requieran estar logueado.
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('user_token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// --- AUTENTICACIÓN ---

export const loginService = async (usuario: string, contrasena: string) => {
  try {
    const response = await axios.post(`${API_URL}/login`, { usuario, contrasena });
    if (response.data.token) {
      localStorage.setItem('user_token', response.data.token);
      localStorage.setItem('user_name', response.data.nombre);
    }
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const logout = () => {
  localStorage.removeItem('user_token');
  localStorage.removeItem('user_name');
  window.location.href = '/login';
};

// --- MÉTODOS CRUD (ADMINISTRADORES) ---

// 1. Obtener todos los administradores
export const obtenerAdmins = async () => {
  return await axios.get(`${API_URL}/obtener`, getAuthHeaders());
};

// 2. Obtener un administrador por su ID (para editar)
export const obtenerAdminPorId = async (id: string | number) => {
  return await axios.get(`${API_URL}/buscar/${id}`, getAuthHeaders());
};

// 3. Crear un nuevo administrador
export const crearAdmin = async (datosAdmin: any) => {
  return await axios.post(`${API_URL}/insertar`, datosAdmin, getAuthHeaders());
};

// 4. Actualizar un administrador existente
export const actualizarAdmin = async (id: string | number, datosActualizados: any) => {
  return await axios.put(`${API_URL}/actualizar/${id}`, datosActualizados, getAuthHeaders());
};

// 5. Eliminar un administrador
export const eliminarAdmin = async (id: string | number) => {
  return await axios.delete(`${API_URL}/eliminar/${id}`, getAuthHeaders());
};