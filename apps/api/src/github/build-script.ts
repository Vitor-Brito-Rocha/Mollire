export type BuildScriptCandidate = {
  name: string;
  command: string;
  priority: number;
};

export type BuildScriptDetection = {
  // Set when the choice is obvious; null when the user has to pick.
  build_command: string | null;
  candidates: BuildScriptCandidate[];
};

const AUTO_PICK_MIN_PRIORITY = 90;
const SAFE_SCRIPT_NAME = /^[\w.:-]+$/;

// Higher = more likely to be the production build.
function priorityOf(name: string): number | null {
  if (name === 'build') return 100;
  if (/^build:prod(uction)?$/i.test(name)) return 90;
  if (/^(prod|production)$/i.test(name)) return 80;
  if (/^build:(dev|development|local|test)$/i.test(name)) return 10;
  if (name.startsWith('build:')) return 50;
  return null;
}

// Picks the build script from package.json "scripts". Auto-selects only when
// the answer is unambiguous (a plain `build`, or a single top-priority
// candidate); otherwise returns the ranked candidates so the user can choose.
export function detectBuildScript(scripts: unknown): BuildScriptDetection {
  if (!scripts || typeof scripts !== 'object') return { build_command: null, candidates: [] };

  const candidates: BuildScriptCandidate[] = [];
  for (const [name, command] of Object.entries(scripts as Record<string, unknown>)) {
    // The name ends up in a shell command, so only accept plain script names.
    if (typeof command !== 'string' || !SAFE_SCRIPT_NAME.test(name)) continue;
    const priority = priorityOf(name);
    if (priority !== null) candidates.push({ name, command, priority });
  }
  candidates.sort((a, b) => b.priority - a.priority || a.name.localeCompare(b.name));

  const [top, second] = candidates;
  const obvious = top && top.priority >= AUTO_PICK_MIN_PRIORITY && top.priority !== second?.priority;
  const lone = candidates.length === 1;
  return {
    build_command: obvious || lone ? `npm install && npm run ${top.name}` : null,
    candidates,
  };
}
