# Mollire

Mini-Vercel self-hosted para builds estáticos de frontend, roteados por subdomínio wildcard (`{slug}.aulvi.com.br`).

O usuário cadastra um projeto (repositório Git + comando de build + pasta de saída), faz deploy pelo painel e os arquivos ficam disponíveis publicamente em segundos — sem configurar Nginx, sem mexer no servidor.

## Como funciona

```
Usuário faz deploy pelo painel
         ↓
apps/api clona o repositório do GitHub
         ↓
┌─────────────────────────────────┐
│  Container Docker isolado       │
│                                 │
│  npm install && npm run build   │
│  sem credenciais da Mollire     │
│  sem acesso à rede interna      │
│  CPU/RAM/tempo limitados        │
└──────────────┬──────────────────┘
               ↓
      artefato gerado (dist/)
               ↓
/var/www/projects/{slug}/current  ←  symlink atômico
               ↓
         Nginx serve
               ↓
    isaura.aulvi.com.br
```

Cada deploy cria um diretório versionado em `releases/<timestamp>/`. O symlink `current` é atualizado atomicamente — o Nginx nunca serve uma versão pela metade e nunca precisa ser recarregado para novos projetos.

## Estrutura

```
apps/
├── api/    NestJS — pipeline de deploy, auth, admin, push notifications
└── web/    Vite + React — painel do tenant e área admin (SPA)
nginx/      Bloco wildcard que roteia projetos pelo header Host
deploy/     Config de VPS (unit systemd, etc.)
```

Cada app gerencia seu próprio `package.json` / `node_modules` e faz deploy de forma independente.

## Stack

| Camada | Tecnologia |
| --- | --- |
| API | NestJS + TypeScript |
| Banco | PostgreSQL via Prisma (Supabase) |
| Auth | Supabase Auth (JWT assimétrico, verificado via JWKS) |
| Build engine | `simple-git` (clone) + Docker (execução isolada) |
| Serving | Nginx com wildcard de subdomínio |
| Dashboard | Vite + React 19 + React Router + TanStack Query + Tailwind v4 + shadcn/ui |
| Push | Web Push / VAPID |

## Setup rápido

```bash
# API
cd apps/api
npm install
cp .env.example .env   # preencha DATABASE_URL, SUPABASE_*, VAPID_*, PROJECTS_ROOT
npx prisma migrate dev
npx playwright install chromium   # captura dos thumbnails da galeria
npm run start:dev

# Web (outro terminal)
cd apps/web
npm install
cp .env.local.example .env.local   # preencha VITE_API_URL, VITE_VAPID_PUBLIC_KEY, VITE_GITHUB_APP_SLUG
npm run dev
```

Requisitos de produção na VPS:

- Docker instalado, para execução isolada dos builds.
- Chromium do Playwright, para os thumbnails da galeria: `npx playwright install --with-deps chromium` (uma vez como root, para as libs do sistema) e depois `npx playwright install chromium` com o mesmo usuário que roda o serviço (`mollire`) — o browser é instalado por usuário.

## Multi-tenancy

- Cada projeto pertence a um usuário (`user_id`); queries de tenant são sempre escopadas por esse campo
- Discrepância de ownership retorna **404**, não 403 — um tenant não consegue confirmar se o slug de outro existe
- `ADMIN_EMAILS` no `.env` concede role `ADMIN` no primeiro login; admins têm acesso read-only a todos os projetos via `/admin/*`

## Documentação detalhada

- [API — pipeline, rotas, segurança](apps/api/README.md)
- [Web — painel, auth, push](apps/web/README.md)
