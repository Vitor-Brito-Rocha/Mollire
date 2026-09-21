export function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="corners bg-card border-border flex flex-col gap-1 border px-4 py-3.5">
      <span className="label text-text-3">{label}</span>
      <span className="font-display text-[26px] leading-none font-bold tabular-nums">{value}</span>
    </div>
  );
}
