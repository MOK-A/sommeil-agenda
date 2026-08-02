import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Note } from "@/lib/sleep/types";

/** Conversion note → nombre d'étoiles (TM = 1 … TB = 5). */
export const ETOILES: Record<Note, number> = { TM: 1, M: 2, Moy: 3, B: 4, TB: 5 };

/** Étoiles d'une note éventuellement non renseignée. */
export const etoilesDe = (n: Note | null | undefined) => (n ? ETOILES[n] : 0);

/** Rangée de 5 étoiles, remplissage fractionnaire possible. */
export function Etoiles({
  valeur,
  taille = "size-4",
  label,
}: {
  valeur: number;
  taille?: string;
  label?: string;
}) {
  return (
    <span className="inline-flex shrink-0 gap-0.5" aria-label={label} role="img">
      {[1, 2, 3, 4, 5].map((i) => {
        const remplissage = Math.max(0, Math.min(1, valeur - (i - 1)));
        return (
          <span key={i} className="relative inline-block" aria-hidden>
            <Star className={cn(taille, "text-muted-foreground/35")} />
            {remplissage > 0 && (
              <span
                className="absolute inset-y-0 left-0 overflow-hidden"
                style={{ width: `${remplissage * 100}%` }}
              >
                <Star className={cn(taille, "fill-jour text-jour")} />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}