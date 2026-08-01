import { createFileRoute, Link } from "@tanstack/react-router";
import { Moon, Plus } from "lucide-react";
import { HistoriqueNuits } from "@/components/historique-nuits";
import { useNuits, useReglages } from "@/lib/sleep/store";
import { dateISO } from "@/lib/sleep/time";

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

function Accueil() {
  const nuits = useNuits();
  const hier = dateISO(new Date(Date.now() - 86400000));
  const dejaRempli = nuits.some((n) => n.date === hier);

  return (
    <main className="mx-auto max-w-2xl px-4 pt-8">
      <header className="mb-6">
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

      <HistoriqueNuits />
    </main>
  );
}