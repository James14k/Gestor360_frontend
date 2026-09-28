# Pedidos360 Frontend (Angular)

Frontend de gestión de productos Suspel. Angular 22 (standalone) + Bootstrap 5, autenticación con **Amazon Cognito** vía **AWS Amplify** (Authorization Code + PKCE) y consumo de la API a través de **AWS API Gateway**.

```
Angular (localhost:4200) → Cognito Hosted UI → Access Token JWT
Angular → API Gateway (Cognito Authorizer + scope) → EC2 / Spring Boot (Resource Server)
```

El backend **no se levanta en el PC**: corre en una instancia EC2 de AWS. En el PC solo se ejecuta este frontend.

---

## Paso a paso para levantar el proyecto en otro PC

### 1. Requisitos del PC

Instalar (si no están):

- **Node.js 20 o superior** (incluye npm): https://nodejs.org
- **Git**
- Un navegador (Chrome recomendado) con acceso a internet

Verificar en una terminal:

```bash
node -v
npm -v
git --version
```

### 2. Descargar e instalar

```bash
git clone <URL_DEL_REPO>
cd Gestor360_frontend
npm install
```

`npm install` tarda 1 a 2 minutos. Los avisos `npm warn install-scripts` son normales.

### 3. Verificar la configuración

Abrir `src/app/core/env.ts` y comprobar que estos valores correspondan al entorno AWS actual:

| Campo | Valor esperado |
|---|---|
| `apiBaseUrl` | `https://477gj9nbjh.execute-api.us-east-1.amazonaws.com/Deploy/api` |
| `cognito.userPoolId` | `us-east-1_3xGcPKuwF` |
| `cognito.userPoolClientId` | `4lud53d38qj4pje0f3urqi9ms9` |
| `cognito.domain` | `us-east-13xgcpkuwf.auth.us-east-1.amazoncognito.com` |
| `cognito.redirectSignIn` / `redirectSignOut` | `http://localhost:4200` |

Si la infraestructura AWS se recreó (el Learner Lab puede expirar), hay que actualizar estos valores con los nuevos.

### 4. Antes de la demo: dejar AWS listo (checklist)

Hacer estas verificaciones **en orden**. Cada una indica qué resultado se espera; si no coincide, ir a la sección indicada.

**4.1. Iniciar el laboratorio**

Entrar a AWS Academy, abrir el Learner Lab y pulsar **Start Lab**. Esperar el círculo verde y pulsar **AWS** para abrir la consola.

**4.2. Revisar que la instancia EC2 esté encendida**

Consola AWS → **EC2 → Instances**. La instancia `pedidosuspel360_Emilio_Hawk` debe estar en estado **Running**.

- Comprobar que su **IP pública** sea la Elastic IP `54.87.208.71` (es fija: no cambia al detener e iniciar la instancia).
- Si es distinta, ir a "Si cambió la IP de EC2".
- Si está *Stopped*, iniciarla (**Instance state → Start instance**) y esperar a que quede *Running*; el backend arranca solo, pero conviene esperar 1 minuto y comprobarlo en 4.3.

**4.3. Revisar que el backend esté corriendo en EC2**

Seleccionar la instancia → **Connect** → pestaña *EC2 Instance Connect* → **Connect**. En la terminal que se abre:

```bash
systemctl status suspel --no-pager | head -5
```

El backend corre como servicio (`suspel`) y arranca solo al iniciar la instancia.

- Esperado: `Active: active (running)`.
- Si dice `inactive` o `failed`: ir a "Reiniciar el backend en EC2".

Luego comprobar que responde desde la propia instancia:

```bash
curl -i http://localhost:8080/api/productos
```

- Esperado: `HTTP/1.1 401` (sin token, es lo correcto: la seguridad está activa).

Ver que el arranque fue limpio:

```bash
sudo journalctl -u suspel -n 5 --no-pager
```

- Esperado: una línea con `Started SuspelBackendApplication`.

**4.4. Revisar que API Gateway llegue al backend**

Desde cualquier terminal del PC:

```bash
curl -i https://477gj9nbjh.execute-api.us-east-1.amazonaws.com/Deploy/api/productos
```

- Esperado: `401` con `{"message":"Unauthorized"}` (lo devuelve Gateway porque no lleva token).
- `502` o `504`: Gateway no alcanza EC2 (backend detenido o IP cambiada), volver a 4.2 y 4.3.
- `Missing Authentication Token`: ruta o stage mal escritos.

**4.5. Revisar Cognito**

Abrir en el navegador:

```
https://us-east-13xgcpkuwf.auth.us-east-1.amazoncognito.com/login?client_id=4lud53d38qj4pje0f3urqi9ms9&response_type=code&scope=openid&redirect_uri=http://localhost:4200
```

- Esperado: se muestra la pantalla de login de Cognito.

Si las cinco verificaciones dan lo esperado, la nube está lista y se puede levantar el frontend (paso 5).

### 5. Levantar el frontend

```bash
npm start
```

Esperar el mensaje `Local: http://localhost:4200/`. Abrir exactamente **http://localhost:4200** (no `127.0.0.1` ni otro puerto: la callback registrada en Cognito es esa).

### 6. Probar el flujo completo

1. Pulsar **Iniciar sesión** → redirige a la pantalla de login de Cognito.
2. Iniciar sesión con el usuario de prueba, o crear una cuenta con **Sign up**.
3. Al volver a `localhost:4200`, el menú muestra **Panel** e **Inventario** y el nombre de usuario arriba.
4. Entrar a **Productos**: debe listar los productos. Probar **Nuevo producto**, editar y eliminar.
5. Para ver el JWT viajando: DevTools (F12) → **Network** → request `productos` → **Request Headers** → `Authorization: Bearer ...`.

---

## Pruebas de seguridad en Postman (200, 401, 403)

Sirven para mostrar cómo responde cada capa. Se necesitan **dos tokens**: uno *con* el scope de la API (da 200) y otro *sin* él (da 401 en Gateway y 403 en el backend).

### A. Configurar OAuth 2.0 en Postman

Crear un request nuevo y en la pestaña **Authorization** elegir **Type: OAuth 2.0**. En *Configure New Token* completar:

| Campo | Valor |
|---|---|
| Token Name | `cognito-suspel` |
| Grant Type | `Authorization Code (With PKCE)` |
| Callback URL | `https://oauth.pstmn.io/v1/callback` |
| **Authorize using browser** | **Marcada** (sin esto no se abre el login) |
| Auth URL | `https://us-east-13xgcpkuwf.auth.us-east-1.amazoncognito.com/oauth2/authorize` |
| Access Token URL | `https://us-east-13xgcpkuwf.auth.us-east-1.amazoncognito.com/oauth2/token` |
| Client ID | `4lud53d38qj4pje0f3urqi9ms9` |
| Client Secret | *(vacío, es un cliente público)* |
| Code Challenge Method | `SHA-256` |
| Code Verifier | *(vacío, Postman lo genera)* |
| Scope | ver tabla siguiente |
| State | *(vacío)* |
| Client Authentication | `Send client credentials in body` |

### B. Los dos tokens

| Token | Valor del campo **Scope** | Sirve para |
|---|---|---|
| **Con scope** | `openid email profile suspel-api/productos-access` | Probar el **200** |
| **Sin scope** | `openid email profile` | Probar el **401** (Gateway) y el **403** (backend) |

Para cada uno: cambiar el campo *Scope*, pulsar **Get New Access Token**, iniciar sesión con el usuario de prueba y pulsar **Use Token**. Al cambiar de scope hay que **generar un token nuevo**; el anterior conserva el scope viejo. Para ver los scopes de un token, pegarlo en https://jwt.io y leer el claim `scope`.

En una petición manual con *Bearer Token*, pegar **solo el JWT**, sin la palabra `Bearer`.

### C. Matriz de pruebas

URL de Gateway: `https://477gj9nbjh.execute-api.us-east-1.amazonaws.com/Deploy/api/productos`
URL directa a EC2 (salta Gateway): `http://54.87.208.71:8080/api/productos` (usar la IP pública actual de la instancia)

| # | Prueba | Método y URL | Authorization en Postman | Resultado esperado |
|---|---|---|---|---|
| 1 | Sin token | GET Gateway | **No Auth** | **401** `{"message":"Unauthorized"}` |
| 2 | Token inventado | GET Gateway | Bearer Token → `abc` | **401** `{"message":"Unauthorized"}` |
| 3 | Token válido **sin scope**, por Gateway | GET Gateway | OAuth 2.0 con el token **sin scope** | **401** `{"message":"Unauthorized"}` (Gateway exige el scope) |
| 4 | Token válido **sin scope**, directo a EC2 | GET EC2 directo | OAuth 2.0 con el token **sin scope** | **403 Forbidden** (Spring autentica pero falta el permiso) |
| 5 | Sin token, directo a EC2 | GET EC2 directo | **No Auth** | **401** (el backend también valida: Defense in Depth) |
| 6 | Token válido **con scope**, por Gateway | GET Gateway | OAuth 2.0 con el token **con scope** | **200** con el JSON de productos |
| 7 | Crear producto con scope | POST Gateway | OAuth 2.0 con el token **con scope** | **201 Created** con el producto creado |

Body del POST (pestaña *Body* → *raw* → *JSON*):

```json
{
  "nombre": "Producto de prueba",
  "imo": "Clase 3 - Líquido Inflamable",
  "bodega": "Bodega Z-01",
  "cantidad": 100
}
```

Lectura de los resultados: **401** = no autenticado o token inválido; **403** = autenticado pero sin permiso (scope); **200** = autenticado y autorizado.

Los tokens duran 60 minutos; si una prueba empieza a dar 401 inesperado, generar un token nuevo.

---

## Si algo falla

| Síntoma | Causa probable | Qué hacer |
|---|---|---|
| Al abrir Productos vuelve a la pantalla de login en bucle o falla el login | Callback distinta | Abrir exactamente `http://localhost:4200` |
| Error `invalid_scope` en Cognito | Scope no habilitado en el app client | Cognito → App clients → Login pages: habilitar `openid`, `email`, `profile` y `suspel-api/productos-access` |
| La lista da **401 Unauthorized** con sesión iniciada | Token viejo o sin el scope | **Cerrar sesión**, Ctrl+F5 e iniciar sesión otra vez. Si persiste, revisar que el campo *Token validation* del authorizer `cognito_suspel` esté vacío |
| **502 / 504** en la lista | El backend en EC2 no responde | Ver "Reiniciar el backend en EC2" |
| Error de CORS en la consola | Origen distinto de `http://localhost:4200` | Usar ese origen exacto |
| `Missing Authentication Token` | Ruta o stage incorrectos | Revisar `apiBaseUrl` (stage `Deploy`) |

### Reiniciar el backend en EC2

En la consola AWS → EC2 → instancia → **Connect** → *EC2 Instance Connect*:

```bash
sudo systemctl restart suspel
sudo journalctl -u suspel -n 5 --no-pager
```

Debe aparecer `Started SuspelBackendApplication`. Si se quiere actualizar el JAR, primero descargarlo con `aws s3 cp s3://pedidosuspel360/suspel-backend.jar ./suspel-backend.jar` y luego ejecutar el `restart`. Los datos se reinician con los 20 productos iniciales (la base H2 es en memoria).

### Si cambió la IP de EC2

La instancia tiene la Elastic IP `54.87.208.71`, así que normalmente esto no hace falta. Solo aplica si la IP se perdió (por ejemplo, si se liberó la Elastic IP o se recreó la instancia). En **API Gateway → `suspel-api-gateway` → Resources**, editar la integración de los 5 métodos (GET y POST de `/productos`; GET, PUT y DELETE de `/{id}`), cambiar la IP en *Endpoint URL* y hacer **Deploy API** al stage `Deploy`.

---

## Configuración

Todo está en `src/app/core/env.ts` (ver tabla del paso 3). El scope custom es `suspel-api/productos-access`.

## Estructura

```
src/app/
├── core/
│   ├── auth/        AuthService, authGuard, authInterceptor, amplify-config
│   ├── models/      ProductoSuspel
│   ├── services/    ProductoService (HttpClient)
│   └── env.ts       configuración
├── layout/          topbar + sidebar
├── pages/           landing, dashboard, productos (CRUD)
└── shared/          utilidades y toasts
```

Equivalencias con Azure AD/MSAL: `AuthService` ≈ servicio MSAL, `authGuard` ≈ MsalGuard, `authInterceptor` ≈ MsalInterceptor.

## Comandos

```bash
npm start        # servidor de desarrollo
npm run build    # build de producción en dist/
npm test         # pruebas unitarias
```
