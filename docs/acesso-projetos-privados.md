# Acesso a projetos privados

Hoje o Nginx serve qualquer projeto para qualquer pessoa que saiba a URL.
O campo `is_public` existe no banco mas só controla a Gallery — não bloqueia o acesso ao site.

## O que queremos

Projetos privados (`is_public = false`) só devem ser acessíveis pelo dono e pelos membros do projeto.
Projetos públicos continuam acessíveis para qualquer pessoa.

## Solução: auth_request

Antes de servir um arquivo, o Nginx faz uma requisição interna para a API da Mollire perguntando:
"esse usuário tem permissão para ver o projeto `{slug}`?"

```
Browser acessa isaura.aulvi.com.br
        ↓
Nginx recebe a requisição
        ↓
Nginx chama GET /internal/auth?slug=isaura  (com o cookie da sessão)
        ↓
API verifica: projeto é público? usuário é membro?
        ↓
200 → Nginx serve os arquivos
401 → Nginx redireciona para o login
403 → Nginx retorna página de acesso negado
```

## O que precisa ser implementado

**Na API (`apps/api`):**
- Novo endpoint `GET /internal/auth` — recebe o slug via query param, verifica o cookie de sessão e responde 200/401/403
- Não retorna body, só o status code (o Nginx só lê o status)

**No Nginx (`nginx/mollire.conf`):**
- Diretiva `auth_request /internal/auth` no bloco do servidor
- `auth_request_set` para repassar o cookie da sessão para a API
- `error_page 401` redirecionando para o login da Mollire
- `error_page 403` mostrando página de acesso negado

**No banco:**
- Nenhuma mudança — `is_public` e a tabela `members` já têm tudo que precisamos

## Fluxo para projetos públicos

Para não exigir login em projetos públicos, o endpoint `/internal/auth` verifica primeiro se `is_public = true` — se sim, retorna 200 direto sem checar sessão.

## Observações

- O cookie de sessão precisa ser repassado do browser → Nginx → API via `proxy_set_header`
- Em dev (`localtest.me`) e prod (`aulvi.com.br`) o domínio do cookie é diferente — precisa de atenção na configuração
- O endpoint `/internal/auth` deve ser inacessível diretamente (fora do Nginx) — bloquear via `allow 127.0.0.1; deny all`
