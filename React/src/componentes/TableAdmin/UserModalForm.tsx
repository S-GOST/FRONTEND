import React, { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import type { TipoDocumentoRecord } from '../../services/tipoDocumento.service';

export type UserFormData = {
  numero_documento: string;
  id_tipo_documento: string;
  nombre: string;
  correo: string;
  telefono: string;
  usuario: string;
  password?: string;
  ciudad?: string;
};

interface UserModalFormProps {
  showCreateModal: boolean;
  showEditModal: boolean;
  activeTab: string;
  formData: UserFormData;
  tiposDocumento: TipoDocumentoRecord[];
  getTabLabel: (tab: string) => string;
  handleInputChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleCreate: (e: FormEvent<HTMLFormElement>) => void;
  handleUpdate: (e: FormEvent<HTMLFormElement>) => void;
  closeCreateModal: () => void;
  closeEditModal: () => void;
}

export const UserModalForm: React.FC<UserModalFormProps> = ({
  showCreateModal,
  showEditModal,
  activeTab,
  formData,
  tiposDocumento,
  getTabLabel,
  handleInputChange,
  handleCreate,
  handleUpdate,
  closeCreateModal,
  closeEditModal
}) => {
  const [showPassword, setShowPassword] = useState(false);

  if (!showCreateModal && !showEditModal) return null;

  return (
    <div className="modal-overlay" onClick={showCreateModal ? closeCreateModal : closeEditModal}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{showCreateModal ? `Crear ${getTabLabel(activeTab).slice(0, -1)}` : `Editar ${getTabLabel(activeTab).slice(0, -1)}`}</h3>
          <button type="button" className="close-btn" onClick={showCreateModal ? closeCreateModal : closeEditModal}>
            &times;
          </button>
        </div>
        <form onSubmit={showCreateModal ? handleCreate : handleUpdate}>
          <div className="form-group">
            <label>Documento</label>
            <input
              type="text"
              name="numero_documento"
              value={formData.numero_documento}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Nombre</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              onKeyDown={(e) => { if (/\d/.test(e.key)) e.preventDefault(); }}
              pattern="^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$"
              required
            />
          </div>
          <div className="form-group">
            <label>Correo</label>
            <input
              type="email"
              name="correo"
              value={formData.correo}
              onChange={handleInputChange}
              required
            />
          </div>
          {(activeTab === 'clientes' || activeTab === 'pendientes') && (
            <div className="form-group">
              <label>Ubicación (Ciudad)</label>
              <input
                type="text"
                name="ciudad"
                value={formData.ciudad || ''}
                onChange={handleInputChange}
                required
              />
            </div>
          )}
          <div className="form-group">
            <label>Tipo de documento</label>
            <select
              name="id_tipo_documento"
              value={String(formData.id_tipo_documento || '')}
              onChange={handleInputChange}
              required
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
            <label>Teléfono</label>
            <input
              type="text"
              name="telefono"
              value={formData.telefono}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Usuario</label>
            <input
              type="text"
              name="usuario"
              value={formData.usuario}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label>{showCreateModal ? 'Contraseña' : 'Nueva contraseña'}</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password || ''}
                onChange={handleInputChange}
                placeholder={showCreateModal ? 'Ingresa la contraseña' : 'Dejar en blanco para mantener la actual'}
                {...(showCreateModal ? { required: true } : {})}
                style={{ flex: 1, paddingRight: '40px' }}
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
                  color: '#ff6b00',
                  cursor: 'pointer'
                }}
              >
                <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
              </button>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={showCreateModal ? closeCreateModal : closeEditModal}>
              Cancelar
            </button>
            <button type="submit">{showCreateModal ? 'Guardar' : 'Guardar cambios'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
