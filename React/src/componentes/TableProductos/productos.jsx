import { useEffect, useState } from 'react';
import { obtenerProductos, eliminarProducto } from '../../services/productosService';
import Swal from 'sweetalert2'; 
import './productos.css';

const TableProductos = () => {
    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(true);

    const cargarProductos = async () => {
        try {
            setLoading(true);
            const response = await obtenerProductos();
            // Accedemos a response.data.data por la estructura de tu Backend
            if (response.data && response.data.success) {
                setProductos(response.data.data);
            }
        } catch (error) {
            console.error("Error al cargar productos", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarProductos();
    }, []);

    const handleEliminar = async (id) => {
        const result = await Swal.fire({
            title: '¿Eliminar producto?',
            text: `Confirmas la eliminación del producto ID: ${id}`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e74c3c',
            cancelButtonColor: '#95a5a6',
            confirmButtonText: 'Sí, borrar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                // Asegúrate de que esta función exista en productosService.js
                await eliminarProducto(id); 
                Swal.fire('Borrado', 'Producto eliminado exitosamente.', 'success');
                cargarProductos(); // Refresca la lista automáticamente
            } catch (error) {
                Swal.fire('Error', 'No se pudo eliminar el producto.', 'error');
            }
        }
    };

    const handleEditar = (producto) => {
        // Por ahora lo mandamos a consola, luego podemos abrir un modal
        console.log("Editando:", producto);
        Swal.fire('Modo Edición', `Editando: ${producto.Nombre} (${producto.Marca})`, 'info');
    };

    return (
        <div className="container-tabla">
            <h2 className="titulo-seccion">Inventario de Productos</h2>
            <table className="tabla-estilizada">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Marca</th>
                        <th>Categoría</th>
                        <th>Cantidad</th>
                        <th>Precio</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr><td colSpan="7">Cargando inventario...</td></tr>
                    ) : (
                        productos.map((p) => (
                            <tr key={p.ID_PRODUCTOS}>
                                <td>{p.ID_PRODUCTOS}</td>
                                <td>{p.Nombre}</td>
                                <td>{p.Marca}</td>
                                <td>{p.Categoria}</td>
                                <td className={p.Cantidad < 5 ? 'text-danger fw-bold' : ''}>
                                    {p.Cantidad}
                                </td>
                                <td>${Number(p.Precio).toLocaleString()}</td>
                                <td>
                                    <div className="btn-group">
                                        <button 
                                            className="btn-edit" 
                                            onClick={() => handleEditar(p)}
                                            title="Editar"
                                        >
                                            ✏️
                                        </button>
                                        <button 
                                            className="btn-delete" 
                                            onClick={() => handleEliminar(p.ID_PRODUCTOS)}
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

export default TableProductos;