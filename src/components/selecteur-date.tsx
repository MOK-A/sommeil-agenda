import { HAUTEUR, Molette } from "@/components/selecteur-heure";
import { cn } from "@/lib/utils";

const MOIS = [
  "janv.",
  "févr.",
  "mars",
  "avr.",
  "mai",
  "juin",
  "juil.",
  "août",
  "sept.",
  "oct.",
  "nov.",
  "déc.",
];

const ANNEE_MAX = new Date().getFullYear();
const ANNEES = Array.from({ length: 110 }, (_, i) => ANNEE_MAX - i).reverse();
const MOIS_NUM = Array.from({ length: 12 }, (_, i) => i + 1);

function joursDuMois(annee: number, mois: number) {
  return new Date(annee, mois, 0).getDate();
}

/** Date en roulettes infinies (jour / mois / année), format ISO YYYY-MM-DD. */
export function SelecteurDate({
  valeur,
  onChange,
  fige = false,
  className,
}: {
  valeur: string;
  onChange: (v: string) => void;
  fige?: boolean;
  className?: string;
}) {
  const auj = new Date();
  const [ay, am, aj] = valeur.split("-").map(Number);
  const annee = ay && ay > 1000 ? ay : auj.getFullYear() - 30;
  const mois = am && am >= 1 && am <= 12 ? am : auj.getMonth() + 1;
  const jour = aj && aj >= 1 ? aj : 1;

  const ecrire = (j: number, m: number, a: number) => {
    const jmax = joursDuMois(a, m);
    const jj = Math.min(j, jmax);
    onChange(`${a}-${String(m).padStart(2, "0")}-${String(jj).padStart(2, "0")}`);
  };

  const jours = Array.from({ length: joursDuMois(annee, mois) }, (_, i) => i + 1);

  if (fige) {
    return (
      <div className={cn("carte-douce grid min-h-12 place-items-center px-3", className)}>
        <span className="text-lg font-extrabold tabular-nums">
          {valeur ? `${String(jour).padStart(2, "0")} ${MOIS[mois - 1]} ${annee}` : "—"}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("carte-douce px-2 py-2", className)}>
      <div className="relative">
        <div
          className="pointer-events-none absolute inset-x-1 rounded-xl bg-background/70"
          style={{ top: HAUTEUR, height: HAUTEUR }}
          aria-hidden
        />
        <div className="relative flex items-center justify-center gap-1">
          <Molette
            valeurs={jours}
            valeur={Math.min(jour, jours.length)}
            onChange={(v) => ecrire(v, mois, annee)}
            aria="Jour"
          />
          <Molette
            valeurs={MOIS_NUM}
            valeur={mois}
            onChange={(v) => ecrire(jour, v, annee)}
            aria="Mois"
            largeur="4.5rem"
            format={(v) => MOIS[v - 1] ?? ""}
          />
          <Molette
            valeurs={ANNEES}
            valeur={annee}
            onChange={(v) => ecrire(jour, mois, v)}
            aria="Année"
            largeur="4.5rem"
            format={(v) => String(v)}
          />
        </div>
      </div>
    </div>
  );
}
