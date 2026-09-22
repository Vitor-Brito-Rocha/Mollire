# Contrato da API de Turmas

Pedido do Vitor em 22/09/2026. Backend implementado (`apps/api/src/turmas/`), migration escrita mas **não aplicada** no banco (ver seção "Rodando a migration"). Este documento é o contrato pra quem for construir o front (`apps/web/src/modules/turmas/`, seguindo o padrão de `modules/gallery/`).

## Conceito

Turma = sala de aula por cima do produto existente. Qualquer membro pode criar uma turma e vira automaticamente o **Professor** dela (`TurmaRole.PROFESSOR`). Quem entra depois — por código ou, se a turma for pública, direto pela lista — vira **Aluno** (`TurmaRole.ALUNO`). Turma tem sua própria galeria de projetos submetidos, com estrela (reaproveita `ProjectStar`, igual à galeria normal) e nota (dada só pelo professor).

Regras centrais:
- **Nome não é único globalmente**, só por dono: o mesmo usuário não pode ter duas turmas com o mesmo nome (`@@unique([owner_id, name])`, case-insensitive).
- **Pública** (`is_public: true`): aparece em `GET /turmas/public`, qualquer um entra sem código. **Privada**: só entra por código.
- Toda turma tem um **código** (6 caracteres, ex. `K7XQ2M` — alfabeto sem `0/O/1/I/L` pra evitar confusão), gerado sempre, público ou privada. É o mecanismo principal de entrada.
- **Capacidade** (`capacity`, opcional): limite de alunos (não conta o professor). `null` = sem limite.
- **Grupos**: a turma tem `group_mode` = `NONE` (sem grupos, submissão é individual) ou `GROUPS` (o professor define grupos com tamanho máximo próprio, ex. "Grupo 1" cap. 4). O aluno escolhe um grupo depois de entrar na turma. O professor pode criar/apagar grupos a qualquer momento, não só na criação da turma.
- **Membership é a fronteira**, igual a projeto: uma turma que o usuário não integra não existe pra ele — a API sempre devolve 404, nunca 403 (mesma regra de `ProjectsService.findForMember`, ver comentário em `turmas.service.ts`).

## Modelo de dados (já no `schema.prisma`)

```prisma
enum TurmaRole { PROFESSOR ALUNO }
enum TurmaGroupMode { NONE GROUPS }

model Turma {
  id          String
  name        String
  code        String         @unique
  description String?
  is_public   Boolean        @default(false)
  capacity    Int?           // só alunos, professor não conta
  group_mode  TurmaGroupMode @default(NONE)
  owner_id    String
  created_at  DateTime
  updated_at  DateTime
  @@unique([owner_id, name])
}

model TurmaGroup {
  id       String
  turma_id String
  name     String
  max_size Int
  @@unique([turma_id, name])
}

model TurmaMember {
  id        String
  turma_id  String
  user_id   String
  role      TurmaRole @default(ALUNO)
  group_id  String?
  joined_at DateTime
  @@unique([turma_id, user_id])
}
```

E no `Project` existente, 5 colunas novas (tudo opcional — um projeto normal, fora de qualquer turma, não muda em nada):

```prisma
model Project {
  // ...
  turma_id       String?
  turma_group_id String?
  grade          Float?     // nota 0–10, só o professor da turma grava
  graded_at      DateTime?
  graded_by      String?
}
```

Um projeto pertence a no máximo uma turma por vez. Submeter de novo (ou trocar de turma) zera a nota anterior.

### Rodando a migration

`apps/api/prisma/migrations/20260922000000_add_turmas/migration.sql` já está escrita (não toquei no banco remoto sem confirmar contigo). Antes de subir o front, rode:

```bash
npm run prisma:migrate
```

(ou `prisma migrate deploy` em produção) dentro de `apps/api`.

## Endpoints

Tudo sob `/turmas`, autenticado (cookie de sessão) salvo onde marcado **público**. Erros seguem o padrão do resto da API: 404 pra "não existe ou você não tem acesso", 409 pra conflito (nome duplicado, turma cheia, grupo cheio), 400 pra validação.

### Criar turma — `POST /turmas`

```json
// body
{
  "name": "Turma 3B — Projetos Web",
  "description": "opcional",
  "is_public": false,
  "capacity": 40,
  "group_mode": "GROUPS",
  "groups": [
    { "name": "Grupo 1", "max_size": 4 },
    { "name": "Grupo 2", "max_size": 4 }
  ]
}
```

`groups` só é lido se `group_mode: "GROUPS"`; pode vir vazio/omitido e o professor cria grupos depois via `POST /turmas/:id/groups`. Todos os campos exceto `name` são opcionais (`is_public` default `false`, `group_mode` default `"NONE"`).

```json
// 201
{
  "id": "cktu...",
  "name": "Turma 3B — Projetos Web",
  "code": "K7XQ2M",
  "description": "opcional",
  "is_public": false,
  "capacity": 40,
  "group_mode": "GROUPS",
  "my_role": "PROFESSOR",
  "groups": [
    { "id": "...", "name": "Grupo 1", "max_size": 4, "members_count": 0 },
    { "id": "...", "name": "Grupo 2", "max_size": 4, "members_count": 0 }
  ],
  "created_at": "2026-09-22T12:00:00Z"
}
```

409 se o usuário já tem uma turma com esse nome.

### Entrar por código — `POST /turmas/join`

```json
{ "code": "k7xq2m" }
```
→ `{ "turma_id": "...", "role": "ALUNO", "group_id": null }`. Não-diferencia maiúsc/minúsc. 404 se o código não existir. 409 se a turma estiver na capacidade. Idempotente: já sendo membro, devolve o estado atual sem erro.

### Entrar em turma pública sem código — `POST /turmas/:id/join`

Mesma resposta/regras de cima; 404 se a turma não existir ou não for pública.

### Minhas turmas — `GET /turmas/mine`

Turmas onde o usuário é professor ou aluno.

```json
[
  { "id": "...", "name": "Turma 3B", "is_public": false, "my_role": "PROFESSOR", "students_count": 12, "capacity": 40, "created_at": "..." }
]
```

### Turmas públicas — `GET /turmas/public`

Pra tela de "entrar em turma" sem código.

```json
[
  { "id": "...", "name": "Curso de React", "description": "...", "owner": "prof.ana", "students_count": 30, "capacity": null, "is_member": false, "created_at": "..." }
]
```

### Detalhe da turma — `GET /turmas/:id`

Membro (professor ou aluno) apenas.

```json
{
  "id": "...", "name": "Turma 3B", "description": "...",
  "code": "K7XQ2M",
  "is_public": false, "capacity": 40, "group_mode": "GROUPS",
  "my_role": "ALUNO", "my_group_id": "grp_1",
  "students_count": 12,
  "groups": [ { "id": "grp_1", "name": "Grupo 1", "max_size": 4, "members_count": 3 } ],
  "created_at": "..."
}
```

### Lista de alunos — `GET /turmas/:id/students` (só professor)

```json
[
  { "user_id": "...", "handle": "joao.dev", "role": "ALUNO", "group": { "id": "grp_1", "name": "Grupo 1" }, "joined_at": "..." }
]
```

### Grupos

- `POST /turmas/:id/groups` (professor) — body `{ "name": "Grupo 3", "max_size": 5 }` → `{ id, name, max_size, members_count }`. Liga `group_mode` pra `GROUPS` automaticamente se a turma ainda estava em `NONE`. 409 se o nome já existe na turma.
- `DELETE /turmas/:id/groups/:groupId` (professor, 204) — apaga o grupo; membros e projetos daquele grupo voltam pra "sem grupo" (não é erro, não precisa estar vazio).
- `POST /turmas/:id/groups/:groupId/join` (qualquer membro) — entra no grupo. 409 se o grupo estiver cheio. Troca de grupo é só chamar de novo com outro `groupId`.
- `DELETE /turmas/:id/group` (204) — sai do grupo atual (fica sem grupo).

### Galeria da turma — `GET /turmas/:id/gallery` (**público se a turma for pública**, senão só membro)

Mesma forma da galeria normal (`GalleryProject`), mais `group` e `grade`:

```json
[
  {
    "id": "...", "name": "Agenda Escolar", "slug": "agenda-3b-joao",
    "author": "joao.dev", "thumbnail_url": null,
    "stars": 4, "starred_by_viewer": false,
    "group": { "id": "grp_1", "name": "Grupo 1" },
    "grade": 8.5, "graded_at": "2026-09-21T10:00:00Z",
    "created_at": "..."
  }
]
```

### Submissão de projeto

- `POST /turmas/:id/projects` — body `{ "project_slug": "agenda-3b-joao" }`. Só o **dono do projeto**, e ele precisa já ser membro da turma. Usa o grupo atual do aluno na turma (`turma_group_id`) automaticamente. Zera nota anterior se houver.
- `DELETE /turmas/:id/projects/:slug` (204) — dono do projeto remove a submissão (some da galeria da turma, projeto continua existindo normalmente).

### Nota — `POST /turmas/:id/projects/:slug/grade` (só professor)

```json
{ "grade": 8.5 }
```
0 a 10, até 2 casas decimais. 404 se o projeto não estiver submetido a essa turma.

### Estrela na galeria da turma

- `POST /turmas/:id/projects/:slug/star` / `DELETE .../star` → `{ "stars": 5, "starred_by_viewer": true }`. Mesmas regras da galeria normal (dono não estrela o próprio projeto), mas sem exigir que o projeto seja público — só que o viewer tenha acesso à turma.

## Sugestão pro front (`frontend-skill`)

Seguir exatamente o padrão de `modules/gallery/`:

```
modules/turmas/
  api/turmas.api.ts       # um método por endpoint acima, tipado
  types.ts                # Turma, TurmaDetail, TurmaGroup, TurmaMember, TurmaGalleryProject...
  hooks/keys.ts            # query keys (react-query, como em gallery/hooks/keys.ts)
  hooks/use-turmas.ts, use-turma-detail.ts, use-turma-gallery.ts, use-turma-mutations.ts (join, criar grupo, entrar em grupo, submeter projeto, dar nota, estrela)
  components/turma-card.tsx, group-card.tsx, students-list.tsx, grade-input.tsx, join-turma-dialog.tsx...
  pages/turmas-list.page.tsx      # "minhas turmas" + botão criar + botão entrar por código
  pages/turma-create.page.tsx     # form: nome, pública/privada, capacidade, modo de grupo + grupos iniciais
  pages/turma-detail.page.tsx     # galeria da turma + (se professor) lista de alunos e grupos
  index.ts
```

Rotas sugeridas em `app/router.tsx`, dentro do bloco `RequireAuth` (perto de `projects`):

```
{ path: "turmas", ...page(() => import("@/modules/turmas/pages/turmas-list.page")) },
{ path: "turmas/nova", ...page(() => import("@/modules/turmas/pages/turma-create.page")) },
{ path: "turmas/:id", ...page(() => import("@/modules/turmas/pages/turma-detail.page")) },
```

Coisas que o front decide (não tem resposta "certa" no back):
- Como mostrar/copiar o `code` (o professor vai precisar compartilhar isso com a turma).
- UI de "professor" vs "aluno" na mesma tela de detalhe (`my_role` já vem pronto pra condicionar).
- Formulário de criação: grupos como lista dinâmica (adicionar/remover linhas nome+tamanho) antes de enviar.
- Onde encaixar "minhas turmas" na navegação (`side-rail.tsx`) — sugestão: item novo ao lado de "Projetos".
