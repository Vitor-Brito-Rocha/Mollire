# Contrato da API: diário de bordo

Combinado em 22/09/2026 (ideia 2 da rodada de inovação; a máquina do tempo, ideia 1, foi descartada pelo time por exigir uma captura por deploy). O front já consome isto: enquanto a chave `note` não vem, o botão de escrever não aparece. Tipo em `apps/web/src/modules/projects/types.ts` (`DeploymentNote`).

**A ideia:** duas linhas por deploy, escritas por quem trabalha no projeto, dizendo o que mudou e o que aprendeu. O histórico de deploys vira a história de como o site chegou onde está. Sem XP de propósito: o diário é reflexão, não moeda.

## Modelo

```prisma
model Deployment {
  // ...
  note_text       String?   // até 500 caracteres
  note_author_id  String?
  note_updated_at DateTime?
}
```

## `PUT /projects/:slug/deployments/:deploymentId/note` (membro)

```json
{ "text": "Troquei o azul por ciano; o contraste no tema claro estava ruim." }
```

→ 200 `{ "text": "…", "author": "voce", "updated_at": "…" }`. Texto vazio apaga a anotação e responde `null`. 404 se o deploy não for desse projeto. Qualquer membro (dono ou convidado) escreve e edita; a autoria fica registrada.

## `GET /projects/:slug` — cada deployment ganha `note`

`"note": { "text", "author", "updated_at" }` ou `"note": null`. A chave presente (mesmo `null`) é como o front sabe que o back já suporta o diário. `author` é o apelido, nunca e-mail.

## Onde aparece no front

- `/projects/:slug`, histórico de deploys: a anotação embaixo da mensagem do commit, e o botão "diário" / "editar diário" nos deploys publicados.
- Se um dia a página pública mostrar o histórico, o diário vai junto: ele faz parte da história do projeto.
