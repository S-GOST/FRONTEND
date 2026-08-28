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

  const closeModal = showCreateModal ? closeCreateModal : closeEditModal;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      onClick={closeModal}
      onKeyDown={(e) => { if (e.key === 'Escape') closeModal(); }}
      tabIndex={-1}
    >
      <div className="modal-container" role="document" onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{showCreateModal ? `Crear ${getTabLabel(activeTab).slice(0, -1)}` : `Editar ${getTabLabel(activeTab).slice(0, -1)}`}</h3>
          <button type="button" className="close-btn" onClick={closeModal}>
            &times;
          </button>
        </div>
        <form onSubmit={showCreateModal ? handleCreate : handleUpdate}>
          <div className="form-group">
            <label htmlFor="user-numero_documento">Documento</label>
            <input
              id="user-numero_documento"
              type="text"
              name="numero_documento"
              value={formData.numero_documento}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="user-nombre">Nombre</label>
            <input
              id="user-nombre"
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
            <label htmlFor="user-correo">Correo</label>
            <input
              id="user-correo"
              type="email"
              name="correo"
              value={formData.correo}
              onChange={handleInputChange}
              required
            />
          </div>
          {(activeTab === 'clientes' || activeTab === 'pendientes') && (
            <div className="form-group">
              <label htmlFor="user-ciudad">Ubicación (Ciudad)</label>
              <input
                id="user-ciudad"
                type="text"
                name="ciudad"
                value={formData.ciudad || ''}
                onChange={handleInputChange}
                required
              />
            </div>
          )}
          <div className="form-group">
            <label htmlFor="user-id_tipo_documento">Tipo de documento</label>
            <select
              id="user-id_tipo_documento"
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
            <label htmlFor="user-telefono">Teléfono</label>
            <input
              id="user-telefono"
              type="text"
              name="telefono"
              value={formData.telefono}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="user-usuario">Usuario</label>
            <input
              id="user-usuario"
              type="text"
              name="usuario"
              value={formData.usuario}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="user-password">{showCreateModal ? 'Contraseña' : 'Nueva contraseña'}</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                id="user-password"
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
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
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
            <button type="button" onClick={closeModal}>
              Cancelar
            </button>
            <button type="submit">{showCreateModal ? 'Guardar' : 'Guardar cambios'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
