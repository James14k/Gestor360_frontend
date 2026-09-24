/**
 * Configuración centralizada del frontend Pedidos360.
 * apiBaseUrl: solo uso interno (no se muestra al usuario final).
 */
const AppConfig = Object.freeze({
  appName: 'Pedidos360',
  appTagline: 'Gestión logística y cumplimiento Suspel',
  companyLine: 'Operaciones · Inventario · Seguridad',
  supportHint: 'Si el problema continúa, contacte al administrador del sistema.',
  apiBaseUrl: 'http://localhost:8080/api',
  requestTimeoutMs: 30000,
  pagination: {
    defaultPageSize: 10,
    pageSizeOptions: [5, 10, 25, 50],
  },
  storageKeys: {
    pageSize: 'pedidos360_page_size',
  },
});

export default AppConfig;
