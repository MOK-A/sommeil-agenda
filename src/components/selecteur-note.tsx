import { cn } from "@/lib/utils";
import { NOTES, type Note } from "@/lib/sleep/types";
import { Etoiles, ETOILES } from "@/components/etoiles";

/** Sélecteur d'appréciation, de très mauvais (gauche) à très bon (droite). */
export function SelecteurNote({
  titre,
  valeur,
  onChange,
}: {
  titre: string;
  valeur: Note;
  onChange: (n: Note) => void;
}) {
  const ordre = NOTES.slice().reverse();
  return (
    <fieldset>
      <legend className="mb-2 flex w-full items-center justify-between gap-2 text-sm font-medium text-muted-foreground">
        <span>{titre}</span>
        <span className="flex items-center gap-2">
          <span className="text-foreground">{NOTES.find((n) => n.value === valeur)?.label}</span>
          <Etoiles valeur={ETOILES[valeur]} label={`${ETOILES[valeur]} sur 5`} />
        </span>
      </legend>
      <div className="grid grid-cols-5 gap-1.5">
        {ordre.map((n) => {
          const actif = n.value === valeur;
          return (
            <button
              key={n.value}
              type="button"
              aria-pressed={actif}
              aria-label={n.label}
              onClick={() => onChange(n.value)}
              className={cn(
                "min-h-12 rounded-2xl text-sm font-semibold transition-all",
                actif
                  ? "bg-primary text-primary-foreground shadow-sm scale-[1.03]"
                  : "carte-douce text-muted-foreground hover:text-foreground",
              )}
            >
              {n.value}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}