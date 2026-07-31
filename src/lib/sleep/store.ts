/**
 * Persistance locale (aucun compte, aucun serveur).
 * Les données restent dans la mémoire de l'appareil.
 */
import { useCallback, useEffect, useState } from "react";
import type { Nuit, Reglages } from "./types";
import { REGLAGES_DEFAUT } from "./types";

const CLE_NUITS = "journal-sommeil.nuits.v1";
const CLE_REGLAGES = "journal-sommeil.reglages.v1";

type Ecouteur = () => void;
const ecouteurs = new Set<Ecouteur>();
const notifier = () => ecouteurs.forEach((e) => e());

function lire<T>(cle: string, defaut: T): T {
  if (typeof window === "undefined") return defaut;
  try {
    const brut = window.localStorage.getItem(cle);
    return brut ? (JSON.parse(brut) as T) : defaut;
  } catch {
    return defaut;
  }
}

function ecrire(cle: string, valeur: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(cle, JSON.stringify(valeur));
  notifier();
}

export function chargerNuits(): Nuit[] {
  return lire<Nuit[]>(CLE_NUITS, []).sort((a, b) => b.date.localeCompare(a.date));
}

export function enregistrerNuit(nuit: Nuit) {
  const nuits = lire<Nuit[]>(CLE_NUITS, []).filter((n) => n.id !== nuit.id);
  nuits.push({ ...nuit, majLe: new Date().toISOString() });
  ecrire(CLE_NUITS, nuits);
}

export function supprimerNuit(id: string) {
  ecrire(
    CLE_NUITS,
    lire<Nuit[]>(CLE_NUITS, []).filter((n) => n.id !== id),
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