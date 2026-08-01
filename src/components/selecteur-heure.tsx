import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const HAUTEUR = 40;
const VISIBLES = 3; // hauteur totale = 3 lignes, comme l'alarme iOS
const HEURES = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

/** Molette défilante à inertie native, calée sur la ligne centrale. */
function Molette({
  valeurs,
  valeur,
  onChange,
  aria,
}: {
  valeurs: number[];
  valeur: number;
  onChange: (v: number) => void;
  aria: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const minuteur = useRef<ReturnType<typeof setTimeout> | null>(null);
  const defile = useRef(false);
  const index = Math.max(0, valeurs.indexOf(valeur));

  // Recale la molette quand la valeur change depuis l'extérieur.
  useEffect(() => {
    const el = ref.current;
    if (!el || defile.current) return;
    const cible = index * HAUTEUR;
    if (Math.abs(el.scrollTop - cible) > 1) el.scrollTop = cible;
  }, [index]);

  const auDefilement = () => {
    const el = ref.current;
    if (!el) return;
    defile.current = true;
    if (minuteur.current) clearTimeout(minuteur.current);
    minuteur.current = setTimeout(() => {
      defile.current = false;
      const i = Math.round(el.scrollTop / HAUTEUR);
      const v = valeurs[Math.max(0, Math.min(valeurs.length - 1, i))];
      if (v !== undefined && v !== valeur) onChange(v);
    }, 90);
  };

  return (
    <div
      ref={ref}
      role="listbox"
      aria-label={aria}
      tabIndex={0}
      onScroll={auDefilement}
      onKeyDown={(e) => {
        if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
        e.preventDefault();
        const i = Math.max(0, Math.min(valeurs.length - 1, index + (e.key === "ArrowDown" ? 1 : -1)));
        const v = valeurs[i];
        if (v !== undefined) onChange(v);
      }}
      style={{ height: VISIBLES * HAUTEUR, scrollSnapType: "y mandatory" }}
      className="w-[3.6rem] overflow-y-auto overscroll-contain outline-none [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <div style={{ height: HAUTEUR }} aria-hidden />
      {valeurs.map((v) => {
        const ecart = Math.abs(v === valeur ? 0 : valeurs.indexOf(v) - index);
        return (
          <div
            key={v}
            role="option"
            aria-selected={v === valeur}
            onClick={() => onChange(v)}
            style={{ height: HAUTEUR, scrollSnapAlign: "center", opacity: ecart === 0 ? 1 : ecart === 1 ? 0.5 : 0.25 }}
            className={cn(
              "grid cursor-pointer select-none place-items-center tabular-nums transition-[font-size,opacity] duration-100",
              v === valeur ? "text-3xl font-extrabold" : "text-2xl font-semibold text-muted-foreground",
            )}
          >
            {String(v).padStart(2, "0")}
          </div>
        );
      })}
      <div style={{ height: HAUTEUR }} aria-hidden />
    </div>
  );
}

/** Sélecteur d'heure façon réglage d'alarme iOS : deux molettes toujours actives. */
export function SelecteurHeure({
  label,
  valeur,
  onChange,
  className,
}: {
  label?: string;
  valeur: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  const parts = valeur.split(":");
  const h = Number(parts[0] ?? 0) || 0;
  const m = Number(parts[1] ?? 0) || 0;
  const ecrire = (nh: number, nm: number) =>
    onChange(`${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`);

  return (
    <div className={cn("carte-douce flex-1 px-2 py-2", className)}>
      {label && (
        <span className="block text-center text-xs font-medium text-muted-foreground">{label}</span>
      )}
      <div className="relative mt-1">
        <div
          className="pointer-events-none absolute inset-x-1 rounded-xl bg-background/70"
          style={{ top: HAUTEUR, height: HAUTEUR }}
          aria-hidden
        />
        <div className="relative flex items-center justify-center gap-0.5">
          <Molette valeurs={HEURES} valeur={h} onChange={(v) => ecrire(v, m)} aria="Heures" />
          <span className="text-2xl font-extrabold text-muted-foreground">:</span>
          <Molette
            valeurs={MINUTES}
            valeur={MINUTES.includes(m) ? m : Math.round(m / 5) * 5}
            onChange={(v) => ecrire(h, v)}
            aria="Minutes"
          />
        </div>
      </div>
    </div>
  );
}