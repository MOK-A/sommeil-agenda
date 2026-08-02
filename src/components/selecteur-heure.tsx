import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const HAUTEUR = 40;
const VISIBLES = 3; // hauteur totale = 3 lignes, comme l'alarme iOS
const REPETITIONS = 11; // la liste est répétée pour un défilement "infini"
const HEURES = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

/** Molette défilante infinie à inertie native, calée sur la ligne centrale. */
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
  const taille = valeurs.length;
  const index = Math.max(0, valeurs.indexOf(valeur));
  const liste = Array.from({ length: REPETITIONS * taille }, (_, i) => valeurs[i % taille]!);
  const blocCentral = Math.floor(REPETITIONS / 2);

  // Recale la molette (position initiale et changements venus de l'extérieur).
  useEffect(() => {
    const el = ref.current;
    if (!el || defile.current) return;
    const g = Math.round(el.scrollTop / HAUTEUR);
    const bloc = el.scrollTop > 0 ? Math.floor(g / taille) : blocCentral;
    const cible = (bloc * taille + index) * HAUTEUR;
    if (Math.abs(el.scrollTop - cible) > 1) el.scrollTop = cible;
  }, [index, taille, blocCentral]);

  const auDefilement = () => {
    const el = ref.current;
    if (!el) return;
    defile.current = true;
    if (minuteur.current) clearTimeout(minuteur.current);
    minuteur.current = setTimeout(() => {
      defile.current = false;
      const g = Math.round(el.scrollTop / HAUTEUR);
      const i = ((g % taille) + taille) % taille;
      // Repositionne au centre de la liste répétée pour ne jamais buter.
      const bloc = Math.floor(g / taille);
      if (bloc < 2 || bloc > REPETITIONS - 3) el.scrollTop = (blocCentral * taille + i) * HAUTEUR;
      const v = valeurs[i];
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
        const i = (index + (e.key === "ArrowDown" ? 1 : taille - 1)) % taille;
        const v = valeurs[i];
        if (v !== undefined) onChange(v);
      }}
      style={{
        height: VISIBLES * HAUTEUR,
        scrollSnapType: "y mandatory",
        maskImage: "linear-gradient(to bottom, transparent, #000 35%, #000 65%, transparent)",
        WebkitMaskImage: "linear-gradient(to bottom, transparent, #000 35%, #000 65%, transparent)",
      }}
      className="w-[3.6rem] overflow-y-auto overscroll-contain outline-none [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <div style={{ height: HAUTEUR }} aria-hidden />
      {liste.map((v, i) => (
        <div
          key={i}
          role="option"
          aria-selected={v === valeur}
          onClick={() => onChange(v)}
          style={{ height: HAUTEUR, scrollSnapAlign: "center" }}
          className={cn(
            "grid cursor-pointer select-none place-items-center tabular-nums",
            v === valeur ? "text-3xl font-extrabold" : "text-2xl font-semibold text-muted-foreground",
          )}
        >
          {String(v).padStart(2, "0")}
        </div>
      ))}
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