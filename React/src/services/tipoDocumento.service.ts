import { BaseApiService } from './base.service';

export interface TipoDocumentoPayload {
  id_tipo_documento: number;
  nombre: string;
}

export type TipoDocumentoRecord = TipoDocumentoPayload;

export class TipoDocumentoService extends BaseApiService<TipoDocumentoPayload> {
  constructor() {
    super({
      baseUrl: '/tipos-documento',
    });
  }
}

const tipoDocumentoService = new TipoDocumentoService();

export const obtenerTiposDocumento = () => tipoDocumentoService.obtenerTodos();
export const obtenerTipoDocumentoPorId = (id: string | number) => tipoDocumentoService.obtenerPorId(id);
