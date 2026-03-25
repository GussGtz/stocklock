import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL as string) || '/api/v1',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor — attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('stocklock_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error),
)

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const auth = useAuthStore()
      auth.logout()
      router.push('/login')
    }
    return Promise.reject(error)
  },
)

export default api

// ─────────────────────────────────────────────
// API endpoints
// ─────────────────────────────────────────────

export const authApi = {
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  profile: () => api.get('/auth/profile'),
  updateProfile: (data: any) => api.patch('/auth/profile', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) => api.post('/auth/change-password', data),
}

export const productsApi = {
  list: (params?: any) => api.get('/products', { params }),
  get: (id: string) => api.get(`/products/${id}`),
  create: (data: any) => api.post('/products', data),
  update: (id: string, data: any) => api.patch(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
  lowStock: () => api.get('/products/low-stock'),
}

export const categoriesApi = {
  list: () => api.get('/categories'),
  create: (data: any) => api.post('/categories', data),
  update: (id: string, data: any) => api.patch(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
}

export const inventoryApi = {
  movements: (params?: any) => api.get('/inventory/movements', { params }),
  kardex: (productId: string, params?: any) => api.get(`/inventory/kardex/${productId}`, { params }),
  stock: (productId: string) => api.get(`/inventory/stock/${productId}`),
  createMovement: (data: any) => api.post('/inventory/movements', data),
  adjust: (data: any) => api.post('/inventory/adjust', data),
  transfer: (data: any) => api.post('/inventory/transfer', data),
  summary: () => api.get('/inventory/summary'),
}

export const warehousesApi = {
  list: () => api.get('/warehouses'),
  get: (id: string) => api.get(`/warehouses/${id}`),
  create: (data: any) => api.post('/warehouses', data),
  update: (id: string, data: any) => api.patch(`/warehouses/${id}`, data),
  inventory: (id: string) => api.get(`/warehouses/${id}/inventory`),
}

export const suppliersApi = {
  list: (params?: any) => api.get('/suppliers', { params }),
  get: (id: string) => api.get(`/suppliers/${id}`),
  create: (data: any) => api.post('/suppliers', data),
  update: (id: string, data: any) => api.patch(`/suppliers/${id}`, data),
  delete: (id: string) => api.delete(`/suppliers/${id}`),
}

export const customersApi = {
  list: (params?: any) => api.get('/customers', { params }),
  get: (id: string) => api.get(`/customers/${id}`),
  create: (data: any) => api.post('/customers', data),
  update: (id: string, data: any) => api.patch(`/customers/${id}`, data),
  delete: (id: string) => api.delete(`/customers/${id}`),
}

export const purchasesApi = {
  list: (params?: any) => api.get('/purchases', { params }),
  get: (id: string) => api.get(`/purchases/${id}`),
  create: (data: any) => api.post('/purchases', data),
  update: (id: string, data: any) => api.patch(`/purchases/${id}`, data),
  receive: (id: string, data: any) => api.post(`/purchases/${id}/receive`, data),
  cancel: (id: string) => api.post(`/purchases/${id}/cancel`),
  pdf: (id: string) => api.get(`/purchases/${id}/pdf`, { responseType: 'blob' }),
}

export const salesApi = {
  list: (params?: any) => api.get('/sales', { params }),
  get: (id: string) => api.get(`/sales/${id}`),
  create: (data: any) => api.post('/sales', data),
  confirm: (id: string) => api.post(`/sales/${id}/confirm`),
  deliver: (id: string) => api.post(`/sales/${id}/deliver`),
  cancel: (id: string) => api.post(`/sales/${id}/cancel`),
  pdf: (id: string) => api.get(`/sales/${id}/pdf`, { responseType: 'blob' }),
}

export const productionApi = {
  list: (params?: any) => api.get('/production', { params }),
  get: (id: string) => api.get(`/production/${id}`),
  create: (data: any) => api.post('/production', data),
  start: (id: string) => api.post(`/production/${id}/start`),
  complete: (id: string, data: any) => api.post(`/production/${id}/complete`, data),
  cancel: (id: string) => api.post(`/production/${id}/cancel`),
}

export const reportsApi = {
  inventory: (params?: any) => api.get('/reports/inventory', { params }),
  sales: (params?: any) => api.get('/reports/sales', { params }),
  purchases: (params?: any) => api.get('/reports/purchases', { params }),
  topProducts: (params?: any) => api.get('/reports/top-products', { params }),
  dashboard: () => api.get('/reports/dashboard'),
  export: (type: string, params?: any) => api.get(`/reports/export/${type}`, { params, responseType: 'blob' }),
}

export const alertsApi = {
  list: () => api.get('/alerts'),
  read: (id: string) => api.patch(`/alerts/notifications/${id}/read`),
  dismiss: (id: string) => api.delete(`/alerts/${id}`),
}

export const usersApi = {
  list: (params?: any) => api.get('/users', { params }),
  get: (id: string) => api.get(`/users/${id}`),
  update: (id: string, data: any) => api.patch(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
  changePassword: (id: string, data: any) => api.post(`/users/${id}/change-password`, data),
}

export const seriesApi = {
  list: () => api.get('/series'),
  get: (id: string) => api.get(`/series/${id}`),
  create: (data: any) => api.post('/series', data),
  update: (id: string, data: any) => api.patch(`/series/${id}`, data),
  toggle: (id: string) => api.patch(`/series/${id}/toggle`),
  delete: (id: string) => api.delete(`/series/${id}`),
}

export const sectorsApi = {
  list: () => api.get('/sectors'),
  create: (data: any) => api.post('/sectors', data),
  update: (id: string, data: any) => api.patch(`/sectors/${id}`, data),
  toggle: (id: string) => api.patch(`/sectors/${id}/toggle`),
  delete: (id: string) => api.delete(`/sectors/${id}`),
  // Types
  listTypes: (sectorId: string) => api.get(`/sectors/${sectorId}/types`),
  createType: (sectorId: string, data: any) => api.post(`/sectors/${sectorId}/types`, data),
  updateType: (sectorId: string, typeId: string, data: any) => api.patch(`/sectors/${sectorId}/types/${typeId}`, data),
  toggleType: (sectorId: string, typeId: string) => api.patch(`/sectors/${sectorId}/types/${typeId}/toggle`),
  deleteType: (sectorId: string, typeId: string) => api.delete(`/sectors/${sectorId}/types/${typeId}`),
}

export const cfdiApi = {
  // Config
  getConfig: () => api.get('/cfdi/config'),
  updateConfig: (data: any) => api.patch('/cfdi/config', data),
  testConnection: () => api.get('/cfdi/config/test'),
  getUtiles: () => api.get('/cfdi/utiles'),
  // Invoice actions (per sale)
  generateInvoice: (saleId: string, data: any = {}) => api.post(`/cfdi/sales/${saleId}/invoice`, data),
  cancelInvoice: (saleId: string, data: any) => api.delete(`/cfdi/sales/${saleId}/invoice`, { data }),
  getInvoiceFiles: (saleId: string) => api.get(`/cfdi/sales/${saleId}/invoice/files`),
  emailInvoice: (saleId: string, email: string) => api.post(`/cfdi/sales/${saleId}/invoice/email`, {}, { params: { email } }),
  // Customer sync
  syncCustomer: (customerId: string) => api.post(`/cfdi/customers/${customerId}/sync`),
}
