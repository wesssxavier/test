import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(err);
  },
);

export default api;

// Auth
export const authApi = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  me: () => api.get('/auth/me'),
  getUsers: () => api.get('/auth/users'),
  createUser: (data: any) => api.post('/auth/users', data),
  updateUser: (id: string, data: any) => api.patch(`/auth/users/${id}`, data),
};

// Events
export const eventsApi = {
  list: () => api.get('/events'),
  get: (id: string) => api.get(`/events/${id}`),
  create: (data: any) => api.post('/events', data),
  update: (id: string, data: any) => api.patch(`/events/${id}`, data),
  delete: (id: string) => api.delete(`/events/${id}`),
};

// Guests
export const guestsApi = {
  list: (eventId: string, params?: any) =>
    api.get(`/events/${eventId}/guests`, { params }),
  get: (eventId: string, id: string) =>
    api.get(`/events/${eventId}/guests/${id}`),
  create: (eventId: string, data: any) =>
    api.post(`/events/${eventId}/guests`, data),
  update: (eventId: string, id: string, data: any) =>
    api.patch(`/events/${eventId}/guests/${id}`, data),
  delete: (eventId: string, id: string) =>
    api.delete(`/events/${eventId}/guests/${id}`),
  bulkUpdate: (eventId: string, guestIds: string[], updates: any) =>
    api.patch(`/events/${eventId}/guests/bulk`, { guestIds, updates }),
  bulkDelete: (eventId: string, guestIds: string[]) =>
    api.delete(`/events/${eventId}/guests/bulk`, { data: { guestIds } }),
  duplicate: (eventId: string, id: string) =>
    api.post(`/events/${eventId}/guests/${id}/duplicate`),
};

// Tables
export const tablesApi = {
  list: (eventId: string) => api.get(`/events/${eventId}/tables`),
  create: (eventId: string, data: any) =>
    api.post(`/events/${eventId}/tables`, data),
  update: (eventId: string, id: string, data: any) =>
    api.patch(`/events/${eventId}/tables/${id}`, data),
  delete: (eventId: string, id: string) =>
    api.delete(`/events/${eventId}/tables/${id}`),
};

// Seating
export const seatingApi = {
  list: (eventId: string) => api.get(`/events/${eventId}/seating`),
  assign: (eventId: string, data: any) =>
    api.post(`/events/${eventId}/seating`, data),
  update: (eventId: string, id: string, data: any) =>
    api.patch(`/events/${eventId}/seating/${id}`, data),
  remove: (eventId: string, id: string) =>
    api.delete(`/events/${eventId}/seating/${id}`),
  warnings: (eventId: string) =>
    api.get(`/events/${eventId}/seating/warnings`),
};

// Relationships
export const relationshipsApi = {
  list: (eventId: string) => api.get(`/events/${eventId}/relationships`),
  create: (eventId: string, data: any) =>
    api.post(`/events/${eventId}/relationships`, data),
  delete: (eventId: string, id: string) =>
    api.delete(`/events/${eventId}/relationships/${id}`),
};

// Custom fields
export const customFieldsApi = {
  list: (eventId: string) => api.get(`/events/${eventId}/custom-fields`),
  create: (eventId: string, data: any) =>
    api.post(`/events/${eventId}/custom-fields`, data),
  update: (eventId: string, id: string, data: any) =>
    api.patch(`/events/${eventId}/custom-fields/${id}`, data),
  delete: (eventId: string, id: string) =>
    api.delete(`/events/${eventId}/custom-fields/${id}`),
};

// Imports
export const importsApi = {
  upload: (eventId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/events/${eventId}/imports/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  preview: (eventId: string, jobId: string) =>
    api.get(`/events/${eventId}/imports/${jobId}/preview`),
  execute: (eventId: string, jobId: string, mappings: any) =>
    api.post(`/events/${eventId}/imports/${jobId}/execute`, { mappings }),
  list: (eventId: string) => api.get(`/events/${eventId}/imports`),
};

// Exports
export const exportsApi = {
  guests: (eventId: string, format: 'xlsx' | 'csv', params?: any) =>
    api.get(`/events/${eventId}/exports/guests`, {
      params: { format, ...params },
      responseType: 'blob',
    }),
  checkInList: (eventId: string, format: string) =>
    api.get(`/events/${eventId}/exports/check-in-list`, {
      params: { format },
      responseType: 'blob',
    }),
  tableLists: (eventId: string, format: string) =>
    api.get(`/events/${eventId}/exports/table-lists`, {
      params: { format },
      responseType: 'blob',
    }),
};

// Check-in
export const checkInApi = {
  checkIn: (eventId: string, guestId: string, notes?: string) =>
    api.post(`/events/${eventId}/check-in/${guestId}`, { notes }),
  undoCheckIn: (eventId: string, guestId: string) =>
    api.post(`/events/${eventId}/check-in/${guestId}/undo`),
  walkIn: (eventId: string, data: any) =>
    api.post(`/events/${eventId}/check-in/walk-in`, data),
  logs: (eventId: string) => api.get(`/events/${eventId}/check-in/logs`),
};

// Dashboard
export const dashboardApi = {
  stats: (eventId: string) => api.get(`/events/${eventId}/dashboard`),
};

// Saved views
export const savedViewsApi = {
  list: (eventId: string) => api.get(`/events/${eventId}/saved-views`),
  create: (eventId: string, data: any) =>
    api.post(`/events/${eventId}/saved-views`, data),
  update: (eventId: string, id: string, data: any) =>
    api.patch(`/events/${eventId}/saved-views/${id}`, data),
  delete: (eventId: string, id: string) =>
    api.delete(`/events/${eventId}/saved-views/${id}`),
};

// Room elements
export const roomElementsApi = {
  list: (eventId: string) => api.get(`/events/${eventId}/room-elements`),
  create: (eventId: string, data: any) =>
    api.post(`/events/${eventId}/room-elements`, data),
  update: (eventId: string, id: string, data: any) =>
    api.patch(`/events/${eventId}/room-elements/${id}`, data),
  delete: (eventId: string, id: string) =>
    api.delete(`/events/${eventId}/room-elements/${id}`),
};

// Audit
export const auditApi = {
  list: (params?: any) => api.get('/audit', { params }),
  byEntity: (entityType: string, entityId: string) =>
    api.get(`/audit/${entityType}/${entityId}`),
};
