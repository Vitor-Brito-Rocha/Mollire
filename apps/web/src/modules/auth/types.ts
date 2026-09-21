export type CurrentUser = {
  id: string;
  email: string;
  // Identidade pública (galeria, comentários). Nunca mostrar o e-mail no lugar dela.
  handle: string | null;
  role: 'ADMIN' | 'TENANT';
  xp: number;
  level: number;
  next: number;
  // Convites de projeto resgatados nesta chamada (0 na maioria das vezes).
  joined_projects?: number;
  github_connected: boolean;
  // Moldura da insígnia escolhida (ver modules/progress). Ausente enquanto a API não a devolver.
  frame?: string | null;
};
