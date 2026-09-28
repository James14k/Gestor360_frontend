/**
 * Configuracion AWS 
 */
export const ENV = {
  appName: 'Pedidos360',
  appTagline: 'Gestión logística y cumplimiento Suspel',
  companyLine: 'Operaciones · Inventario · Seguridad',
  supportHint: 'Si el problema continúa, contacte al administrador del sistema.',

  apiBaseUrl: 'https://477gj9nbjh.execute-api.us-east-1.amazonaws.com/Deploy/api',

  cognito: {
    userPoolId: 'us-east-1_3xGcPKuwF',
    userPoolClientId: '4lud53d38qj4pje0f3urqi9ms9',
    domain: 'us-east-13xgcpkuwf.auth.us-east-1.amazoncognito.com',
    scopes: ['openid', 'email', 'profile', 'suspel-api/productos-access'],
    redirectSignIn: 'http://localhost:4200',
    redirectSignOut: 'http://localhost:4200',
  },

  pagination: {
    defaultPageSize: 10,
    pageSizeOptions: [5, 10, 25, 50],
  },

  storageKeys: {
    pageSize: 'pedidos360_page_size',
  },
} as const;
