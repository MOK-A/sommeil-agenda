/**
 * Moteur graphique de l'agenda.
 * Convertit une nuit saisie en éléments à dessiner sur la grille 20h → 20h,
 * sans aucune intervention de l'utilisateur.
 */
import type { Nuit } from "./types";
import { depuisOrigine, toMinutes } from "./time";

/** Largeur de la grille en minutes (20h J → 20h J+1). */
export const LARGEUR = 1440;
/** Nombre de colonnes (une demi-heure par colonne). */
export const COLONNES = 48;

export interface Barre {
  debut: number;
  fin: number;
  type: "sommeil" | "sieste" | "demi";
}

export interface Rendu {
  coucher: number | null;
  lever: number | null;
  barres: Barre[];
  /** Positions des marqueurs "S" (somnolence dans la journée). */
  somnolences: number[];
}

const borne = (v: number) => Math.max(0, Math.min(LARGEUR, v));

/** Ramène une position après une référence (gère le passage de minuit). */
function apres(position: number, reference: number): number {
  return position < reference ? position + LARGEUR : position;
}

function soustraire(barres: Barre[], debut: number, fin: number): Barre[] {
  const out: Barre[] = [];
  for (const b of barres) {
    if (fin <= b.debut || debut >= b.fin) {
      out.push(b);
      continue;
    }
    if (debut > b.debut) out.push({ ...b, fin: debut });
    if (fin < b.fin) out.push({ ...b, debut: fin });
  }
  return out.filter((b) => b.fin - b.debut > 1);
}

export function calculerRendu(nuit: Nuit): Rendu {
  const coucher = depuisOrigine(nuit.heureCoucher);
  const endormissement = coucher + Math.max(0, nuit.delaiEndormissement || 0);
  const lever = apres(depuisOrigine(nuit.heureLever), endormissement);

  let barres: Barre[] = [];
  if (lever > endormissement) {
    barres.push({ debut: borne(endormissement), fin: borne(lever), type: "sommeil" });
  }

  const long = Math.max(0, nuit.longReveil || 0);
  if (long > 0) barres = soustraire(barres, borne(lever - long), borne(lever));

  const demis: Barre[] = [];
  for (const r of nuit.reveils || []) {
    if (!r.debut || !r.fin) continue;
    const d = apres(depuisOrigine(r.debut), endormissement);
    const f = apres(depuisOrigine(r.fin), d);
    barres = soustraire(barres, borne(d), borne(f));
    if (r.demi) demis.push({ debut: borne(d), fin: borne(f), type: "demi" });
  }
  barres = barres.concat(demis);

  for (const s of nuit.siestes || []) {
    if (!s.debut || !s.fin) continue;
    const d = apres(depuisOrigine(s.debut), lever);
    const f = apres(depuisOrigine(s.fin), d);
    if (d < LARGEUR) barres.push({ debut: borne(d), fin: borne(f), type: "sieste" });
  }

  return {
    coucher: coucher <= LARGEUR ? borne(coucher) : null,
    lever: lever <= LARGEUR ? borne(lever) : null,
    barres: barres.sort((a, b) => a.debut - b.debut),
    somnolences: (nuit.somnolences || [])
      .filter(Boolean)
      .map((h) => depuisOrigine(h))
      .filter((p) => p >= 0 && p <= LARGEUR),
  };
}

/** Durées calculées d'une nuit (minutes). */
export interface Mesures {
  tempsSommeil: number;
  tempsEveilNocturne: number;
  tempsAuLit: number;
  nbReveils: number;
  tempsSieste: number;
  delai: number;
}

export function mesurer(nuit: Nuit): Mesures {
  const rendu = calculerRendu(nuit);
  const sommeil = rendu.barres
    .filter((b) => b.type === "sommeil")
    .reduce((s, b) => s + (b.fin - b.debut), 0);
  const sieste = rendu.barres
    .filter((b) => b.type === "sieste")
    .reduce((s, b) => s + (b.fin - b.debut), 0);
  const coucher = depuisOrigine(nuit.heureCoucher);
  const lever = apres(depuisOrigine(nuit.heureLever), coucher);
  const auLit = lever - coucher;
  const reveils = (nuit.reveils || []).filter((r) => r.debut && r.fin);
  const eveil = reveils.reduce((s, r) => {
    const d = toMinutes(r.debut);
    const f = toMinutes(r.fin);
    return s + ((f - d + 1440) % 1440);
  }, Math.max(0, nuit.longReveil || 0));
  return {
    tempsSommeil: sommeil,
    tempsEveilNocturne: eveil,
    tempsAuLit: auLit,
    nbReveils: reveils.length,
    tempsSieste: sieste,
    delai: Math.max(0, nuit.delaiEndormissement || 0),
  };
}