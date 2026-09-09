import React, { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import Swal from 'sweetalert2';
import { obtenerClientePorId, actualizarCliente, type ClientePayload } from '../../services/cliente.service';
import { obtenerTiposDocumento, type TipoDocumentoRecord } from '../../services/tipoDocumento.service';
import '../TableAdmin/Admin.css'; // Reutilizamos los estilos del formulario

const ClientePerfil: React.FC = () => {
  const [formData, setFormData] = useState<ClientePayload>({
    numero_documento: '',
    id_tipo_documento: '',
    nombre: '',
    correo: '',
    telefono: '',
    usuario: '',
    ciudad: '',
    password: ''
  });
  const [tiposDocumento, setTiposDocumento] = useState<TipoDocumentoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const id = localStorage.getItem('user_id') || '';
      if (!id) {
        throw new Error('No se encontró el ID del usuario en la sesión.');
      }
      
      const [clienteRes, tiposRes] = await Promise.all([
        obtenerClientePorId(id),
        obtenerTiposDocumento()
      ]);

      const data = clienteRes.data?.data || clienteRes.data;
      if (data) {
        setFormData({
          numero_documento: data.numero_documento || '',
          id_tipo_documento: data.id_tipo_documento || '',
          nombre: data.nombre || data.Nombre || '',
          correo: data.correo || '',
          telefono: data.telefono || '',
          usuario: data.usuario || '',
          ciudad: data.ciudad || data.Ubicacion || '',
          password: ''
        });
      }

      if (tiposRes.data) {
        setTiposDocumento(Array.isArray(tiposRes.data) ? tiposRes.data : []);
      }
    } catch (error) {
      console.error('Error al cargar el perfil:', error);
      Swal.fire({
        title: 'Error',
        text: 'No se pudo cargar la información del perfil.',
        icon: 'error',
        confirmButtonColor: '#ff6600',
        background: '#101010',
        color: '#f5f5f5',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }) as ClientePayload);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const id = localStorage.getItem('user_id') || '';
      const payload = { ...formData };
      if (!payload.password) {
        delete payload.password;
      }

      await actualizarCliente(id, payload);
      
      // Actualizar nombre en el local storage si cambió
      localStorage.setItem('user_name', payload.nombre);
      // Disparar evento para que el header y dashboard se actualicen si es necesario
      window.dispatchEvent(new Event('storage'));

      Swal.fire({
        title: 'Actualizado',
        text: 'Tu perfil ha sido actualizado correctamente.',
        icon: 'success',
        confirmButtonColor: '#ff6600',
        background: '#101010',
        color: '#f5f5f5',
      });
      
      // Recargar para limpiar la contraseña
      cargarDatos();
    } catch (error) {
      console.error('Error al actualizar:', error);
      Swal.fire({
        title: 'Error',
        text: 'Ocurrió un error al actualizar el perfil.',
        icon: 'error',
        confirmButtonColor: '#ff6600',
        background: '#101010',
        color: '#f5f5f5',
      });
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '50px', color: '#ff6600' }}>
        <h2>Cargando perfil...</h2>
      </div>
    );
  }

  return (
    <div className="admin-section" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h2 style={{ color: '#ff6600', borderBottom: '2px solid #ff6600', paddingBottom: '10px', marginBottom: '20px' }}>
        <i className="bi bi-person-circle" style={{ marginRight: '10px' }}></i>
        Mi Perfil
      </h2>
      
      <div style={{ background: '#1a1a1a', padding: '30px', borderRadius: '10px', border: '1px solid #333' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="form-group">
              <label style={{ color: '#aaa', marginBottom: '8px', display: 'block' }}>Tipo de documento</label>
              <select
                name="id_tipo_documento"
                value={String(formData.id_tipo_documento)}
                disabled
                style={{ width: '100%', padding: '10px', background: '#2a2a2a', border: '1px solid #444', color: '#888', borderRadius: '5px' }}
              >
                <option value="">Seleccione</option>
                {tiposDocumento.map(t => (
                  <option key={t.id_tipo_documento} value={String(t.id_tipo_documento)}>
                    {t.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label style={{ color: '#aaa', marginBottom: '8px', display: 'block' }}>Documento</label>
              <input
                type="text"
                name="numero_documento"
                value={String(formData.numero_documento)}
                disabled
                style={{ width: '100%', padding: '10px', background: '#2a2a2a', border: '1px solid #444', color: '#888', borderRadius: '5px' }}
              />
            </div>

            <div className="form-group">
              <label style={{ color: '#aaa', marginBottom: '8px', display: 'block' }}>Nombre</label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                required
                onKeyDown={(e) => { if (/\d/.test(e.key)) e.preventDefault(); }}
                pattern="^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$"
                style={{ width: '100%', padding: '10px', background: '#0a0a0a', border: '1px solid #ff6600', color: '#fff', borderRadius: '5px' }}
              />
            </div>

            <div className="form-group">
              <label style={{ color: '#aaa', marginBottom: '8px', display: 'block' }}>Usuario</label>
              <input
                type="text"
                name="usuario"
                value={formData.usuario}
                onChange={handleInputChange}
                required
                style={{ width: '100%', padding: '10px', background: '#0a0a0a', border: '1px solid #ff6600', color: '#fff', borderRadius: '5px' }}
              />
            </div>

            <div className="form-group">
              <label style={{ color: '#aaa', marginBottom: '8px', display: 'block' }}>Correo</label>
              <input
                type="email"
                name="correo"
                value={formData.correo}
                onChange={handleInputChange}
                required
                style={{ width: '100%', padding: '10px', background: '#0a0a0a', border: '1px solid #ff6600', color: '#fff', borderRadius: '5px' }}
              />
            </div>

            <div className="form-group">
              <label style={{ color: '#aaa', marginBottom: '8px', display: 'block' }}>Teléfono</label>
              <input
                type="text"
                name="telefono"
                value={formData.telefono}
                onChange={handleInputChange}
                required
                style={{ width: '100%', padding: '10px', background: '#0a0a0a', border: '1px solid #ff6600', color: '#fff', borderRadius: '5px' }}
              />
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label style={{ color: '#aaa', marginBottom: '8px', display: 'block' }}>Ciudad</label>
              <input
                type="text"
                name="ciudad"
                value={formData.ciudad}
                onChange={handleInputChange}
                required
                style={{ width: '100%', padding: '10px', background: '#0a0a0a', border: '1px solid #ff6600', color: '#fff', borderRadius: '5px' }}
              />
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label style={{ color: '#aaa', marginBottom: '8px', display: 'block' }}>Nueva Contraseña (Opcional)</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password || ''}
                  onChange={handleInputChange}
                  placeholder="Dejar en blanco para mantener la actual"
                  style={{ flex: 1, padding: '10px', paddingRight: '40px', background: '#0a0a0a', border: '1px solid #ff6600', color: '#fff', borderRadius: '5px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    background: 'none',
                    border: 'none',
                    color: '#ff6600',
                    cursor: 'pointer'
                  }}
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              type="submit" 
              style={{ 
                background: '#ff6600', 
                color: '#fff', 
                border: 'none', 
                padding: '12px 24px', 
                borderRadius: '5px', 
                fontWeight: 'bold', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <i className="bi bi-save"></i> Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientePerfil;
