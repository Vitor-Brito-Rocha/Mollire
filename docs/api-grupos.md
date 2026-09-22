# Contrato da API de grupos: equipe, entregas, XP de equipe, progresso da turma, feedback e link de convite

Combinado com o time em 22/09/2026 (as seis ideias, mais o pedido de feedback privado ou público). O front já consome estes endpoints (`apps/web/src/modules/turmas/` e `modules/progress/`): enquanto eles não existem, cada bloco some em silêncio (404 ou campo ausente), então dá pra subir o back por partes, em qualquer ordem. Os tipos TypeScript em `modules/turmas/types.ts` são a fonte da verdade; este documento explica o que está por trás deles.

Segue as regras de `docs/api-turmas.md`: membership é a fronteira (404, nunca 403), apelido em vez de e-mail, snake_case. E as de produto: nada aqui é ranking. Toda comparação é da pessoa (ou do grupo) com a própria meta, ou da turma inteira com a meta da turma.

## 1. Equipe automática (grupo vira membros do projeto)

Hoje o grupo é só uma etiqueta no projeto submetido. A ideia: quem está no mesmo grupo trabalha junto no projeto, sem convite por e-mail.

**Comportamento no back**

- `POST /turmas/:id/projects` (submissão), quando o aluno tem grupo: criar `ProjectMember(role: MEMBER)` para cada colega do grupo que ainda não é membro do projeto. Marcar de onde veio: coluna nova `ProjectMember.via_turma_group_id String?`.
- `POST /turmas/:id/groups/:groupId/join`: quem entra num grupo vira membro dos projetos que esse grupo já submeteu (mesma marca).
- `DELETE /turmas/:id/group` (sair do grupo), troca de grupo, `DELETE /turmas/:id/groups/:groupId` (grupo apagado) e `DELETE /turmas/:id/projects/:slug` (projeto retirado): remover só os `ProjectMember` com `via_turma_group_id` daquele grupo. Membros convidados à mão pelo dono ficam.
- O dono continua dono; membros automáticos têm o mesmo poder de um membro convidado (deploy, log, variáveis), como já é hoje.

**Na galeria da turma** (`GET /turmas/:id/gallery`), cada projeto ganha a equipe:

```json
{
  "slug": "clima-agora",
  "author": "helena.r",
  "group": { "id": "grp_1", "name": "Grupo 1" },
  "team": [
    { "handle": "helena.r", "level": 7, "frame": "silver" },
    { "handle": "dudu", "level": 4, "frame": null }
  ]
}
```

`team` = dono + membros do projeto (ordem: dono primeiro), com nível e moldura para a insígnia. Ausente enquanto o back não montar: o cartão só não mostra a equipe.

## 2. Entregas com prazo

O professor define as entregas da turma ("Entrega 1: site no ar até 30/09"). Cada **unidade** (o grupo, em `group_mode: GROUPS`; o aluno, em `NONE`) cumpre a entrega com o projeto que submeteu à turma. **Não há ação de "entregar":** o back verifica os requisitos contra o projeto submetido e marca sozinho. Aluno sem grupo numa turma em grupos não tem unidade (`mine: null`).

```prisma
model TurmaMilestone {
  id           String   @id @default(uuid())
  turma_id     String
  title        String
  description  String?
  due_at       DateTime
  req_deployed Boolean  @default(true)   // último deploy SUCCESS
  req_published Boolean @default(false)  // is_public
  req_min_stars Int?                     // estrelas na galeria da turma
  position     Int      @default(0)
  created_at   DateTime @default(now())
}

model MilestoneCompletion {
  id            String   @id @default(uuid())
  milestone_id  String
  unit_id       String   // TurmaGroup.id ou User.id, conforme o group_mode
  project_id    String
  completed_at  DateTime @default(now())
  @@unique([milestone_id, unit_id])
}
```

**Quando verificar:** no fim de um deploy com sucesso, ao publicar, ao receber estrela na turma e ao submeter projeto — para cada entrega da turma ainda não cumprida pela unidade, se os requisitos batem, grava `MilestoneCompletion` (a primeira vez, só) e dá XP (seção 3). Um cron diário não é necessário.

**Status** (calculado): `done` (cumprida até `due_at`), `late` (cumprida depois), `pending` (falta e ainda há prazo), `missed` (falta e o prazo passou).

### `GET /turmas/:id/milestones` (membro)

Ordenadas por `due_at`. `mine` vem para o aluno (a unidade dele), `stats` para o professor.

```json
[
  {
    "id": "ms_1", "title": "Site no ar", "description": "Qualquer página, mas publicada.",
    "due_at": "2026-09-30T23:59:59-03:00",
    "requirements": { "deployed": true, "published": false, "min_stars": null },
    "created_at": "…",
    "mine": { "status": "done", "completed_at": "2026-09-24T14:02:00Z", "project": { "slug": "clima-agora", "name": "Clima Agora" } },
    "stats": null
  }
]
```

Para o professor: `"mine": null, "stats": { "completed": 6, "total": 8 }` (`total` = grupos, ou alunos em `NONE`).

### `POST /turmas/:id/milestones` (professor)

```json
{ "title": "Site no ar", "description": "opcional", "due_at": "2026-09-30T23:59:59-03:00",
  "requirements": { "deployed": true, "published": false, "min_stars": null } }
```

→ 201 com a entrega no formato acima. `PATCH /turmas/:id/milestones/:milestoneId` aceita os mesmos campos (parciais); `DELETE …/:milestoneId` → 204 (apaga as conclusões junto; o XP já dado fica).

### `GET /turmas/:id/milestones/:milestoneId` (professor)

A entrega mais uma linha por unidade, para a tela "quem entregou":

```json
{
  "id": "ms_1", "title": "Site no ar", "…": "…",
  "rows": [
    { "unit": { "type": "group", "id": "grp_1", "name": "Grupo 1" },
      "project": { "slug": "clima-agora", "name": "Clima Agora" },
      "status": "done", "completed_at": "…" },
    { "unit": { "type": "group", "id": "grp_3", "name": "Grupo 3" }, "project": null, "status": "missed", "completed_at": null }
  ]
}
```

`unit.type: "student"` traz `name` = apelido.

## 3. XP para quem fez, bônus para a equipe, conquistas de equipe

Corrige o que ficou em aberto no repasse ("XP de deploy por membro vai ao dono") e liga o XP às entregas.

- **Deploy:** o XP de `DEPLOY` vai para **quem disparou** — quem clicou em deploy, ou o autor do push (login do GitHub → conta conectada → usuário; sem correspondência, o dono). `FIRST_DEPLOY` continua do dono (é a estreia do projeto).
- **Bônus de equipe:** `TEAM_DEPLOY` (+3) para cada outro membro do projeto quando um deploy termina bem. `XpEvent.actor_id` = quem fez o deploy, para o histórico dizer "deploy do dudu em Clima Agora".
- **Entrega:** `MILESTONE` (+30 se `done`, +10 se `late`) para cada pessoa da unidade, uma vez por entrega.

`GET /xp/rules` passa a listar `TEAM_DEPLOY` e `MILESTONE`. Novos `XpReason`: `TEAM_DEPLOY`, `MILESTONE`.

**Conquistas novas** (mesmo mecanismo de `docs/api-progresso.md`, seção 4):

| code | quando | tier |
|---|---|---|
| `team_all_deployed` | todos os membros de um projeto com equipe (2+) já dispararam pelo menos um deploy nele | prata |
| `team_first_milestone` | a unidade da pessoa cumpriu uma entrega no prazo pela primeira vez | bronze |

## 4. Progresso coletivo da turma: `GET /turmas/:id/progress` (membro)

A turma inteira contra a própria meta. Nenhum número por pessoa.

```json
{
  "students": 20,
  "with_deploy": 14,
  "published": 9,
  "milestones": [ { "id": "ms_1", "title": "Site no ar", "completed": 6, "total": 8 } ],
  "xp_week": 1240
}
```

`with_deploy` = alunos com pelo menos um deploy SUCCESS em qualquer projeto submetido à turma (membro conta); `published` = projetos submetidos que estão na galeria; `xp_week` = soma dos `XpEvent` dos alunos nos últimos 7 dias. Cache de um minuto é seguro.

## 5. Feedback escrito com a nota, privado ou público

`POST /turmas/:id/projects/:slug/grade` ganha dois campos opcionais:

```json
{ "grade": 8.5, "comment": "Bom uso do grid; falta o estado vazio.", "comment_public": false }
```

- `comment` até 2000 caracteres; `null` ou vazio apaga. `comment_public` (padrão `false`): `true` = toda a turma lê o comentário (a nota continua só do grupo); `false` = só o professor e a equipe do projeto.
- Colunas em `Project`: `grade_comment String?`, `grade_comment_public Boolean @default(false)`. Zeradas junto com a nota quando o projeto é submetido de novo.
- Na galeria da turma, cada projeto traz `grade_comment` (string ou `null`) **só para quem pode ler** (professor, equipe, ou qualquer membro se público) e `grade_comment_public` para o professor e a equipe. Para quem não pode ler, as duas chaves não vêm. O front usa a presença de `grade_comment` para saber que o back já suporta o campo.

## 6. Link de convite do grupo

Cada grupo ganha um código próprio, no mesmo alfabeto do da turma:

- `TurmaGroup.code String @unique` (gerado ao criar o grupo; migração preenche os existentes). Vem em `groups[]` no detalhe da turma.
- `POST /turmas/join { code }` aceita código de grupo: entra na turma (se ainda não estava) **e** no grupo. Se o grupo estiver cheio, entra só na turma e responde `{ "turma_id": "…", "role": "ALUNO", "group_id": null, "group_full": true }` (200, não 409). Turma cheia continua 409.

O link é montado pelo front: `https://<app>/turmas/entrar?code=XXXXXX` — funciona para o código da turma e para o de grupo, e leva ao login primeiro se preciso.

## Ordem sugerida

1. **6 e 1** (pequenas; grupo deixa de ser etiqueta).
2. **5** (dois campos e uma regra de visibilidade).
3. **2** (o modelo e a verificação nos quatro ganchos).
4. **3 e 4** (dependem de 2 para as entregas; o XP para quem fez pode ir junto com o 1).
