# Pedidos360 Frontend

Interfaz web profesional para la gestión de productos **Suspel**, integrada con el backend Spring Boot del repositorio (`/api/productos`).

## Stack

- HTML5 semántico
- CSS3 (variables + componentes)
- JavaScript ES modules (ES6+)
- Bootstrap 5.3
- Bootstrap Icons
- Fetch API (cliente centralizado en `assets/js/api/client.js`)

No se utilizan frameworks SPA (React, Angular, Vue).

## Análisis del backend (contrato real)

| Método | Ruta | Body JSON | Respuesta | Códigos |
|--------|------|-----------|-----------|---------|
| `GET` | `/api/productos` | — | `ProductoSuspel[]` | 200 |
| `GET` | `/api/productos/{id}` | — | `ProductoSuspel` | 200, 404 |
| `POST` | `/api/productos` | `{ nombre, imo, bodega, cantidad }` | `ProductoSuspel` | 201 |
| `PUT` | `/api/productos/{id}` | `{ nombre, imo, bodega, cantidad }` | `ProductoSuspel` | 200, 404 |
| `DELETE` | `/api/productos/{id}` | — | vacío | 204, 404 |

### Modelo `ProductoSuspel`

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | `number` | Generado por el backend (no enviar en POST) |
| `nombre` | `string` | |
| `imo` | `string` | Clasificación IMO (texto libre en backend) |
| `bodega` | `string` | |
| `cantidad` | `integer` | |

**Autenticación:** no implementada en el código actual del backend. El README del backend menciona AWS Cognito a futuro; cuando exista en la API, extender `api/client.js` con headers de token y páginas de login.

**Paginación / filtros en servidor:** no disponibles; el listado es `findAll()`. El frontend aplica búsqueda, filtros, ordenamiento y paginación en cliente.

**CORS:** configurado en el backend para `*` y métodos `GET, POST, PUT, DELETE, OPTIONS`.

## Estructura

```text
frontend/
├── index.html
├── pages/
│   ├── dashboard.html
│   └── productos.html
├── assets/
│   ├── css/
│   ├── js/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── utils/
│   │   └── validators/
│   └── images/
└── README.md
```

## Configuración

Editar `assets/js/config.js`:

```javascript
apiBaseUrl: 'http://localhost:8080/api'
```

Para otros entornos (staging/producción), cambiar solo esta constante o externalizarla en un archivo de despliegue.

## Ejecución local

1. Iniciar el backend (puerto **8080** por defecto):

   ```bash
   ./mvnw spring-boot:run
   ```

2. Servir el frontend con un servidor estático (requerido por ES modules).

   **Opción A — Python (recomendada si no tienes Node.js):**

   ```bash
   cd frontend
   python3 -m http.server 5500
   ```

   Si aparece `Address already in use`, el puerto está ocupado. Usa otro puerto, por ejemplo:

   ```bash
   python3 -m http.server 5501
   ```

   y abre `http://localhost:5501`.

   Para liberar el puerto 5500 en macOS:

   ```bash
   lsof -i :5500
   kill <PID>
   ```

   **Opción B — Node.js (`serve`):** requiere tener Node/npm instalados (`npx` no funciona si Node no está en el PATH).

   ```bash
   npx --yes serve -l 5500
   ```

3. Abrir `http://localhost:5500` (landing) o `http://localhost:5500/pages/productos.html` (ajusta el puerto si usaste otro).

> Abrir los HTML directamente con `file://` puede fallar por políticas CORS de módulos ES; usar siempre un servidor HTTP local.

## Páginas

| Página | Descripción |
|--------|-------------|
| `index.html` | Landing pública, SEO básico y acceso al panel |
| `pages/dashboard.html` | KPIs, stock bajo y distribución por bodega |
| `pages/productos.html` | CRUD, filtros, orden, paginación, validación |

## Extensión del proyecto

- Nuevos recursos REST: crear `services/<recurso>Service.js` y reutilizar `api/client.js`.
- Componentes UI: añadir en `assets/js/components/`.
- Validaciones: `assets/js/validators/`.
- Estilos globales: `assets/css/variables.css` y `components.css`.

## Producción

- Minificar y empaquetar CSS/JS según pipeline de despliegue.
- Servir estáticos desde CDN o reverse proxy; apuntar `apiBaseUrl` al API Gateway / backend desplegado.
- Mantener HTTPS en producción.

## Licencia / créditos

Proyecto académico Duoc UC — integración Pedidos360 / Suspel.
