import axios, { AxiosInstance, AxiosResponse } from 'axios';
import apiClient from '../config/axios';

export interface ApiConfig {
  baseUrl: string;
  routes?: {
    listPrimary?: string; listFallback?: string;
    getByIdPrimary?: string; getByIdFallback?: string;
    createPrimary?: string; createFallback?: string;
    updatePrimary?: string; updateFallback?: string;
    deletePrimary?: string; deleteFallback?: string;
  };
}

interface RouteMap {
  listPrimary: string; listFallback: string;
  getByIdPrimary: string; getByIdFallback: string;
  createPrimary: string; createFallback: string;
  updatePrimary: string; updateFallback: string;
  deletePrimary: string; deleteFallback: string;
}

export class BaseApiService<T> {
  protected readonly baseUrl: string;
  protected readonly http: AxiosInstance;
  protected routes: RouteMap;

  constructor(config: ApiConfig, http: AxiosInstance = apiClient) {
    this.baseUrl = config.baseUrl;
    this.http = http;
    this.routes = {
      listPrimary: '/obtener', listFallback: '',
      getByIdPrimary: '/buscar/:id', getByIdFallback: '/:id',
      createPrimary: '/insertar', createFallback: '',
      updatePrimary: '/actualizar/:id', updateFallback: '/:id',
      deletePrimary: '/eliminar/:id', deleteFallback: '/:id',
      ...(config.routes || {})
    } as RouteMap;
  }

  protected resolvePath(path: string, id?: string | number) {
    return path.replace(':id', String(id ?? '').trim());
  }

  protected async fallbackRequest<TData>(
    primary: () => Promise<AxiosResponse<TData>>,
    fallback: () => Promise<AxiosResponse<TData>>
  ) {
    try { return await primary(); }
    catch (error: any) {
      if (axios.isAxiosError(error) && error.response?.status === 404) return await fallback();
      throw error;
    }
  }

  async obtenerTodos() {
    return this.fallbackRequest(
      () => this.http.get(`${this.baseUrl}${this.routes.listPrimary}`),
      () => this.http.get(`${this.baseUrl}${this.routes.listFallback}`)
    );
  }

  async obtenerPorId(id: string | number) {
    return this.fallbackRequest(
      () => this.http.get(`${this.baseUrl}${this.resolvePath(this.routes.getByIdPrimary, id)}`),
      () => this.http.get(`${this.baseUrl}${this.resolvePath(this.routes.getByIdFallback, id)}`)
    );
  }

  private sanitizePayload(payload: unknown): unknown {
    if (payload === null || payload === undefined) return payload;
    if (Array.isArray(payload)) {
      return payload.map(item => this.sanitizePayload(item));
    }
    if (typeof payload === 'object') {
      const sanitized: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
        if (key === 'especialidad') continue;
        sanitized[key] = this.sanitizePayload(value);
      }
      return sanitized;
    }
    return payload;
  }

  private preparePayload(datos: T): T {
    const cleanData = this.sanitizePayload(JSON.parse(JSON.stringify(datos)));
    if (JSON.stringify(datos).includes('especialidad')) {
      console.warn('[BaseApiService] removed especialidad from payload', {
        original: datos,
        cleaned: cleanData,
      });
    }
    return cleanData as T;
  }

  async crear(datos: T) {
    const payload = this.preparePayload(datos);
    return this.fallbackRequest(
      () => this.http.post(`${this.baseUrl}${this.routes.createPrimary}`, payload),
      () => this.http.post(`${this.baseUrl}${this.routes.createFallback || ''}`, payload)
    );
  }

  async actualizar(id: string | number, datos: T) {
    const payload = this.preparePayload(datos);
    const cleanId = String(id ?? '').trim();
    if (!cleanId) return this.http.put(`${this.baseUrl}/actualizar`, payload);
    return this.fallbackRequest(
      () => this.http.put(`${this.baseUrl}${this.resolvePath(this.routes.updatePrimary, id)}`, payload),
      () => this.http.put(`${this.baseUrl}${this.resolvePath(this.routes.updateFallback, id)}`, payload)
    );
  }

  async eliminar(id: string | number) {
    return this.fallbackRequest(
      () => this.http.delete(`${this.baseUrl}${this.resolvePath(this.routes.deletePrimary, id)}`),
      () => this.http.delete(`${this.baseUrl}${this.resolvePath(this.routes.deleteFallback, id)}`)
    );
  }
}