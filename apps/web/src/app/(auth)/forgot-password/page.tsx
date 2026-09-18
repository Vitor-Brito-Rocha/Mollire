"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset } from "@/lib/auth-actions";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    const { error } = await requestPasswordReset(email);
    setLoading(false);

    if (error) {
      toast.error(error);
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Confira seu email</CardTitle>
          <CardDescription>
            Se {email} tiver uma conta, enviamos um link para redefinir a senha.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Esqueceu a senha?</CardTitle>
        <CardDescription>
          Informe seu email e enviaremos um link para redefinir sua senha.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Enviando..." : "Enviar link"}
          </Button>
          <p className="text-muted-foreground text-center text-sm">
            <Link href="/login" className="text-primary underline underline-offset-4">
              Voltar para o login
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
