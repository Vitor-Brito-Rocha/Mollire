"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

// Auth runs on the server so the session cookie is set (httpOnly) by the
// response itself; the browser only ever sees the outcome.
type Result = { error?: string };

export async function signIn(email: string, password: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error: error?.message };
}

export async function signUp(email: string, password: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({ email, password });
  return { error: error?.message };
}

export async function requestPasswordReset(email: string): Promise<Result> {
  const requestHeaders = await headers();
  const origin =
    requestHeaders.get("origin") ?? `https://${requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host")}`;

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/reset-password`,
  });
  return { error: error?.message };
}

export async function updatePassword(password: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  return { error: error?.message };
}

export async function hasSession(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return !!user;
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
