import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useNuits, supprimerNuit } from "@/lib/sleep/store";
import { couleurNuit } from "@/lib/sleep/stats";
import { dateISO, formatHeure, libelleNuit } from "@/lib/sleep/time";
import { useReglages } from "@/lib/sleep/store";

export const Route = createFileRoute("/historique")({
  head: () => ({
    meta: [
      { title: "Historique des nuits — Journal de Sommeil" },
      {
        name: "description",
        content: "Toutes vos nuits en liste ou en calendrier mensuel coloré selon la qualité du sommeil.",
      },
      { property: "og:title", content: "Historique des nuits — Journal de Sommeil" },
      { property: "og:description", content: "Consultez, modifiez ou supprimez chaque nuit enregistrée." },
    ],
  }),
  component: Historique,
});

const COULEURS = {
  bonne: "bg-bien",
  moyenne: "bg-moyen",
  mauvaise: "bg-mauvais",
} as const;

const JOURS = ["L", "M", "M", "J", "V", "S", "D"];
const MOIS_LONGS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

function Historique() {
  const nuits = useNuits();
  const reglages = useReglages();
  const [mois, setMois] = useState(() => {
    const d = new Date();
    return { annee: d.getFullYear(), mois: d.getMonth() };
  });

  const parDate = useMemo(() => new Map(nuits.map((n) => [n.date, n])), [nuits]);
  const premier = new Date(mois.annee, mois.mois, 1);
  const decalage = (premier.getDay() + 6) % 7;
  const nbJours = new Date(mois.annee, mois.mois + 1, 0).getDate();

  const changerMois = (delta: number) => {
    const d = new Date(mois.annee, mois.mois + delta, 1);
    setMois({ annee: d.getFullYear(), mois: d.getMonth() });
  };

  return (
    <main className="mx-auto max-w-2xl px-4 pt-8">
      <h1 className="mb-4 text-3xl font-extrabold tracking-tight">Historique</h1>
      <Tabs defaultValue="liste">
        <TabsList className="mb-4 grid w-full grid-cols-2 rounded-2xl">
          <TabsTrigger value="liste" className="rounded-xl">
            Liste
          </TabsTrigger>
          <TabsTrigger value="calendrier" className="rounded-xl">
            Calendrier
          </TabsTrigger>
        </TabsList>

        <TabsContent value="liste">
          {nuits.length === 0 ? (
            <p className="carte p-6 text-sm text-muted-foreground">Aucune nuit enregistrée.</p>
          ) : (
            <ul className="space-y-2">
              {nuits.map((nuit) => (
                <li key={nuit.id} className="carte apparition flex items-center gap-3 p-4">
                  <span
                    className={cn("size-3 shrink-0 rounded-full", COULEURS[couleurNuit(nuit)])}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{libelleNuit(nuit.date)}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatHeure(nuit.heureCoucher, reglages.format24h)} →{" "}
                      {formatHeure(nuit.heureLever, reglages.format24h)} · {nuit.qualiteSommeil}
                    </p>
                  </div>
                  <Link
                    to="/saisie"
                    search={{ id: nuit.id, date: undefined }}
                    aria-label={`Modifier la ${libelleNuit(nuit.date).toLowerCase()}`}
                    className="carte-douce grid size-11 place-items-center text-primary"
                  >
                    <Pencil className="size-4" aria-hidden />
                  </Link>
                  <button
                    type="button"
                    aria-label="Supprimer"
                    onClick={() => {
                      supprimerNuit(nuit.id);
                      toast("Nuit supprimée");
                    }}
                    className="carte-douce grid size-11 place-items-center text-destructive"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="calendrier">
          <div className="carte p-4">
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => changerMois(-1)}
                aria-label="Mois précédent"
                className="carte-douce grid size-11 place-items-center"
              >
                <ChevronLeft className="size-5" aria-hidden />
              </button>
              <p className="font-semibold">
                {MOIS_LONGS[mois.mois]} {mois.annee}
              </p>
              <button
                type="button"
                onClick={() => changerMois(1)}
                aria-label="Mois suivant"
                className="carte-douce grid size-11 place-items-center"
              >
                <ChevronRight className="size-5" aria-hidden />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
              {JOURS.map((j, i) => (
                <span key={i}>{j}</span>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {Array.from({ length: decalage }).map((_, i) => (
                <span key={`v${i}`} />
              ))}
              {Array.from({ length: nbJours }).map((_, i) => {
                const iso = dateISO(new Date(mois.annee, mois.mois, i + 1));
                const nuit = parDate.get(iso);
                const contenu = (
                  <span
                    className={cn(
                      "grid aspect-square w-full place-items-center rounded-xl text-sm font-medium",
                      nuit
                        ? `${COULEURS[couleurNuit(nuit)]} text-background`
                        : "carte-douce text-muted-foreground",
                    )}
                  >
                    {i + 1}
                  </span>
                );
                return nuit ? (
                  <Link
                    key={iso}
                    to="/saisie"
                    search={{ id: nuit.id, date: undefined }}
                    aria-label={libelleNuit(iso)}
                  >
                    {contenu}
                  </Link>
                ) : (
                  <Link key={iso} to="/saisie" search={{ date: iso, id: undefined }} aria-label={`Remplir le ${iso}`}>
                    {contenu}
                  </Link>
                );
              })}
            </div>
            <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded-full bg-bien" aria-hidden /> Bonne nuit
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded-full bg-moyen" aria-hidden /> Moyenne
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded-full bg-mauvais" aria-hidden /> Mauvaise
              </span>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}