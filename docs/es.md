# Guía del cliente de prueba de la Partner API de Haila

Este proyecto es un **cliente de referencia** para la API de socio de Haila
(`/api/partner/v1`). Cubre todos los endpoints, muestra el formato de las respuestas y
sirve como punto de partida para construir tu propio cliente personalizado.

Stack: **Vue 3 + Vite + PrimeVue 4** (tema oscuro Dracula). El proyecto es independiente:
no depende de la app Haila y puede copiarse/adaptarse libremente.

---

## 1. Requisitos

- **Node.js 20.19+** o **22.12+** (requisito de Vite 7)
- **npm 10+**
- Una **API key de socio** (`X-Api-Key`), emitida por el equipo de Haila. La clave
  identifica al socio y al conjunto de tiendas (workspaces) a las que puede acceder.
- Un **usuario Haila** (correo/contraseña) para las rutas de reservas, disponibilidad y
  precio. Si aún no existe, el propio cliente crea la cuenta vía código de acceso + registro.

## 2. Cómo ejecutar

Dentro de esta carpeta:

```bash
npm install
npm run dev      # abre http://localhost:5199
```

Otros comandos:

| Comando | Descripción |
|---|---|
| `npm run dev` | servidor de desarrollo (puerto 5199) |
| `npm run build` | typecheck + build de producción en `dist/` |
| `npm run preview` | sirve el build de producción (puerto 4199) |
| `npm run typecheck` | verificación de tipos (`vue-tsc`) |

## 3. Configuración (pestaña Conexión)

| Campo | Descripción |
|---|---|
| **URL del engine** | Dirección del engine de Haila, ej.: `https://haila-java.haila.app`. Puedes pegarla con o sin el sufijo `/api/partner/v1` — el cliente lo normaliza. |
| **X-Api-Key** | La clave del socio. Se envía en **todas** las peticiones. |

Los valores se guardan en el `localStorage` del navegador (clave
`haila-partner-api-client`), por lo que sobreviven al recargar la página.

El botón **Probar clave** hace un login con credenciales inválidas a propósito: si la
respuesta es `invalid credentials`, el engine aceptó la clave. Si responde
`invalid api key`, la clave es incorrecta o pertenece a otro entorno.

## 4. Autenticación

La Partner API tiene su propio flujo de autenticación. El token emitido **no** abre el
schema GraphQL de Haila y solo vale para el socio que lo emitió (7 días).

| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| POST | `/auth/access-code` | `{ "email": "..." }` | `{ "sent": true }` — envía el código por correo |
| POST | `/auth/register` | `{ "email", "password", "firstName", "lastName", "phoneNumber", "code" }` | `{ "token", "expiresIn" }` |
| POST | `/auth/login` | `{ "email", "password" }` | `{ "token", "expiresIn" }` |

Observaciones:

- El `X-Api-Key` es obligatorio en **todas** las rutas, incluidas `login`, `register` y
  `access-code` (que no usan Bearer).
- `register` requiere un `code` obtenido antes vía `/auth/access-code`.
- El login valida la misma contraseña bcrypt de la cuenta Haila.
- El campo `expiresIn` viene en segundos (604800 = 7 días).

En la interfaz, la pestaña **Autenticación** tiene las tres operaciones (Login, Registro,
Código de acceso) y muestra el token actual con contador de expiración.

## 5. Endpoints

Todas las rutas están bajo `/api/partner/v1` y requieren `X-Api-Key`.
Las rutas marcadas con **Bearer** también requieren `Authorization: Bearer <token>`.

| Método | Ruta | Bearer | Descripción |
|---|---|---|---|
| POST | `/auth/access-code` | no | envía el código de acceso |
| POST | `/auth/register` | no | crea la cuenta y devuelve token |
| POST | `/auth/login` | no | autentica y devuelve token |
| GET | `/reservations` | sí | lista las reservas del usuario en las tiendas de la clave |
| POST | `/reservations` | sí | crea una reserva |
| GET | `/reservations/{id}` | sí | detalle de una reserva |
| PATCH | `/reservations/{id}` | sí | actualiza fechas/dependientes |
| POST | `/reservations/{id}/cancel` | sí | cancela la reserva |
| POST | `/availability` | sí | consulta de disponibilidad |
| POST | `/pricing` | sí | cálculo de precio |

## 6. Formato de las respuestas

Éxito y error usan el mismo envelope:

```json
{
  "success": true,
  "code": "OK",
  "payload": { },
  "errorMessages": []
}
```

En error, `success` es `false`, `payload` es `null` y `errorMessages` trae los mensajes:

```json
{
  "success": false,
  "code": "NOT_FOUND",
  "payload": null,
  "errorMessages": ["workspace not found"]
}
```

Códigos posibles:

| code | HTTP | Significado |
|---|---|---|
| `OK` | 200 | éxito |
| `VALIDATION` | 400 | cuerpo/campos inválidos |
| `UNAUTHORIZED` | 401 | clave inválida, token inválido/expirado o credenciales incorrectas |
| `NOT_FOUND` | 404 | tienda/área/reserva fuera del alcance o inexistente |
| `CONFLICT` | 409 | conflicto (ej.: la tienda ya pertenece a otra clave) |
| `FAILED` | 400/500 | fallo al ejecutar la operación |
| `UNAVAILABLE` | 503 | Partner API aún no configurada en el engine |

En el cliente Vue, el helper `PartnerApiError` (`src/api/partner.ts`) contiene `status`,
`code` y `messages`, y la utilidad `notifyError` (`src/utils/feedback.ts`) muestra el error
en un toast.

## 7. Reservas

### Crear

```json
POST /reservations
{
  "workspaceId": "uuid-de-la-tienda",
  "areaId": "uuid-del-area",
  "startDate": "2026-10-10T13:00:00Z",
  "endDate": "2026-10-10T14:00:00Z",
  "dependents": 0
}
```

- Fechas en ISO 8601 **con timezone** (el cliente convierte la hora local a UTC).
- Si el usuario aún no es cliente de la tienda, la API crea automáticamente el vínculo
  primario con permiso `client` solo en esa tienda.
- Una tienda fuera de la clave responde como inexistente (`NOT_FOUND`).
- La respuesta es el objeto de la reserva ya creada (ver abajo).

### Listar y detallar

- `GET /reservations` devuelve hasta 200 reservas, ordenadas por fecha de inicio (desc).
- Una reserva solo aparece cuando se cumplen las dos condiciones: el **destinatario**
  pertenece al usuario del token **y** la **tienda remitente** está en la clave.
- `GET /reservations/{id}` devuelve la reserva o `NOT_FOUND`.

### Objeto de la reserva

```json
{
  "id": "uuid",
  "workspaceId": "uuid",
  "workspaceName": "Instituto Caldeira",
  "areaId": "uuid",
  "areaName": "Sala 03",
  "startDate": "2026-12-17T18:00:00Z",
  "endDate": "2026-12-17T19:00:00Z",
  "status": "ACCEPTED",
  "price": null,
  "charges": []
}
```

### Cobros (`charges`)

`charges` contiene los asientos financieros de la reserva (lo que pagará el cliente):

```json
{
  "id": "uuid",
  "type": "DEBIT",
  "value": 60,
  "unit": "Horas",
  "unitType": "TIME",
  "unitSymbol": "Horas",
  "symbolBeforeValue": false,
  "payDay": "2026-11-05T00:00:00Z",
  "paidDay": null,
  "description": null,
  "templateName": "Residentes P"
}
```

Reglas de visualización usadas por el cliente (las mismas de la app Haila):

- `unitType = TIME`: `value` está en **minutos**; muestra `value / 60` + símbolo
  (ej.: 60 → "1 Horas").
- `unitType = CURRENCY`: muestra `value` con el símbolo; `symbolBeforeValue` define si el
  símbolo va antes ("R$ 35,50") o después.
- `payDay` = ciclo de débito; `paidDay` nulo → "pago no informado".
- `templateName` = nombre del contrato/template.
- El campo `price` (precio final de la reserva) puede ser nulo cuando el cobro viene por
  asientos; prioriza `charges` en la visualización.

### Actualizar

```json
PATCH /reservations/{id}
{ "startDate": "...", "endDate": "...", "dependents": 1 }
```

Informa al menos un campo. Una reserva cancelada no puede actualizarse.
La respuesta es la reserva actualizada.

### Cancelar

```
POST /reservations/{id}/cancel
```

Sin cuerpo. La respuesta es la reserva con el nuevo estado.

## 8. Disponibilidad

```json
POST /availability
{
  "workspaceId": "uuid-de-la-tienda",
  "startDate": "2026-10-10T13:00:00Z",
  "endDate": "2026-10-10T14:00:00Z",
  "areaCategoryId": null,
  "capacity": null,
  "specificDurationId": null,
  "areaId": null
}
```

Dos modos:

- **Sin `areaId`**: devuelve las áreas disponibles en el período (mismo cálculo de
  `getavailableareasjson`). Opcionales: `areaCategoryId` y `capacity`.
- **Con `areaId`**: devuelve los horarios disponibles del día; en este modo
  `specificDurationId` es **obligatorio**.

El `payload` es el JSON crudo de la función del engine (estructura de áreas/horarios). En
la interfaz, la pestaña **Disponibilidad** muestra el JSON formateado.

## 9. Precio

```json
POST /pricing
{
  "workspaceId": "uuid-de-la-tienda",
  "areaId": "uuid-del-area",
  "startDate": "2026-10-10T13:00:00Z",
  "endDate": "2026-10-10T14:00:00Z"
}
```

- Si el usuario del token ya es cliente de la tienda, el cálculo usa su contrato
  (`calculatelinkvaluesjson`).
- Si no, usa el valor suelto (`calculatelinkvalue`).
- Respuesta: `{ "price": ... }`.

## 10. Reutilizar el código en tu cliente

El proyecto está organizado para que copies las partes que te interesen:

| Archivo | Para qué sirve |
|---|---|
| `src/api/partner.ts` | Cliente HTTP puro (usa `fetch`, sin dependencia de Vue). Contiene tipos, envelope, `PartnerApiError` y todos los endpoints. Cópialo a cualquier proyecto. |
| `src/stores/session.ts` | Estado reactivo con URL, clave y token, persistido en `localStorage`. |
| `src/utils/format.ts` | Formato de cobros (`TIME` → horas) y fechas en el estándar Haila. |
| `src/utils/feedback.ts` | Toasts de éxito/error a partir de `PartnerApiError`. |
| `src/components/` | Ejemplos de pantallas con PrimeVue para cada grupo de endpoints. |
| `src/theme/dracula.ts` | Preset de PrimeVue (tema oscuro). Reemplázalo por el tuyo si quieres. |

Para usar el cliente HTTP fuera de Vue, solo configura la URL y la clave:

```ts
import { partnerApi, PartnerApiError } from './api/partner'
import { session, applyToken } from './stores/session'

session.baseUrl = 'https://haila-java.haila.app'
session.apiKey = 'tu-api-key'

const { token, expiresIn } = await partnerApi.login('usuario@ejemplo.com', 'password')
applyToken(token, expiresIn, 'usuario@ejemplo.com')

const reservas = await partnerApi.listReservations()
```

## 11. Seguridad

- **No incrustes la API key en aplicaciones web públicas.** Quien tenga la clave puede
  actuar en nombre del socio en las tiendas vinculadas (junto con las
  credenciales/token de un usuario).
- Este cliente de prueba guarda la clave en el navegador **a propósito**, porque sirve
  para validación manual. En producción, coloca la clave en tu backend y haz que el
  navegador hable solo con tu servidor.
- El token del socio es independiente del JWT de la app Haila y no da acceso a GraphQL.
- Una tienda pertenece a **una sola** clave; la distribución de las tiendas la hace Haila.

## 12. Solución de problemas

| Síntoma | Causa probable |
|---|---|
| `invalid api key` | `X-Api-Key` ausente/incorrecta o clave creada para otro entorno. Recuerda: la clave es obligatoria incluso en login/registro. |
| `invalid credentials` | Correo o contraseña incorrectos en el login. |
| `invalid token` | Token expirado (7 días) o emitido con la clave de otro socio. Inicia sesión de nuevo. |
| `workspace not found` / `area not found` | Tienda/área fuera de las tiendas vinculadas a la clave, o id incorrecto. |
| `specificDurationId is required when areaId is set` | Informa `specificDurationId` al consultar horarios de un área. |
| `user has no primary workspace` | La cuenta del usuario no tiene workspace primario; contacta a Haila. |
| `endpoint not found` | URL del engine con `/api/partner/v1` duplicado; el cliente lo normaliza, pero verifica la URL. |
| Error de red / CORS | Engine caído o URL incorrecta. El engine permite CORS para `GET`, `POST` y `PATCH`. |
| Cobro vacío en pantalla | Reserva sin asientos (`financial_entry`) o engine sin la versión más reciente del script `partner_api.sql`. |
