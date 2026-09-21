# Design system do Mollire (web)

A interface é um **launcher de jogo** (Steam, Epic, Riot): escura por padrão, com um acento ciano, cantos chanfrados e ferragens em L, tipografia de display em caixa alta. Não é um dashboard de SaaS nem pixel art. Existe um **tema claro** opcional (`useTheme`, botão na barra lateral, na barra do celular e no login; a escolha fica no navegador em `mollire:theme`). Tudo que está aqui vive em `apps/web/src/styles/globals.css` (tokens e utilitários) e em `apps/web/src/shared/` (componentes).

## Tokens

### Cor (`globals.css`: `.dark` é o escuro, padrão; `:root` é o claro)
| Token | Escuro | Claro | Uso |
|---|---|---|---|
| `--background` / `--card` / `--raised` | `#0c0f16` / `#131824` / `#1a2131` | `#f2f4f8` / `#ffffff` / `#e9edf4` | fundo, superfície, superfície elevada |
| `--foreground` / `--muted-foreground` / `--text-3` | `#eef1f7` / `#a3adc2` / `#7f8aa3` | `#101523` / `#4c5870` / `#66718b` | texto principal, secundário, terciário |
| `--border` / `--line-2` | `#2a3346` / `#38425a` | `#d3d9e4` / `#b8c1d2` | linhas; a segunda para hover e destaque |
| `--primary` | `#5ee2ff` | `#0b86ab` | o acento: ações, foco, nível, XP |
| `--gold` / `--silver` / `--bronze` | `#f2c14e` / `#c3cbd9` / `#d08a4f` | `#9a6d05` / `#6f7a8c` / `#99592d` | estrelas e selos. Dourado **só** para estrela e Ouro |
| `--good` / `--destructive` | `#4de38a` / `#ff6b70` | `#15834b` / `#d1353c` | publicado / falhou |
| `--glow` / `--halo` / `--halo-2` / `--glow-gold` | acento a 35% / 10%, violeta 9%, dourado 35% | idem, mais fracos | brilhos e luz ambiente |
| `--ring-good` / `--ring-bad` | verde / vermelho a 35% | idem | anel interno dos chips de estado |
| `--grid-line` / `--surface-edge` / `--shadow-surface` | malha 4%, fio de luz, sombra pesada | malha 9%, fio branco, sombra leve | fundo e superfícies |

Toda cor nova entra nos dois blocos. Não use `white`, `black`, `slate`, `zinc`, `gray`: se precisar de uma cor, ela vira token.

### Tipografia
Três famílias: **Chakra Petch** (`font-display`: títulos, rótulos, números grandes), **IBM Plex Sans** (texto), **Geist Mono** (URLs, hashes, XP, estrelas — sempre `tabular-nums`).

| Classe | Tamanho | Uso |
|---|---|---|
| `text-display-2xl` / `-xl` | 68 / 58px | a vitrine do login |
| `text-display-lg` | 46px | h1 de tela no desktop, nome no banner |
| `text-display` | 36px | h1 no celular, título das telas de entrada |
| `text-title-lg` / `text-title` | 28 / 26px | título de detalhe, números do painel de nível |
| `text-heading` | 22px | nome do item em destaque, título de diálogo |
| `text-base` / `text-sm` | 16 / 14px | texto corrido |
| `text-body-lg` | 15px | texto com um pouco mais de presença (linhas de lista) |
| `text-caption` | 13px | legendas e metadados |
| `text-xs` | 12px | mono pequeno |
| `text-mini` / `text-micro` | 11 / 10px | rótulos de HUD. **10px é o piso.** |

Trackings: `tracking-display` (−0.02em, títulos), `tracking-label` (0.12em, caixa alta), `tracking-eyebrow` (0.14em). Nada de `text-[..px]` fora dos glifos decorativos do `SiteThumb`.

### Página, movimento e foco
| Token | Valor | Uso |
|---|---|---|
| `--page` / `--page-narrow` | 1180 / 1000px | `max-w-(--page)` em toda tela |
| `--dur-fast` / `--dur` / `--dur-slow` | 120 / 300 / 700ms | `duration-(--dur)` |
| `--ease` | `cubic-bezier(0.2, 0.8, 0.2, 1)` | toda transição por interação |
| `--ease-reward` | `cubic-bezier(0.2, 0.9, 0.3, 1.3)` | só as recompensas (estrela, nível) |
| `focus-ring` | contorno de 2px no acento | todo botão ou link cru |

As grades de duas e três colunas entram em `xl` (1280px): a barra lateral ocupa 232px.

## Vocabulário do HUD (utilitários)
- `chamfer` / `chamfer-sm`: cantos superior-esquerdo e inferior-direito cortados. Botão primário, selos de nível.
- `corners` (+ `--corner`): ferragens em L nos cantos. **Só em destaques**: banners, cartões de vitrine, diálogo.
- `surface`: a superfície de todo bloco, translúcida com fio de luz no topo e sombra. Sem desfoque, de propósito: desfocar o fundo animado custa caro.
- `hex`: hexágono. Insígnia de nível e avatar.
- `label`: caixa alta, Chakra Petch 11px, espaçada.
- `tag-cut`: selo com um canto cortado e faixa de metal (`TierBadge`).
- `xp-track` / `xp-fill`: barra de XP segmentada.
- `glow` / `glow-lg`: brilho ciano.
- `hud-grid`: malha de fundo, esvanecendo para baixo. Só no `<main>` e na vitrine do login.
- `spot-glow`: brilho que segue o ponteiro dentro de um `.group`.
- `route-enter`: entrada de tela (fade curto). Só no shell.

## Componentes

### Primitivos (`shared/ui`, shadcn base-nova)
Button (variantes `default` chanfrada, `outline`, `secondary`, `ghost`, `destructive`, `link`; tamanhos `sm`, `default`, `lg`, `icon-*`), Input, Label, Switch, Skeleton, Spinner, Avatar, Card, DropdownMenu, Separator, Table, Sonner (toasts).

### Blocos (`shared/components`)
| Componente | Quando usar |
|---|---|
| `PageHeader` | o topo de toda tela: eyebrow ou link de voltar, h1, descrição, meta, ações à direita |
| `Eyebrow` | o rótulo com traço. `primary` acima de h1, `section` como h2 de bloco, `muted` para rótulos discretos; `style={{ color }}` para a cor de um projeto |
| `Panel` | todo bloco de conteúdo com título em caixa alta, contador e um `aside` à direita |
| `CoverBanner` | topo de tela ou destaque com a capa do projeto atrás e degradê. Recebe a cor do projeto por render-prop |
| `CoverCard` | item de vitrine (galeria, perfil): capa 16:10, selo, brilho, rodapé livre. `featured` para o primeiro |
| `SiteThumb` | a captura do site, ou a capa honesta "sem captura" (inicial + malha na cor do projeto). `thumb`, `card`, `banner` |
| `LevelInsignia` | o hexágono com o nível. `sm` (barra do celular, `solid`), `md` (barra lateral), `lg` (painel, perfil) |
| `LevelBar` | barra de XP com contagem, selo e toast ao subir de nível |
| `ConfirmDialog` | a pergunta antes de uma ação que não volta. Título curto, uma frase de consequência, botão com o verbo |
| `EmptyState` | "nada aqui" e "não carregou", com uma ação |
| `SegmentedControl` | filtros mutuamente exclusivos |
| `FormField` | label + input, sempre por aqui |
| `SubmitButton` | botão de formulário com estado pendente |
| `InlineAction` | ação de texto dentro de linhas ("remover", "re-deploy"), com pendente próprio |
| `GridBeams` | feixes de luz no fundo. Já está no shell; não repita por tela |

Chips de estado (`StatusChip`, `DeployStatus`) e selos (`TierBadge`) vivem nos módulos `projects` e `gallery` e saem pelos `index.ts`.

## Regras
| Faça | Não faça |
|---|---|
| Tamanho de texto pela escala nomeada | `text-[13px]` |
| `max-w-(--page)` | `max-w-[1120px]` |
| Um `Eyebrow` acima do h1 e pronto | eyebrow em todo bloco: vira papel de parede |
| `corners` em banner, cartão de vitrine e diálogo | `corners` em painel comum |
| Dourado para estrela e Ouro | dourado como decoração |
| `focus-ring` em botão cru | botão sem foco visível |
| Confirmar o que não volta com `ConfirmDialog` | apagar no primeiro clique |
| Recompensa com movimento (estrela, nível, deploy) | animar o que é só atualização de estado |
| Respeitar `prefers-reduced-motion` (todas as animações já param) | animação sem saída |

## Produto (não muda sem conversa)
Estrela binária e acumulativa, nunca nota. Selos por limiar: Bronze 10, Prata 50, Ouro 100, nenhum abaixo de 10. Sem ranking. Apelido público, e-mail nunca exposto. Projeto privado por padrão. Faixas de nível em `shared/lib/level.ts`.
