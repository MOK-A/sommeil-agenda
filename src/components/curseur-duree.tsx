import { Minus, Plus } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { dureeHumaine } from "@/lib/sleep/time";

/**
 * Durée en minutes : gros curseur 0 → 60 min, plus deux boutons
 * pour ajouter ou retirer des heures entières.
 */
export function CurseurDuree({
  valeur,
  onChange,
  label,
  max = 720,
}: {
  valeur: number;
  onChange: (v: number) => void;
  label: string;
  max?: number;
}) {
  const heures = Math.floor(Math.max(0, valeur) / 60);
  const minutes = Math.max(0, valeur) - heures * 60;

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span className="text-2xl font-extrabold tabular-nums">
          {valeur <= 0 ? "Tout de suite" : dureeHumaine(valeur)}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Slider
            value={[minutes]}
            min={0}
            max={60}
            step={5}
            aria-label={label}
            onValueChange={([v]) => onChange(Math.min(max, heures * 60 + (v ?? 0)))}
            className="h-11 w-full [&_[data-slot=slider-range]]:h-2.5 [&_[data-slot=slider-thumb]]:size-8 [&_[data-slot=slider-track]]:h-2.5"
          />
          <p className="text-center text-xs font-medium text-muted-foreground">minutes</p>
        </div>
        <div className="shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Retirer une heure"
              onClick={() => onChange(Math.max(0, valeur - 60))}
              className="carte-douce grid size-12 place-items-center text-primary"
            >
              <Minus className="size-6" aria-hidden />
            </button>
            <button
              type="button"
              aria-label="Ajouter une heure"
              onClick={() => onChange(Math.min(max, valeur + 60))}
              className="carte-douce grid size-12 place-items-center text-primary"
            >
              <Plus className="size-6" aria-hidden />
            </button>
          </div>
          <p className="text-center text-xs font-medium text-muted-foreground">heures</p>
        </div>
      </div>
    </div>
  );
}