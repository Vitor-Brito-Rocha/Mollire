import { useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router";
import { loginPathFor, useCurrentUser } from "@/modules/auth";
import { InlineAction } from "@/shared/components/inline-action";
import { SubmitButton } from "@/shared/components/submit-button";
import { formatTimeAgo } from "@/shared/lib/format";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Skeleton } from "@/shared/ui/skeleton";
import { useAddComment, useDeleteComment, useToggleHelpful } from "../hooks/use-comment-mutations";
import { useComments } from "../hooks/use-gallery";
import { ConfirmDialog } from "@/shared/components/confirm-dialog";
import { Eyebrow } from "@/shared/components/eyebrow";
import { StatusChip } from "@/shared/components/status-chip";

// `isOwner`: o dono marca comentários como úteis (e o autor ganha XP).
export function CommentsSection({ slug, count, isOwner = false }: { slug: string; count: number; isOwner?: boolean }) {
  const location = useLocation();
  const { user } = useCurrentUser();
  const { data: comments, isPending } = useComments(slug);
  const addComment = useAddComment(slug);
  const deleteComment = useDeleteComment(slug);
  const toggleHelpful = useToggleHelpful(slug);
  const [body, setBody] = useState("");
  // Comentário aguardando confirmação para ser apagado.
  const [removing, setRemoving] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const text = body.trim();
    if (!text) return;
    addComment.mutate(text, { onSuccess: () => setBody("") });
  }

  return (
    <section className="flex flex-col gap-4">
      <Eyebrow as="h2" tone="section">
        Comentários
        <span className="text-text-3 font-mono text-xs tracking-normal normal-case">{count}</span>
      </Eyebrow>

      {user ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <Label htmlFor="comentario">Deixe um comentário</Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id="comentario"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="O que você achou do projeto?"
              maxLength={1000}
              className="bg-card"
            />
            <SubmitButton size="lg" pending={addComment.isPending} pendingLabel="Enviando…" disabled={!body.trim()}>
              Publicar
            </SubmitButton>
          </div>
        </form>
      ) : (
        <div className="corners bg-card border-border flex flex-wrap items-center justify-between gap-3 border px-4 py-3">
          <span className="text-muted-foreground text-sm">Entre para deixar um comentário.</span>
          <Button
            size="sm"
            nativeButton={false}
            render={<Link to={loginPathFor(location.pathname + location.search)}>Entrar</Link>}
          />
        </div>
      )}

      {isPending ? (
        <Skeleton className="h-24 w-full" />
      ) : !comments || comments.length === 0 ? (
        <p className="text-text-3 text-sm">Ninguém comentou ainda. Seja a primeira pessoa.</p>
      ) : (
        <div className="corners bg-card border-border flex flex-col border">
          {comments.map((comment) => (
            <div key={comment.id} className="border-border flex gap-3 border-b p-4 last:border-b-0">
              <span className="hex bg-raised font-display text-muted-foreground grid size-8 shrink-0 place-items-center text-xs font-bold uppercase">
                {comment.author.charAt(0)}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="text-sm font-semibold">{comment.author}</span>
                  {comment.is_project_owner && (
                    <StatusChip tone="accent">autor</StatusChip>
                  )}
                  {comment.helpful && <StatusChip tone="good">útil</StatusChip>}
                  <span className="text-text-3 text-xs">{formatTimeAgo(comment.created_at)}</span>
                  {isOwner && comment.helpful !== undefined && !comment.is_project_owner && (
                    <InlineAction
                      className="ml-auto"
                      onClick={() => toggleHelpful.mutate({ commentId: comment.id, helpful: !comment.helpful })}
                      pending={toggleHelpful.isPending && toggleHelpful.variables?.commentId === comment.id}
                    >
                      {comment.helpful ? "desmarcar útil" : "marcar como útil"}
                    </InlineAction>
                  )}
                  {comment.can_delete && (
                    <InlineAction
                      destructive
                      className={isOwner && comment.helpful !== undefined && !comment.is_project_owner ? undefined : "ml-auto"}
                      onClick={() => setRemoving(comment.id)}
                      pending={deleteComment.isPending && deleteComment.variables === comment.id}
                      disabled={deleteComment.isPending}
                    >
                      remover
                    </InlineAction>
                  )}
                </div>
                <p className="text-body-lg leading-relaxed break-words whitespace-pre-line">{comment.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      <ConfirmDialog
        open={removing !== null}
        title="Apagar este comentário?"
        description="Ele some da página do projeto para todo mundo. Não dá para desfazer."
        confirmLabel="Apagar"
        pending={deleteComment.isPending}
        onCancel={() => setRemoving(null)}
        onConfirm={() => removing && deleteComment.mutate(removing, { onSettled: () => setRemoving(null) })}
      />
    </section>
  );
}
