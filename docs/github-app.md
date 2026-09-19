# Integração com GitHub App

Hoje a Mollire clona repositórios públicos via URL. Para suportar repos privados e
deploy automático no push (como a Vercel faz), precisamos de uma integração via GitHub App.

## Por que GitHub App e não Personal Access Token?

| | PAT | GitHub App |
| --- | --- | --- |
| Experiência | Usuário gera token manualmente | Um clique para instalar |
| Deploy automático no push | Não | Sim (webhook) |
| Segurança | Token com acesso amplo | Permissão só no repo escolhido |
| Revogação | Manual | Automática se desinstalar |

## O que muda no fluxo

**Hoje:**
```
Usuário cola URL do repo → deploy manual
```

**Com GitHub App:**
```
Usuário conecta GitHub → escolhe o repo → push no GitHub → deploy automático
```

## Passos de implementação

### 1. Registrar o GitHub App (manual, ~30 min)
- Criar o App em github.com/settings/apps
- Configurar permissões: `contents: read` (clonar repos)
- Configurar webhook: `POST /webhooks/github` na API da Mollire
- Salvar: App ID, Client ID, Client Secret, Private Key

### 2. Migração do banco (~30 min)
Nova coluna na tabela `User`:
```sql
ALTER TABLE "User" ADD COLUMN github_installation_id BIGINT;
```

### 3. Fluxo de instalação — API + Web (~3-4h)

**Web:** botão "Conectar GitHub" no painel que redireciona para:
```
https://github.com/apps/mollire/installations/new
```

**API:** novo endpoint `GET /auth/github/callback` que recebe o `installation_id`
retornado pelo GitHub após o usuário instalar o App, e salva no banco.

### 4. Clone de repos privados (~1-2h)

Antes de clonar, a API gera um token temporário usando o `installation_id`:

```
POST https://api.github.com/app/installations/{id}/access_tokens
Authorization: Bearer {jwt assinado com a private key do App}
→ retorna token válido por 1 hora
```

Token é usado na URL de clone:
```
https://x-access-token:{token}@github.com/usuario/repo.git
```

### 5. Webhook de push automático (~2-3h)

Novo endpoint `POST /webhooks/github` que:
1. Verifica assinatura HMAC do payload (segurança)
2. Filtra evento `push` na branch principal
3. Busca o projeto pelo `repository.full_name`
4. Dispara deploy automaticamente

### 6. Seletor de repositórios no painel (~3-4h)

Em vez de colar a URL, o usuário escolhe de uma lista:
```
GET https://api.github.com/installation/repositories
Authorization: Bearer {token}
```

## Tempo estimado total

~2 dias de trabalho focado com IA.

O passo mais trabalhoso é o fluxo de instalação (passo 3) — tem bastante
ida e volta com o OAuth do GitHub.

## Ordem sugerida

1. Registrar o App e testar clone com token manualmente
2. Salvar `installation_id` no banco
3. Fluxo de instalação no painel
4. Webhook de push automático
5. Seletor de repositórios
