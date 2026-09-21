import { useSyncExternalStore } from "react";

export type Theme = "dark" | "light";

const KEY = "mollire:theme";
const listeners = new Set<() => void>();

// O escuro é o padrão: é a identidade do produto. O claro é uma escolha,
// guardada no navegador. index.html aplica a escolha antes do React montar.
function read(): Theme {
  try {
    return localStorage.getItem(KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

let current: Theme = read();

function apply(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

if (typeof document !== "undefined") apply(current);

export function setTheme(theme: Theme) {
  current = theme;
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    // sem storage: a escolha vale só nesta visita
  }
  apply(theme);
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, () => current, () => "dark" as Theme);
  return { theme, setTheme, toggle: () => setTheme(current === "dark" ? "light" : "dark") };
}
