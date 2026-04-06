// src/services/motosService.ts
import api from './api';  // ← Corregido: está en la misma carpeta

export type MotoPayload = {
  ID_MOTOS: string;
  ID_CLIENTES: string;
  Placa: string;
  Modelo: string;
  Marca: string;
  Recorrido: number;
};

export type MotoRecord = MotoPayload;

// Obtener todas las motos
export const obtenerMotos = async () => {
  try {
    const response = await api.get('/motos');
    return response;
  } catch (error) {
    console.error('Error al obtener motos:', error);
    throw error;
  }
};

// Crear una nueva moto
export const crearMoto = async (data: MotoPayload) => {
  try {
    const response = await api.post('/motos', data);
    return response;
  } catch (error) {
    console.error('Error al crear moto:', error);
    throw error;
  }
};

// Actualizar una moto existente
export const actualizarMoto = async (id: string, data: MotoPayload) => {
  try {
    const response = await api.put(`/motos/${id}`, data);
    return response;
  } catch (error) {
    console.error('Error al actualizar moto:', error);
    throw error;
  }
};

// Eliminar una moto
export const eliminarMoto = async (id: string) => {
  try {
    const response = await api.delete(`/motos/${id}`);
    return response;
  } catch (error) {
    console.error('Error al eliminar moto:', error);
    throw error;
  }
};