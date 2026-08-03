import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Download, FileJson, Upload } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { SelecteurDate } from "@/components/selecteur-date";
import { SelecteurHeure } from "@/components/selecteur-heure";
import { BoutonValider } from "@/components/bouton-valider";
import { cn } from "@/lib/utils";
import {
  chargerNuits,
  enregistrerReglages,
  remplacerNuits,
  useNuits,
  useReglages,
} from "@/lib/sleep/store";
import { exporterJson, lireSauvegarde } from "@/lib/sleep/export";
import type { Reglages } from "@/lib/sleep/types";

export const Route = createFileRoute("/parametres")({
  head: () => ({
    meta: [
      { title: "Paramètres et exports — Journal de Sommeil" },
      {
        name: "description",
        content:
          "Identité du patient, thème clair/sombre, rappels, export PDF conforme, PNG, CSV, JSON et sauvegarde locale.",
      },
      { property: "og:title", content: "Paramètres et exports — Journal de Sommeil" },
      {
        property: "og:description",
        content: "Exportez votre agenda de sommeil au format PDF pour votre médecin.",
      },
    ],
  }),
  component: Parametres,
});

const THEMES: { valeur: Reglages["theme"]; label: string }[] = [
  { valeur: "clair", label: "Clair" },
  { valeur: "sombre", label: "Sombre" },
  { valeur: "systeme", label: "Système" },
];

function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="carte apparition p-5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {titre}
      </h2>
      {children}
    </section>
  );
}

function Champ({
  label,
  ...props
}: { label: string } & React.ComponentProps<typeof Input>) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <Input {...props} className="mt-1 min-h-12 rounded-2xl" />
    </label>
  );
}

/** Valeur réglée à la roulette, figée après validation. */
function ChampRoue({
  label,
  children,
  fige,
  onToggle,
}: {
  label: string;
  children: React.ReactNode;
  fige: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <BoutonValider fige={fige} onToggle={onToggle} />
      </div>
      {children}
    </div>
  );
}

function Parametres() {
  const reglages = useReglages();
  const nuits = useNuits();
  const fichier = useRef<HTMLInputElement>(null);
  const [figes, setFiges] = useState<Record<string, boolean>>({
    naissance: true,
    soir: true,
    matin: true,
  });
  const basculer = (cle: string) => setFiges((f) => ({ ...f, [cle]: !f[cle] }));

  const maj = (patch: Partial<Reglages>) => enregistrerReglages({ ...reglages, ...patch });

  return (
    <main className="mx-auto max-w-2xl px-4 pt-8">
      <h1 className="mb-4 text-3xl font-extrabold tracking-tight">Paramètres</h1>

      <div className="space-y-4">
        <Section titre="Patient">
          <div className="grid gap-3 sm:grid-cols-2">
            <Champ
              label="Prénom"
              value={reglages.prenom}
              onChange={(e) => maj({ prenom: e.target.value })}
            />
            <Champ label="Nom" value={reglages.nom} onChange={(e) => maj({ nom: e.target.value })} />
            <ChampRoue
              label="Date de naissance"
              fige={!!figes["naissance"]}
              onToggle={() => basculer("naissance")}
            >
              <SelecteurDate
                valeur={reglages.dateNaissance}
                fige={!!figes["naissance"]}
                onChange={(v) => maj({ dateNaissance: v })}
              />
            </ChampRoue>
            <Champ
              label="Centre / médecin"
              value={reglages.centre}
              onChange={(e) => maj({ centre: e.target.value })}
            />
          </div>
        </Section>

        <Section titre="Apparence">
          <div className="flex gap-2" role="group" aria-label="Thème">
            {THEMES.map((t) => (
              <button
                key={t.valeur}
                type="button"
                aria-pressed={reglages.theme === t.valeur}
                onClick={() => maj({ theme: t.valeur })}
                className={cn(
                  "min-h-12 flex-1 rounded-2xl text-sm font-semibold transition-all",
                  reglages.theme === t.valeur
                    ? "bg-primary text-primary-foreground"
                    : "carte-douce text-muted-foreground",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <label className="mt-4 flex items-center justify-between gap-3">
            <span className="text-sm font-medium">Format 24 heures</span>
            <Switch
              checked={reglages.format24h}
              onCheckedChange={(v) => maj({ format24h: v })}
              aria-label="Format 24 heures"
            />
          </label>
        </Section>

        <Section titre="Rappels">
          <p className="mb-3 text-sm text-muted-foreground">
            Heures suggérées pour penser à remplir votre agenda.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <ChampRoue label="Rappel du soir" fige={!!figes["soir"]} onToggle={() => basculer("soir")}>
              <SelecteurHeure
                valeur={reglages.rappelSoir ?? "22:00"}
                fige={!!figes["soir"]}
                onChange={(v) => maj({ rappelSoir: v })}
              />
            </ChampRoue>
            <ChampRoue label="Rappel du matin" fige={!!figes["matin"]} onToggle={() => basculer("matin")}>
              <SelecteurHeure
                valeur={reglages.rappelMatin ?? "08:00"}
                fige={!!figes["matin"]}
                onChange={(v) => maj({ rappelMatin: v })}
              />
            </ChampRoue>
          </div>
        </Section>

        <Section titre="Sauvegarde JSON">
          <button
            type="button"
            onClick={() => {
              if (!nuits.length) {
                toast("Aucune nuit à exporter");
                return;
              }
              exporterJson(nuits, reglages);
              toast.success("Sauvegarde JSON générée");
            }}
            className="carte-douce flex w-full items-center gap-3 p-4 text-left"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
              <FileJson className="size-5" aria-hidden />
            </span>
            <span className="flex-1">
              <span className="block font-semibold">Exporter mes données</span>
              <span className="block text-xs text-muted-foreground">
                Toutes vos nuits et vos réglages
              </span>
            </span>
            <Download className="size-4 text-muted-foreground" aria-hidden />
          </button>
        </Section>

        <Section titre="Restaurer une sauvegarde">
          <input
            ref={fichier}
            type="file"
            accept="application/json"
            className="sr-only"
            onChange={async (ev) => {
              const f = ev.target.files?.[0];
              if (!f) return;
              try {
                const data = await lireSauvegarde(f);
                remplacerNuits(data.nuits);
                if (data.reglages) enregistrerReglages(data.reglages);
                toast.success(`${data.nuits.length} nuits restaurées`);
              } catch {
                toast.error("Fichier de sauvegarde invalide");
              }
              ev.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fichier.current?.click()}
            className="carte-douce flex min-h-14 w-full items-center justify-center gap-2 font-semibold"
          >
            <Upload className="size-4" aria-hidden />
            Importer un fichier JSON
          </button>
          <p className="mt-3 text-xs text-muted-foreground">
            {chargerNuits().length} nuit(s) enregistrée(s) sur cet appareil. Vos données restent
            uniquement dans ce navigateur, sans compte ni serveur.
          </p>
        </Section>
      </div>
    </main>
  );
}