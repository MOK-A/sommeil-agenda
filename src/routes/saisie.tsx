import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Check, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { ApercuGrille } from "@/components/apercu-grille";
import { SelecteurNote } from "@/components/selecteur-note";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { chargerNuits, enregistrerNuit, nouvelId, supprimerNuit } from "@/lib/sleep/store";
import { dateISO, libelleNuit } from "@/lib/sleep/time";
import type { Nuit } from "@/lib/sleep/types";

const recherche = z.object({
  id: z.string().optional(),
  date: z.string().optional(),
});

export const Route = createFileRoute("/saisie")({
  validateSearch: recherche,
  head: () => ({
    meta: [
      { title: "Remplir ma nuit — Journal de Sommeil" },
      {
        name: "description",
        content: "Saisie guidée : coucher, endormissement, réveils nocturnes, lever, sieste et ressenti.",
      },
      { property: "og:title", content: "Remplir ma nuit — Journal de Sommeil" },
      { property: "og:description", content: "Une seule page pour enregistrer votre nuit en 30 secondes." },
    ],
  }),
  component: Saisie,
});

function nuitVide(date: string): Nuit {
  return {
    id: nouvelId(),
    date,
    heureCoucher: "23:00",
    delaiEndormissement: 15,
    reveils: [],
    heureLever: "07:00",
    sieste: null,
    somnolences: [],
    qualiteSommeil: "B",
    qualiteReveil: "B",
    formeJournee: "B",
    commentaire: "",
    majLe: "",
  };
}

const DELAIS = [0, 15, 30, 45, 60];

function Carte({
  numero,
  titre,
  children,
  action,
}: {
  numero: number;
  titre: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="carte apparition p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <span className="grid size-6 place-items-center rounded-full bg-secondary text-xs font-bold text-primary">
            {numero}
          </span>
          {titre}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function ChampHeure({
  label,
  valeur,
  onChange,
}: {
  label: string;
  valeur: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="carte-douce block flex-1 px-4 py-3">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input
        type="time"
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        className="champ-heure"
      />
    </label>
  );
}

function Saisie() {
  const { id, date } = Route.useSearch();
  const navigate = useNavigate();
  const existante = useMemo(() => (id ? chargerNuits().find((n) => n.id === id) : undefined), [id]);
  const [nuit, setNuit] = useState<Nuit>(
    () => existante ?? nuitVide(date ?? dateISO(new Date(Date.now() - 86400000))),
  );
  const [delaiLibre, setDelaiLibre] = useState(!DELAIS.includes(nuit.delaiEndormissement));

  const maj = (patch: Partial<Nuit>) => setNuit((n) => ({ ...n, ...patch }));

  const enregistrer = () => {
    enregistrerNuit(nuit);
    toast.success("Nuit enregistrée");
    navigate({ to: "/historique" });
  };

  return (
    <main className="mx-auto max-w-2xl px-4 pt-6">
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{libelleNuit(nuit.date)}</h1>
          <input
            type="date"
            value={nuit.date}
            onChange={(e) => maj({ date: e.target.value })}
            className="mt-1 bg-transparent text-sm text-muted-foreground outline-none"
            aria-label="Date de la nuit"
          />
        </div>
        <button
          type="button"
          onClick={() => navigate({ to: "/" })}
          aria-label="Fermer"
          className="carte-douce grid size-11 place-items-center text-muted-foreground"
        >
          <X className="size-5" aria-hidden />
        </button>
      </header>

      <div className="carte mb-5 p-4">
        <ApercuGrille nuits={[nuit]} hauteurLigne={34} />
        <p className="mt-1 text-xs text-muted-foreground">
          Aperçu automatique — identique au document PDF remis au médecin.
        </p>
      </div>

      <div className="space-y-4">
        <Carte numero={1} titre="Heure du coucher">
          <ChampHeure
            label="Mise au lit"
            valeur={nuit.heureCoucher}
            onChange={(v) => maj({ heureCoucher: v })}
          />
        </Carte>

        <Carte numero={2} titre="Endormissement">
          <div className="grid grid-cols-3 gap-2">
            {DELAIS.map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={!delaiLibre && nuit.delaiEndormissement === d}
                onClick={() => {
                  setDelaiLibre(false);
                  maj({ delaiEndormissement: d });
                }}
                className={cn(
                  "min-h-14 rounded-2xl text-sm font-semibold transition-all",
                  !delaiLibre && nuit.delaiEndormissement === d
                    ? "bg-primary text-primary-foreground"
                    : "carte-douce text-muted-foreground",
                )}
              >
                {d === 0 ? "Tout de suite" : `${d} min`}
              </button>
            ))}
            <button
              type="button"
              aria-pressed={delaiLibre}
              onClick={() => setDelaiLibre(true)}
              className={cn(
                "min-h-14 rounded-2xl text-sm font-semibold transition-all",
                delaiLibre ? "bg-primary text-primary-foreground" : "carte-douce text-muted-foreground",
              )}
            >
              Autre
            </button>
          </div>
          {delaiLibre && (
            <label className="carte-douce mt-3 flex items-center gap-3 px-4 py-3">
              <span className="text-xs font-medium text-muted-foreground">Minutes</span>
              <input
                type="number"
                min={0}
                max={480}
                value={nuit.delaiEndormissement}
                onChange={(e) => maj({ delaiEndormissement: Number(e.target.value) })}
                className="champ-heure"
              />
            </label>
          )}
        </Carte>

        <Carte
          numero={3}
          titre="Réveils nocturnes"
          action={
            <button
              type="button"
              onClick={() =>
                maj({
                  reveils: [...nuit.reveils, { id: nouvelId(), debut: "03:00", fin: "03:30" }],
                })
              }
              className="flex min-h-10 items-center gap-1.5 rounded-full bg-secondary px-3 text-sm font-semibold text-primary"
            >
              <Plus className="size-4" aria-hidden />
              Ajouter
            </button>
          }
        >
          {nuit.reveils.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun réveil noté.</p>
          ) : (
            <ul className="space-y-2">
              {nuit.reveils.map((r) => (
                <li key={r.id} className="flex items-end gap-2">
                  <ChampHeure
                    label="Début"
                    valeur={r.debut}
                    onChange={(v) =>
                      maj({
                        reveils: nuit.reveils.map((x) => (x.id === r.id ? { ...x, debut: v } : x)),
                      })
                    }
                  />
                  <ChampHeure
                    label="Fin"
                    valeur={r.fin}
                    onChange={(v) =>
                      maj({
                        reveils: nuit.reveils.map((x) => (x.id === r.id ? { ...x, fin: v } : x)),
                      })
                    }
                  />
                  <button
                    type="button"
                    aria-label="Supprimer ce réveil"
                    onClick={() => maj({ reveils: nuit.reveils.filter((x) => x.id !== r.id) })}
                    className="carte-douce grid size-12 shrink-0 place-items-center text-destructive"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Carte>

        <Carte numero={4} titre="Heure de lever">
          <ChampHeure label="Lever" valeur={nuit.heureLever} onChange={(v) => maj({ heureLever: v })} />
        </Carte>

        <Carte
          numero={5}
          titre="Sieste"
          action={
            <Switch
              checked={!!nuit.sieste}
              aria-label="J'ai fait une sieste"
              onCheckedChange={(actif) =>
                maj({ sieste: actif ? { id: nouvelId(), debut: "14:00", fin: "14:30" } : null })
              }
            />
          }
        >
          {nuit.sieste ? (
            <div className="flex gap-2">
              <ChampHeure
                label="Début"
                valeur={nuit.sieste.debut}
                onChange={(v) => maj({ sieste: { ...nuit.sieste!, debut: v } })}
              />
              <ChampHeure
                label="Fin"
                valeur={nuit.sieste.fin}
                onChange={(v) => maj({ sieste: { ...nuit.sieste!, fin: v } })}
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Pas de sieste.</p>
          )}
        </Carte>

        <Carte numero={6} titre="Évaluation">
          <div className="space-y-5">
            <SelecteurNote
              titre="Qualité du sommeil"
              valeur={nuit.qualiteSommeil}
              onChange={(v) => maj({ qualiteSommeil: v })}
            />
            <SelecteurNote
              titre="Qualité du réveil"
              valeur={nuit.qualiteReveil}
              onChange={(v) => maj({ qualiteReveil: v })}
            />
            <SelecteurNote
              titre="Forme de la journée"
              valeur={nuit.formeJournee}
              onChange={(v) => maj({ formeJournee: v })}
            />
          </div>
        </Carte>

        <Carte numero={7} titre="Traitement et remarques">
          <Textarea
            value={nuit.commentaire}
            onChange={(e) => maj({ commentaire: e.target.value })}
            placeholder="Traitement, événement particulier…"
            className="min-h-24 rounded-2xl"
          />
        </Carte>
      </div>

      <div className="sticky bottom-24 z-30 mt-6 flex gap-2">
        {existante && (
          <button
            type="button"
            onClick={() => {
              supprimerNuit(existante.id);
              toast("Nuit supprimée");
              navigate({ to: "/historique" });
            }}
            className="carte grid min-h-14 w-14 place-items-center text-destructive"
            aria-label="Supprimer cette nuit"
          >
            <Trash2 className="size-5" aria-hidden />
          </button>
        )}
        <button
          type="button"
          onClick={enregistrer}
          className="flex min-h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary text-base font-semibold text-primary-foreground shadow-lg transition-transform active:scale-[0.985]"
        >
          <Check className="size-5" aria-hidden />
          Enregistrer
        </button>
      </div>
    </main>
  );
}