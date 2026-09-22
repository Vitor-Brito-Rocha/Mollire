# Contrato da API: máquina do tempo e diário de bordo

Combinado em 22/09/2026 (ideias 1 e 2 da rodada de inovação). O front já consome estes endpoints: enquanto não existem, os blocos somem em silêncio (404 ou campo ausente). Tipos em `apps/web/src/modules/projects/types.ts` (`Snapshot`, `DeploymentNote`).

**A ideia:** o projeto deixa de ser só "o site de agora" e vira a história de como chegou lá. Uma captura por deploy, e duas linhas do aluno em cada um dizendo o que mudou e o que aprendeu. Sem XP de propósito: o diário é reflexão, não moeda.

## 1. Uma captura por deploy

Hoje a Playwright captura o site depois de cada deploy com sucesso e sobrescreve `THUMBNAILS_DIR/{slug}.png`. Passa a **também** guardar a mesma imagem por deploy:

- arquivo `THUMBNAILS_DIR/{slug}/{deploymentId}.png`, servido em `GET /thumbnails/{slug}/{deploymentId}.png` (público, mesmo `ServeStaticModule`);
- `Deployment.snapshot_url String?` preenchido quando a captura deu certo (a captura pode falhar; o deploy continua `SUCCESS`);
- ao apagar o projeto, apagar a pasta. Sem retenção por enquanto: um PNG de 640×400 tem ~40 KB, cem deploys são 4 MB.

### `GET /projects/:slug/snapshots` (membro) e `GET /gallery/:slug/snapshots` (público)

Mesma resposta. A rota de `/gallery` segue as regras de `GET /gallery/:slug` (404 se o projeto não for público). Só deploys com captura, do mais novo para o mais antigo:

```json
[
  {
    "deployment_id": "dep_8",
    "commit_sha": "e4f5a6b",
    "commit_message": "ajusta cores do calendário",
    "url": "/thumbnails/turma-3b/dep_8.png",
    "created_at": "2026-09-22T10:02:00Z",
    "note": { "text": "Troquei o azul por ciano; o contraste no tema claro estava ruim.", "author": "voce", "updated_at": "2026-09-22T10:20:00Z" }
  },
  { "deployment_id": "dep_7", "commit_sha": "9f3a1c2", "commit_message": "primeira versão", "url": "/thumbnails/turma-3b/dep_7.png", "created_at": "…", "note": null }
]
```

O front só mostra a máquina do tempo com duas capturas ou mais.

## 2. Diário de bordo

Duas linhas por deploy, escritas por quem trabalha no projeto (dono ou membro), editáveis depois. Aparecem no histórico de deploys, na máquina do tempo e na página pública do projeto (o diário faz parte da história; se o projeto é privado, só membros veem).

```prisma
model Deployment {
  // ...
  snapshot_url    String?
  note_text       String?   // até 500 caracteres
  note_author_id  String?
  note_updated_at DateTime?
}
```

### `PUT /projects/:slug/deployments/:deploymentId/note` (membro)

```json
{ "text": "Troquei o azul por ciano; o contraste no tema claro estava ruim." }
```

→ 200 `{ "text": "…", "author": "voce", "updated_at": "…" }`. Texto vazio apaga a anotação e responde `null`. 404 se o deploy não for desse projeto.

### `GET /projects/:slug` — cada deployment ganha `note`

`"note": { "text", "author", "updated_at" }` ou `"note": null`. A chave presente (mesmo `null`) é como o front sabe que o back já suporta o diário e mostra o botão de escrever. `author` é o apelido, nunca e-mail.

## O que o front faz com isso

- `/projects/:slug`: painel "Máquina do tempo" acima do histórico (imagem grande, controle deslizante por deploy, botão "ver evolução" que passa as capturas sozinho) e, em cada linha do histórico, a anotação e o botão "diário".
- `/galeria/:slug`: a mesma máquina do tempo, só leitura, embaixo da prévia do site.
