# Haila Partner API — Test Client Guide

This project is a **reference client** for the Haila Partner API (`/api/partner/v1`).
It covers every endpoint, shows the response format and serves as a starting point for
building your own custom client.

Stack: **Vue 3 + Vite + PrimeVue 4** (Dracula dark theme). The project is standalone: it
does not depend on the Haila app and can be copied/adapted freely.

---

## 1. Requirements

- **Node.js 20.19+** or **22.12+** (Vite 7 requirement)
- **npm 10+**
- A **partner API key** (`X-Api-Key`) issued by the Haila team. The key identifies the
  partner and the set of stores (workspaces) it can access.
- A **Haila user** (email/password) for the reservation, availability and pricing routes.
  If the user does not exist yet, the client itself creates the account via access code +
  registration.

## 2. Running the project

From this folder:

```bash
npm install
npm run dev      # opens http://localhost:5199
```

Other commands:

| Command | Description |
|---|---|
| `npm run dev` | development server (port 5199) |
| `npm run build` | typecheck + production build into `dist/` |
| `npm run preview` | serves the production build (port 4199) |
| `npm run typecheck` | type checking (`vue-tsc`) |

## 3. Configuration (Connection tab)

| Field | Description |
|---|---|
| **Engine URL** | Haila engine address, e.g. `https://haila-java.haila.app`. You may paste it with or without the `/api/partner/v1` suffix — the client normalizes it. |
| **X-Api-Key** | The partner key. Sent on **every** request. |

Values are stored in the browser's `localStorage` (key `haila-partner-api-client`), so they
survive page reloads.

The **Test key** button performs a login with intentionally invalid credentials: if the
response is `invalid credentials`, the engine accepted the key. If it answers
`invalid api key`, the key is wrong or belongs to another environment.

## 4. Authentication

The Partner API has its own authentication flow. The issued token does **not** open the
Haila GraphQL schema and is valid only for the partner that issued it (7 days).

| Method | Path | Body | Response |
|---|---|---|---|
| POST | `/auth/access-code` | `{ "email": "..." }` | `{ "sent": true }` — emails the code |
| POST | `/auth/register` | `{ "email", "password", "firstName", "lastName", "phoneNumber", "code" }` | `{ "token", "expiresIn" }` |
| POST | `/auth/login` | `{ "email", "password" }` | `{ "token", "expiresIn" }` |

Notes:

- `X-Api-Key` is required on **all** routes, including `login`, `register` and
  `access-code` (which do not use Bearer).
- `register` requires a `code` obtained beforehand via `/auth/access-code`.
- Login checks the same bcrypt password as the Haila account.
- `expiresIn` is in seconds (604800 = 7 days).

In the UI, the **Authentication** tab has all three operations (Login, Register, Access
code) and shows the current token with an expiry countdown.

## 5. Endpoints

All routes live under `/api/partner/v1` and require `X-Api-Key`.
Routes marked **Bearer** also require `Authorization: Bearer <token>`.

| Method | Path | Bearer | Description |
|---|---|---|---|
| POST | `/auth/access-code` | no | sends the access code |
| POST | `/auth/register` | no | creates the account and returns a token |
| POST | `/auth/login` | no | authenticates and returns a token |
| GET | `/reservations` | yes | lists the user's reservations at the key's stores |
| POST | `/reservations` | yes | creates a reservation |
| GET | `/reservations/{id}` | yes | reservation details |
| PATCH | `/reservations/{id}` | yes | updates dates/dependents |
| POST | `/reservations/{id}/cancel` | yes | cancels the reservation |
| POST | `/availability` | yes | availability lookup |
| POST | `/pricing` | yes | price calculation |

## 6. Response format

Success and error share the same envelope:

```json
{
  "success": true,
  "code": "OK",
  "payload": { },
  "errorMessages": []
}
```

On error, `success` is `false`, `payload` is `null` and `errorMessages` carries the
messages:

```json
{
  "success": false,
  "code": "NOT_FOUND",
  "payload": null,
  "errorMessages": ["workspace not found"]
}
```

Possible codes:

| code | HTTP | Meaning |
|---|---|---|
| `OK` | 200 | success |
| `VALIDATION` | 400 | invalid body/fields |
| `UNAUTHORIZED` | 401 | invalid key, invalid/expired token or wrong credentials |
| `NOT_FOUND` | 404 | store/area/reservation out of scope or nonexistent |
| `CONFLICT` | 409 | conflict (e.g. store already belongs to another key) |
| `FAILED` | 400/500 | operation failed |
| `UNAVAILABLE` | 503 | Partner API not configured in the engine yet |

In the Vue client, the `PartnerApiError` helper (`src/api/partner.ts`) carries `status`,
`code` and `messages`, and the `notifyError` utility (`src/utils/feedback.ts`) displays the
error in a toast.

## 7. Reservations

### Create

```json
POST /reservations
{
  "workspaceId": "store-uuid",
  "areaId": "area-uuid",
  "startDate": "2026-10-10T13:00:00Z",
  "endDate": "2026-10-10T14:00:00Z",
  "dependents": 0
}
```

- Dates in ISO 8601 **with timezone** (the client converts local time to UTC).
- If the user is not a client of the store yet, the API automatically creates the primary
  link with the `client` permission for that store only.
- A store outside the key is reported as nonexistent (`NOT_FOUND`).
- The response is the newly created reservation object (see below).

### List and details

- `GET /reservations` returns up to 200 reservations, ordered by start date (desc).
- A reservation only appears when both conditions are true: the **recipient** belongs to
  the token user **and** the **sender store** is in the key.
- `GET /reservations/{id}` returns the reservation or `NOT_FOUND`.

### Reservation object

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

### Charges (`charges`)

`charges` holds the reservation's financial entries (what the client will pay):

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

Display rules used by the client (same as the Haila app):

- `unitType = TIME`: `value` is in **minutes**; display `value / 60` + symbol
  (e.g. 60 → "1 Horas").
- `unitType = CURRENCY`: display `value` with the symbol; `symbolBeforeValue` defines
  whether the symbol comes before ("R$ 35,50") or after.
- `payDay` = debit cycle; `paidDay` null → "payment not informed".
- `templateName` = contract/template name.
- The `price` field (final reservation price) may be null when billing comes from entries;
  prefer `charges` for display.

### Update

```json
PATCH /reservations/{id}
{ "startDate": "...", "endDate": "...", "dependents": 1 }
```

Provide at least one field. A cancelled reservation cannot be updated.
The response is the updated reservation.

### Cancel

```
POST /reservations/{id}/cancel
```

No body. The response is the reservation with its new status.

## 8. Availability

```json
POST /availability
{
  "workspaceId": "store-uuid",
  "startDate": "2026-10-10T13:00:00Z",
  "endDate": "2026-10-10T14:00:00Z",
  "areaCategoryId": null,
  "capacity": null,
  "specificDurationId": null,
  "areaId": null
}
```

Two modes:

- **Without `areaId`**: returns the areas available in the period (same calculation as
  `getavailableareasjson`). Optional: `areaCategoryId` and `capacity`.
- **With `areaId`**: returns the available time slots of the day; in this mode
  `specificDurationId` is **required**.

The `payload` is the raw JSON from the engine function (areas/time slots structure). In the
UI, the **Availability** tab displays the formatted JSON.

## 9. Pricing

```json
POST /pricing
{
  "workspaceId": "store-uuid",
  "areaId": "area-uuid",
  "startDate": "2026-10-10T13:00:00Z",
  "endDate": "2026-10-10T14:00:00Z"
}
```

- If the token user is already a client of the store, the calculation uses their contract
  (`calculatelinkvaluesjson`).
- Otherwise, it uses the standalone price (`calculatelinkvalue`).
- Response: `{ "price": ... }`.

## 10. Reusing the code in your client

The project is organized so you can copy the parts you need:

| File | Purpose |
|---|---|
| `src/api/partner.ts` | Pure HTTP client (uses `fetch`, no Vue dependency). Contains types, envelope, `PartnerApiError` and all endpoints. Copy it into any project. |
| `src/stores/session.ts` | Reactive state with URL, key and token, persisted in `localStorage`. |
| `src/utils/format.ts` | Charge formatting (`TIME` → hours) and dates in the Haila format. |
| `src/utils/feedback.ts` | Success/error toasts from `PartnerApiError`. |
| `src/components/` | PrimeVue screen examples for each endpoint group. |
| `src/theme/dracula.ts` | PrimeVue preset (dark theme). Replace it with your own if you want. |

To use the HTTP client outside Vue, just set the URL and key:

```ts
import { partnerApi, PartnerApiError } from './api/partner'
import { session, applyToken } from './stores/session'

session.baseUrl = 'https://haila-java.haila.app'
session.apiKey = 'your-api-key'

const { token, expiresIn } = await partnerApi.login('user@example.com', 'password')
applyToken(token, expiresIn, 'user@example.com')

const reservations = await partnerApi.listReservations()
```

## 11. Security

- **Do not embed the API key in public web applications.** Anyone with the key can act on
  behalf of the partner at the linked stores (together with a user's credentials/token).
- This test client stores the key in the browser **on purpose**, because it is meant for
  manual validation. In production, keep the key on your backend and let the browser talk
  only to your server.
- The partner token is independent from the Haila app JWT and does not grant GraphQL access.
- A store belongs to **only one** key; store assignment is done by Haila.

## 12. Troubleshooting

| Symptom | Likely cause |
|---|---|
| `invalid api key` | Missing/wrong `X-Api-Key` or a key created for another environment. Remember: the key is required even on login/register. |
| `invalid credentials` | Wrong email or password on login. |
| `invalid token` | Token expired (7 days) or issued with another partner's key. Log in again. |
| `workspace not found` / `area not found` | Store/area outside the key's linked stores, or wrong id. |
| `specificDurationId is required when areaId is set` | Provide `specificDurationId` when querying time slots for an area. |
| `user has no primary workspace` | The user account has no primary workspace; contact Haila. |
| `endpoint not found` | Engine URL with a duplicated `/api/partner/v1`; the client normalizes it, but check the URL. |
| Network / CORS error | Engine down or wrong URL. The engine allows CORS for `GET`, `POST` and `PATCH`. |
| Empty billing on screen | Reservation without financial entries (`financial_entry`) or engine missing the latest `partner_api.sql` script. |
