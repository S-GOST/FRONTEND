import { useEffect, useState } from "react";
import { obtenerAdmins, eliminarAdmin } from "../services/adminsServices";
// Asegúrate de que este archivo contenga el CSS que me diste
import "./admins.css";

function Admins() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarAdmins();
  }, []);

  const cargarAdmins = async () => {
    try {
      setLoading(true);
      const res = await obtenerAdmins();
      // Accedemos a res.data (Axios) y luego a .data (estructura de tu controlador)
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

  const borrarAdmin = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este administrador?")) {
      try {
        await eliminarAdmin(id);
        // Recargar la lista después de eliminar
        cargarAdmins();
      } catch (error) {
        console.error("Error al eliminar:", error);
        alert("Ocurrió un error al eliminar el administrador.");
      }
    }
  };

  return (
    <div className="container">
      <div className="admin-section">
        <h1 className="admin-title">Administradores</h1>

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
                {admins && admins.length > 0 ? (
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
                          onClick={() => borrarAdmin(admin.ID_ADMINISTRADOR)}
                        >
                          <i className="bi bi-trash3"></i> Eliminar
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="loading-row">No hay administradores registrados.</td>
                  </tr>
                )}
              </tbody>
          </table>
        </div>
    </div>
  );
}

export default Admins;