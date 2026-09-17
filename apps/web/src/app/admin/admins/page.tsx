"use client";

import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api, ApiError, type AdminsList, type InviteAdminResponse } from "@/lib/api";

export default function AdminAdminsPage() {
  const [data, setData] = useState<AdminsList | null>(null);
  const [email, setEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  function reload() {
    return api.get<AdminsList>("/admin/admins").then(setData);
  }

  useEffect(() => {
    reload();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setInviting(true);
    try {
      const result = await api.post<InviteAdminResponse>("/admin/admins", { email });
      if (result.status === "already_admin") {
        toast.info(`${result.user.email} já é admin`);
      } else if (result.status === "promoted") {
        toast.success(`${result.user.email} agora é admin`);
      } else {
        toast.success(`Convite criado — ${result.invite.email} vira admin no próximo login`);
      }
      setEmail("");
      await reload();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Erro ao convidar admin");
    } finally {
      setInviting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Novo admin</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex items-end gap-3">
            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="pessoa@exemplo.com"
                required
              />
            </div>
            <Button type="submit" disabled={inviting}>
              {inviting ? "Enviando..." : "Tornar admin"}
            </Button>
          </form>
          <p className="text-muted-foreground mt-2 text-xs">
            Se a pessoa ainda não fez login, ela vira admin automaticamente no primeiro login.
          </p>
        </CardContent>
      </Card>

      {data === null ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.admins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell>{admin.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">admin</Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {data.pendingInvites.map((invite) => (
                  <TableRow key={invite.email}>
                    <TableCell>{invite.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">pendente (aguardando 1º login)</Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {data.admins.length === 0 && data.pendingInvites.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-muted-foreground">
                      Nenhum admin ainda.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
