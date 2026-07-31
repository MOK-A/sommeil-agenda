import { cn } from "@/lib/utils";
import { NOTES, type Note } from "@/lib/sleep/types";

/** Sélecteur d'appréciation TB / B / Moy / M / TM en un seul geste. */
export function SelecteurNote({
  titre,
  valeur,
  onChange,
}: {
  titre: string;
  valeur: Note;
  onChange: (n: Note) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-muted-foreground">{titre}</legend>
      <div className="grid grid-cols-5 gap-1.5">
        {NOTES.map((n) => {
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
      <p className="mt-1.5 text-xs text-muted-foreground">
        {NOTES.find((n) => n.value === valeur)?.label}
      </p>
    </fieldset>
  );
}