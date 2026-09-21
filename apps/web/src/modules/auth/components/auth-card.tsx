import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

// The card every auth screen sits in — forms and "check your e-mail" notices
// alike — so they all look like one flow.
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
    <Card className="corners w-full max-w-[420px]">
      <CardHeader className="items-center text-center">
        <CardTitle className="text-2xl font-bold">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      {children && <CardContent>{children}</CardContent>}
    </Card>
  );
}
