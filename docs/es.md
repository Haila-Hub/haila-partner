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

### Flujos por tienda (clientes, contratos, áreas, autorizaciones y grupos)

Rutas con alcance en una tienda de la clave: `/workspaces/{workspaceId}/...`. Todas requieren
Bearer y usan el mismo envelope.

| Método | Ruta | Bearer | Descripción |
|---|---|---|---|
| GET | `/workspaces/{workspaceId}/clients` | sí | lista los clientes de la tienda |
| POST | `/workspaces/{workspaceId}/clients` | sí | crea un cliente |
| GET | `/workspaces/{workspaceId}/contract-templates` | sí | lista modelos de contrato |
| GET | `/workspaces/{workspaceId}/contract-options` | sí | ciclos, pagos y monedas disponibles |
| POST | `/workspaces/{workspaceId}/contract-templates` | sí | crea un modelo de contrato |
| GET | `/workspaces/{workspaceId}/contracts` | sí | lista contratos de clientes |
| POST | `/workspaces/{workspaceId}/contracts` | sí | crea un contrato desde un modelo |
| GET | `/workspaces/{workspaceId}/areas` | sí | lista áreas |
| POST | `/workspaces/{workspaceId}/areas` | sí | crea un área |
| GET | `/workspaces/{workspaceId}/areas/{areaId}/availability` | sí | horarios del área |
| POST | `/workspaces/{workspaceId}/areas/{areaId}/availability` | sí | reemplaza los horarios del área |
| GET | `/workspaces/{workspaceId}/area-pricing` | sí | lista precios de área |
| POST | `/workspaces/{workspaceId}/area-pricing` | sí | crea un precio de área |
| GET | `/workspaces/{workspaceId}/authorizations` | sí | lista autorizaciones |
| POST | `/workspaces/{workspaceId}/authorizations` | sí | crea una autorización |
| GET | `/workspaces/{workspaceId}/groups` | sí | lista grupos de clientes |
| POST | `/workspaces/{workspaceId}/groups` | sí | crea un grupo de clientes |
| GET | `/workspaces/{workspaceId}/accesses` | sí | lista los accesos activos del usuario en la tienda |
| POST | `/workspaces/{workspaceId}/accesses/open` | sí | abre puerta BLE (devuelve el hash) o remota (devuelve el estado) |
| GET | `/usage` | no | límites y uso de tu clave de api |

Ejemplos de cuerpo:

```json
POST /workspaces/{workspaceId}/clients
{ "type": "PERSON", "email": "cliente@ejemplo.com", "firstName": "Ana", "lastName": "Souza", "phoneNumber": "+55 51 99999-0000" }

POST /workspaces/{workspaceId}/contract-templates
{
  "name": "Plan mensual", "value": 100, "payDay": 5, "mode": "member",
  "cycleTypeId": "uuid", "paymentTypeId": "uuid", "autoRenew": true, "autoRenewPeriod": "P1M",
  "credits": [ { "value": 10, "priority": 1, "currencyUnit": { "id": "uuid" } } ]
}

POST /workspaces/{workspaceId}/contracts
{ "templateId": "uuid", "clientId": "workspace-client-uuid", "startDate": "2026-11-01T00:00:00Z", "endDate": "2027-11-01T00:00:00Z" }

POST /workspaces/{workspaceId}/areas
{ "name": "Sala 03", "areaCategoryName": "Salas", "capacity": 10, "quantity": 1 }

POST /workspaces/{workspaceId}/areas/{areaId}/availability
{ "days": [ { "dayWeek": "1", "startHour": "08:00", "endHour": "18:00" } ] }

POST /workspaces/{workspaceId}/area-pricing
{ "name": "Hora suelta", "basePrice": 60, "baseInterval": "hour", "areaIds": ["uuid"] }

POST /workspaces/{workspaceId}/authorizations
{ "clients": ["workspace-client-uuid"], "areas": ["uuid"], "startDate": "2026-11-01T00:00:00", "endDate": "2026-11-30T23:59:59", "uses": -1 }

POST /workspaces/{workspaceId}/groups
{ "name": "Grupo A", "members": ["workspace-client-uuid"] }
```

Observaciones:

- `dayWeek` va de `"1"` (lunes) a `"7"` (domingo); sin `weekDays` el área nace abierta todos
  los días (`00:00`–`23:59`).
- En `area-pricing`, envía `basePrice` + `baseInterval` (`minute`, `hour`, `day`, `week`,
  `month` o `year`) **o** los seis campos `priceMinute`…`priceYear`. Con `areaIds`, el precio
  se vincula a las áreas mediante `area_booking_preferences`.
- Los contratos requieren un cliente con workspace vinculado (vínculo primario aceptado); de
  lo contrario la respuesta es `VALIDATION`.
- Las autorizaciones devuelven la lista de vínculos creados (uno por combinación
  cliente/tienda).

### Accesos y apertura (BLE y remota)

`GET /workspaces/{workspaceId}/accesses` devuelve los accesos activos del usuario del token en
esa tienda (mismo payload que el `getdashboardaccesses` de la app Haila): cada acceso trae
`linkId`, `passages` con `devices`, `keys` y `area`, y los `devices` de área.

`POST /workspaces/{workspaceId}/accesses/open` abre una puerta. Envía `passageId` o `deviceId`
y, opcionalmente, `mode` (`"BLE"` o `"REMOTE"`; sin él la API prefiere remota y cae a BLE):

```json
{ "passageId": "uuid-de-la-passage", "mode": "BLE" }
```

Dispositivo **REMOTE** — la API ejecuta la apertura remota y responde el estado:

```json
{
  "mode": "REMOTE",
  "passageId": "uuid", "passageName": "Portón",
  "deviceId": "uuid", "deviceName": "Portón", "externalApiKey": "KEY",
  "opened": true,
  "status": "OPENED"
}
```

Dispositivo **BLE** — la API devuelve el hash temporal para que el cliente lo escriba por
Bluetooth:

```json
{
  "mode": "BLE",
  "passageId": "uuid", "passageName": "Puerta 1",
  "deviceId": "uuid", "deviceName": "Nano", "externalApiKey": "KEY",
  "bleTouch": false,
  "connection": {
    "format": "nano",
    "hash": "42c24c02cfc9d5ee934e0b7a8c676bc9",
    "date": "2026-01-05-10-05",
    "payload": "{\"hash\":\"42c24c02cfc9d5ee934e0b7a8c676bc9\",\"date\":\"2026-01-05-10-05\"}"
  }
}
```

Receta del hash: `md5("yyyy-MM-dd-HH-mm" + externalApiKey + deviceWorkspaceId)` en la zona
`America/Sao_Paulo`. `format` es `nano` (payload `{"hash","date"}`) o `atmega` (payload
`{"h","d"}` con la fecha sin guiones). El campo `payload` ya es la cadena exacta para enviar al
servicio/característica BLE del dispositivo; `bleTouch` indica la cerradura que exige toque
antes del BLE.

### Uso y límites de la clave

`GET /usage` (solo `X-Api-Key`) devuelve nombre, tiendas, límites y el uso del día/mes de tu
clave. Toda respuesta trae los headers `X-Partner-Quota-*` (límites y uso del día/mes,
overage y `hardLimit`). Límite `null` = ilimitado; `hardLimit: false` solo señala el exceso;
con `hardLimit: true` la API responde `429` `QUOTA_EXCEEDED` al pasar el límite.

```json
{
  "client": { "id": "uuid", "name": "Mi Tienda", "active": true, "workspaceIds": ["uuid"] },
  "usage": {
    "day": "2026-10-14", "month": "2026-10", "resetAt": "2026-11-01",
    "dailyLimit": 8000, "dailyUsed": 120,
    "monthlyLimit": 150000, "monthlyUsed": 5400,
    "overageLimit": 30000, "overageUsed": 0,
    "hardLimit": false, "exceeded": false
  }
}
```

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
| `passageId or deviceId is required` | En la apertura, informa el `passageId` o el `deviceId`. |
| `device does not support remote opening` / `... ble opening` | El `mode` pedido no existe en ese dispositivo; omite el `mode` o usa el correcto. |
| `user has no primary workspace` | La cuenta del usuario no tiene workspace primario; contacta a Haila. |
| `endpoint not found` | URL del engine con `/api/partner/v1` duplicado; el cliente lo normaliza, pero verifica la URL. |
| Error de red / CORS | Engine caído o URL incorrecta. El engine permite CORS para `GET`, `POST` y `PATCH`. |
| Cobro vacío en pantalla | Reserva sin asientos (`financial_entry`) o engine sin la versión más reciente del script `partner_api.sql`. |
| `endpoint not found` en `/workspaces/...` | Plugin antiguo en el engine: entregue el JAR actualizado en `/app/extensions` y ejecute `POST /api/schema/reload`. |
