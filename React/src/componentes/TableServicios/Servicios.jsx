import { useEffect, useState } from 'react';
import { obtenerServicios, eliminarServicio } from '../../services/serviciosService';
import Swal from 'sweetalert2'; // Para alertas bonitas
import './Servicios.css';

const TableServicios = () => {
    const [servicios, setServicios] = useState([]);
    const [loading, setLoading] = useState(true);

    const cargarServicios = async () => {
        try {
            setLoading(true);
            const response = await obtenerServicios();
            if (response.data && response.data.success) {
                setServicios(response.data.data);
            }
        } catch (error) {
            console.error("Error al cargar servicios", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarServicios();
    }, []);

    const handleEliminar = async (id) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: `Vas a eliminar el servicio ${id}`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                // Asumiendo que tienes esta función en tu servicio
                await eliminarServicio(id); 
                Swal.fire('Eliminado', 'El servicio ha sido borrado.', 'success');
                cargarServicios(); // Recargamos la tabla
            } catch (error) {
                Swal.fire('Error', 'No se pudo eliminar el servicio', 'error');
            }
        }
    };

    const handleEditar = (servicio) => {
        console.log("Editando servicio:", servicio);
        // Aquí podrías abrir un modal o navegar a una ruta de edición
        Swal.fire('Editar', `Abriendo edición para: ${servicio.Nombre}`, 'info');
    };

    return (
        <div className="container-tabla">
            <h2 className="titulo-seccion">Panel de Administración: Servicios</h2>
            <table className="tabla-estilizada">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Categoría</th>
                        <th>Garantía</th>
                        <th>Precio</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr><td colSpan="7">Cargando servicios...</td></tr>
                    ) : (
                        servicios.map((s) => (
                            <tr key={s.ID_SERVICIOS}>
                                <td>{s.ID_SERVICIOS}</td>
                                <td>{s.Nombre}</td>
                                <td>{s.Categoria}</td>
                                <td>{s.Garantia} días</td>
                                <td>${Number(s.Precio).toLocaleString()}</td>
                                <td>
                                    <span className={`badge ${s.Estado === 'Disponible' ? 'bg-success' : 'bg-danger'}`}>
                                        {s.Estado}
                                    </span>
                                </td>
                                <td>
                                    <div className="btn-group">
                                        <button 
                                            className="btn-edit" 
                                            onClick={() => handleEditar(s)}
                                            title="Editar"
                                        >
                                            ✏️
                                        </button>
                                        <button 
                                            className="btn-delete" 
                                            onClick={() => handleEliminar(s.ID_SERVICIOS)}
                                            title="Eliminar"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default TableServicios;