// Espelho das constantes da API — DEPLOY_XP e FIRST_DEPLOY_BONUS_XP em
// deployments.service.ts, PUBLISH_XP em projects.service.ts, STAR_XP em
// gallery.service.ts. Enquanto não existe um GET /xp/rules, mudar lá exige
// mudar aqui. É a única lista de números do jogo que o usuário vê.
export const XP_RULES = [
  { label: "Deploy publicado", xp: 10, note: "cada deploy que termina bem" },
  { label: "Primeiro deploy", xp: 50, note: "bônus de estreia, uma vez só" },
  { label: "Projeto na galeria", xp: 20, note: "na primeira vez que publica" },
  { label: "Estrela recebida", xp: 5, note: "cada estrela num projeto seu" },
] as const;
