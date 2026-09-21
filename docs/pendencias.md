# Pendências

Coisas que ficaram de propósito num estado provisório. Cada item diz por quê, o
que fazer e quando.

## 1. Cookie de sessão cross-site → corrigir ao subir a API no VPS

**Quando:** ao publicar a API num servidor próprio (VPS). Enquanto ela roda local,
exposta por túnel (ngrok), vale o modo provisório abaixo.

### Como está hoje

O token de sessão nunca fica no JavaScript: a **API** faz o login (`POST /auth/*`,
falando com o Supabase Auth) e grava a sessão em dois cookies `httpOnly` na origem
dela (`mollire_at`, acesso, 1h; `mollire_rt`, refresh, só em `/auth`). O front chama
a API com `credentials: "include"`, e se receber 401 renova a sessão em
`POST /auth/refresh` e tenta de novo.

Como o front (`mollire.vercel.app`) e a API (túnel ngrok) são **sites diferentes**,
o navegador só manda o cookie se ele for de terceiros: `SameSite=None; Secure;
Partitioned`. Isso é ligado por `COOKIE_CROSS_SITE=true` no `.env` da API
(`apps/api/src/auth/session-cookie.ts`).

Limitações desse modo:

- **Safari / iOS bloqueiam cookie de terceiros** — o login não funciona lá.
- Firefox só aceita cookie *particionado* (o que usamos); Chrome hoje aceita, mas a
  política de terceiros pode apertar.
- O túnel do ngrok mostra uma página de aviso a navegadores; por isso o `fetch` manda
  `ngrok-skip-browser-warning` (e `<img>` de miniatura não consegue mandar header).

Proteção que já existe e **deve continuar**: rotas `/auth/*` e escritas
autenticadas por cookie exigem `Origin` listado em `FRONTEND_URL` (senão 403), porque
cookie `SameSite=None` não protege contra CSRF por si só.

### O que fazer ao subir a API

1. **Domínios no mesmo site:** front em `app.SEUDOMINIO` (domínio customizado na
   Vercel) e API em `api.SEUDOMINIO` (nginx + TLS no VPS).
   - **Não use `aulvi.com.br`** como domínio do cookie se os sites publicados dos
     usuários ficam em `*.aulvi.com.br`: uma página de usuário poderia sobrescrever
     o cookie de sessão e derrubar o login. Use outro domínio para app + API, ou
     mova os sites publicados para um domínio separado.
2. **`.env` da API:**
   - `COOKIE_CROSS_SITE=false`
   - `COOKIE_DOMAIN=.SEUDOMINIO`
   - `FRONTEND_URL=https://app.SEUDOMINIO`
   - `NODE_ENV=production` (liga `Secure` no cookie)
3. **Web (Vercel):** `VITE_API_URL=https://api.SEUDOMINIO` (e `VITE_VAPID_PUBLIC_KEY`,
   `VITE_GITHUB_APP_SLUG`, `VITE_PROJECTS_DOMAIN=SEUDOMINIO`) e **redeploy** (variável `VITE_*` é gravada no build).
   Ao migrar do Next: renomear as `NEXT_PUBLIC_*` existentes no painel da Vercel, e
   conferir Framework Preset = Vite, Build `npm run build`, Output `dist`.
4. **Supabase:** Authentication → URL Configuration → Site URL e Redirect URLs com
   `https://app.SEUDOMINIO` (os e-mails de confirmação e de redefinir senha usam a
   Site URL para abrir `/auth/confirm`).
5. **Limpeza:** remover o `ngrok-skip-browser-warning` de `apps/web/src/shared/lib/http/client.ts` e,
   se quiser, o ramo `crossSite` de `session-cookie.ts`.
6. **Testar** login, refresh (deixar a aba aberta > 1h), logout e o fluxo de
   redefinir senha, **no Safari/iOS também**.

## 2. Limpeza pendente

- `apps/api/revert-gallery.js` e `apps/api/verify-gallery.js` estão soltos (sem
  versionar) desde antes: commitar ou apagar.
- `/auth/login` só conta com o rate limit do próprio Supabase; se a API ficar pública,
  considerar um limite por IP (ex.: `@nestjs/throttler`).
