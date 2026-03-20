import axios from 'axios'; // Importa la biblioteca axios para realizar solicitudes HTTP al backend, facilitando la comunicación entre el frontend y el backend para operaciones como autenticación y gestión de datos.

const API_URL = 'http://localhost:3000/api/admins'; //


const getAuthHeaders = () => { // Función que obtiene el token de autenticación almacenado en localStorage y devuelve un objeto con los headers necesarios para incluir el token en las solicitudes protegidas al backend, asegurando que solo los usuarios autenticados puedan acceder a ciertas rutas y realizar operaciones protegidas.
  const token = localStorage.getItem('user_token'); // Obtiene el token de autenticación almacenado en localStorage bajo la clave 'user_token', que se establece al iniciar sesión exitosamente. Este token es necesario para autenticar las solicitudes al backend y acceder a rutas protegidas.
  return {
    headers: {
      Authorization: `Bearer ${token}`, // Devuelve un objeto con los headers de autorización, incluyendo el token en formato Bearer, que es el formato estándar para tokens de autenticación en las solicitudes HTTP. Esto permite que el backend verifique la autenticidad del token y autorice el acceso a las rutas protegidas.
    },
  };
};

// --- AUTENTICACIÓN ---

export const loginService = async (usuario: string, contrasena: string) => { // Función que realiza la solicitud de inicio de sesión al backend, enviando el nombre de usuario y la contraseña. Si el inicio de sesión es exitoso y el backend devuelve un token, este se almacena en localStorage para su uso en futuras solicitudes protegidas. Si ocurre un error durante el proceso de inicio de sesión, se lanza una excepción para que pueda ser manejada por el componente que llama a esta función, como Login.tsx. 
  try {
    const response = await axios.post(`${API_URL}/login`, { usuario, contrasena }); // Realiza una solicitud POST al endpoint de login del backend, enviando el nombre de usuario y la contraseña en el cuerpo de la solicitud. El backend procesará esta información, verificará las credenciales y, si son correctas, devolverá un token de autenticación que se utilizará para acceder a rutas protegidas en el frontend.
    if (response.data.token) { 
      localStorage.setItem('user_token', response.data.token);// Si el backend devuelve un token en la respuesta, este se almacena en localStorage bajo la clave 'user_token' para que pueda ser utilizado en futuras solicitudes protegidas al backend. Esto permite que el usuario permanezca autenticado mientras navega por la aplicación y acceda a rutas protegidas sin tener que iniciar sesión nuevamente.
      localStorage.setItem('user_name', response.data.nombre);// Además del token, también se almacena el nombre del usuario en localStorage bajo la clave 'user_name', lo que puede ser útil para mostrar el nombre del usuario en la interfaz de usuario o para otras funcionalidades relacionadas con el usuario autenticado.
    }
    return response.data;// Devuelve los datos de la respuesta del backend, que pueden incluir información adicional sobre el usuario autenticado o cualquier otro dato relevante que el backend decida enviar junto con el token.
  } catch (error) { 
    throw error;
  }
};

export const logout = () => { // Función que cierra la sesión del usuario eliminando el token de autenticación y el nombre del usuario almacenados en localStorage. Después de eliminar esta información, redirige al usuario a la página de login para que pueda iniciar sesión nuevamente si lo desea. Esta función es útil para permitir a los usuarios cerrar su sesión de manera segura y garantizar que no puedan acceder a rutas protegidas después de cerrar sesión.
  localStorage.removeItem('user_token'); 
  localStorage.removeItem('user_name'); 
  window.location.href = '/login'; 
};

// --- MÉTODOS CRUD (ADMINISTRADORES) ---

// 1. Obtener todos los administradores
export const obtenerAdmins = async () => { // Función que realiza una solicitud GET al backend para obtener la lista de todos los administradores registrados en el sistema. Esta función utiliza el token de autenticación almacenado en localStorage para incluirlo en los headers de la solicitud, asegurando que solo los usuarios autenticados puedan acceder a esta información. Si la solicitud es exitosa, devuelve los datos de los administradores; si ocurre un error, se lanza una excepción para que pueda ser manejada por el componente que llama a esta función, como Admins.tsx.
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
  return await axios.delete(`${API_URL}/eliminar/${id}`, getAuthHeaders()); //
};