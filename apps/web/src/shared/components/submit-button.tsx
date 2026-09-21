import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/spinner";

type SubmitButtonProps = Omit<React.ComponentProps<typeof Button>, "type" | "children"> & {
  pending: boolean;
  children: React.ReactNode;
  // Text while the request is in flight ("Entrando…"); defaults to the idle label.
  pendingLabel?: React.ReactNode;
};

// The submit button of every form: while the request runs it shows a spinner
// and refuses a second click, so nothing is ever sent twice.
export function SubmitButton({ pending, pendingLabel, children, disabled, ...props }: SubmitButtonProps) {
  return (
    <Button type="submit" disabled={pending || disabled} aria-busy={pending} {...props}>
      {pending && <Spinner />}
      {pending ? (pendingLabel ?? children) : children}
    </Button>
  );
}
