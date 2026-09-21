import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

type FormFieldProps = React.ComponentProps<typeof Input> & {
  id: string;
  label: string;
  // Right of the label on the same line (e.g. "Esqueceu a senha?").
  labelAction?: React.ReactNode;
};

// Label + input, wired together. Every form field goes through here so
// spacing, labels and accessibility stay identical from screen to screen.
export function FormField({ id, label, labelAction, ...inputProps }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      {labelAction ? (
        <div className="flex items-center justify-between">
          <Label htmlFor={id}>{label}</Label>
          {labelAction}
        </div>
      ) : (
        <Label htmlFor={id}>{label}</Label>
      )}
      <Input id={id} {...inputProps} />
    </div>
  );
}
