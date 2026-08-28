import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { obtenerMotos, insertarMoto, type MotoPayload } from '../../services/moto.service';
import { obtenerMisOrdenes } from '../../services/ordenServicioService';
import './ClienteMotos.css';

function ClienteMotos() {
  const navigate = useNavigate();
  const userDocumento = localStorage.getItem('user_id') || '';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [motos, setMotos] = useState<any[]>([]);
  const [motosConOrdenes, setMotosConOrdenes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [realClientId, setRealClientId] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    placa: '',
    marca: '',
    modelo: '',
    cilindraje: '',
    kilometraje: '',
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    cargarMotos();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarMotos = async () => {
    try {
      setLoading(true);

      // 1) Obtener todas las motos (obtenerMotos ya está filtrado por backend o las trae todas)
      const motosRes = await obtenerMotos();
      const clientId = String(userDocumento); // En localStorage ya está el id_usuario
      setRealClientId(clientId);
      
      // Extraer motos
      const rawMotos = motosRes.data;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let motosArr: any[] = [];
      if (Array.isArray(rawMotos)) motosArr = rawMotos;
      else if (rawMotos?.data && Array.isArray(rawMotos.data)) motosArr = rawMotos.data;

      // Filtrar motos del cliente actual
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const misMotos = motosArr.filter((m: any) =>
        String(m.id_cliente ?? m.ID_CLIENTES ?? '') === clientId
      );

      setMotos(misMotos);

      // 2) Obtener las órdenes del cliente para saber qué motos tienen órdenes
      try {
        const ordenesRes = await obtenerMisOrdenes();
        // Manejar correctamente la estructura de respuesta que puede venir anidada
        const ordenes = ordenesRes.data?.data || ordenesRes.data || [];
        const ordenesArray = Array.isArray(ordenes) ? ordenes : [];
        console.log('📦 Órdenes recibidas (limpias):', ordenesArray);
        
        const motosIdsConOrdenes = new Set<string>();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ordenesArray.forEach((o: any) => {
          if (o.ID_MOTOS) motosIdsConOrdenes.add(String(o.ID_MOTOS));
          if (o.id_moto) motosIdsConOrdenes.add(String(o.id_moto));
        });
        console.log('🏍️ IDs de motos con órdenes (Set):', Array.from(motosIdsConOrdenes));
        console.log('🏍️ Mis motos cargadas:', misMotos);
        setMotosConOrdenes(motosIdsConOrdenes);
      } catch (errOrdenes) {
        console.error('No se pudieron obtener las órdenes para validar los botones:', errOrdenes);
      }

    } catch (err) {
      console.error('Error cargando motos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.placa.trim() || !form.marca.trim() || !form.modelo.trim()) {
      Swal.fire('Campos obligatorios', 'Placa, marca y modelo son requeridos.', 'warning');
      return;
    }

    if (!realClientId) {
      Swal.fire('Error de sesión', 'No se pudo identificar tu usuario. Intenta cerrar sesión e ingresar de nuevo.', 'error');
      return;
    }

    try {
      setSaving(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: any = {
        ID_CLIENTES: realClientId,
        id_cliente: Number(realClientId),
        Placa: form.placa.toUpperCase(),
        placa: form.placa.toUpperCase(),
        Marca: form.marca,
        marca: form.marca,
        Modelo: form.modelo,
        modelo: form.modelo,
        cilindraje: form.cilindraje ? Number(form.cilindraje) : null,
        kilometraje: form.kilometraje ? Number(form.kilometraje) : null,
        Recorrido: form.kilometraje ? Number(form.kilometraje) : 0,
      };

      await insertarMoto(payload as MotoPayload);

      Swal.fire({
        title: '¡Moto registrada!',
        html: `Tu motocicleta <strong>${form.placa.toUpperCase()}</strong> ha sido registrada correctamente.`,
        icon: 'success',
        confirmButtonColor: '#ff6600',
      });

      setForm({ placa: '', marca: '', modelo: '', cilindraje: '', kilometraje: '' });
      setShowForm(false);
      await cargarMotos();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Error del servidor';
      Swal.fire('Error', msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cliente-motos">
      {/* Header */}
      <div className="cm-header">
        <div className="cm-header__left">
          <button className="cm-back-btn" onClick={() => navigate('/cliente')}>
            <i className="bi bi-arrow-left"></i>
          </button>
          <div>
            <h2 className="cm-title">
              <i className="bi bi-bicycle"></i> Mis Motocicletas
            </h2>
            <p className="cm-subtitle">
              Administra las motos asociadas a tu cuenta
            </p>
          </div>
        </div>
        <button
          className="cm-add-btn"
          onClick={() => setShowForm(!showForm)}
        >
          <i className={`bi ${showForm ? 'bi-x-lg' : 'bi-plus-lg'}`}></i>
          {showForm ? 'Cancelar' : 'Agregar Moto'}
        </button>
      </div>

      {/* Formulario de nueva moto */}
      {showForm && (
        <div className="cm-form-card cm-fade-in">
          <div className="cm-form-card__header">
            <i className="bi bi-plus-circle-fill"></i>
            <h3>Nueva Motocicleta</h3>
          </div>
          <div className="cm-form-grid">
            <div className="cm-field">
              <label><i className="bi bi-card-text"></i> Placa</label>
              <input
                type="text"
                placeholder="Ej: ABC123"
                value={form.placa}
                onChange={(e) => setForm({ ...form, placa: e.target.value.toUpperCase() })}
                maxLength={7}
              />
            </div>
            <div className="cm-field">
              <label><i className="bi bi-tag"></i> Marca</label>
              <input
                type="text"
                placeholder="Ej: KTM"
                value={form.marca}
                onChange={(e) => setForm({ ...form, marca: e.target.value })}
              />
            </div>
            <div className="cm-field">
              <label><i className="bi bi-wrench"></i> Modelo (Año)</label>
              <input
                type="number"
                placeholder="Ej: 2020"
                value={form.modelo}
                onChange={(e) => setForm({ ...form, modelo: e.target.value })}
              />
            </div>
            <div className="cm-field">
              <label><i className="bi bi-speedometer2"></i> Cilindraje (cc)</label>
              <input
                type="number"
                placeholder="Ej: 390"
                value={form.cilindraje}
                onChange={(e) => setForm({ ...form, cilindraje: e.target.value })}
              />
            </div>
            <div className="cm-field">
              <label><i className="bi bi-signpost"></i> Kilometraje</label>
              <input
                type="number"
                placeholder="Ej: 15000"
                value={form.kilometraje}
                onChange={(e) => setForm({ ...form, kilometraje: e.target.value })}
              />
            </div>
          </div>
          <button
            className="cm-submit-btn"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? (
              <><i className="bi bi-hourglass-split"></i> Registrando...</>
            ) : (
              <><i className="bi bi-check-circle"></i> Registrar Motocicleta</>
            )}
          </button>
        </div>
      )}

      {/* Lista de motos */}
      {loading ? (
        <div className="cm-loading">
          <div className="cm-spinner"></div>
          <p>Cargando tus motocicletas...</p>
        </div>
      ) : motos.length === 0 ? (
        <div className="cm-empty cm-fade-in">
          <div className="cm-empty__icon">
            <i className="bi bi-bicycle"></i>
          </div>
          <h3>No tienes motos registradas</h3>
          <p>Agrega tu primera motocicleta para poder solicitar servicios.</p>
          <button className="cm-add-btn" onClick={() => setShowForm(true)}>
            <i className="bi bi-plus-lg"></i> Agregar mi primera moto
          </button>
        </div>
      ) : (
        <div className="cm-grid cm-fade-in">
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          {motos.map((moto: any, index: number) => {
            const placa = moto.placa || moto.Placa || '---';
            const marca = moto.marca || moto.Marca || '---';
            const modelo = moto.modelo || moto.Modelo || '---';
            const cilindraje = moto.cilindraje || moto.Cilindraje || null;
            const kilometraje = moto.kilometraje || moto.Kilometraje || moto.Recorrido || null;

            return (
              <div
                className="cm-moto-card cm-fade-in"
                key={moto.id_moto || moto.ID_MOTOS || index}
                style={{ animationDelay: `${index * 0.08}s` }}
              >
                <div className="cm-moto-card__badge">
                  <i className="bi bi-bicycle"></i>
                </div>
                <div className="cm-moto-card__placa">{placa}</div>
                <div className="cm-moto-card__brand">
                  {marca} <span>{modelo}</span>
                </div>
                <div className="cm-moto-card__divider"></div>
                <div className="cm-moto-card__specs">
                  {cilindraje && (
                    <div className="cm-spec">
                      <i className="bi bi-speedometer2"></i>
                      <span>{cilindraje}cc</span>
                    </div>
                  )}
                  {kilometraje && (
                    <div className="cm-spec">
                      <i className="bi bi-signpost"></i>
                      <span>{Number(kilometraje).toLocaleString('es-CO')} km</span>
                    </div>
                  )}
                </div>

                {/* Acciones de Ordenes */}
                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                  {motosConOrdenes.has(String(moto.id_moto || moto.ID_MOTOS)) ? (
                    <button 
                      className="cm-submit-btn" 
                      style={{ padding: '0.6rem 1rem', fontSize: '0.9rem', width: '100%' }}
                      onClick={() => navigate('/cliente/ordenes')}
                    >
                      <i className="bi bi-eye"></i> Ver Órdenes
                    </button>
                  ) : (
                    <button 
                      className="cm-add-btn" 
                      style={{ padding: '0.6rem 1rem', fontSize: '0.9rem', width: '100%' }}
                      onClick={() => navigate('/')}
                    >
                      <i className="bi bi-plus-circle"></i> Crear Nueva Orden
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ClienteMotos;
