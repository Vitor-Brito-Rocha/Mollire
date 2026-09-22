import { toast } from "sonner";

// O link que o professor (ou o grupo) cola no WhatsApp: entra na turma e, se
// o código for de um grupo, no grupo. A tela /turmas/entrar faz o resto.
export const inviteLink = (code: string) => `${window.location.origin}/turmas/entrar?code=${encodeURIComponent(code)}`;

// Copia e avisa; se o navegador não deixar, o texto vai no próprio aviso.
export async function copyText(text: string, message: string, fallback: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(message);
    return true;
  } catch {
    toast.error(`${fallback} ${text}`);
    return false;
  }
}
