import { useEffect, useState } from "react";
import { obtenerAdmins, eliminarAdmin } from "../../services/authService";
import "./Admin.css";

// 1. La interfaz se queda fuera, está perfecta ahí.
interface Administrador {
  ID_ADMINISTRADOR: number;
  Nombre: string;
  Correo: string;
  TipoDocumento: string;
  Telefono: string;
  usuario: string;
}

function Admins() {
  const [admins, setAdmins] = useState<Administrador[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    cargarAdmins();
  }, []);

  const cargarAdmins = async () => {
    try {
      setLoading(true);
      const res = await obtenerAdmins();
      
      if (res.data && res.data.success) {
        setAdmins(res.data.data);
      } else {
        setAdmins([]);
      }
    } catch (error) {
      console.error("Error al obtener admins:", error);
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  };

  const borrarAdmin = async (admin: Administrador) => { 
    if (window.confirm(`¿Estás seguro de eliminar a ${admin.Nombre}?`)) {
      try {
        await eliminarAdmin(admin.ID_ADMINISTRADOR);
        setAdmins(prevAdmins => prevAdmins.filter(a => a.ID_ADMINISTRADOR !== admin.ID_ADMINISTRADOR));
      } catch (error) {
        console.error("Error al eliminar:", error);
        alert("Ocurrió un error al eliminar el administrador.");
      }
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-section">
        <h1 className="admin-title">Panel de Administración</h1>
        
        <table className="table-ktm">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Documento</th>
              <th>Teléfono</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="loading-row">Cargando datos...</td>
              </tr>
            ) : admins.length > 0 ? (
              admins.map((admin) => (
                <tr key={admin.ID_ADMINISTRADOR}>
                  <td>{admin.ID_ADMINISTRADOR}</td>
                  <td>{admin.Nombre}</td>
                  <td>{admin.Correo}</td>
                  <td>{admin.TipoDocumento}</td>
                  <td>{admin.Telefono}</td>
                  <td>
                    <button 
                      className="btn-eliminar-ktm" 
                      onClick={() => borrarAdmin(admin)}
                      title="Eliminar Administrador"
                    >
                      <i className="bi bi-trash3"></i> Eliminar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="loading-row">No hay administradores registrados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Admins;
