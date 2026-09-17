import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard-header";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Belt-and-suspenders — middleware.ts already redirects unauthenticated
  // requests before they reach here.
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader email={user.email ?? ""} />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
