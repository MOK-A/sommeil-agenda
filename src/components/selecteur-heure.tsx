import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const HAUTEUR = 44;
const HEURES = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

function Molette({
  valeurs,
  valeur,
  onChange,
  actif,
  onActiver,
  aria,
}: {
  valeurs: number[];
  valeur: number;
  onChange: (v: number) => void;
  actif: boolean;
  onActiver: () => void;
  aria: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const minuteur = useRef<ReturnType<typeof setTimeout> | null>(null);
  const index = Math.max(0, valeurs.indexOf(valeur));

  useEffect(() => {
    if (actif && ref.current) ref.current.scrollTop = index * HAUTEUR;
  }, [actif, index]);

  if (!actif) {
    return (
      <button
        type="button"
        onClick={onActiver}
        aria-label={aria}
        className="grid h-11 w-[4.5rem] place-items-center rounded-2xl text-4xl font-extrabold tabular-nums tracking-tight transition-colors hover:bg-secondary/60"
      >
        {String(valeur).padStart(2, "0")}
      </button>
    );
  }

  return (
    <div className="relative h-[132px] w-[4.5rem] overflow-hidden rounded-2xl bg-secondary/70">
      <div className="pointer-events-none absolute inset-x-1 top-[44px] h-[44px] rounded-xl border border-primary/40" />
      <div
        ref={ref}
        role="listbox"
        aria-label={aria}
        className="h-full snap-y snap-mandatory overflow-y-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onScroll={(e) => {
          const cible = e.currentTarget;
          if (minuteur.current) clearTimeout(minuteur.current);
          minuteur.current = setTimeout(() => {
            const i = Math.round(cible.scrollTop / HAUTEUR);
            const v = valeurs[Math.max(0, Math.min(valeurs.length - 1, i))];
            if (v !== undefined && v !== valeur) onChange(v);
          }, 120);
        }}
      >
        <div style={{ height: HAUTEUR }} />
        {valeurs.map((v) => (
          <div
            key={v}
            role="option"
            aria-selected={v === valeur}
            onClick={() => onChange(v)}
            style={{ height: HAUTEUR }}
            className={cn(
              "grid snap-center cursor-pointer place-items-center text-3xl font-extrabold tabular-nums",
              v === valeur ? "text-foreground" : "text-muted-foreground/60",
            )}
          >
            {String(v).padStart(2, "0")}
          </div>
        ))}
        <div style={{ height: HAUTEUR }} />
      </div>
    </div>
  );
}

/**
 * Sélecteur d'heure en molettes : figées par défaut, éditables au clic,
 * refigées dès qu'on clique en dehors.
 */
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
  const [actif, setActif] = useState<"h" | "m" | null>(null);
  const boite = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!actif) return;
    const dehors = (e: PointerEvent) => {
      if (boite.current && !boite.current.contains(e.target as Node)) setActif(null);
    };
    document.addEventListener("pointerdown", dehors);
    return () => document.removeEventListener("pointerdown", dehors);
  }, [actif]);

  const parts = valeur.split(":");
  const h = Number(parts[0] ?? 0) || 0;
  const m = Number(parts[1] ?? 0) || 0;
  const ecrire = (nh: number, nm: number) =>
    onChange(`${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`);

  return (
    <div ref={boite} className={cn("carte-douce flex-1 px-3 py-2", className)}>
      {label && (
        <span className="block text-center text-xs font-medium text-muted-foreground">{label}</span>
      )}
      <div className="flex items-center justify-center gap-1">
        <Molette
          valeurs={HEURES}
          valeur={h}
          actif={actif === "h"}
          onActiver={() => setActif("h")}
          onChange={(v) => ecrire(v, m)}
          aria="Heures"
        />
        <span className="text-3xl font-extrabold text-muted-foreground">:</span>
        <Molette
          valeurs={MINUTES}
          valeur={MINUTES.includes(m) ? m : Math.round(m / 5) * 5}
          actif={actif === "m"}
          onActiver={() => setActif("m")}
          onChange={(v) => ecrire(h, v)}
          aria="Minutes"
        />
      </div>
    </div>
  );
}