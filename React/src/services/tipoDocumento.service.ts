import { BaseApiService } from './base.service';

export interface TipoDocumentoPayload {
  id_tipo_documento: number;
  nombre: string;
}

export type TipoDocumentoRecord = TipoDocumentoPayload;

export const tipoDocumentoService = new BaseApiService<TipoDocumentoPayload>({
  baseUrl: '/tipos-documento',
});

export const obtenerTiposDocumento = () => tipoDocumentoService.obtenerTodos();
export const obtenerTipoDocumentoPorId = (id: string | number) => tipoDocumentoService.obtenerPorId(id);
