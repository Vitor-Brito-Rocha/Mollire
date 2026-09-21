# Contrato da API de progresso: missões, conquistas e histórico de XP

Pedido do Vitor em 21/09/2026. O front já consome estes endpoints (`apps/web/src/modules/progress/`): enquanto eles não existem, cada bloco some em silêncio (404), então dá pra subir o back por partes. Os tipos TypeScript em `modules/progress/types.ts` são a fonte da verdade; este documento explica o que está por trás deles.

**Princípio:** a API devolve **fatos por código** (o que foi feito, quando, quanto vale). Texto, ícone, cor e link de cada item ficam no front (`modules/progress/lib/catalog.ts`). Criar uma missão ou conquista nova é: uma constante no back, uma entrada no catálogo do front.

## 1. Regras de XP: `GET /xp/rules` (público)

Hoje os valores vivem em constantes espalhadas (`DEPLOY_XP`, `FIRST_DEPLOY_BONUS_XP` em `deployments.service.ts`; `PUBLISH_XP` em `projects.service.ts`; `STAR_XP` em `gallery.service.ts`) e o front os espelha em `modules/projects/lib/xp-rules.ts`. Um endpoint tira o espelho.

```json
[
  { "code": "DEPLOY", "xp": 10 },
  { "code": "FIRST_DEPLOY", "xp": 50 },
  { "code": "PUBLISH", "xp": 20 },
  { "code": "STAR_RECEIVED", "xp": 5 },
  { "code": "QUEST", "xp": 10 },
  { "code": "HELPFUL_COMMENT", "xp": 5 }
]
```

Sem tabela: é um objeto constante no back. Cache de um dia é seguro.

## 2. Histórico de XP: `GET /users/me/xp/history?limit=20` (sessão)

Toda soma de XP passa a **também gravar um evento**. Sem isso, o histórico não existe e as missões não têm como dar XP uma vez só.

```prisma
model XpEvent {
  id         String   @id @default(uuid())
  user_id    String
  amount     Int
  reason     XpReason
  project_id String?  // deploy, publicação, estrela recebida
  actor_id   String?  // quem deu a estrela / marcou o comentário
  created_at DateTime @default(now())
  user       User     @relation(fields: [user_id], references: [id])
  @@index([user_id, created_at])
}

enum XpReason { DEPLOY FIRST_DEPLOY PUBLISH STAR_RECEIVED QUEST ACHIEVEMENT HELPFUL_COMMENT }
```

Onde gravar: dentro de `awardDeployXp` (DEPLOY e, quando for o caso, FIRST_DEPLOY), no `publish` do `projects.service`, no `star` do `gallery.service` (o XP vai pro **dono** do projeto; `actor_id` é quem deu a estrela). Ideal: uma função só, `xp.award(userId, reason, { projectId, actorId })`, que soma no `User.xp` e grava o evento na mesma transação. Aí `User.xp` vira um cache do somatório, e recalcular é possível.

Resposta (mais recente primeiro; `ref` tem o que o front precisa pro link):

```json
[
  { "id": "…", "amount": 10, "reason": "DEPLOY",
    "ref": { "project": { "slug": "turma-3b", "name": "Agenda da Turma 3B" } },
    "created_at": "2026-09-21T18:02:00Z" },
  { "id": "…", "amount": 5, "reason": "STAR_RECEIVED",
    "ref": { "project": { "slug": "clima-agora", "name": "Clima Agora" }, "handle": "helena.r" },
    "created_at": "2026-09-21T15:10:00Z" },
  { "id": "…", "amount": 10, "reason": "QUEST", "ref": null, "created_at": "…" }
]
```

`limit` entre 1 e 50, padrão 20. `ref.handle` é o apelido do ator (nunca e-mail). Projeto apagado: `ref: null`.

## 3. Missões de estreia: `GET /users/me/quests` (sessão)

Sete missões, todas dedutíveis de dados que já existem. A única tabela nova guarda a conclusão, pra pagar o XP **uma vez só** mesmo que o usuário desfaça e refaça (desconecte o GitHub, apague o projeto).

| code | Completa quando | XP |
|---|---|---|
| `connect_github` | existe `GithubInstallation` do usuário | 10 |
| `create_project` | existe projeto do usuário (dono) | 10 |
| `first_deploy` | existe deploy `SUCCESS` em projeto do usuário | 10 |
| `publish_gallery` | existe projeto do usuário com `is_public` | 10 |
| `give_star` | existe estrela dada pelo usuário | 5 |
| `invite_member` | existe convite ou membro adicionado pelo usuário | 10 |
| `add_env_var` | existe variável em projeto do usuário | 10 |

```prisma
model QuestCompletion {
  user_id      String
  code         String
  completed_at DateTime @default(now())
  @@id([user_id, code])
}
```

Avaliação: no `GET`, para cada missão sem `QuestCompletion`, checar a condição; se passou, gravar a conclusão e `xp.award(user, QUEST)`. Simples, sem ganchos espalhados, e o usuário vê a missão virar concluída na próxima visita ao painel (o front busca a cada 30 s). Quem já fez tudo antes desta feature ganha tudo de uma vez na primeira chamada; é aceitável e até simpático.

```json
{
  "quests": [
    { "code": "connect_github", "xp": 10, "completed_at": "2026-09-19T12:00:00Z" },
    { "code": "give_star", "xp": 5, "completed_at": null }
  ],
  "completed": 4,
  "total": 7
}
```

Ordem fixa, a da tabela acima. O front mostra as missões no painel Progresso enquanto `completed < total`; depois volta a mostrar as regras de XP.

## 4. Conquistas: `GET /users/me/achievements` (sessão) e `GET /users/:handle/achievements` (público)

Marco pessoal, não ranking. Sete pra começar:

| code | Desbloqueia quando | Progresso exposto |
|---|---|---|
| `first_deploy` | 1º deploy `SUCCESS` | não |
| `ten_deploys` | 10 deploys `SUCCESS` (somando os projetos do usuário) | `current/10` |
| `first_star` | 1ª estrela recebida | não |
| `fast_deploy` | um deploy `SUCCESS` com `finished_at - created_at < 60 s` | não |
| `rollback` | 1º redeploy por SHA de uma versão anterior | não |
| `collaborator` | membro (não dono) em 3 projetos | `current/3` |
| `uptime_30` | um site publicado 30 dias sem deploy `FAILED` e sem sair da galeria | `current/30` (dias) |

```prisma
model Achievement {
  user_id     String
  code        String
  unlocked_at DateTime @default(now())
  @@id([user_id, code])
}
```

Avaliação: como as missões, **no `GET`** (checar as não desbloqueadas, gravar as que passaram, `xp.award(user, ACHIEVEMENT)` com 25 XP cada, por exemplo). Se quiserem toast na hora e push, o passo 2 é chamar a mesma avaliação ao fim de `awardDeployXp`, do `star` e do `addMember`, e registrar uma `ProjectActivity` do tipo `ACHIEVEMENT_UNLOCKED`. O `uptime_30` depende do item 6 (ping); até lá, contar dias desde o último deploy bem-sucedido sem falha é uma aproximação honesta.

Resposta do próprio usuário (todas, com progresso):

```json
[
  { "code": "first_deploy", "unlocked_at": "2026-09-19T13:00:00Z" },
  { "code": "ten_deploys", "unlocked_at": null, "progress": { "current": 6, "target": 10 } },
  { "code": "rollback", "unlocked_at": null }
]
```

Resposta pública (`/users/:handle/achievements`): **só as desbloqueadas**, sem progresso. Apelido inexistente: 404.

## 5. Comentário útil (opcional, pequeno) — front pronto

`POST /gallery/:slug/comments/:id/helpful` e `DELETE` do mesmo (204): só o dono do projeto (403 para os outros); grava `Comment.helpful_at`; na primeira marcação, `xp.award(autor do comentário, HELPFUL_COMMENT, { projectId, actorId: dono })` — desmarcar e marcar de novo não paga de novo. `GET /gallery/:slug/comments` passa a devolver `helpful: boolean` em cada comentário. **O front mostra o botão "marcar como útil" só quando o campo `helpful` existe na resposta**; o chip "útil" aparece para todo mundo.

## 6. "No ar há N dias" (opcional, médio) — front pronto

Cron a cada 10 min faz `HEAD https://{slug}.aulvi.com.br` em todo projeto publicado; grava em `SiteCheck(project_id, ok, checked_at)`; `GET /projects/:slug` e `GET /gallery/:slug` passam a devolver `uptime_since: string | null` (ISO do início da sequência atual de `ok`; `null` se o último check falhou ou nunca houve). Alimenta a conquista `uptime_30`. O front já mostra o chip "no ar há 12 dias" no cabeçalho do projeto e a linha "No ar" na galeria quando o campo vem.

## 7. Moldura da insígnia (opcional, pequeno) — front pronto

Cosmético: a cor do hexágono do nível. `User.frame` (string, nulo = padrão), devolvido em `GET /users/me` e em `GET /users/:handle` (é público: aparece no perfil). `PATCH /users/me { frame }` aceita um dos ids `default | bronze | silver | gold | violet` e valida o nível mínimo (bronze 3, prata 5, ouro 8, violeta 12; 400 se não liberou). **O seletor só aparece no perfil quando `frame` vem na resposta de `/users/me`** (nem que seja `null`).

## Ordem sugerida e tamanho

1. `xp.award` + `XpEvent` + `GET /users/me/xp/history` + `GET /xp/rules` — meio dia. Destrava o resto.
2. Missões — meio dia. Só leitura de dados que já existem, mais uma tabela.
3. Conquistas — um dia. Mesma mecânica das missões.
4. Moldura da insígnia — uma hora (um campo e uma validação).
5. Comentário útil — duas horas.
6. Ping de uptime — um dia.

O front de todos os seis já está na main e liga sozinho quando cada endpoint ou campo aparecer.

**Migrações:** só tabelas novas. Não renomear nem editar migrações já aplicadas (o `init` renomeado ainda está na fila do review de 21/09).

## Como ficou no back (21/09/2026)

Os sete itens estão implementados, com o contrato JSON acima intacto. Ajustes em relação ao texto:

- **Onde mora o quê:** `src/xp/` (regras, `XpService.award`, histórico), `src/progress/` (catálogos de missões e conquistas, avaliação no `GET`), `src/uptime/` (ping e `uptime_since`). Constantes soltas (`DEPLOY_XP` etc.) viraram `XP_VALUE` em `xp/xp.rules.ts`.
- **`GithubInstallation` não existe:** o model real é `GithubAccount`; `connect_github` olha ele.
- **`invite_member`:** convite feito pelo usuário **ou** membro (não dono) em projeto dele — adicionar quem já tem conta não gera convite.
- **`rollback`:** ganhou campo `Deployment.is_rollback`, marcado em `DeploymentsService.trigger` quando o deploy por `commit_sha` aponta um commit que já foi ao ar antes e não é o atual. Só conta para o dono do projeto (o deploy não guarda quem o disparou).
- **`uptime_30`:** usa os checks reais (`SiteCheck`), cortado pelo último deploy `FAILED`. Sair da galeria apaga os checks do projeto, então a contagem recomeça ao republicar. Progresso só aparece enquanto bloqueada.
- **Comentário útil:** dois campos em `Comment` — `helpful_at` (estado atual) e `helpful_paid_at` (marca de pagamento, nunca limpa). O dono **não** pode marcar comentário próprio (409), senão pagaria XP a si mesmo. `POST` e `DELETE` respondem 204.
- **Ping:** `setInterval` no processo da API (sem dependência nova), a cada 10 min. **Desligado fora de produção** por padrão (`UPTIME_CHECK_ENABLED=true` liga; ver `.env.example`). Checks ficam 90 dias; se o último check tem mais de 1 h (pinger parado), `uptime_since` volta `null`. Site privado nunca tem `uptime_since`.
- **Moldura:** `PATCH /users/me` agora aceita `handle` e/ou `frame` (ao menos um). `default` é gravado como `null`. A resposta do `PATCH` passou a trazer o formato completo de `/users/me` (inclui `github_connected`), porque o front a grava no cache da sessão.
- **Estrela:** o `star` pagava XP mesmo quando a estrela já existia (três chamadas em `Promise.all`); agora só paga se a estrela foi criada. Continua possível estrelar, tirar e estrelar de novo pra ganhar 5 XP a cada vez — decisão pendente.
- **Histórico antigo:** quem ganhou XP antes desta feature tem `User.xp` maior que a soma dos eventos (não há backfill); o histórico começa daqui.
- **Push ao desbloquear conquista:** logo depois de um deploy bem-sucedido, de uma estrela recebida e de entrar num projeto (convite aceito ou adicionado pelo dono), o back roda a mesma avaliação do `GET` e manda um push (`Conquista desbloqueada: <título>`, `+25 XP`, abre `/perfil`) para cada conquista **recém**-desbloqueada. O `GET` continua silencioso (quem está com o painel aberto já vê). O título do push vem de `progress/achievements.catalog.ts` (único texto no back; manter igual ao do front). Falha de push não quebra a requisição nem desfaz o desbloqueio. Consequência: XP de conquista (+25) já entra no momento do evento, não na próxima visita ao painel.
- **`uptime_30` também manda push:** ela só fica verdadeira com o tempo passando, então um job de hora em hora (`progress/uptime-milestone.service.ts`, mesmo liga/desliga do ping) avalia só quem tem um site publicado com check de 30+ dias e ainda não a desbloqueou.
- **Não feito:** não registramos `ProjectActivity ACHIEVEMENT_UNLOCKED`.

**Como testar sem o front:** os JSONs acima são exatamente os que o backend de mentira do Michael devolve; a tela do painel, do perfil e do perfil público já renderizam a partir deles.
