# Contrato da API: feed da turma (o hub)

Combinado em 22/09/2026. O front já consome isto (`/turmas/:id/hub` e a prévia na tela da turma): enquanto o endpoint não existe, a prévia e o botão somem, e o hub mostra "ainda não disponível". Tipos em `apps/web/src/modules/turmas/types.ts` (`TurmaFeedItem`, `TurmaFeedPage`).

**A ideia:** um lugar onde a turma vê o que está acontecendo: quem publicou, o que escreveu no diário, que grupo cumpriu qual entrega, quem entrou. Nada de ranking: é a ordem dos acontecimentos, não uma ordem de mérito. Notas nunca aparecem; feedback do professor só quando ele marcou como público.

## `GET /turmas/:id/feed?limit=30&before=<ISO>` (membro)

```json
{
  "items": [
    { "id": "dep_9", "type": "deploy", "at": "2026-09-22T13:10:00Z",
      "actor": { "handle": "dudu", "level": 4, "frame": null },
      "group": { "id": "grp_1", "name": "Grupo 1" },
      "project": { "slug": "clima-agora", "name": "Clima Agora" },
      "commit_message": "previsão de 5 dias e ícones" },
    { "id": "note_dep_9", "type": "note", "at": "…", "actor": { "…": "…" }, "group": { "…": "…" }, "project": { "…": "…" },
      "text": "Troquei a API de clima: a antiga limitava a 50 chamadas por dia." },
    { "id": "mc_3", "type": "milestone", "at": "…", "actor": null, "group": { "id": "grp_1", "name": "Grupo 1" },
      "project": { "slug": "clima-agora", "name": "Clima Agora" },
      "milestone": { "id": "ms_1", "title": "Site no ar" }, "status": "done" },
    { "id": "sub_5", "type": "submit", "at": "…", "actor": { "…": "…" }, "group": { "…": "…" }, "project": { "…": "…" } },
    { "id": "star_2026-09-21_clima-agora", "type": "star", "at": "…", "actor": null, "group": { "…": "…" }, "project": { "…": "…" }, "stars": 3 },
    { "id": "fb_clima-agora", "type": "feedback", "at": "…", "actor": { "handle": "prof.aline", "level": 9, "frame": "gold" }, "group": { "…": "…" }, "project": { "…": "…" },
      "text": "README exemplar. Deem uma olhada em como ele explica o projeto." },
    { "id": "join_u_7", "type": "join", "at": "…", "actor": { "handle": "bia.m", "level": 3, "frame": null }, "group": { "id": "grp_4", "name": "Equipe Norte" }, "project": null }
  ],
  "next": "2026-09-15T08:00:00Z"
}
```

- Ordenado do mais novo para o mais antigo. `next` é o `at` do último item (ou `null` no fim); o front manda de volta em `before`.
- `limit` entre 1 e 50, padrão 30.
- `actor` sempre com apelido, nível e moldura (para a insígnia), nunca e-mail. `null` quando o evento é do grupo (entrega cumprida) ou agregado (estrelas).
- `group` é o grupo do projeto na turma (ou do membro, em `join`); `null` em turma sem grupos.
- Tipos que o front não conhece são ignorados: dá para acrescentar (o mural da turma, por exemplo) sem quebrar nada.

### De onde vem cada tipo

| type | fonte | quando |
|---|---|---|
| `deploy` | `Deployment` com `SUCCESS` de projeto submetido à turma | `finished_at`; `actor` = quem disparou (o dono, se não houver) |
| `note` | `Deployment.note_text` (docs/api-diario-de-bordo.md) | `note_updated_at`; `actor` = autor da anotação |
| `milestone` | `MilestoneCompletion` (docs/api-grupos.md §2) | `completed_at`; `status` = `done` se até o prazo, senão `late` |
| `submit` | `Project.turma_id` gravado (guardar `turma_submitted_at`) | ao submeter; `actor` = dono |
| `star` | `ProjectStar` em projetos da turma, **agregado por dia e projeto** | o dia; `stars` = quantas naquele dia. Sem `actor`, para não virar placar de quem estrela |
| `feedback` | `Project.grade_comment` com `grade_comment_public = true` | `graded_at`; `actor` = professor. A nota **nunca** vai |
| `join` | `TurmaMember.joined_at`, e troca de grupo | quando entrou; `group` = grupo atual |

Uma consulta por fonte, unindo e ordenando em memória, resolve para turmas de até algumas centenas de eventos. Cache de um minuto é seguro.

## O que o front faz com isso

- `/turmas/:id/hub`: o feed com separadores por dia e "ver mais", o progresso da turma e as entregas ao lado.
- `/turmas/:id`: botão "Hub da turma" e um painel "Novidades" com os três itens mais recentes.
