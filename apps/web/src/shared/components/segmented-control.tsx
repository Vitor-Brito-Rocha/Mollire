import { cn } from "@/shared/lib/utils";

type SegmentedControlProps<T extends string> = {
  options: readonly { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
};

// A row of mutually exclusive choices (filters, view modes) in the HUD style.
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn("bg-card border-border inline-flex max-w-full flex-wrap gap-0.5 border p-[3px]", className)}
    >
      {options.map((option) => {
        const on = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(option.value)}
            className={cn(
              "label focus-ring min-h-[38px] px-3.5 transition-colors",
              on ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
