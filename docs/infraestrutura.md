# Infraestrutura Mollire

Mini-Vercel self-hosted para builds estáticos de frontend. Monorepo com `apps/api` (NestJS) e `apps/web` (Vite + React SPA), servidos por Nginx com wildcard de subdomínio.

---

## Visão geral

```
Browser → Nginx (*.aulvi.com.br) → serve /var/www/projects/{slug}/current/
Browser → API (port 4000) → NestJS + Prisma + PostgreSQL
GitHub push → POST /webhooks/github → pipeline clone → build → publish
```

---

## API (`apps/api`)

### Stack

- **NestJS 10** + `@nestjs/platform-express`
- **Prisma 5** sobre PostgreSQL (Supabase ou self-hosted)
- **jose** — verificação JWT via JWKS assimétrico (Supabase)
- **simple-git** — clone/fetch de repositórios
- **execa** — executa Docker para builds isolados
- **Playwright** — captura thumbnails da galeria
- **web-push** — notificações push

Ponto de entrada: `apps/api/src/main.ts`, porta `4000` (env `PORT`).  
`rawBody: true` necessário para verificação HMAC-SHA256 dos webhooks GitHub.

### Módulos

| Módulo | Endpoints principais |
|---|---|
| `AuthModule` | `POST /auth/login`, `/signup`, `/refresh`, `/logout`, `/forgot`, `/confirm`, `PUT /auth/password`, `GET /auth/github` (OAuth redirect), `POST /auth/session` (seta cookies a partir de tokens OAuth) |
| `ProjectsModule` | `POST /projects`, `GET /projects`, `GET /projects/:slug`, `PATCH /projects/:slug/visibility` |
| `MembersModule` | `GET /projects/:slug/members`, `POST /projects/:slug/invitations`, `DELETE /projects/:slug/members/:userId` |
| `DeploymentsModule` | `POST /projects/:slug/deploy`, `GET /deployments/:id`, `GET /projects/:slug/status` (SSE) |
| `GalleryModule` | `GET /gallery`, `GET /gallery/:slug`, `POST /gallery/:slug/star`, `GET /gallery/:slug/comments`, `POST /gallery/:slug/comments` |
| `GithubModule` | `POST /github/install` (associa instalação do App), `DELETE /github/install/:id`, `GET /github/accounts`, `GET /github/repos[?available=true]` — lista repos frontend com `has_project`, cache em memória 5 min |
| `WebhooksModule` | `POST /webhooks/github` — HMAC-SHA256, dispara deploy automático; resolve `pusher.name` → `GithubAccount.account_login` → `user_id` para atribuir o deploy ao utilizador correto |
| `UsersModule` | `GET /users/me`, `PATCH /users/me`, `GET /users/:handle` (público — perfil com projetos e heatmap) |
| `AdminModule` | `GET /admin/projects`, `GET /admin/admins`, `POST /admin/admins` — gated por `@Roles(Role.ADMIN)` |
| `NotificationsModule` | `POST /notifications/subscribe`, `DELETE /notifications/subscribe` |
| `ErrorLogModule` | Persiste erros em DB + push para admins |
| `PrismaModule` | `PrismaService` — singleton, conecta em `onModuleInit` |
| `EnvVarsModule` | `GET/PUT/DELETE /projects/:slug/env/:key` — owner-only, valores nunca retornados após criação |
| `InternalModule` | `GET /internal/auth?slug=` — chamado pelo Nginx via `auth_request`, responde 200/401/403 sem body; registra views fire-and-forget |
| `AnalyticsModule` | `GET /analytics/:slug` — retorna `total`, `byDay` (30 dias), `byCountry` (top 10), `byPath` (top 10); requer membership |

### Autenticação e Sessão

**Guard global**: `JwtAuthGuard` aplicado em `APP_GUARD` — protege todos os endpoints por padrão.

**Flow**:
1. `POST /auth/login` → `SupabaseGoTrueService` autentica via GoTrue
2. API cria dois cookies **httpOnly**:
   - `mollire_at` (access token, 1h)
   - `mollire_rt` (refresh token, 30d, path=/auth)
3. `JwtAuthGuard` extrai `mollire_at`, verifica com JWKS remoto, hidrata `request.user`
4. JIT provisioning: se `User` não existe no banco, cria na primeira requisição autenticada

**Decorators**:
- `@Public()` — desativa guard, aceita anonymous
- `@CurrentUser()` — injeta `request.user` como parâmetro
- `@Roles(Role.ADMIN)` — exige role, precisa de `RolesGuard` explícito

**Login com GitHub (OAuth)**:
1. `GET /auth/github` — redireciona para `<supabase>/auth/v1/authorize?provider=github&redirect_to=<frontend>/auth/github/callback` (implicit flow, sem PKCE)
2. GitHub → Supabase → frontend recebe `#access_token=...&refresh_token=...` no hash da URL
3. `POST /auth/session { access_token, refresh_token, expires_in }` — valida origin, seta cookies httpOnly
4. Frontend redireciona para `/`

O fluxo de **instalação do GitHub App** (para repos/deploys) é independente do login e feito na página de perfil.

**CSRF**: Mutations (writes) validam `Origin` contra `FRONTEND_URL`.

**Proteção multi-tenant**: Todos lookups de tenant passam por `ProjectsService.findForMember()` — mismatch retorna 404, nunca 403 (tenant não descobre existência alheia).

### Schema Prisma (tabelas relevantes)

```prisma
model User {
  id              String   @id            // sub do JWT Supabase
  email           String   @unique
  handle          String?  @unique
  role            Role     @default(TENANT) // ADMIN | TENANT
  xp              Int      @default(0)
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt
  project_memberships ProjectMember[]
  github_accounts GithubAccount[]
}

// Um utilizador pode ter N contas GitHub conectadas (pessoal + orgs).
// Criada via POST /github/install após o utilizador instalar o GitHub App.
model GithubAccount {
  id                   String   @id @default(cuid())
  installation_id      BigInt   @unique  // ⚠ BigInt — nunca serializar diretamente em JSON
  account_login        String            // ex: "jpselas05"
  account_id           BigInt
  account_avatar_url   String
  account_type         String            // "User" | "Organization"
  repository_selection String            // "all" | "selected"
  user_id              String
  created_at           DateTime @default(now())
  user User @relation(...)
}

model Project {
  id             String    @id @default(cuid())
  slug           String    @unique              // {slug}.aulvi.com.br
  name           String
  repository_url String
  build_command  String    @default("npm install && npm run build")
  output_dir     String    @default("dist")
  is_public      Boolean   @default(false)      // galeria + acesso
  thumbnail_url  String?
  published_at   DateTime?
  user_id        String
  created_at     DateTime  @default(now())
  updated_at     DateTime  @updatedAt
  members        ProjectMember[]
  deployments    Deployment[]
}

model ProjectMember {
  id         String      @id @default(cuid())
  project_id String
  user_id    String
  role       ProjectRole @default(MEMBER)       // OWNER | MEMBER
  created_at DateTime    @default(now())
  @@unique([project_id, user_id])
}

model ProjectInvitation {
  id          String           @id @default(cuid())
  project_id  String
  email       String
  role        ProjectRole      @default(MEMBER)
  status      InvitationStatus @default(PENDING) // PENDING | ACCEPTED | REVOKED
  invited_by  String
  expires_at  DateTime                            // 14 dias
  accepted_at DateTime?
  @@unique([project_id, email])
}

model Deployment {
  id             String           @id @default(cuid())
  project_id     String
  status         DeploymentStatus // QUEUED | PENDING | CLONING | BUILDING | PUBLISHING | SUCCESS | FAILED
  commit_sha     String?
  commit_message String?
  release_path   String?
  log            String?
  created_at     DateTime         @default(now())
  finished_at    DateTime?
}

// Variáveis de ambiente injetadas no container de build. Valores criptografados
// em repouso (AES-256-GCM, chave em ENV_ENCRYPTION_KEY). Nunca retornados pela API.
model ProjectView {
  id         String   @id @default(cuid())
  project_id String
  visitor_id String                           // UUID anônimo (_mollire_vid cookie), nunca vinculado ao user
  country    String?                          // ISO 3166-1 alpha-2, via MaxMind GeoLite2 (null se GEOIP_DB_PATH não configurado)
  path       String   @default("/")           // URI acessada (ex: "/login")
  date       DateTime @db.Date                // deduplicação por dia
  @@unique([project_id, visitor_id, path, date])
  @@index([project_id, date])
}

model ProjectEnvVar {
  id         String   @id @default(cuid())
  project_id String
  key        String                           // ^[A-Z_][A-Z0-9_]*$, max 256
  value      String                           // "iv:authTag:ciphertext" em hex
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt
  @@unique([project_id, key])
}
```

### Pipeline de Deploy

```
POST /projects/:slug/deploy
  → Se slots livres (< BUILD_MAX_CONCURRENT): Cria Deployment { status: PENDING } → startPipeline()
  → Se fila não cheia (< BUILD_QUEUE_DEPTH):  Cria Deployment { status: QUEUED }  → buildQueue.push()
  → Se fila cheia: 409 Conflict

  buildQueue é FIFO em memória. Quando um pipeline termina (SUCCESS ou FAILED),
  emitTerminal() faz shift() e inicia o próximo automaticamente.
  Deploys QUEUED já têm Subject em streams → SSE do frontend permanece aberto.

CLONING   → simple-git clone --depth=1 (ou fetch+reset se repo existe)
            timeout por operação: CLONE_TIMEOUT_MS (padrão 120s)
BUILDING  → getDecrypted(project.id) — busca + decripta env vars em memória
          → docker run --rm
              --memory 512m --cpus 0.5 --pids-limit 100
              -e NPM_CONFIG_PREFER_OFFLINE=true
              -e NODE_OPTIONS=--max-old-space-size=896
              -e KEY=value  ← env vars do projeto (nunca logadas)
              -v {repoPath}:/workspace
              -v {outputPath}:/output
              -v mollire-npm-cache:/root/.npm
              node:20-alpine sh -c "{buildCommand}"
PUBLISHING → cp output → /var/www/projects/{slug}/releases/{timestamp}/
             ln -s (atômico via rename); EXDEV lança erro claro em vez de fallback silencioso
             prune releases antigas
SUCCESS    → update Deployment, XP +10 (+50 bonus 1º ever)
           → se is_public: Playwright thumbnail
FAILED     → update Deployment, push notification para owner
```

Variáveis de ambiente do build: `BUILD_MEMORY_LIMIT`, `BUILD_CPU_LIMIT`, `BUILD_PIDS_LIMIT`, `BUILD_DOCKER_IMAGE`, `BUILD_TIMEOUT_MS`, `BUILD_MAX_CONCURRENT` (padrão `3`), `BUILD_QUEUE_DEPTH` (padrão `10`), `CLONE_TIMEOUT_MS` (padrão `120000`).

### Armadilhas

**BigInt (`GithubAccount.installation_id`)**: `JSON.stringify` não serializa `BigInt` — qualquer endpoint que retorne um `GithubAccount` completo quebra com `500: Do not know how to serialize a BigInt`. Sempre converter para `String` ao expor em respostas HTTP (ex: `installation_id.toString()`). Internamente o campo pode ser lido normalmente.

### Gamification (XP)

Level calculado em read-time via `levelForXp(xp)` (quadrático: `50 * n * (n-1)`).

| Evento | XP |
|---|---|
| Deploy bem-sucedido | +10 |
| 1º deploy ever (por usuário) | +50 bonus |
| Publicar projeto (1x) | +20 |
| Receber star | +5 |

### Perfis públicos

`GET /users/:handle` — `@Public()`, sem auth.

Retorna:
- `handle`, `xp`, `level`, `next`, `joined_at`
- `projects` — projetos públicos onde o utilizador é OWNER (`is_public = true`), com `stars` count
- `heatmap` — array `{ date, count }` dos últimos 365 dias, contando apenas `DEPLOY_TRIGGERED` e `COMMENT_ADDED` onde `actor_id = user.id` (ações do próprio utilizador, não eventos passivos como receber star)

Página frontend em `u/[handle]`: avatar hex, nível/XP, data de entrada, grid de calor estilo GitHub (52 semanas × 7 dias, intensidade proporcional ao `count`), grid de projetos públicos.

Os autores e membros na galeria linkam para `/u/[handle]`.

---

## Web (`apps/web`)

- **Vite + React 19 SPA**, React Router (data router, rotas `lazy`), TanStack Query, Tailwind v4, shadcn/ui
- Estrutura por módulo (`src/modules/<domínio>`: `api/`, `hooks/`, `components/`, `pages/`, `types.ts`, `index.ts`); `src/shared` para o que é de todos e `src/app` para router, layouts e guards
- Deploy na Vercel (`apps/web/vercel.json` faz o fallback de SPA para `index.html`); variáveis `VITE_*` são gravadas no build
- Auth via API própria (`/auth/*`), não pelo Supabase client
- Cookies httpOnly gerenciados pela API — frontend nunca vê o token
- Auto-refresh: intercepta 401, chama `POST /auth/refresh`, faz retry

### Rotas principais

```
/login  /signup  /forgot-password  /reset-password  /auth/confirm  /auth/github/callback
/                     /projects/new  /projects/:slug  /projects/:slug/analytics  /perfil
/galeria              /galeria/:slug
/u/:handle            (perfil público — projetos e heatmap de atividade)
/admin                /admin/projects/:slug  /admin/admins
```

### Tipografia

- **Chakra Petch** — títulos e display
- **IBM Plex Sans** — corpo
- **Geist Mono** — código, XP, SHA

---

## Nginx

Wildcard de subdomínio — sem reload por deploy. Symlink atômico no deploy faz a troca transparentemente.

```nginx
# Extrai slug do Host header
set $slug "";
if ($host ~* "^([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)\.aulvi\.com\.br$") {
    set $slug $1;
}

root /var/www/projects/$slug/current;

# Controle de acesso: auth_request chama a API antes de servir qualquer arquivo
location = /_internal_auth {
    internal;                        # inacessível pelo browser
    proxy_pass http://127.0.0.1:4000/internal/auth?slug=$slug;
    proxy_pass_request_body off;
    proxy_set_header Content-Length "";
    proxy_set_header Cookie $http_cookie;  # repassa sessão do browser
}

location / {
    auth_request /_internal_auth;
    error_page 401 = @login;         # sem sessão → redirect login
    error_page 403 = @forbidden;     # não é membro → 403
    try_files $uri $uri/ /index.html;
}
```

**Respostas do `GET /internal/auth`**:
- `200` — projeto público ou usuário é membro; registra `ProjectView` fire-and-forget (só para requests `Accept: text/html`)
- `401` — projeto privado, sem sessão → Nginx redireciona para `/login?next=<url>`
- `403` — projeto privado, sessão válida mas não é membro

**Analytics (visitor tracking)**:
- Identificador anônimo `_mollire_vid` (UUID) gerado na API e setado via cookie pelo Nginx (`Max-Age=31536000`, `SameSite=Lax`)
- Cookie setado condicionalmente via `map $visitor_id $mollire_set_cookie` (arquivo `nginx/map.conf`, montado como `00-map.conf` no contexto `http` antes do server block)
- Só requests com `Accept: text/html` geram UUID e registram view — assets (`.js`, `.css`, etc.) não rastreados
- Deduplicação: `@@unique([project_id, visitor_id, path, date])` — uma view por visitante por página por dia
- GeoIP opcional: `GEOIP_DB_PATH` aponta para `GeoLite2-Country.mmdb` (MaxMind); sem ele `country` é sempre `null`; IP real só disponível em produção (`$remote_addr` em dev é o IP da bridge Docker)

**Diferenças dev vs prod**:
- Dev (`*.localtest.me`): `proxy_pass` aponta para `host.docker.internal:4000` + `resolver 127.0.0.11`; redirect login → `localhost:3000`
- Prod (`*.aulvi.com.br`): `proxy_pass` aponta para `127.0.0.1:4000`; redirect login → `https://app.aulvi.com.br`

Arquivos:
- `nginx/mollire.conf.example` — prod (`*.aulvi.com.br`)
- `nginx/mollire.dev.conf` — dev local (`*.localtest.me`), inclui `@not_found` fallback
- `public/forbidden.html` — página 403 servida pelo Nginx

---

## Docker Compose (dev)

```yaml
services:
  nginx:
    image: nginx:alpine
    ports: ["80:80"]
    volumes:
      - ./data/projects:/var/www/projects:ro
      - ./public:/var/www/mollire-public:ro
      - ./nginx/mollire.dev.conf:/etc/nginx/conf.d/default.conf:ro
      - ./nginx/map.conf:/etc/nginx/conf.d/00-map.conf:ro   # map para cookie condicional
```

`map.conf` precisa ser carregado antes de `default.conf` (prefixo `00-`) pois declara `$mollire_set_cookie` no contexto `http`, que é referenciada dentro do `server` block.

A API roda fora do compose (systemd no VPS, `node dist/main.js` direto em dev).

---

## VPS (produção)

- Systemd service: `deploy/mollire.service.example`
- `Restart=on-failure` + `RestartSec=2`, paired com `process.on('uncaughtException')` no `main.ts`
- Playwright Chromium instalado uma vez: `npx playwright install --with-deps chromium`
- Node.js 22+, Docker, PostgreSQL (Supabase), Nginx

---

## Segurança

| Mecanismo | Onde |
|---|---|
| JWT assimétrico (JWKS) | `JwtAuthGuard` → `SupabaseAuthService` |
| Cookies httpOnly | `AuthController` → `setSessionCookies()` |
| CSRF via Origin check | `JwtAuthGuard` (writes) |
| HMAC-SHA256 | `WebhooksController` (GitHub) |
| Docker isolation | `DockerBuildService` (memory/CPU/PID limits, sem rede) |
| Membership boundary | `ProjectsService.findForMember()` (mismatch → 404) |
| `@Public()` | Rotas abertas explícitas (galeria, webhook) |
| Nginx `auth_request` | `InternalModule` — projetos privados bloqueados antes de servir arquivos |
| Criptografia em repouso | `EnvCryptoService` — AES-256-GCM, IV aleatório por escrita, chave em `ENV_ENCRYPTION_KEY` |
| Env vars write-only | `EnvVarsService` — valores nunca retornados pela API após criação |
