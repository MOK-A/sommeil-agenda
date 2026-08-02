/**
 * Persistance locale (aucun compte, aucun serveur).
 * Les données restent dans la mémoire de l'appareil.
 */
import { useCallback, useEffect, useState } from "react";
import type { Nuit, Reglages } from "./types";
import { REGLAGES_DEFAUT } from "./types";

const CLE_NUITS = "journal-sommeil.nuits.v1";
const CLE_REGLAGES = "journal-sommeil.reglages.v1";
const CLE_TRAITEMENTS = "journal-sommeil.traitements.v1";
const CLE_REMARQUES = "journal-sommeil.remarques.v1";

type Ecouteur = () => void;
const ecouteurs = new Set<Ecouteur>();
const notifier = () => ecouteurs.forEach((e) => e());

/** Passe à vrai après l'hydratation, pour que le premier rendu client soit identique au serveur. */
let hydrate = false;

function lireBrut<T>(cle: string, defaut: T): T {
  if (typeof window === "undefined") return defaut;
  try {
    const brut = window.localStorage.getItem(cle);
    return brut ? (JSON.parse(brut) as T) : defaut;
  } catch {
    return defaut;
  }
}

function lire<T>(cle: string, defaut: T): T {
  return hydrate ? lireBrut(cle, defaut) : defaut;
}

function ecrire(cle: string, valeur: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(cle, JSON.stringify(valeur));
  notifier();
}

/** Compatibilité avec les anciennes sauvegardes (sieste unique, sans traitement). */
export function migrer(n: any): Nuit {
  const siestes = Array.isArray(n?.siestes)
    ? n.siestes
    : n?.sieste
      ? [{ ...n.sieste }]
      : [];
  return {
    ...n,
    siestes,
    reveils: Array.isArray(n?.reveils) ? n.reveils : [],
    somnolences: Array.isArray(n?.somnolences) ? n.somnolences : [],
    longReveil: typeof n?.longReveil === "number" ? n.longReveil : 0,
    traitement: typeof n?.traitement === "string" ? n.traitement : "",
    commentaire: typeof n?.commentaire === "string" ? n.commentaire : "",
  } as Nuit;
}

export function chargerNuits(): Nuit[] {
  return lire<Nuit[]>(CLE_NUITS, [])
    .map(migrer)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function enregistrerNuit(nuit: Nuit) {
  // Une seule nuit par date : toute nuit existante à la même date est remplacée.
  const nuits = lireBrut<Nuit[]>(CLE_NUITS, []).filter(
    (n) => n.id !== nuit.id && n.date !== nuit.date,
  );
  nuits.push({ ...nuit, majLe: new Date().toISOString() });
  ecrire(CLE_NUITS, nuits);
}

/** Nuit déjà enregistrée à cette date, le cas échéant. */
export function nuitParDate(date: string): Nuit | undefined {
  return chargerNuits().find((n) => n.date === date);
}

export function supprimerNuit(id: string) {
  ecrire(
    CLE_NUITS,
    lireBrut<Nuit[]>(CLE_NUITS, []).filter((n) => n.id !== id),
  );
}

export function remplacerNuits(nuits: Nuit[]) {
  ecrire(CLE_NUITS, nuits);
}

export function chargerReglages(): Reglages {
  return { ...REGLAGES_DEFAUT, ...lire<Partial<Reglages>>(CLE_REGLAGES, {}) };
}

export function enregistrerReglages(r: Reglages) {
  ecrire(CLE_REGLAGES, r);
}

function useSynchro<T>(lecture: () => T): [T, () => void] {
  const [valeur, setValeur] = useState<T>(() => lecture());
  const rafraichir = useCallback(() => setValeur(lecture()), [lecture]);
  useEffect(() => {
    hydrate = true;
    rafraichir();
    ecouteurs.add(rafraichir);
    window.addEventListener("storage", rafraichir);
    return () => {
      ecouteurs.delete(rafraichir);
      window.removeEventListener("storage", rafraichir);
    };
  }, [rafraichir]);
  return [valeur, rafraichir];
}

export function useNuits() {
  const [nuits] = useSynchro(chargerNuits);
  return nuits;
}

export function useReglages() {
  const [reglages] = useSynchro(chargerReglages);
  return reglages;
}

export function nouvelId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/* ---- Historique des traitements saisis ---- */

export function chargerTraitements(): string[] {
  return lire<string[]>(CLE_TRAITEMENTS, []);
}

export function memoriserTraitement(valeur: string) {
  const v = valeur.trim();
  if (!v) return;
  const liste = chargerTraitements().filter((t) => t.toLowerCase() !== v.toLowerCase());
  ecrire(CLE_TRAITEMENTS, [v, ...liste].slice(0, 12));
}

export function oublierTraitement(valeur: string) {
  ecrire(
    CLE_TRAITEMENTS,
    chargerTraitements().filter((t) => t !== valeur),
  );
}

export function useTraitements() {
  const [liste] = useSynchro(chargerTraitements);
  return liste;
}

/* ---- Historique des remarques saisies ---- */

export function chargerRemarques(): string[] {
  return lire<string[]>(CLE_REMARQUES, []);
}

export function memoriserRemarque(valeur: string) {
  const v = valeur.trim();
  if (!v) return;
  const liste = chargerRemarques().filter((t) => t.toLowerCase() !== v.toLowerCase());
  ecrire(CLE_REMARQUES, [v, ...liste].slice(0, 12));
}

export function oublierRemarque(valeur: string) {
  ecrire(
    CLE_REMARQUES,
    chargerRemarques().filter((t) => t !== valeur),
  );
}

export function useRemarques() {
  const [liste] = useSynchro(chargerRemarques);
  return liste;
}