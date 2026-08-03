import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { ApercuGrille } from "@/components/apercu-grille";
import { SelecteurNote } from "@/components/selecteur-note";
import { SelecteurHeure } from "@/components/selecteur-heure";
import { BoutonValider } from "@/components/bouton-valider";
import { CurseurDuree } from "@/components/curseur-duree";
import { Etoiles, etoilesDe } from "@/components/etoiles";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  chargerNuits,
  enregistrerNuit,
  memoriserRemarque,
  memoriserTraitement,
  nouvelId,
  nuitParDate,
  oublierRemarque,
  oublierTraitement,
  useRemarques,
  useTraitements,
  useNuits,
} from "@/lib/sleep/store";
import { supprimerAvecAnnulation } from "@/lib/sleep/suppression";
import { ajouterJours, dateISO, fromMinutes, libelleNuit, toMinutes } from "@/lib/sleep/time";
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
    qualiteSommeil: null,
    qualiteReveil: null,
    formeJournee: null,
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
  const remarques = useRemarques();
  const dateRef = useRef<HTMLInputElement>(null);
  const nuits = useNuits();
  /** Date maximale autorisée : la journée en cours (pas de nuit dans le futur). */
  const dateMax = dateISO(new Date());
  const existante = useMemo(() => (id ? chargerNuits().find((n) => n.id === id) : undefined), [id]);
  const [nuit, setNuit] = useState<Nuit>(
    () => existante ?? nuitVide(date ?? dateISO(new Date(Date.now() - 86400000))),
  );
  const [compact, setCompact] = useState(false);
  /** Valeurs validées/figées (clés : "coucher", "lever", id de réveil/sieste, "som-i"). */
  const [figes, setFiges] = useState<Record<string, boolean>>({});
  const basculer = (cle: string) => setFiges((f) => ({ ...f, [cle]: !f[cle] }));
  /** La nuit affichée existe déjà dans le journal (coche verte). */
  const [enregistree, setEnregistree] = useState(!!existante);
  /** Des paramètres ont été touchés : l'aperçu repasse en couleur. */
  const [modifiee, setModifiee] = useState(false);

  useEffect(() => {
    const auScroll = () => setCompact(window.scrollY > 40);
    auScroll();
    window.addEventListener("scroll", auScroll, { passive: true });
    return () => window.removeEventListener("scroll", auScroll);
  }, []);

  // Reprend la nuit déjà enregistrée à cette date (y compris après hydratation).
  useEffect(() => {
    const deja = nuits.find((n) => n.date === nuit.date);
    if (!deja) return;
    setEnregistree(true);
    if (deja.id !== nuit.id && !modifiee) setNuit(deja);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nuits]);

  const maj = (patch: Partial<Nuit>) => {
    setModifiee(true);
    setNuit((n) => ({ ...n, ...patch }));
  };

  /** Change de date : reprend la nuit déjà enregistrée s'il y en a une (pas de doublon). */
  const changerDate = (nouvelleDate: string) => {
    if (!nouvelleDate) return;
    if (nouvelleDate > dateMax) {
      toast("Impossible de remplir une nuit à venir");
      return;
    }
    const deja = nuitParDate(nouvelleDate);
    const reprise = deja && deja.id !== nuit.id;
    setNuit(reprise ? deja : { ...nuitVide(nouvelleDate), id: nuit.id });
    setEnregistree(!!deja);
    setModifiee(false);
    setFiges({});
  };

  const notes = [nuit.qualiteSommeil, nuit.qualiteReveil, nuit.formeJournee].filter(Boolean);
  const moyenne = notes.length
    ? notes.reduce((s, n) => s + etoilesDe(n), 0) / notes.length
    : 0;

  const enregistrer = () => {
    if (nuit.traitement.trim()) memoriserTraitement(nuit.traitement.trim());
    if (nuit.commentaire.trim()) memoriserRemarque(nuit.commentaire.trim());
    enregistrerNuit(nuit);
    setEnregistree(true);
    setModifiee(false);
    toast.success("Nuit enregistrée");
    navigate({ to: "/" });
  };

  return (
    <main className="mx-auto max-w-2xl px-4 pt-4">
      <div className="sticky top-0 z-40 -mx-4 bg-background/95 px-4 pt-2 pb-3 backdrop-blur-xl">
        <div className="mb-2 flex items-center gap-2">
          <button
            type="button"
            aria-label="Jour précédent"
            onClick={() => changerDate(ajouterJours(nuit.date, -1))}
            className="carte-douce grid size-11 shrink-0 place-items-center text-primary"
          >
            <ChevronLeft className="size-6" aria-hidden />
          </button>

          <button
            type="button"
            aria-label="Choisir la date de la nuit"
            onClick={() => {
              const el = dateRef.current;
              if (!el) return;
              const avecPicker = el as HTMLInputElement & { showPicker?: () => void };
              if (typeof avecPicker.showPicker === "function") avecPicker.showPicker();
              else avecPicker.click();
            }}
            className={cn(
              "relative flex min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-3 font-bold text-primary-foreground shadow-sm transition-all",
              compact ? "min-h-10 text-sm" : "min-h-14 text-lg",
            )}
          >
            <CalendarDays className={compact ? "size-4 shrink-0" : "size-5 shrink-0"} aria-hidden />
            <span className="truncate">{libelleNuit(nuit.date)}</span>
            {enregistree && (
              <CheckCircle2
                className={cn("shrink-0 text-[var(--color-tres-bien)]", compact ? "size-4" : "size-5")}
                aria-label="Nuit déjà enregistrée"
              />
            )}
            <input
              ref={dateRef}
              type="date"
              value={nuit.date}
              max={dateMax}
              onChange={(e) => changerDate(e.target.value)}
              tabIndex={-1}
              aria-hidden
              className="pointer-events-none absolute bottom-0 left-1/2 size-px opacity-0"
            />
          </button>

          <button
            type="button"
            aria-label="Jour suivant"
            disabled={nuit.date >= dateMax}
            onClick={() => changerDate(ajouterJours(nuit.date, 1))}
            className="carte-douce grid size-11 shrink-0 place-items-center text-primary disabled:opacity-40"
          >
            <ChevronRight className="size-6" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: "/" })}
            aria-label="Fermer"
            className="carte-douce grid size-11 shrink-0 place-items-center text-muted-foreground"
          >
            <X className="size-6" aria-hidden />
          </button>
        </div>

        <div className="carte p-3">
          <ApercuGrille
            nuits={[nuit]}
            hauteurLigne={compact ? 28 : 34}
            origineHeure={18}
            grise={!enregistree && !modifiee}
          />
          {!compact && (
            <p className="mt-1 text-xs text-muted-foreground">
              Aperçu automatique — identique au document PDF remis au médecin.
            </p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <Carte
          numero={1}
          titre="Heure du coucher"
          action={
            <BoutonValider fige={!!figes["coucher"]} onToggle={() => basculer("coucher")} />
          }
        >
          <SelecteurHeure
            label="Mise au lit"
            valeur={nuit.heureCoucher}
            fige={!!figes["coucher"]}
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
            <ul className="space-y-4">
              {nuit.reveils.map((r) => (
                <li key={r.id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label="Supprimer ce réveil"
                      onClick={() => maj({ reveils: nuit.reveils.filter((x) => x.id !== r.id) })}
                      className="carte-douce grid size-12 shrink-0 place-items-center text-destructive"
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                    <SelecteurHeure
                      label="Début"
                      valeur={r.debut}
                      fige={!!figes[r.id]}
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
                      fige={!!figes[r.id]}
                      onChange={(v) =>
                        maj({
                          reveils: nuit.reveils.map((x) => (x.id === r.id ? { ...x, fin: v } : x)),
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <BoutonValider fige={!!figes[r.id]} onToggle={() => basculer(r.id)} />
                    <button
                      type="button"
                      aria-pressed={!!r.demi}
                      onClick={() =>
                        maj({
                          reveils: nuit.reveils.map((x) =>
                            x.id === r.id ? { ...x, demi: !x.demi } : x,
                          ),
                        })
                      }
                      className={cn(
                        "min-h-12 rounded-2xl px-4 text-sm font-semibold transition-colors",
                        r.demi ? "bg-primary text-primary-foreground" : "carte-douce text-muted-foreground",
                      )}
                    >
                      1/2 réveil
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Carte>

        <Carte
          numero={4}
          titre="Heure de lever"
          action={<BoutonValider fige={!!figes["lever"]} onToggle={() => basculer("lever")} />}
        >
          <SelecteurHeure
            label="Lever"
            valeur={nuit.heureLever}
            fige={!!figes["lever"]}
            onChange={(v) => maj({ heureLever: v })}
          />
        </Carte>

        <Carte numero={5} titre="Long réveil">
          <CurseurDuree
            label="Éveillé avant le lever"
            valeur={nuit.longReveil}
            onChange={(v) => maj({ longReveil: v })}
          />
        </Carte>

        <Carte
          numero={6}
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
            <ul className="space-y-4">
              {nuit.siestes.map((s) => (
                <li key={s.id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label="Supprimer cette sieste"
                      onClick={() => maj({ siestes: nuit.siestes.filter((x) => x.id !== s.id) })}
                      className="carte-douce grid size-12 shrink-0 place-items-center text-destructive"
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                    <SelecteurHeure
                      label="Début"
                      valeur={s.debut}
                      fige={!!figes[s.id]}
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
                      fige={!!figes[s.id]}
                      onChange={(v) =>
                        maj({ siestes: nuit.siestes.map((x) => (x.id === s.id ? { ...x, fin: v } : x)) })
                      }
                    />
                  </div>
                  <BoutonValider fige={!!figes[s.id]} onToggle={() => basculer(s.id)} />
                </li>
              ))}
            </ul>
          )}
        </Carte>

        <Carte
          numero={7}
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
            <ul className="space-y-4">
              {nuit.somnolences.map((h, i) => (
                <li key={i} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label="Supprimer cette somnolence"
                      onClick={() => maj({ somnolences: nuit.somnolences.filter((_, j) => j !== i) })}
                      className="carte-douce grid size-12 shrink-0 place-items-center text-destructive"
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                    <SelecteurHeure
                      label="Moment"
                      valeur={h}
                      fige={!!figes[`som-${i}`]}
                      onChange={(v) =>
                        maj({ somnolences: nuit.somnolences.map((x, j) => (j === i ? v : x)) })
                      }
                    />
                  </div>
                  <BoutonValider fige={!!figes[`som-${i}`]} onToggle={() => basculer(`som-${i}`)} />
                </li>
              ))}
            </ul>
          )}
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
                  <button
                    type="button"
                    onClick={() =>
                      maj({
                        traitement: nuit.traitement.trim() ? `${nuit.traitement.trim()}, ${t}` : t,
                      })
                    }
                    className="font-medium"
                  >
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
          {remarques.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {remarques.map((t) => (
                <span
                  key={t}
                  className="flex max-w-full items-center gap-1 rounded-full bg-secondary py-1 pl-3 pr-1 text-sm"
                >
                  <button
                    type="button"
                    onClick={() => maj({ commentaire: t })}
                    className="max-w-[14rem] truncate font-medium"
                  >
                    {t}
                  </button>
                  <button
                    type="button"
                    aria-label={`Oublier ${t}`}
                    onClick={() => oublierRemarque(t)}
                    className="grid size-6 shrink-0 place-items-center rounded-full text-muted-foreground hover:text-destructive"
                  >
                    <X className="size-3.5" aria-hidden />
                  </button>
                </span>
              ))}
            </div>
          )}
        </Carte>
      </div>

      <div className="mt-6 mb-4 flex gap-2">
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
