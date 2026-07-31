import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { CalendarDays, Check, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { ApercuGrille } from "@/components/apercu-grille";
import { SelecteurNote } from "@/components/selecteur-note";
import { SelecteurHeure } from "@/components/selecteur-heure";
import { CurseurDuree } from "@/components/curseur-duree";
import { Etoiles, ETOILES } from "@/components/etoiles";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  chargerNuits,
  enregistrerNuit,
  memoriserTraitement,
  nouvelId,
  oublierTraitement,
  useTraitements,
} from "@/lib/sleep/store";
import { supprimerAvecAnnulation } from "@/lib/sleep/suppression";
import { dateISO, fromMinutes, libelleNuit, toMinutes } from "@/lib/sleep/time";
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
        content:
          "Saisie guidée : coucher, endormissement, réveils nocturnes, lever, siestes, somnolences et ressenti.",
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
    siestes: [],
    somnolences: [],
    longReveil: 0,
    qualiteSommeil: "B",
    qualiteReveil: "B",
    formeJournee: "B",
    traitement: "",
    commentaire: "",
    majLe: "",
  };
}

function Carte({
  numero,
  titre,
  children,
  action,
  extra,
}: {
  numero: number;
  titre: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  extra?: React.ReactNode;
}) {
  return (
    <section className="carte apparition p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <span className="grid size-6 place-items-center rounded-full bg-secondary text-xs font-bold text-primary">
            {numero}
          </span>
          {titre}
          {extra}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Décale l'heure de fin quand le début change, en gardant la durée saisie. */
function decaler(debut: string, ancienDebut: string, ancienneFin: string): string {
  const duree = (toMinutes(ancienneFin) - toMinutes(ancienDebut) + 1440) % 1440;
  return fromMinutes((toMinutes(debut) + (duree || 30)) % 1440);
}

function Saisie() {
  const { id, date } = Route.useSearch();
  const navigate = useNavigate();
  const traitements = useTraitements();
  const dateRef = useRef<HTMLInputElement>(null);
  const existante = useMemo(() => (id ? chargerNuits().find((n) => n.id === id) : undefined), [id]);
  const [nuit, setNuit] = useState<Nuit>(
    () => existante ?? nuitVide(date ?? dateISO(new Date(Date.now() - 86400000))),
  );

  const maj = (patch: Partial<Nuit>) => setNuit((n) => ({ ...n, ...patch }));

  const moyenne =
    (ETOILES[nuit.qualiteSommeil] + ETOILES[nuit.qualiteReveil] + ETOILES[nuit.formeJournee]) / 3;

  const enregistrer = () => {
    if (nuit.traitement.trim()) memoriserTraitement(nuit.traitement.trim());
    enregistrerNuit(nuit);
    toast.success("Nuit enregistrée");
    navigate({ to: "/" });
  };

  return (
    <main className="mx-auto max-w-2xl px-4 pt-6">
      <header className="mb-5 flex items-center justify-between gap-3">
        <button
          type="button"
          aria-label="Changer la date"
          onClick={() => dateRef.current?.showPicker?.() ?? dateRef.current?.focus()}
          className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm"
        >
          <CalendarDays className="size-6" aria-hidden />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-extrabold tracking-tight">{libelleNuit(nuit.date)}</h1>
          <input
            ref={dateRef}
            type="date"
            value={nuit.date}
            onChange={(e) => maj({ date: e.target.value })}
            className="mt-0.5 bg-transparent text-sm text-muted-foreground outline-none"
            aria-label="Date de la nuit"
          />
        </div>
        <button
          type="button"
          onClick={() => navigate({ to: "/" })}
          aria-label="Fermer"
          className="carte-douce grid size-11 shrink-0 place-items-center text-muted-foreground"
        >
          <X className="size-6" aria-hidden />
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
          <SelecteurHeure
            label="Mise au lit"
            valeur={nuit.heureCoucher}
            onChange={(v) => maj({ heureCoucher: v })}
          />
        </Carte>

        <Carte numero={2} titre="Endormissement">
          <CurseurDuree
            label="Temps pour s'endormir"
            valeur={nuit.delaiEndormissement}
            onChange={(v) => maj({ delaiEndormissement: v })}
          />
        </Carte>

        <Carte
          numero={3}
          titre="Réveils nocturnes"
          action={
            <button
              type="button"
              onClick={() =>
                maj({
                  reveils: [...nuit.reveils, { id: nouvelId(), debut: "03:00", fin: "03:30", demi: false }],
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
            <ul className="space-y-3">
              {nuit.reveils.map((r) => (
                <li key={r.id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <SelecteurHeure
                      label="Début"
                      valeur={r.debut}
                      onChange={(v) =>
                        maj({
                          reveils: nuit.reveils.map((x) =>
                            x.id === r.id ? { ...x, debut: v, fin: decaler(v, x.debut, x.fin) } : x,
                          ),
                        })
                      }
                    />
                    <SelecteurHeure
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
                  </div>
                  <label className="flex items-center gap-2 px-1 text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={!!r.demi}
                      onChange={(e) =>
                        maj({
                          reveils: nuit.reveils.map((x) =>
                            x.id === r.id ? { ...x, demi: e.target.checked } : x,
                          ),
                        })
                      }
                      className="size-5 accent-[var(--color-primary)]"
                    />
                    1/2 réveil (hachures zébrées)
                  </label>
                </li>
              ))}
            </ul>
          )}
        </Carte>

        <Carte numero={4} titre="Heure de lever">
          <SelecteurHeure label="Lever" valeur={nuit.heureLever} onChange={(v) => maj({ heureLever: v })} />
        </Carte>

        <Carte
          numero={5}
          titre="Siestes"
          action={
            <button
              type="button"
              onClick={() =>
                maj({ siestes: [...nuit.siestes, { id: nouvelId(), debut: "14:00", fin: "14:30" }] })
              }
              className="flex min-h-10 items-center gap-1.5 rounded-full bg-secondary px-3 text-sm font-semibold text-primary"
            >
              <Plus className="size-4" aria-hidden />
              Ajouter
            </button>
          }
        >
          {nuit.siestes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Pas de sieste.</p>
          ) : (
            <ul className="space-y-2">
              {nuit.siestes.map((s) => (
                <li key={s.id} className="flex items-center gap-2">
                  <SelecteurHeure
                    label="Début"
                    valeur={s.debut}
                    onChange={(v) =>
                      maj({
                        siestes: nuit.siestes.map((x) =>
                          x.id === s.id ? { ...x, debut: v, fin: decaler(v, x.debut, x.fin) } : x,
                        ),
                      })
                    }
                  />
                  <SelecteurHeure
                    label="Fin"
                    valeur={s.fin}
                    onChange={(v) =>
                      maj({ siestes: nuit.siestes.map((x) => (x.id === s.id ? { ...x, fin: v } : x)) })
                    }
                  />
                  <button
                    type="button"
                    aria-label="Supprimer cette sieste"
                    onClick={() => maj({ siestes: nuit.siestes.filter((x) => x.id !== s.id) })}
                    className="carte-douce grid size-12 shrink-0 place-items-center text-destructive"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Carte>

        <Carte
          numero={6}
          titre="Somnolence"
          action={
            <button
              type="button"
              onClick={() => maj({ somnolences: [...nuit.somnolences, "15:00"] })}
              className="flex min-h-10 items-center gap-1.5 rounded-full bg-secondary px-3 text-sm font-semibold text-primary"
            >
              <Plus className="size-4" aria-hidden />
              Ajouter
            </button>
          }
        >
          {nuit.somnolences.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune somnolence dans la journée.</p>
          ) : (
            <ul className="space-y-2">
              {nuit.somnolences.map((h, i) => (
                <li key={i} className="flex items-center gap-2">
                  <SelecteurHeure
                    label="Moment"
                    valeur={h}
                    onChange={(v) =>
                      maj({ somnolences: nuit.somnolences.map((x, j) => (j === i ? v : x)) })
                    }
                  />
                  <button
                    type="button"
                    aria-label="Supprimer cette somnolence"
                    onClick={() => maj({ somnolences: nuit.somnolences.filter((_, j) => j !== i) })}
                    className="carte-douce grid size-12 shrink-0 place-items-center text-destructive"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Carte>

        <Carte numero={7} titre="Long réveil">
          <CurseurDuree
            label="Éveillé avant le lever"
            valeur={nuit.longReveil}
            onChange={(v) => maj({ longReveil: v })}
          />
        </Carte>

        <Carte
          numero={8}
          titre="Évaluation"
          extra={<Etoiles valeur={moyenne} label={`Moyenne : ${moyenne.toFixed(1)} sur 5`} />}
        >
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

        <Carte numero={9} titre="Traitement">
          <Input
            value={nuit.traitement}
            onChange={(e) => maj({ traitement: e.target.value })}
            placeholder="Nom du traitement, dose…"
            className="h-12 rounded-2xl"
          />
          {traitements.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {traitements.map((t) => (
                <span
                  key={t}
                  className="flex items-center gap-1 rounded-full bg-secondary py-1 pl-3 pr-1 text-sm"
                >
                  <button type="button" onClick={() => maj({ traitement: t })} className="font-medium">
                    {t}
                  </button>
                  <button
                    type="button"
                    aria-label={`Oublier ${t}`}
                    onClick={() => oublierTraitement(t)}
                    className="grid size-6 place-items-center rounded-full text-muted-foreground hover:text-destructive"
                  >
                    <X className="size-3.5" aria-hidden />
                  </button>
                </span>
              ))}
            </div>
          )}
        </Carte>

        <Carte numero={10} titre="Remarques">
          <Textarea
            value={nuit.commentaire}
            onChange={(e) => maj({ commentaire: e.target.value })}
            placeholder="Événement particulier…"
            className="min-h-24 rounded-2xl"
          />
        </Carte>
      </div>

      <div className="sticky bottom-24 z-30 mt-6 flex gap-2">
        {existante && (
          <button
            type="button"
            onClick={() => {
              supprimerAvecAnnulation(existante);
              navigate({ to: "/" });
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
