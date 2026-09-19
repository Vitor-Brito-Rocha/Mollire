# Configuração do GitHub App — Mollire

Passo a passo do que preencher em github.com/settings/apps/new.

## Informações básicas

| Campo | Valor |
| --- | --- |
| GitHub App name | `Mollire` |
| Homepage URL | `https://mollire.vercel.app` |
| Description | `Deploy automático de projetos frontend` |

## Identifying and authorizing users

| Campo | Valor |
| --- | --- |
| Redirect URI | `https://app.aulvi.com.br/auth/github/callback` (prod) / `http://localhost:3000/auth/github/callback` (dev) |
| Allow wildcard matching | **Desligado** |
| Expire user authorization tokens | **Ligado** |
| Request user authorization during installation | **Ligado** — queremos saber quem instalou |
| Enable Device Flow | Desligado |

## Post installation

| Campo | Valor |
| --- | --- |
| Setup URL | Deixar vazio por enquanto |
| Redirect on update | Desligado |

## Webhook

| Campo | Valor |
| --- | --- |
| Active | **Ligado** |
| Webhook URL | `https://api.aulvi.com.br/webhooks/github` (prod) / URL do ngrok em dev |
| Secret | Gerar uma string aleatória e salvar no `.env` como `GITHUB_WEBHOOK_SECRET` |

## Repository permissions

| Permissão | Nível |
| --- | --- |
| Contents | **Read-only** — para clonar o repositório |
| Metadata | **Read-only** — obrigatório pelo GitHub |

Todas as outras permissões: **No access**.

## Subscribe to events

| Evento | Motivo |
| --- | --- |
| **Push** | Disparar deploy automático quando o usuário fizer push |

## Where can this GitHub App be installed?

**Any account** — para qualquer usuário da Mollire instalar.

---

## Após criar o App

Salvar no `.env` da API:

```
GITHUB_APP_ID=          # App ID (na página do App)
GITHUB_CLIENT_ID=       # Client ID (na página do App)
GITHUB_CLIENT_SECRET=   # gerar em "Generate a new client secret"
GITHUB_PRIVATE_KEY=     # gerar em "Generate a private key" — salvar o .pem
GITHUB_WEBHOOK_SECRET=  # o secret que você colocou no webhook acima
```
