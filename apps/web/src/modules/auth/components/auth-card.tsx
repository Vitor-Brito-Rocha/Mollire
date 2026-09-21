// The block every auth screen sits in — forms and "check your e-mail" notices
// alike — so they all look like one flow. The frame is the layout's; here it
// is only the title, the description and the content.
export function AuthCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex w-full flex-col gap-7">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-[34px] leading-[1.05] font-bold tracking-[-0.015em]">{title}</h1>
        {description && <p className="text-muted-foreground text-[15px] leading-relaxed">{description}</p>}
      </div>
      {children}
    </div>
  );
}
