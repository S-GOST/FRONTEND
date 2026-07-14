import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import logo from '../assets/icons/rock.png';
import './Registro.css';
import { insertarCliente, ClientePayload } from '../services/cliente.service';
import { insertarMoto, MotoPayload } from '../services/moto.service';
import { obtenerTiposDocumento, TipoDocumentoPayload } from '../services/tipoDocumento.service';

interface RegistroFormInputs {
  // Cliente
  numero_documento: string;
  id_tipo_documento: string;
  ciudad: string;
  nombre: string;
  usuario: string;
  contrasena: string;
  correo: string;
  telefono: string;

  // Moto
  placa: string;
  modelo: string;
  marca: string;
  cilindraje: string;
  kilometraje: string;
}

const Registro: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState<string | null>(null);
  const [tiposDocumento, setTiposDocumento] = useState<TipoDocumentoPayload[]>([]);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegistroFormInputs>();

  useEffect(() => {
    const fetchTipos = async () => {
      try {
        const res = await obtenerTiposDocumento();
        if (res.data) {
          if (Array.isArray(res.data)) {
            setTiposDocumento(res.data);
          } else if (res.data.data && Array.isArray(res.data.data)) {
            setTiposDocumento(res.data.data);
          }
        }
      } catch (err) {
        console.error('Error fetching tipos documento:', err);
      }
    };
    fetchTipos();
  }, []);

  const onSubmit = async (data: RegistroFormInputs) => {
    setServerError(null);
    setServerSuccess(null);
    setLoading(true);

    try {
      // 1. Registrar Cliente
      const clienteData: ClientePayload = {
        numero_documento: data.numero_documento,
        id_tipo_documento: Number(data.id_tipo_documento) || 1,
        ciudad: data.ciudad,
        nombre: data.nombre,
        usuario: data.usuario,
        password: data.contrasena,
        correo: data.correo,
        telefono: data.telefono,
      };

      const resCliente = await insertarCliente(clienteData);
      
      // Intentar obtener el ID del cliente recién creado.
      // Dependiendo de la respuesta del backend, puede estar en resCliente.data.id o similar.
      // Si no retorna ID, usamos el numero_documento que a menudo sirve como ID_CLIENTES por retrocompatibilidad.
      let idCliente = clienteData.numero_documento;
      if (resCliente.data && (resCliente.data as any).data && (resCliente.data as any).data.id_usuario) {
        idCliente = (resCliente.data as any).data.id_usuario;
      } else if (resCliente.data && (resCliente.data as any).id_usuario) {
        idCliente = (resCliente.data as any).id_usuario;
      }

      // 2. Registrar Moto
      const motoData: MotoPayload = {
        ID_CLIENTES: idCliente,
        id_cliente: idCliente,
        Placa: data.placa,
        placa: data.placa,
        Modelo: data.modelo,
        modelo: data.modelo,
        Marca: data.marca,
        marca: data.marca,
        Cilindraje: data.cilindraje,
        cilindraje: data.cilindraje,
        Kilometraje: data.kilometraje,
        kilometraje: data.kilometraje,
      };

      await insertarMoto(motoData);

      setServerSuccess('¡Registro completado exitosamente! Ahora puedes iniciar sesión.');
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (err: any) {
      console.error(err);
      setServerError(err.response?.data?.message || 'Error al registrar. Verifica los datos e intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="registro-page-wrapper">
      <div className="registro-orb registro-orb-1"></div>
      <div className="registro-orb registro-orb-2"></div>
      <div className="registro-grid-overlay"></div>

      <div className="registro-card animate-fade-in-up">
        <div className="registro-card-head">
          <Link to="/">
            <img src={logo} alt="Logo KTM Rocket Service" className="registro-card-logo" />
          </Link>
          <h2>Únete a KTM</h2>
          <p className="registro-card-copy">Registra tus datos y los de tu motocicleta para acceder a nuestros servicios.</p>
        </div>

        {serverError && (
          <div className="alert-error">
            <i className="bi bi-exclamation-triangle-fill"></i>
            <span>{serverError}</span>
          </div>
        )}

        {serverSuccess && (
          <div className="alert-success">
            <i className="bi bi-check-circle-fill"></i>
            <span>{serverSuccess}</span>
          </div>
        )}

        <form className="registro-form" onSubmit={handleSubmit(onSubmit)}>
          
          {/* SECCIÓN CLIENTE */}
          <div>
            <h3 className="registro-section-title">
              <i className="bi bi-person-lines-fill"></i> Datos Personales
            </h3>
            <div className="registro-grid">
              
              <div className="input-shell">
                <i className="bi bi-card-text input-icon"></i>
                <select 
                  className="registro-input"
                  {...register('id_tipo_documento', { required: true })}
                >
                  <option value="">Tipo Documento</option>
                  {tiposDocumento.map(tipo => (
                    <option key={tipo.id_tipo_documento} value={tipo.id_tipo_documento}>
                      {tipo.nombre}
                    </option>
                  ))}
                  {tiposDocumento.length === 0 && (
                    <>
                      <option value="1">Cédula de Ciudadanía (CC)</option>
                      <option value="2">Cédula de Extranjería (CE)</option>
                      <option value="3">Tarjeta de Identidad (TI)</option>
                    </>
                  )}
                </select>
                <div className="input-glow"></div>
              </div>

              <div className="input-shell">
                <i className="bi bi-hash input-icon"></i>
                <input
                  type="text"
                  className="registro-input"
                  placeholder="Número de Documento"
                  {...register('numero_documento', { required: true })}
                />
                <div className="input-glow"></div>
              </div>

              <div className="input-shell">
                <i className="bi bi-person input-icon"></i>
                <input
                  type="text"
                  className="registro-input"
                  placeholder="Nombre Completo"
                  {...register('nombre', { required: true })}
                />
                <div className="input-glow"></div>
              </div>

              <div className="input-shell">
                <i className="bi bi-envelope input-icon"></i>
                <input
                  type="email"
                  className="registro-input"
                  placeholder="Correo Electrónico"
                  {...register('correo', { required: true })}
                />
                <div className="input-glow"></div>
              </div>

              <div className="input-shell">
                <i className="bi bi-telephone input-icon"></i>
                <input
                  type="tel"
                  className="registro-input"
                  placeholder="Teléfono"
                  {...register('telefono', { required: true })}
                />
                <div className="input-glow"></div>
              </div>

              <div className="input-shell">
                <i className="bi bi-geo-alt input-icon"></i>
                <input
                  type="text"
                  className="registro-input"
                  placeholder="Ciudad / Ubicación"
                  {...register('ciudad', { required: true })}
                />
                <div className="input-glow"></div>
              </div>

              <div className="input-shell">
                <i className="bi bi-person-badge input-icon"></i>
                <input
                  type="text"
                  className="registro-input"
                  placeholder="Usuario para Login"
                  {...register('usuario', { required: true })}
                />
                <div className="input-glow"></div>
              </div>

              <div className="input-shell">
                <i className="bi bi-shield-lock input-icon"></i>
                <input
                  type="password"
                  className="registro-input"
                  placeholder="Contraseña"
                  {...register('contrasena', { required: true })}
                />
                <div className="input-glow"></div>
              </div>

            </div>
          </div>

          {/* SECCIÓN MOTO */}
          <div>
            <h3 className="registro-section-title">
              <i className="bi bi-bicycle input-icon"></i> Datos de la Motocicleta
            </h3>
            <div className="registro-grid">

              <div className="input-shell">
                <i className="bi bi-upc-scan input-icon"></i>
                <input
                  type="text"
                  className="registro-input"
                  placeholder="Placa"
                  {...register('placa', { required: true })}
                />
                <div className="input-glow"></div>
              </div>

              <div className="input-shell">
                <i className="bi bi-tag input-icon"></i>
                <input
                  type="text"
                  className="registro-input"
                  placeholder="Marca (Ej: KTM)"
                  {...register('marca', { required: true })}
                />
                <div className="input-glow"></div>
              </div>

              <div className="input-shell">
                <i className="bi bi-motorcycle input-icon"></i>
                <input
                  type="text"
                  className="registro-input"
                  placeholder="Modelo"
                  {...register('modelo', { required: true })}
                />
                <div className="input-glow"></div>
              </div>

              <div className="input-shell">
                <i className="bi bi-speedometer2 input-icon"></i>
                <input
                  type="text"
                  className="registro-input"
                  placeholder="Cilindraje"
                  {...register('cilindraje', { required: true })}
                />
                <div className="input-glow"></div>
              </div>

              <div className="input-shell">
                <i className="bi bi-signpost-split input-icon"></i>
                <input
                  type="number"
                  className="registro-input"
                  placeholder="Kilometraje"
                  {...register('kilometraje', { required: true })}
                />
                <div className="input-glow"></div>
              </div>

            </div>
          </div>

          <button type="submit" className="btn-ktm registro-submit" disabled={loading}>
            <span className="submit-content">
              {loading ? (
                <>
                  <span className="button-spinner"></span>
                  Registrando...
                </>
              ) : (
                <>
                  <i className="bi bi-check2-circle"></i>
                  Completar Registro
                </>
              )}
            </span>
            <div className="submit-glow"></div>
          </button>
        </form>

        <div className="registro-card-footer">
          <p>¿Ya tienes una cuenta?</p>
          <Link to="/login" className="footer-link">
            <i className="bi bi-box-arrow-in-right"></i> Iniciar Sesión
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Registro;
