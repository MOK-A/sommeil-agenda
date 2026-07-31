/** Calculs statistiques sur un ensemble de nuits. */
import type { Nuit } from "./types";
import { mesurer } from "./grid";
import { depuisOrigine, fromMinutes, ORIGINE } from "./time";

export interface Statistiques {
  nbNuits: number;
  dureeMoyenne: number;
  delaiMoyen: number;
  reveilsMoyens: number;
  eveilMoyen: number;
  heureCoucherMoyenne: string;
  heureLeverMoyenne: string;
  nbSiestes: number;
  tempsTotalSieste: number;
  efficacite: number;
  serie: { date: string; sommeil: number; eveil: number; sieste: number; coucher: number; lever: number }[];
}

export function calculerStatistiques(nuits: Nuit[]): Statistiques {
  const n = nuits.length;
  const vide: Statistiques = {
    nbNuits: 0,
    dureeMoyenne: 0,
    delaiMoyen: 0,
    reveilsMoyens: 0,
    eveilMoyen: 0,
    heureCoucherMoyenne: "--:--",
    heureLeverMoyenne: "--:--",
    nbSiestes: 0,
    tempsTotalSieste: 0,
    efficacite: 0,
    serie: [],
  };
  if (!n) return vide;

  const mesures = nuits.map(mesurer);
  const somme = (f: (i: number) => number) => mesures.reduce((s, _, i) => s + f(i), 0);

  const coucherMoyen = nuits.reduce((s, x) => s + depuisOrigine(x.heureCoucher), 0) / n;
  const leverMoyen = nuits.reduce((s, x) => s + depuisOrigine(x.heureLever), 0) / n;
  const auLit = somme((i) => mesures[i]!.tempsAuLit);
  const sommeil = somme((i) => mesures[i]!.tempsSommeil);

  return {
    nbNuits: n,
    dureeMoyenne: sommeil / n,
    delaiMoyen: somme((i) => mesures[i]!.delai) / n,
    reveilsMoyens: somme((i) => mesures[i]!.nbReveils) / n,
    eveilMoyen: somme((i) => mesures[i]!.tempsEveilNocturne) / n,
    heureCoucherMoyenne: fromMinutes(coucherMoyen + ORIGINE),
    heureLeverMoyenne: fromMinutes(leverMoyen + ORIGINE),
    nbSiestes: nuits.reduce(
      (s, x) => s + (x.siestes || []).filter((v) => v.debut && v.fin).length,
      0,
    ),
    tempsTotalSieste: somme((i) => mesures[i]!.tempsSieste),
    efficacite: auLit > 0 ? Math.round((sommeil / auLit) * 100) : 0,
    serie: nuits
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((x) => ({
        date: x.date,
        sommeil: Math.round((mesurer(x).tempsSommeil / 60) * 10) / 10,
        eveil: Math.round((mesurer(x).tempsEveilNocturne / 60) * 10) / 10,
        sieste: Math.round((mesurer(x).tempsSieste / 60) * 10) / 10,
        coucher: depuisOrigine(x.heureCoucher),
        lever: depuisOrigine(x.heureLever),
      })),
  };
}

/** Couleur de synthèse d'une nuit pour le calendrier. */
export function couleurNuit(nuit: Nuit): "bonne" | "moyenne" | "mauvaise" {
  if (nuit.qualiteSommeil === "TB" || nuit.qualiteSommeil === "B") return "bonne";
  if (nuit.qualiteSommeil === "Moy") return "moyenne";
  return "mauvaise";
}