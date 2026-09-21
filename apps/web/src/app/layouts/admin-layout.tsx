import { Link, Outlet, useLocation } from "react-router";

const NAV_ITEMS = [
  { href: "/admin", label: "Projetos" },
  { href: "/admin/admins", label: "Admins" },
];

// Cabeçalho e navegação da seção admin, dentro do AppLayout (a barra superior
// é a mesma do resto do app: o admin é uma seção, não outro app).
export default function AdminLayout() {
  const { pathname } = useLocation();

  return (
    <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-col gap-2.5">
          <span className="label text-primary flex items-center gap-2.5 tracking-[0.14em]">
            <span className="bg-primary h-0.5 w-[18px]" />
            Admin
          </span>
          <h1 className="font-display text-[34px] leading-[1.1] font-bold">Console</h1>
          <p className="text-muted-foreground text-[15px]">
            Todos os projetos e deploys, de todos os tenants — somente leitura, exceto quem é admin.
          </p>
        </div>
        <nav className="bg-card border-border inline-flex gap-0.5 border p-[3px]" aria-label="Seções do admin">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                aria-current={active ? "page" : undefined}
                className={
                  "label inline-flex min-h-[38px] items-center px-3.5 transition-colors " +
                  (active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <Outlet />
    </div>
  );
}
