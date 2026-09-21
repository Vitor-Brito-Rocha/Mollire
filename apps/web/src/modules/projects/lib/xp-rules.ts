// Espelho das constantes da API — DEPLOY_XP e FIRST_DEPLOY_BONUS_XP em
// deployments.service.ts, PUBLISH_XP em projects.service.ts, STAR_XP em
// gallery.service.ts. Enquanto não existe um GET /xp/rules, mudar lá exige
// mudar aqui. É a única lista de números do jogo que o usuário vê.
export const XP_RULES = [
  { label: "Deploy", xp: 10, note: "Cada deploy que termina bem" },
  { label: "Estreia", xp: 50, note: "Bônus do seu primeiro deploy, uma vez só" },
  { label: "Galeria", xp: 20, note: "Na primeira vez que um projeto é publicado na galeria" },
  { label: "Estrela", xp: 5, note: "Cada estrela recebida num projeto seu" },
] as const;
