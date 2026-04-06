import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import Swal from 'sweetalert2';
import {
  obtenerProductos,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  type ProductoPayload,
  type ProductoRecord,
} from '../../services/productosService';
import './Productos.css';

const CATEGORIAS = [
  'Accesorios',
  'Repuestos',
  'Herramientas',
  'Lubricantes',
  'Neumáticos',
];

const ESTADOS = ['Disponibles', 'Agotados', 'Próximamente'] as const;
type EstadoType = (typeof ESTADOS)[number];

const createInitialFormData = (): ProductoPayload => ({
  ID_PRODUCTOS: '',
  Nombre: '',
  Marca: '',
  Categoria: '',
  Garantia: 0,
  Precio: 0,
  Cantidad: 0,
  Estado: 'Disponibles',
});

const buildProductoPayload = (formData: ProductoPayload): ProductoPayload => {
  const id = String(formData.ID_PRODUCTOS ?? '').trim();
  const nombre = String(formData.Nombre ?? '').trim();
  const marca = String(formData.Marca ?? '').trim();
  const categoria = String(formData.Categoria ?? '').trim();
  const garantia = Number(formData.Garantia);
  const precio = Number(formData.Precio);
  const cantidad = Number(formData.Cantidad);
  const estado = String(formData.Estado ?? 'Disponibles').trim() as EstadoType;

  if (!id) throw new Error('El ID del producto es obligatorio.');
  if (!nombre) throw new Error('El nombre del producto es obligatorio.');
  if (!marca) throw new Error('La marca del producto es obligatoria.');
  if (!categoria) throw new Error('Debe seleccionar una categoría.');
  if (Number.isNaN(garantia) || garantia < 0) {
    throw new Error('La garantía debe ser un número mayor o igual a 0.');
  }
  if (Number.isNaN(precio) || precio <= 0) {
    throw new Error('El precio debe ser mayor a 0.');
  }
  if (Number.isNaN(cantidad) || cantidad < 0) {
    throw new Error('La cantidad debe ser mayor o igual a 0.');
  }
  if (!estado) throw new Error('Debe seleccionar un estado.');

  return {
    ID_PRODUCTOS: id,
    Nombre: nombre,
    Marca: marca,
    Categoria: categoria,
    Garantia: garantia,
    Precio: precio,
    Cantidad: cantidad,
    Estado: estado,
  };
};

const readProductoArray = (value: unknown): ProductoRecord[] | null => {
  if (Array.isArray(value)) return value as ProductoRecord[];
  if (value && typeof value === 'object') {
    const nested = value as Record<string, unknown>;
    const fromData = readProductoArray(nested.data);
    if (fromData) return fromData;
    const fromProductos = readProductoArray(nested.productos);
    if (fromProductos) return fromProductos;
  }
  return null;
};

const extractProductos = (payload: unknown): ProductoRecord[] =>
  readProductoArray(payload) ?? [];

const isSuccessfulResponse = (payload: unknown) => {
  if (!payload || typeof payload !== 'object' || !('success' in payload)) return true;
  return Boolean((payload as { success?: boolean }).success);
};

const formatPrecio = (precio: ProductoPayload['Precio']) => {
  const numericValue = Number(precio);
  if (Number.isFinite(numericValue)) return numericValue.toLocaleString();
  return precio;
};

const getEstadoBadgeClass = (estado?: string) => {
  if (estado === 'Disponibles') return 'bg-success';
  if (estado === 'Próximamente') return 'bg-warning';
  return 'bg-danger';
};

function TableProductos() {
  const [productos, setProductos] = useState<ProductoRecord[]>([]);
  const [filteredProductos, setFilteredProductos] = useState<ProductoRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentProducto, setCurrentProducto] = useState<ProductoRecord | null>(null);
  const [formData, setFormData] = useState<ProductoPayload>(createInitialFormData());

  useEffect(() => {
    void cargarProductos();
  }, []);

  const showAlert = (
    title: string,
    text: string,
    icon: 'success' | 'error' | 'warning'
  ) => {
    return Swal.fire({
      title,
      text,
      icon,
      confirmButtonColor: '#ff6600',
      background: '#101010',
      color: '#f5f5f5',
    });
  };

  const cargarProductos = async () => {
    try {
      setLoading(true);
      const response = await obtenerProductos();
      const data = extractProductos(response.data);
      setProductos(data);
      setFilteredProductos(data);
    } catch (error) {
      console.error('Error al obtener productos:', error);
      setProductos([]);
      setFilteredProductos([]);
      showAlert('Error', 'No se pudieron cargar los productos.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setFilteredProductos(productos);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = productos.filter(
      (producto) =>
        String(producto.Nombre).toLowerCase().includes(term) ||
        String(producto.Marca).toLowerCase().includes(term) ||
        String(producto.Categoria).toLowerCase().includes(term) ||
        String(producto.Estado ?? '').toLowerCase().includes(term) ||
        String(producto.ID_PRODUCTOS).toLowerCase().includes(term)
    );

    setFilteredProductos(filtered);
  };

  const handleReset = () => {
    setSearchTerm('');
    setFilteredProductos(productos);
  };

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }) as ProductoPayload);
  };

  const openCreateModal = () => {
    setCurrentProducto(null);
    setFormData(createInitialFormData());
    setShowCreateModal(true);
  };

  const openEditModal = (producto: ProductoRecord) => {
    setCurrentProducto(producto);
    setFormData({
      ID_PRODUCTOS: producto.ID_PRODUCTOS,
      Nombre: producto.Nombre,
      Marca: producto.Marca,
      Categoria: producto.Categoria,
      Garantia: producto.Garantia ?? 0,
      Precio: producto.Precio,
      Cantidad: producto.Cantidad,
      Estado: (producto.Estado as EstadoType) ?? 'Disponibles',
    });
    setShowEditModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setFormData(createInitialFormData());
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setCurrentProducto(null);
    setFormData(createInitialFormData());
  };

  const validateForm = (): string | null => {
    const id = String(formData.ID_PRODUCTOS ?? '').trim();
    const nombre = String(formData.Nombre ?? '').trim();
    const marca = String(formData.Marca ?? '').trim();
    const categoria = String(formData.Categoria ?? '').trim();
    const garantia = Number(formData.Garantia);
    const precio = Number(formData.Precio);
    const cantidad = Number(formData.Cantidad);
    const estado = String(formData.Estado ?? '').trim();

    if (!id) return 'El ID del producto es obligatorio.';
    if (!nombre) return 'El nombre del producto es obligatorio.';
    if (!marca) return 'La marca del producto es obligatoria.';
    if (!categoria) return 'Debe seleccionar una categoria.';
    if (Number.isNaN(garantia) || garantia < 0) {
      return 'La garantía debe ser un número válido mayor o igual a 0.';
    }
    if (Number.isNaN(precio) || precio <= 0) {
      return 'El precio debe ser un número válido mayor a 0.';
    }
    if (Number.isNaN(cantidad) || cantidad < 0) {
      return 'La cantidad debe ser un número válido mayor o igual a 0.';
    }
    if (!estado) return 'Debe seleccionar un estado.';
    return null;
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const error = validateForm();
    if (error) {
      showAlert('Datos incompletos', error, 'warning');
      return;
    }

    try {
      const payload = buildProductoPayload(formData);
      const response = await crearProducto(payload);

      if (isSuccessfulResponse(response.data)) {
        await showAlert(
          'Producto creado',
          'El producto fue registrado correctamente.',
          'success'
        );
        closeCreateModal();
        await cargarProductos();
      } else {
        showAlert('Error', 'No se pudo crear el producto.', 'error');
      }
    } catch (error) {
      console.error('Error al crear:', error);
      const message =
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al crear el producto.';
      showAlert('Error', message, 'error');
    }
  };

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentProducto) return;

    const error = validateForm();
    if (error) {
      showAlert('Datos incompletos', error, 'warning');
      return;
    }

    try {
      const payload = buildProductoPayload(formData);
      const response = await actualizarProducto(currentProducto.ID_PRODUCTOS, payload);

      if (isSuccessfulResponse(response.data)) {
        await showAlert(
          'Cambios guardados',
          'El producto fue actualizado correctamente.',
          'success'
        );
        closeEditModal();
        await cargarProductos();
      } else {
        showAlert('Error', 'No se pudo actualizar el producto.', 'error');
      }
    } catch (error) {
      console.error('Error al actualizar:', error);
      const message =
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al actualizar el producto.';
      showAlert('Error', message, 'error');
    }
  };

  const borrarProducto = async (producto: ProductoRecord) => {
    const result = await Swal.fire({
      title: `¿Estás seguro de eliminar "${producto.Nombre}"?`,
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ff6600',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: '#101010',
      color: '#f5f5f5',
    });

    if (!result.isConfirmed) return;

    try {
      await eliminarProducto(producto.ID_PRODUCTOS);
      setProductos((prev) =>
        prev.filter((item) => item.ID_PRODUCTOS !== producto.ID_PRODUCTOS)
      );
      setFilteredProductos((prev) =>
        prev.filter((item) => item.ID_PRODUCTOS !== producto.ID_PRODUCTOS)
      );
      Swal.fire({
        title: 'Eliminado',
        text: 'El producto fue eliminado correctamente.',
        icon: 'success',
        confirmButtonColor: '#ff6600',
        background: '#101010',
        color: '#f5f5f5',
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error('Error al eliminar:', error);
      showAlert('Error', 'No se pudo eliminar el producto.', 'error');
    }
  };

  return (
    <div className="productos-page">
      <div className="admin-section">
        <h1 className="admin-title">Gestión de Productos</h1>

        <div className="action-bar">
          <div className="search-area">
            <input
              type="text"
              className="search-input"
              placeholder="Buscar por nombre, marca, categoría, estado o ID"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && handleSearch()}
            />
            <button className="btn-search" onClick={handleSearch} title="Buscar">
              <i className="bi bi-search"></i>
            </button>
          </div>

          <div className="right-actions">
            <button className="btn-create" onClick={openCreateModal}>
              <i className="bi bi-plus-circle"></i> Nuevo Producto
            </button>
            <button className="btn-reset" onClick={handleReset}>
              <i className="bi bi-arrow-repeat"></i> Reset
            </button>
          </div>
        </div>

        <div className="table-responsive-container">
          <table className="table-ktm">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Marca</th>
                <th>Categoría</th>
                <th>Garantía (días)</th>
                <th>Precio</th>
                <th>Cantidad</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="loading-row">
                    Cargando productos...
                  </td>
                </tr>
              ) : filteredProductos.length > 0 ? (
                filteredProductos.map((producto) => (
                  <tr key={producto.ID_PRODUCTOS}>
                    <td>{producto.ID_PRODUCTOS}</td>
                    <td>{producto.Nombre}</td>
                    <td>{producto.Marca}</td>
                    <td>{producto.Categoria}</td>
                    <td>{producto.Garantia ?? 0}</td>
                    <td>${formatPrecio(producto.Precio)}</td>
                    <td className={producto.Cantidad < 5 ? 'stock-bajo' : ''}>
                      {producto.Cantidad}
                    </td>
                    <td>
                      <span
                        className={`estado-badge ${getEstadoBadgeClass(
                          producto.Estado
                        )}`}
                      >
                        {producto.Estado}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <button
                        className="btn-edit-ktm"
                        onClick={() => openEditModal(producto)}
                        title="Editar"
                      >
                        <i className="bi bi-pencil-square"></i> Editar
                      </button>
                      <button
                        className="btn-eliminar-ktm"
                        onClick={() => borrarProducto(producto)}
                        title="Eliminar"
                      >
                        <i className="bi bi-trash3"></i> Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="loading-row">
                    No hay productos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={closeCreateModal}>
          <div className="modal-container" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Crear Producto</h3>
              <button type="button" className="close-btn" onClick={closeCreateModal}>
                &times;
              </button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>ID Producto</label>
                <input
                  type="text"
                  name="ID_PRODUCTOS"
                  value={formData.ID_PRODUCTOS}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Nombre</label>
                <input
                  type="text"
                  name="Nombre"
                  value={formData.Nombre}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Marca</label>
                <input
                  type="text"
                  name="Marca"
                  value={formData.Marca}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Categoría</label>
                <select
                  name="Categoria"
                  value={formData.Categoria}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Seleccione</option>
                  {CATEGORIAS.map((categoria) => (
                    <option key={categoria} value={categoria}>
                      {categoria}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Garantía (días)</label>
                <input
                  type="number"
                  step="1"
                  name="Garantia"
                  value={formData.Garantia}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Precio</label>
                <div className="input-with-icon">
                  <span>$</span>
                  <input
                    type="number"
                    step="0.01"
                    name="Precio"
                    value={formData.Precio}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Cantidad</label>
                <input
                  type="number"
                  step="1"
                  name="Cantidad"
                  value={formData.Cantidad}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Estado</label>
                <select
                  name="Estado"
                  value={formData.Estado}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Seleccione</option>
                  {ESTADOS.map((estado) => (
                    <option key={estado} value={estado}>
                      {estado}
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={closeCreateModal}>
                  Cancelar
                </button>
                <button type="submit">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && currentProducto && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-container" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Editar Producto</h3>
              <button type="button" className="close-btn" onClick={closeEditModal}>
                &times;
              </button>
            </div>

            <form onSubmit={handleUpdate}>
              <div className="form-group">
                <label>ID Producto</label>
                <input
                  type="text"
                  name="ID_PRODUCTOS"
                  value={formData.ID_PRODUCTOS}
                  readOnly
                  title="El ID no se puede modificar"
                />
              </div>
              <div className="form-group">
                <label>Nombre</label>
                <input
                  type="text"
                  name="Nombre"
                  value={formData.Nombre}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Marca</label>
                <input
                  type="text"
                  name="Marca"
                  value={formData.Marca}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Categoría</label>
                <select
                  name="Categoria"
                  value={formData.Categoria}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Seleccione</option>
                  {CATEGORIAS.map((categoria) => (
                    <option key={categoria} value={categoria}>
                      {categoria}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Garantía (días)</label>
                <input
                  type="number"
                  step="1"
                  name="Garantia"
                  value={formData.Garantia}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Precio</label>
                <div className="input-with-icon">
                  <span>$</span>
                  <input
                    type="number"
                    step="0.01"
                    name="Precio"
                    value={formData.Precio}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Cantidad</label>
                <input
                  type="number"
                  step="1"
                  name="Cantidad"
                  value={formData.Cantidad}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Estado</label>
                <select
                  name="Estado"
                  value={formData.Estado}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Seleccione</option>
                  {ESTADOS.map((estado) => (
                    <option key={estado} value={estado}>
                      {estado}
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={closeEditModal}>
                  Cancelar
                </button>
                <button type="submit">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TableProductos;
