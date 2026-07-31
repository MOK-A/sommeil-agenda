import { createFileRoute, Link } from "@tanstack/react-router";
import { Moon, Plus, Star, Sunrise } from "lucide-react";
import { ApercuGrille } from "@/components/apercu-grille";
import { useNuits, useReglages } from "@/lib/sleep/store";
import { mesurer } from "@/lib/sleep/grid";
import { dateISO, dureeHumaine, formatHeure, libelleNuit } from "@/lib/sleep/time";
import { NOTES, type Note } from "@/lib/sleep/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Journal de Sommeil — Agenda quotidien" },
      {
        name: "description",
        content:
          "Notez votre nuit en moins de 30 secondes : coucher, endormissement, réveils, lever et appréciations.",
      },
      { property: "og:title", content: "Journal de Sommeil — Agenda quotidien" },
      {
        property: "og:description",
        content: "Agenda de sommeil simple, local et hors ligne, avec export PDF pour votre médecin.",
      },
    ],
  }),
  component: Accueil,
});

const etoiles: Record<Note, number> = { TB: 5, B: 4, Moy: 3, M: 2, TM: 1 };

function Accueil() {
  const nuits = useNuits();
  const reglages = useReglages();
  const dernieres = nuits.slice(0, 5);
  const hier = dateISO(new Date(Date.now() - 86400000));
  const dejaRempli = nuits.some((n) => n.date === hier);

  return (
    <main className="mx-auto max-w-2xl px-4 pt-8">
      <header className="mb-6">
        <p className="text-sm text-muted-foreground">
          {reglages.prenom ? `Bonjour ${reglages.prenom}` : "Bonjour"}
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight">Journal de sommeil</h1>
      </header>

      <section className="carte apparition overflow-hidden p-6">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-secondary text-primary">
            <Moon className="size-5" aria-hidden />
          </span>
          <div>
            <h2 className="text-xl font-bold leading-tight">Comment s'est passée votre nuit ?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {dejaRempli
                ? "La nuit dernière est déjà enregistrée. Vous pouvez la modifier."
                : "Moins de 30 secondes, le graphique est généré automatiquement."}
            </p>
          </div>
        </div>
        <Link
          to="/saisie"
          search={{ date: hier, id: undefined }}
          className="mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-semibold text-primary-foreground transition-transform active:scale-[0.985]"
        >
          <Plus className="size-5" aria-hidden />
          Remplir
        </Link>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 px-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Derniers jours
        </h2>
        {dernieres.length === 0 ? (
          <p className="carte p-6 text-sm text-muted-foreground">
            Aucune nuit enregistrée pour l'instant.
          </p>
        ) : (
          <ul className="space-y-3">
            {dernieres.map((nuit) => {
              const m = mesurer(nuit);
              return (
                <li key={nuit.id}>
                  <Link
                    to="/saisie"
                    search={{ id: nuit.id, date: undefined }}
                    className="carte apparition block p-4"
                  >
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
                      <span
                        className="flex shrink-0 gap-0.5"
                        aria-label={`Qualité : ${NOTES.find((n) => n.value === nuit.qualiteSommeil)?.label}`}
                      >
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star
                            key={i}
                            className={
                              i <= etoiles[nuit.qualiteSommeil]
                                ? "size-4 fill-jour text-jour"
                                : "size-4 text-muted-foreground/35"
                            }
                            aria-hidden
                          />
                        ))}
                      </span>
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
      </section>
    </main>
  );
}