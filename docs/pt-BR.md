# Guia do cliente de teste da Partner API da Haila

Este projeto é um **cliente de referência** para a API de parceiro da Haila (`/api/partner/v1`).
Ele cobre todos os endpoints, mostra o formato das respostas e serve de ponto de partida
para você construir o seu próprio cliente customizado.

Stack: **Vue 3 + Vite + PrimeVue 4** (tema escuro Dracula). O projeto é independente: não
depende do app Haila e pode ser copiado/adaptado livremente.

---

## 1. Requisitos

- **Node.js 20.19+** ou **22.12+** (exigência do Vite 7)
- **npm 10+**
- Uma **API key de parceiro** (`X-Api-Key`), emitida pela equipe Haila. A chave identifica
  o parceiro e o conjunto de lojas (workspaces) que ele pode acessar.
- Um **usuário Haila** (e-mail/senha) para as rotas de reserva, disponibilidade e preço.
  Se ainda não existir, o próprio cliente cria a conta via código de acesso + registro.

## 2. Como rodar

Dentro desta pasta:

```bash
npm install
npm run dev      # abre em http://localhost:5199
```

Outros comandos:

| Comando | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento (porta 5199) |
| `npm run build` | typecheck + build de produção em `dist/` |
| `npm run preview` | serve o build de produção (porta 4199) |
| `npm run typecheck` | validação de tipos (`vue-tsc`) |

## 3. Configuração (aba Conexão)

| Campo | Descrição |
|---|---|
| **URL do engine** | Endereço do engine da Haila, ex.: `https://haila-java.haila.app`. Pode colar com ou sem o sufixo `/api/partner/v1` — o cliente normaliza. |
| **X-Api-Key** | A chave do parceiro. Vai em **todas** as requisições. |

Os valores ficam salvos no `localStorage` do navegador (chave `haila-partner-api-client`),
então sobrevivem ao recarregar a página.

O botão **Testar chave** faz um login com credenciais inválidas de propósito: se a resposta
for `invalid credentials`, significa que a chave foi aceita pelo engine. Se responder
`invalid api key`, a chave está errada ou pertence a outro ambiente.

## 4. Autenticação

A Partner API tem um fluxo de autenticação próprio. O token emitido **não** abre o schema
GraphQL da Haila e vale apenas para o parceiro que o emitiu (7 dias).

| Método | Caminho | Corpo | Resposta |
|---|---|---|---|
| POST | `/auth/access-code` | `{ "email": "..." }` | `{ "sent": true }` — envia o código por e-mail |
| POST | `/auth/register` | `{ "email", "password", "firstName", "lastName", "phoneNumber", "code" }` | `{ "token", "expiresIn" }` |
| POST | `/auth/login` | `{ "email", "password" }` | `{ "token", "expiresIn" }` |

Observações:

- O `X-Api-Key` é obrigatório em **todas** as rotas, inclusive `login`, `register` e
  `access-code` (que não usam Bearer).
- `register` exige um `code` obtido antes via `/auth/access-code`.
- O login confere a mesma senha bcrypt da conta Haila.
- O campo `expiresIn` vem em segundos (604800 = 7 dias).

Na interface, a aba **Autenticação** tem as três operações (Login, Registro, Código de
acesso) e mostra o token atual com contagem de expiração.

## 5. Endpoints

Todas as rotas ficam sob `/api/partner/v1` e exigem `X-Api-Key`.
As rotas marcadas com **Bearer** também exigem `Authorization: Bearer <token>`.

| Método | Caminho | Bearer | Descrição |
|---|---|---|---|
| POST | `/auth/access-code` | não | envia código de acesso |
| POST | `/auth/register` | não | cria conta e devolve token |
| POST | `/auth/login` | não | autentica e devolve token |
| GET | `/reservations` | sim | lista reservas do usuário nas lojas da chave |
| POST | `/reservations` | sim | cria reserva |
| GET | `/reservations/{id}` | sim | detalha uma reserva |
| PATCH | `/reservations/{id}` | sim | atualiza datas/dependentes |
| POST | `/reservations/{id}/cancel` | sim | cancela a reserva |
| POST | `/availability` | sim | consulta disponibilidade |
| POST | `/pricing` | sim | calcula preço |

## 6. Formato das respostas

Sucesso e erro usam o mesmo envelope:

```json
{
  "success": true,
  "code": "OK",
  "payload": { },
  "errorMessages": []
}
```

Em erro, `success` é `false`, `payload` é `null` e `errorMessages` traz as mensagens:

```json
{
  "success": false,
  "code": "NOT_FOUND",
  "payload": null,
  "errorMessages": ["workspace not found"]
}
```

Códigos possíveis:

| code | HTTP | Significado |
|---|---|---|
| `OK` | 200 | sucesso |
| `VALIDATION` | 400 | corpo/campos inválidos |
| `UNAUTHORIZED` | 401 | chave inválida, token inválido/expirado ou credenciais erradas |
| `NOT_FOUND` | 404 | loja/área/reserva fora do escopo ou inexistente |
| `CONFLICT` | 409 | conflito (ex.: loja já pertence a outra chave) |
| `FAILED` | 400/500 | falha ao executar a operação |
| `UNAVAILABLE` | 503 | Partner API ainda não configurada no engine |

No cliente Vue, o helper `PartnerApiError` (`src/api/partner.ts`) carrega `status`, `code`
e `messages`, e o utilitário `notifyError` (`src/utils/feedback.ts`) mostra o erro em um toast.

## 7. Reservas

### Criar

```json
POST /reservations
{
  "workspaceId": "uuid-da-loja",
  "areaId": "uuid-da-area",
  "startDate": "2026-10-10T13:00:00Z",
  "endDate": "2026-10-10T14:00:00Z",
  "dependents": 0
}
```

- Datas em ISO 8601 **com timezone** (o cliente converte o horário local para UTC).
- Se o usuário ainda não for cliente da loja, a API cria automaticamente o vínculo
  primário com permissão `client` somente nessa loja.
- Loja fora da chave responde como inexistente (`NOT_FOUND`).
- A resposta é o objeto da reserva já criada (ver abaixo).

### Listar e detalhar

- `GET /reservations` devolve até 200 reservas, ordenadas pela data de início (desc).
- Uma reserva só aparece quando as duas condições são verdadeiras: o **destinatário**
  pertence ao usuário do token **e** a **loja remetente** está na chave.
- `GET /reservations/{id}` devolve a reserva ou `NOT_FOUND`.

### Objeto da reserva

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

### Cobranças (`charges`)

`charges` traz os lançamentos financeiros da reserva (o que o cliente vai pagar):

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

Regras de exibição usadas pelo cliente (mesmas do app Haila):

- `unitType = TIME`: `value` está em **minutos**; mostre `value / 60` + símbolo
  (ex.: 60 → "1 Horas").
- `unitType = CURRENCY`: mostre `value` com o símbolo; `symbolBeforeValue` define se o
  símbolo vem antes ("R$ 35,50") ou depois.
- `payDay` = ciclo de débito; `paidDay` nulo → "Pagamento não informado".
- `templateName` = nome do contrato/template.
- O campo `price` (preço final da reserva) pode ser nulo quando a cobrança vem por
  lançamentos; priorize `charges` na exibição.

### Atualizar

```json
PATCH /reservations/{id}
{ "startDate": "...", "endDate": "...", "dependents": 1 }
```

Informe ao menos um campo. Reserva cancelada não pode ser atualizada.
A resposta é a reserva atualizada.

### Cancelar

```
POST /reservations/{id}/cancel
```

Sem corpo. A resposta é a reserva com o novo status.

## 8. Disponibilidade

```json
POST /availability
{
  "workspaceId": "uuid-da-loja",
  "startDate": "2026-10-10T13:00:00Z",
  "endDate": "2026-10-10T14:00:00Z",
  "areaCategoryId": null,
  "capacity": null,
  "specificDurationId": null,
  "areaId": null
}
```

Dois modos:

- **Sem `areaId`**: retorna as áreas disponíveis no período (mesmo cálculo de
  `getavailableareasjson`). Opcionais: `areaCategoryId` e `capacity`.
- **Com `areaId`**: retorna os horários disponíveis do dia; nesse modo
  `specificDurationId` é **obrigatório**.

O `payload` é o JSON bruto da função do engine (estrutura de áreas/horários). Na interface,
a aba **Disponibilidade** exibe o JSON formatado.

## 9. Preço

```json
POST /pricing
{
  "workspaceId": "uuid-da-loja",
  "areaId": "uuid-da-area",
  "startDate": "2026-10-10T13:00:00Z",
  "endDate": "2026-10-10T14:00:00Z"
}
```

- Se o usuário do token já é cliente da loja, o cálculo usa o contrato dele
  (`calculatelinkvaluesjson`).
- Caso contrário, usa o valor avulso (`calculatelinkvalue`).
- Resposta: `{ "price": ... }`.

## 10. Reutilizando o código no seu cliente

O projeto foi organizado para você copiar as partes que interessam:

| Arquivo | Para que serve |
|---|---|
| `src/api/partner.ts` | Cliente HTTP puro (usa `fetch`, não depende de Vue). Contém tipos, envelope, `PartnerApiError` e todos os endpoints. Copie para qualquer projeto. |
| `src/stores/session.ts` | Estado reativo com URL, chave e token, persistido no `localStorage`. |
| `src/utils/format.ts` | Formatação de cobranças (`TIME` → horas) e datas no padrão Haila. |
| `src/utils/feedback.ts` | Toasts de sucesso/erro a partir de `PartnerApiError`. |
| `src/components/` | Exemplos de telas com PrimeVue para cada grupo de endpoints. |
| `src/theme/dracula.ts` | Preset do PrimeVue (tema escuro). Troque pelo seu se quiser. |

Para usar o cliente HTTP fora do Vue, basta apontar a URL e a chave:

```ts
import { partnerApi, PartnerApiError } from './api/partner'
import { session, applyToken } from './stores/session'

session.baseUrl = 'https://haila-java.haila.app'
session.apiKey = 'sua-api-key'

const { token, expiresIn } = await partnerApi.login('usuario@exemplo.com', 'senha')
applyToken(token, expiresIn, 'usuario@exemplo.com')

const reservas = await partnerApi.listReservations()
```

## 11. Segurança

- **Não embuta a API key em aplicações web públicas.** Quem tiver a chave consegue agir em
  nome do parceiro nas lojas vinculadas (junto com as credenciais/token de um usuário).
- Este cliente de teste guarda a chave no navegador **de propósito**, porque serve para
  validação manual. Em produção, coloque a chave no seu backend e faça o navegador falar
  apenas com o seu servidor.
- O token do parceiro é independente do JWT do app Haila e não dá acesso ao GraphQL.
- Uma loja pertence a **apenas uma** chave; a distribuição das lojas é feita pela Haila.

## 12. Solução de problemas

| Sintoma | Causa provável |
|---|---|
| `invalid api key` | `X-Api-Key` ausente/errada ou chave criada para outro ambiente. Lembre: a chave é obrigatória até em login/registro. |
| `invalid credentials` | E-mail ou senha incorretos no login. |
| `invalid token` | Token expirado (7 dias) ou emitido com a chave de outro parceiro. Faça login novamente. |
| `workspace not found` / `area not found` | Loja/área fora das lojas vinculadas à chave, ou id errado. |
| `specificDurationId is required when areaId is set` | Informe o `specificDurationId` ao consultar horários de uma área. |
| `user has no primary workspace` | A conta do usuário não tem workspace primário; fale com a Haila. |
| `endpoint not found` | URL do engine com `/api/partner/v1` duplicado; o cliente normaliza, mas verifique a URL. |
| Erro de rede / CORS | Engine fora do ar ou URL errada. O engine libera CORS para `GET`, `POST` e `PATCH`. |
| Cobrança vazia na tela | Reserva sem lançamentos (`financial_entry`) ou engine sem a versão mais recente do script `partner_api.sql`. |
