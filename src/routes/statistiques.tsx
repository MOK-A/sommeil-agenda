import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Area,
  ComposedChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import { useNuits } from "@/lib/sleep/store";
import { calculerStatistiques } from "@/lib/sleep/stats";
import { dateCourte, depuisOrigine, dureeHumaine, fromMinutes } from "@/lib/sleep/time";

export const Route = createFileRoute("/statistiques")({
  head: () => ({
    meta: [
      { title: "Statistiques du sommeil — Journal de Sommeil" },
      {
        name: "description",
        content:
          "Durée moyenne, délai d'endormissement, réveils nocturnes et efficacité du sommeil sur 7, 30 ou 90 jours.",
      },
      { property: "og:title", content: "Statistiques du sommeil — Journal de Sommeil" },
      { property: "og:description", content: "Vos moyennes et tendances de sommeil en un coup d'œil." },
    ],
  }),
  component: Statistiques,
});

const PERIODES = [
  { label: "7 j", valeur: 7 },
  { label: "30 j", valeur: 30 },
  { label: "90 j", valeur: 90 },
];

function Bloc({ titre, valeur, detail }: { titre: string; valeur: string; detail?: string }) {
  return (
    <div className="carte apparition p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{titre}</p>
      <p className="mt-1 text-2xl font-extrabold tracking-tight">{valeur}</p>
      {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
    </div>
  );
}

function Statistiques() {
  const nuits = useNuits();
  const [periode, setPeriode] = useState(30);
  const selection = useMemo(() => nuits.slice(0, periode), [nuits, periode]);
  const stats = useMemo(() => calculerStatistiques(selection), [selection]);

  const donnees = stats.serie
    .slice()
    .reverse()
    .map((p) => {
      const coucher = depuisOrigine(p.coucher) / 60;
      const lever = depuisOrigine(p.lever) / 60;
      return {
        jour: dateCourte(p.date),
        coucher,
        lever: lever < coucher ? lever + 24 : lever,
        plage: [coucher, lever < coucher ? lever + 24 : lever] as [number, number],
      };
    });

  const etiquetteHeure = (v: number) => fromMinutes(Math.round((v * 60 + 20 * 60) % 1440));

  return (
    <main className="mx-auto max-w-2xl px-4 pt-8">
      <h1 className="mb-4 text-3xl font-extrabold tracking-tight">Statistiques</h1>

      <div className="mb-5 flex gap-2" role="group" aria-label="Période">
        {PERIODES.map((p) => (
          <button
            key={p.valeur}
            type="button"
            aria-pressed={periode === p.valeur}
            onClick={() => setPeriode(p.valeur)}
            className={cn(
              "min-h-11 flex-1 rounded-2xl text-sm font-semibold transition-all",
              periode === p.valeur
                ? "bg-primary text-primary-foreground"
                : "carte-douce text-muted-foreground",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {stats.nbNuits === 0 ? (
        <p className="carte p-6 text-sm text-muted-foreground">
          Enregistrez au moins une nuit pour voir vos statistiques.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Bloc
              titre="Sommeil moyen"
              valeur={dureeHumaine(stats.dureeMoyenne)}
              detail={`${stats.nbNuits} nuit${stats.nbNuits > 1 ? "s" : ""}`}
            />
            <Bloc titre="Efficacité" valeur={`${stats.efficacite} %`} detail="Sommeil / temps au lit" />
            <Bloc titre="Endormissement" valeur={dureeHumaine(stats.delaiMoyen)} detail="Délai moyen" />
            <Bloc
              titre="Réveils"
              valeur={stats.reveilsMoyens.toFixed(1)}
              detail={`${dureeHumaine(stats.eveilMoyen)} éveillé`}
            />
            <Bloc titre="Coucher moyen" valeur={stats.heureCoucherMoyenne} />
            <Bloc titre="Lever moyen" valeur={stats.heureLeverMoyenne} />
          </div>

          <section className="carte mt-4 p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Heures de coucher et de lever
            </h2>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={donnees} margin={{ left: -10, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="degradeSommeil" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis
                    dataKey="jour"
                    tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={20}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                    width={52}
                    domain={[0, 24]}
                    ticks={[0, 4, 8, 12, 16, 20, 24]}
                    tickFormatter={etiquetteHeure}
                    reversed
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 14,
                      border: "1px solid var(--color-border)",
                      background: "var(--color-card)",
                      color: "var(--color-foreground)",
                      fontSize: 12,
                    }}
                    formatter={(v, name) =>
                      Array.isArray(v)
                        ? [`${etiquetteHeure(v[0] as number)} → ${etiquetteHeure(v[1] as number)}`, "Nuit"]
                        : [etiquetteHeure(v as number), name === "coucher" ? "Coucher" : "Lever"]
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="plage"
                    stroke="none"
                    fill="url(#degradeSommeil)"
                    activeDot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="coucher"
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="lever"
                    stroke="var(--color-jour)"
                    strokeWidth={2}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </section>

          {stats.nbSiestes > 0 && (
            <p className="mt-4 px-1 text-sm text-muted-foreground">
              {stats.nbSiestes} sieste{stats.nbSiestes > 1 ? "s" : ""} sur la période, soit{" "}
              {dureeHumaine(stats.tempsTotalSieste)} au total.
            </p>
          )}
        </>
      )}
    </main>
  );
}