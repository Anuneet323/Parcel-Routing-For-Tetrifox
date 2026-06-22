import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5004/api/parcels';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const routeSingle = async (parcelData) => {
  const response = await api.post('/route', parcelData);
  return response.data;
};

export const routeBatch = async (batchData) => {
  const response = await api.post('/batch', batchData);
  return response.data;
};

export const getStats = async () => {
  const response = await api.get('/stats');
  return response.data;
};

export const getParcels = async (params = {}) => {
  const response = await api.get('/', { params });
  return response.data;
};

export const getErrors = async () => {
  const response = await api.get('/errors');
  return response.data;
};

export const resetStats = async () => {
  const response = await api.post('/reset');
  return response.data;
};

export default api;
