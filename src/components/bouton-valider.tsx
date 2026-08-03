import { Check, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

/** Petit bouton pour valider (figer) ou rouvrir la modification d'une valeur. */
export function BoutonValider({
  fige,
  onToggle,
  className,
}: {
  fige: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={fige ? "Modifier la valeur" : "Valider la valeur"}
      className={cn(
        "flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-semibold transition-colors",
        fige ? "carte-douce text-muted-foreground" : "bg-primary text-primary-foreground",
        className,
      )}
    >
      {fige ? <Pencil className="size-4" aria-hidden /> : <Check className="size-4" aria-hidden />}
      {fige ? "Modifier" : "Valider"}
    </button>
  );
}