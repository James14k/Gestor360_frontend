import api from '../api/client.js';

const BASE = '/productos';

export const productoService = {
  async listar() {
    const { data } = await api.get(BASE);
    return Array.isArray(data) ? data : [];
  },

  async obtener(id) {
    const { data } = await api.get(`${BASE}/${id}`);
    return data;
  },

  async crear(producto) {
    const { data } = await api.post(BASE, producto);
    return data;
  },

  async actualizar(id, producto) {
    const { data } = await api.put(`${BASE}/${id}`, producto);
    return data;
  },

  async eliminar(id) {
    await api.delete(`${BASE}/${id}`);
    return true;
  },
};

export default productoService;
