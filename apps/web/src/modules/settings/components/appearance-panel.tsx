import { Panel } from "@/shared/components/panel";
import { SegmentedControl } from "@/shared/components/segmented-control";
import { useTheme } from "@/shared/hooks/use-theme";

const THEMES = [
  { label: "Escuro", value: "dark" },
  { label: "Claro", value: "light" },
] as const;

// O mesmo interruptor da barra lateral, com nome e explicação.
export function AppearancePanel() {
  const { theme, setTheme } = useTheme();

  return (
    <Panel title="Aparência">
      <div className="flex flex-col gap-4 p-5">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">Tema</span>
          <p className="text-text-3 text-xs">O escuro é o padrão do launcher. O claro é para ambiente muito iluminado.</p>
        </div>
        <SegmentedControl label="Tema" options={THEMES} value={theme} onChange={setTheme} className="w-fit" />
        <p className="text-text-3 text-xs">A escolha fica salva neste navegador.</p>
      </div>
    </Panel>
  );
}
