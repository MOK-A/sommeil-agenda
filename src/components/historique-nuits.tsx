import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Moon, Sunrise } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApercuGrille } from "@/components/apercu-grille";
import { Etoiles, etoilesDe } from "@/components/etoiles";
import { cn } from "@/lib/utils";
import { useNuits, useReglages } from "@/lib/sleep/store";
import { niveauNuit } from "@/lib/sleep/stats";
import { mesurer } from "@/lib/sleep/grid";
import { dateISO, dureeHumaine, formatHeure, libelleNuit } from "@/lib/sleep/time";

/** Cinq graduations, alignées sur la note en étoiles (1 = très mauvaise, 5 = très bonne). */
const COULEURS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: "bg-tres-mauvais",
  2: "bg-mauvais",
  3: "bg-moyen",
  4: "bg-bien",
  5: "bg-tres-bien",
};

const JOURS = ["L", "M", "M", "J", "V", "S", "D"];
const MOIS_LONGS = [
  "Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre",
];

/** Historique des nuits : liste (par défaut) ou calendrier mensuel. */
export function HistoriqueNuits() {
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
    <section className="mt-8">
      <h2 className="mb-3 px-1 text-lg font-bold tracking-tight">Historique</h2>
      <Tabs defaultValue="liste">
        <TabsList className="mb-4 grid w-full grid-cols-2 rounded-2xl">
          <TabsTrigger value="liste" className="rounded-xl">Liste</TabsTrigger>
          <TabsTrigger value="calendrier" className="rounded-xl">Calendrier</TabsTrigger>
        </TabsList>

        <TabsContent value="liste">
          {nuits.length === 0 ? (
            <p className="carte p-6 text-sm text-muted-foreground">Aucune nuit enregistrée pour l'instant.</p>
          ) : (
            <ul className="space-y-3">
              {nuits.map((nuit) => {
                const m = mesurer(nuit);
                return (
                  <li key={nuit.id}>
                    <Link to="/saisie" search={{ id: nuit.id, date: undefined }} className="carte apparition block p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold">{libelleNuit(nuit.date)}</p>
                          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Moon className="size-3.5" aria-hidden />
                            {formatHeure(nuit.heureCoucher, reglages.format24h)}
                            <span aria-hidden>→</span>
                            <Sunrise className="size-3.5" aria-hidden />
                            {formatHeure(nuit.heureLever, reglages.format24h)}
                            <span className="text-foreground/70">· {dureeHumaine(m.tempsSommeil)}</span>
                          </p>
                        </div>
                        <Etoiles
                          valeur={etoilesDe(nuit.qualiteSommeil)}
                          label={`Qualité du sommeil : ${etoilesDe(nuit.qualiteSommeil)} sur 5`}
                        />
                      </div>
                      <div className="mt-3">
                        <ApercuGrille nuits={[nuit]} hauteurLigne={26} />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="calendrier">
          <div className="carte p-4">
            <div className="mb-3 flex items-center justify-between">
              <button type="button" onClick={() => changerMois(-1)} aria-label="Mois précédent" className="carte-douce grid size-11 place-items-center">
                <ChevronLeft className="size-5" aria-hidden />
              </button>
              <p className="font-semibold">{MOIS_LONGS[mois.mois]} {mois.annee}</p>
              <button type="button" onClick={() => changerMois(1)} aria-label="Mois suivant" className="carte-douce grid size-11 place-items-center">
                <ChevronRight className="size-5" aria-hidden />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
              {JOURS.map((j, i) => (<span key={i}>{j}</span>))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {Array.from({ length: decalage }).map((_, i) => (<span key={`v${i}`} />))}
              {Array.from({ length: nbJours }).map((_, i) => {
                const iso = dateISO(new Date(mois.annee, mois.mois, i + 1));
                const nuit = parDate.get(iso);
                const futur = iso > dateISO(new Date());
                const contenu = (
                  <span className={cn("grid aspect-square w-full place-items-center rounded-xl text-sm font-medium", nuit ? `${COULEURS[niveauNuit(nuit)]} text-background` : "carte-douce text-muted-foreground")}>
                    {i + 1}
                  </span>
                );
                return futur && !nuit ? (
                  <span key={iso} aria-disabled className="pointer-events-none opacity-40">{contenu}</span>
                ) : nuit ? (
                  <Link key={iso} to="/saisie" search={{ id: nuit.id, date: undefined }} aria-label={libelleNuit(iso)}>{contenu}</Link>
                ) : (
                  <Link key={iso} to="/saisie" search={{ date: iso, id: undefined }} aria-label={`Remplir le ${iso}`}>{contenu}</Link>
                );
              })}
            </div>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="size-3 rounded-full bg-tres-bien" aria-hidden /> Très bonne</span>
              <span className="flex items-center gap-1.5"><span className="size-3 rounded-full bg-bien" aria-hidden /> Bonne</span>
              <span className="flex items-center gap-1.5"><span className="size-3 rounded-full bg-moyen" aria-hidden /> Moyenne</span>
              <span className="flex items-center gap-1.5"><span className="size-3 rounded-full bg-mauvais" aria-hidden /> Mauvaise</span>
              <span className="flex items-center gap-1.5"><span className="size-3 rounded-full bg-tres-mauvais" aria-hidden /> Très mauvaise</span>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
}
