import { useEffect, useState } from "react"; 
import { useNavigate } from "react-router-dom"; 
// Asegúrate de que la ruta a tu archivo de servicios sea correcta
import { obtenerServicios, eliminarServicio } from "../../services/servicioService"; 
import "./Servicios.css"; 

function Servicios() {
  const navigate = useNavigate();
  
  // En JS no definimos interfaces, solo inicializamos el estado
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);

  const cerrarSesion = () => {
    localStorage.removeItem("token"); 
    navigate("/login");
  };

  useEffect(() => {
    cargarServicios();
  }, []);

  const cargarServicios = async () => {
    try {
      setLoading(true);
      const res = await obtenerServicios();
      
      // Verificamos si la respuesta trae datos exitosos
      if (res.data && res.data.success) {
        setServicios(res.data.data);
      } else {
        setServicios([]);
      }
    } catch (error) {
      console.error("Error al obtener servicios:", error);
      setServicios([]);
    } finally {
      setLoading(false);
    }
  };

  const borrarServicio = async (ser) => { 
    if (window.confirm(`¿Estás seguro de eliminar el servicio: ${ser.Nombre}?`)) {
      try {
        await eliminarServicio(ser.ID_SERVICIO);
        // Filtramos la lista para quitar el elemento borrado sin recargar
        setServicios(servicios.filter(s => s.ID_SERVICIO !== ser.ID_SERVICIO));
      } catch (error) {
        console.error("Error al eliminar:", error);
        alert("No se pudo eliminar el servicio.");
      }
    }
  };

  return (
    <div className="container">
      <div className="header-admin">
        <button className="btn-logout" onClick={cerrarSesion}>
          Cerrar Sesión
        </button>
      </div>

      <div className="admin-section">
        <h1 className="admin-title">Gestión de Servicios</h1>
        
        <table className="table-ktm">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Precio</th>
              <th>Duración</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="loading-row">Cargando servicios...</td>
              </tr>
            ) : servicios.length > 0 ? (
              servicios.map((serv) => (
                <tr key={serv.ID_SERVICIO}>
                  <td>{serv.ID_SERVICIO}</td>
                  <td>{serv.Nombre}</td>
                  <td>{serv.Descripcion}</td>
                  <td>${Number(serv.Precio).toLocaleString()}</td>
                  <td>{serv.Duracion}</td>
                  <td>
                    <button 
                      className="btn-eliminar-ktm" 
                      onClick={() => borrarServicio(serv)}
                      title="Eliminar"
                    >
                      <i className="bi bi-trash3"></i> Eliminar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="loading-row">No hay servicios registrados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Servicios;