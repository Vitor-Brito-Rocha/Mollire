// The API answers in English (its own exceptions, Supabase's auth errors passed
// through, class-validator's). The product is Brazilian, so every error message
// is translated once, here, when the ApiError is built — toasts and inline
// messages all read the translation.

type Rule = [match: string | RegExp, message: string | ((groups: string[]) => string)];

// Matched against the message trimmed, lower-cased and without its final period.
const RULES: Rule[] = [
  // --- Login, cadastro e sessão (Supabase / auth) ---
  ["invalid login credentials", "E-mail ou senha incorretos."],
  ["email not confirmed", "Confirme seu e-mail antes de entrar. Enviamos um link para a sua caixa de entrada."],
  ["user already registered", "Já existe uma conta com esse e-mail."],
  [/^email address .* is invalid$/, "E-mail inválido."],
  ["unable to validate email address: invalid format", "E-mail inválido."],
  [/password should be at least (\d+) characters/, ([n]) => `A senha deve ter pelo menos ${n} caracteres.`],
  ["new password should be different from the old password", "A nova senha deve ser diferente da anterior."],
  ["signup requires a valid password", "Informe uma senha válida."],
  ["signups not allowed for this instance", "Novos cadastros estão desativados no momento."],
  [/for security purposes, you can only request this (?:after|once every) (\d+) seconds?/, ([n]) =>
    `Por segurança, aguarde ${n} segundos antes de tentar de novo.`],
  [/rate limit/, "Muitas tentativas. Aguarde alguns minutos e tente de novo."],
  [/token has expired or is invalid|email link is invalid or has expired/, "Link inválido ou expirado. Solicite um novo."],
  [/^missing (session|tokens)$|invalid or expired token|token missing required claims/, "Sua sessão expirou. Entre novamente."],
  ["auth provider unreachable", "O serviço de autenticação está indisponível. Tente novamente em instantes."],
  ["origin not allowed", "Requisição bloqueada por segurança. Recarregue a página e tente de novo."],
  ["insufficient role", "Você não tem permissão para isso."],

  // --- Projetos e deploys ---
  [/^project ".*" not found$/, "Projeto não encontrado."],
  [/^slug ".*" is already taken$/, "Esse endereço já está em uso. Escolha outro slug."],
  [/^project ".*" already has a deploy in progress$/, "Este projeto já tem um deploy em andamento."],
  [/^project ".*" has a deploy in progress, wait for it to finish$/, "Este projeto tem um deploy em andamento. Espere terminar para apagar."],
  [/^root_dir ".*" was not found in the repository/, "A pasta do projeto não existe no repositório. Confira o caminho."],
  [/^root_dir ".*" is a file, not a folder$/, "O caminho da pasta do projeto aponta para um arquivo, não para uma pasta."],
  [/^root_dir must be a relative folder/, 'A pasta do projeto deve ser um caminho relativo (letras, números, . _ - e /), sem "..".'],
  ["confirm_name does not match the project name", "O nome digitado não confere com o nome do projeto."],
  ["build queue is full, try again later", "A fila de builds está cheia. Tente de novo em instantes."],
  [/^deployment ".*" not found$/, "Deploy não encontrado."],
  ["commit_sha must be a hex string", "SHA de commit inválido."],
  [/^key must be uppercase letters/, "O nome deve ter só letras maiúsculas, números e _ (máx. 256 caracteres)."],
  [/^env var ".*" not found$/, "Variável não encontrada."],

  // --- Membros, perfil e galeria ---
  ["you're already the owner of this project", "Você já é o dono deste projeto."],
  ["the owner can't be removed from their own project", "O dono não pode ser removido do próprio projeto."],
  [/^handle ".*" is already taken$/, "Esse apelido já está em uso."],
  [/^user ".*" not found$/, "Usuário não encontrado."],
  ["can't star your own project", "Você não pode dar estrela no seu próprio projeto."],
  [/^comment ".*" not found$/, "Comentário não encontrado."],

  // --- GitHub ---
  ["github account not found", "Conta do GitHub não encontrada."],
  [/^github not connected/, "GitHub não conectado. Instale o GitHub App primeiro."],

  // --- Validação (class-validator) ---
  [/must be an email/, "E-mail inválido."],
  [/should not be empty/, "Preencha todos os campos obrigatórios."],
  [/must be longer than or equal to (\d+) characters/, ([n]) => `Um dos campos é curto demais (mínimo de ${n} caracteres).`],
  [/must be shorter than or equal to (\d+) characters/, ([n]) => `Um dos campos é longo demais (máximo de ${n} caracteres).`],
  [/must be a url address/, "Informe uma URL válida."],
  [/must match .* regular expression/, "Um dos campos está em formato inválido."],
  [/must be a string|must be a number|must be a boolean|should not exist/, "Dados inválidos. Confira o que foi preenchido."],
];

// Nothing above matched (Nest's stock "Not Found", a GitHub failure, a message
// nobody translated yet): say what the status means, in Portuguese.
const BY_STATUS: [test: (status: number) => boolean, message: string][] = [
  [(s) => s === 400 || s === 422, "Dados inválidos. Confira o que foi preenchido."],
  [(s) => s === 401, "Sua sessão expirou. Entre novamente."],
  [(s) => s === 403, "Você não tem permissão para isso."],
  [(s) => s === 404, "Não encontrado."],
  [(s) => s === 409, "Essa ação conflita com o estado atual. Atualize a página e tente de novo."],
  [(s) => s === 413, "O conteúdo enviado é grande demais."],
  [(s) => s === 429, "Muitas tentativas. Aguarde um pouco e tente de novo."],
  [(s) => s >= 500, "O servidor teve um problema. Tente novamente em instantes."],
];

const FALLBACK = "Não foi possível concluir a operação. Tente novamente.";

function translateOne(raw: string, status: number): string {
  const text = raw.trim().toLowerCase().replace(/\.$/, "");
  for (const [match, message] of RULES) {
    const groups = typeof match === "string" ? (text === match ? [] : null) : text.match(match)?.slice(1);
    if (groups) return typeof message === "function" ? message(groups) : message;
  }
  if (import.meta.env.DEV) console.warn(`[api] mensagem sem tradução (${status}):`, raw);
  return BY_STATUS.find(([test]) => test(status))?.[1] ?? FALLBACK;
}

// `raw` is what the API sent: a string, or the array of strings Nest's
// validation pipe produces.
export function translateApiMessage(raw: unknown, status: number): string {
  const messages = (Array.isArray(raw) ? raw : [raw]).filter((m): m is string => typeof m === "string" && m !== "");
  if (messages.length === 0) return translateOne("", status);
  return [...new Set(messages.map((message) => translateOne(message, status)))].join(" ");
}
