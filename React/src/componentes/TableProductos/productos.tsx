import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import Swal from 'sweetalert2';
import {
  obtenerProductos,
  insertarProducto,
  actualizarProducto,
  eliminarProducto,
  habilitarProducto,
  type ProductoPayload,
  type ProductoRecord,
} from '../../services/producto.service';
import {
  obtenerCategoriasPorTipo,
  type CategoriaPayload,
} from '../../services/categoria.service';
import { FormattedId } from '../../componentes/FormattedId';
import { BackButton } from '../BackButton';
import './Productos.css';

const ESTADOS = ['Disponibles', 'Agotados', 'Próximamente'] as const;
type EstadoType = (typeof ESTADOS)[number];

const createInitialFormData = (): ProductoPayload => ({
  ID_PRODUCTOS: '',
  ID_CATEGORIA: '',
  Marca: '',
  Nombre: '',
  precio_costo: 0,
  precio_venta: 0,
  Estado: 'Disponibles',
  stock: 0,
  stock_minimo: 0,
});

// ✅ FUNCIONES AUXILIARES DE VALIDACIÓN
const filterOnlyLetters = (value: string): string => value.replace(/[^a-zA-ZñÑ\s]/g, '');
const filterOnlyNumbers = (value: string): string => value.replace(/\D/g, '');

const buildProductoPayload = (formData: ProductoPayload): ProductoPayload => {
  const id = String(formData.ID_PRODUCTOS ?? '').trim();
  const idCategoria = Number(formData.ID_CATEGORIA);
  const nombre = String(formData.Nombre ?? '').trim();
  const marca = String(formData.Marca ?? '').trim();
  const precioCosto = Number(formData.precio_costo);
  const precioVenta = Number(formData.precio_venta);
  const stock = Number(formData.stock);
  const stockMinimo = Number(formData.stock_minimo);
  const estado = String(formData.Estado ?? 'Disponibles').trim() as EstadoType;

  if (!id) throw new Error('El ID del producto es obligatorio.');
  if (!idCategoria) throw new Error('Debe seleccionar una categoría.');
  if (!nombre) throw new Error('El nombre del producto es obligatorio.');
  if (!marca) throw new Error('La marca del producto es obligatoria.');
  if (Number.isNaN(precioCosto) || precioCosto < 0) {
    throw new Error('El precio de costo debe ser válido.');
  }
  if (Number.isNaN(precioVenta) || precioVenta <= 0) {
    throw new Error('El precio de venta debe ser mayor a 0.');
  }
  if (Number.isNaN(stock) || stock < 0) {
    throw new Error('El stock debe ser válido.');
  }
  if (Number.isNaN(stockMinimo) || stockMinimo < 0) {
    throw new Error('El stock mínimo debe ser válido.');
  }
  if (!estado) throw new Error('Debe seleccionar un estado.');

  return {
    ID_PRODUCTOS: id,
    ID_CATEGORIA: idCategoria,
    Nombre: nombre,
    Marca: marca,
    precio_costo: precioCosto,
    precio_venta: precioVenta,
    stock: stock,
    stock_minimo: stockMinimo,
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

const formatPrecio = (precio: ProductoPayload['precio_venta']) => {
  const numericValue = Number(precio);
  if (Number.isFinite(numericValue)) return numericValue.toLocaleString();
  return precio;
};

const getEstadoBadgeClass = (estado?: string) => {
  if (estado === 'Disponible' || estado === 'Disponibles' || estado === 'Activo') return 'bg-success';
  if (estado === 'Próximamente' || estado === 'Inactivo') return 'bg-warning';
  return 'bg-danger';
};

function TableProductos() {
  const [productos, setProductos] = useState<ProductoRecord[]>([]);
  const [filteredProductos, setFilteredProductos] = useState<ProductoRecord[]>([]);
  const [categorias, setCategorias] = useState<CategoriaPayload[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentProducto, setCurrentProducto] = useState<ProductoRecord | null>(null);
  const [formData, setFormData] = useState<ProductoPayload>(createInitialFormData());

  useEffect(() => {
    void cargarProductos();
    void cargarCategorias();
  }, []);

  const cargarCategorias = async () => {
    try {
      const response = await obtenerCategoriasPorTipo('PRODUCTO');
      const data = response.data;
      const cats = Array.isArray(data) ? data : (data as any)?.data ?? [];
      setCategorias(cats);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
  };

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
        String(producto.categoria_nombre ?? '').toLowerCase().includes(term) ||
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

  // ✅ MANEJADOR: SOLO LETRAS (Nombre y Marca)
  const handleTextOnlyInput = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    const sanitizedValue = filterOnlyLetters(value);

    if (value !== sanitizedValue) {
      Swal.fire({
        title: 'Solo letras permitidas',
        text: 'No se permiten números ni símbolos en este campo.',
        icon: 'warning',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 1500,
        timerProgressBar: true,
        background: '#101010',
        color: '#f5f5f5',
      });
    }

    setFormData((prev) => ({ ...prev, [name]: sanitizedValue }) as ProductoPayload);
  };

  // ✅ MANEJADOR: SOLO NÚMEROS (ID Producto)
  const handleNumberOnlyInput = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    const sanitizedValue = filterOnlyNumbers(value);

    if (value !== sanitizedValue) {
      Swal.fire({
        title: 'Solo números permitidos',
        text: 'El ID solo acepta dígitos numéricos.',
        icon: 'warning',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 1500,
        timerProgressBar: true,
        background: '#101010',
        color: '#f5f5f5',
      });
    }

    setFormData((prev) => ({ ...prev, [name]: sanitizedValue }) as ProductoPayload);
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
      ID_CATEGORIA: producto.ID_CATEGORIA,
      Marca: producto.Marca,
      Nombre: producto.Nombre,
      precio_costo: producto.precio_costo,
      precio_venta: producto.precio_venta,
      stock: producto.stock,
      stock_minimo: producto.stock_minimo,
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
    const idCategoria = Number(formData.ID_CATEGORIA);
    const precioCosto = Number(formData.precio_costo);
    const precioVenta = Number(formData.precio_venta);
    const stock = Number(formData.stock);
    const stockMinimo = Number(formData.stock_minimo);
    const estado = String(formData.Estado ?? '').trim();

    if (!id) return 'El ID del producto es obligatorio.';
    if (!nombre) return 'El nombre del producto es obligatorio.';
    if (!marca) return 'La marca del producto es obligatoria.';
    if (!idCategoria) return 'Debe seleccionar una categoría.';
    if (Number.isNaN(precioCosto) || precioCosto < 0) return 'El precio de costo debe ser válido.';
    if (Number.isNaN(precioVenta) || precioVenta <= 0) {
      return 'El precio de venta debe ser un número válido mayor a 0.';
    }
    if (Number.isNaN(stock) || stock < 0) return 'El stock debe ser válido.';
    if (Number.isNaN(stockMinimo) || stockMinimo < 0) return 'El stock mínimo debe ser válido.';
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
      const response = await insertarProducto(payload);

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
      title: `¿Estás seguro de inhabilitar "${producto.Nombre}"?`,
      text: 'El producto será marcado como Inactivo.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ff6600',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, inhabilitar',
      cancelButtonText: 'Cancelar',
      background: '#101010',
      color: '#f5f5f5',
    });

    if (!result.isConfirmed) return;

    try {
      await eliminarProducto(producto.ID_PRODUCTOS);
      const updateFn = (prev: ProductoRecord[]) =>
        prev.map((item) => (item.ID_PRODUCTOS === producto.ID_PRODUCTOS ? { ...item, Estado: 'Inactivo' } : item));
      setProductos(updateFn);
      setFilteredProductos(updateFn);
      Swal.fire({
        title: 'Inhabilitado',
        text: 'El producto fue inhabilitado correctamente.',
        icon: 'success',
        confirmButtonColor: '#ff6600',
        background: '#101010',
        color: '#f5f5f5',
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error('Error al inhabilitar:', error);
      showAlert('Error', 'No se pudo inhabilitar el producto.', 'error');
    }
  };

  const restaurarProducto = async (producto: ProductoRecord) => {
    const result = await Swal.fire({
      title: `¿Estás seguro de habilitar "${producto.Nombre}"?`,
      text: 'El producto volverá a estar activo.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, habilitar',
      cancelButtonText: 'Cancelar',
      background: '#101010',
      color: '#f5f5f5',
    });

    if (!result.isConfirmed) return;

    try {
      await habilitarProducto(producto.ID_PRODUCTOS);
      const updateFn = (prev: ProductoRecord[]) =>
        prev.map((item) => (item.ID_PRODUCTOS === producto.ID_PRODUCTOS ? { ...item, Estado: 'Activo' } : item));
      setProductos(updateFn);
      setFilteredProductos(updateFn);
      Swal.fire({
        title: 'Habilitado',
        text: 'El producto fue habilitado correctamente.',
        icon: 'success',
        confirmButtonColor: '#28a745',
        background: '#101010',
        color: '#f5f5f5',
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error('Error al habilitar:', error);
      showAlert('Error', 'No se pudo habilitar el producto.', 'error');
    }
  };

  // Helper: obtener nombre de categoría por ID
  const getCategoriaNombre = (producto: ProductoRecord): string => {
    if (producto.categoria_nombre) return producto.categoria_nombre;
    const cat = categorias.find((c) => c.ID_CATEGORIA === Number(producto.ID_CATEGORIA));
    return cat?.nombre ?? String(producto.ID_CATEGORIA);
  };

  return (
    <div className="productos-page">
      <div className="admin-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <BackButton />
          <h1 className="admin-title" style={{ margin: 0, borderBottom: 'none' }}>Gestión de Productos</h1>
        </div>

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
                <th>Categoría</th>
                <th>Marca</th>
                <th>Nombre</th>
                <th>Precio de Costo</th>
                <th>Precio de Venta</th>
                <th>Stock</th>
                <th>Min</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="loading-row">
                    Cargando productos...
                  </td>
                </tr>
              ) : filteredProductos.length > 0 ? (
                filteredProductos.map((producto) => (
                  <tr key={producto.ID_PRODUCTOS}>
                    <td><FormattedId entity="producto" value={producto.ID_PRODUCTOS} /></td>
                    <td>{getCategoriaNombre(producto)}</td>
                    <td>{producto.Marca}</td>
                    <td>{producto.Nombre}</td>
                    <td>${formatPrecio(producto.precio_costo ?? (producto as any).Precio_Costo ?? (producto as any).precioCosto)}</td>
                    <td>${formatPrecio(producto.precio_venta)}</td>
                    <td className={producto.stock <= producto.stock_minimo ? 'stock-bajo' : ''}>{producto.stock}</td>
                    <td>{producto.stock_minimo}</td>
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
                      {producto.Estado === 'Inactivo' ? (
                        <button
                          className="btn-eliminar-ktm"
                          onClick={() => restaurarProducto(producto)}
                          title="Habilitar"
                          style={{ backgroundColor: '#28a745', color: '#fff' }}
                        >
                          <i className="bi bi-check-circle"></i> Habilitar
                        </button>
                      ) : (
                        <button
                          className="btn-eliminar-ktm"
                          onClick={() => borrarProducto(producto)}
                          title="Inhabilitar"
                        >
                          <i className="bi bi-slash-circle"></i> Inhabilitar
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="loading-row">
                    No hay productos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear */}
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
                  onChange={handleNumberOnlyInput}
                  required
                />
              </div>
              <div className="form-group">
                <label>Categoría</label>
                <select
                  name="ID_CATEGORIA"
                  value={formData.ID_CATEGORIA}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Seleccione</option>
                  {categorias.map((cat) => (
                    <option key={cat.ID_CATEGORIA} value={cat.ID_CATEGORIA}>
                      {cat.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Marca</label>
                <input
                  type="text"
                  name="Marca"
                  value={formData.Marca}
                  onChange={handleTextOnlyInput}
                  required
                />
              </div>
              <div className="form-group">
                <label>Nombre</label>
                <input
                  type="text"
                  name="Nombre"
                  value={formData.Nombre}
                  onChange={handleTextOnlyInput}
                  required
                />
              </div>
              <div className="form-group form-group-half">
                <label>Precio de Costo</label>
                <div className="input-with-icon">
                  <span>$</span>
                  <input
                    type="number"
                    step="0.01"
                    name="precio_costo"
                    value={formData.precio_costo}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="form-group form-group-half">
                <label>Precio de Venta</label>
                <div className="input-with-icon">
                  <span>$</span>
                  <input
                    type="number"
                    step="0.01"
                    name="precio_venta"
                    value={formData.precio_venta}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="form-group form-group-half">
                <label>Stock</label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group form-group-half">
                <label>Stock Mínimo</label>
                <input
                  type="number"
                  name="stock_minimo"
                  value={formData.stock_minimo}
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

      {/* Modal Editar */}
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
                  required
                  title="El ID no se puede modificar"
                />
              </div>
              <div className="form-group">
                <label>Categoría</label>
                <select
                  name="ID_CATEGORIA"
                  value={formData.ID_CATEGORIA}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Seleccione</option>
                  {categorias.map((cat) => (
                    <option key={cat.ID_CATEGORIA} value={cat.ID_CATEGORIA}>
                      {cat.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Marca</label>
                <input
                  type="text"
                  name="Marca"
                  value={formData.Marca}
                  onChange={handleTextOnlyInput}
                  required
                />
              </div>
              <div className="form-group">
                <label>Nombre</label>
                <input
                  type="text"
                  name="Nombre"
                  value={formData.Nombre}
                  onChange={handleTextOnlyInput}
                  required
                />
              </div>
              <div className="form-group form-group-half">
                <label>Precio de Costo</label>
                <div className="input-with-icon">
                  <span>$</span>
                  <input
                    type="number"
                    step="0.01"
                    name="precio_costo"
                    value={formData.precio_costo}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="form-group form-group-half">
                <label>Precio de Venta</label>
                <div className="input-with-icon">
                  <span>$</span>
                  <input
                    type="number"
                    step="0.01"
                    name="precio_venta"
                    value={formData.precio_venta}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="form-group form-group-half">
                <label>Stock</label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group form-group-half">
                <label>Stock Mínimo</label>
                <input
                  type="number"
                  name="stock_minimo"
                  value={formData.stock_minimo}
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