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
        <Slider
          value={[minutes]}
          min={0}
          max={60}
          step={5}
          aria-label={label}
          onValueChange={([v]) => onChange(Math.min(max, heures * 60 + (v ?? 0)))}
          className="h-11 flex-1 [&_[data-slot=slider-range]]:h-2.5 [&_[data-slot=slider-thumb]]:size-8 [&_[data-slot=slider-track]]:h-2.5"
        />
        <button
          type="button"
          aria-label="Retirer une heure"
          onClick={() => onChange(Math.max(0, valeur - 60))}
          className="carte-douce grid size-12 shrink-0 place-items-center text-primary"
        >
          <Minus className="size-6" aria-hidden />
        </button>
        <button
          type="button"
          aria-label="Ajouter une heure"
          onClick={() => onChange(Math.min(max, valeur + 60))}
          className="carte-douce grid size-12 shrink-0 place-items-center text-primary"
        >
          <Plus className="size-6" aria-hidden />
        </button>
      </div>
    </div>
  );
}