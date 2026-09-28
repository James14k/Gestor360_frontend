# Gestor360 Frontend

## 1. Clonar e instalar

```bash
git clone https://github.com/James14k/Gestor360_frontend
npm install
```

## 2. Configuración

Abrir `src/app/core/env.ts` y comprobar que estos valores correspondan al entorno AWS actual:

| Campo | Valor esperado |
|---|---|
| `apiBaseUrl` | `https://477gj9nbjh.execute-api.us-east-1.amazonaws.com/Deploy/api` |
| `cognito.userPoolId` | `us-east-1_3xGcPKuwF` |
| `cognito.userPoolClientId` | `4lud53d38qj4pje0f3urqi9ms9` |
| `cognito.domain` | `us-east-13xgcpkuwf.auth.us-east-1.amazoncognito.com` |
| `cognito.redirectSignIn` / `redirectSignOut` | `http://localhost:4200` |

## 3. Verificar AWS

### EC2

Elastic IP: `54.87.208.71`

Estado del servicio:

```bash
systemctl status suspel --no-pager | head -5
```

Respuesta del backend:

```bash
curl -i http://localhost:8080/api/productos
```

Arranque limpio:

```bash
sudo journalctl -u suspel -n 5 --no-pager
```

### API Gateway

```bash
curl -i https://477gj9nbjh.execute-api.us-east-1.amazonaws.com/Deploy/api/productos
```

## 4. Levantar el frontend

```bash
npm install
npm start
```

---

## Pruebas de seguridad en Postman (200, 401, 403)

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
