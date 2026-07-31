/** Exports : PDF, PNG, CSV (Excel), JSON — et import JSON. */
import type { Nuit, Reglages } from "./types";
import { mesurer } from "./grid";
import { dessinerAgenda } from "./canvas";
import { telechargerPdf } from "./pdf";
import { dateCellule } from "./time";

function telecharger(contenu: Blob, nom: string) {
  const url = URL.createObjectURL(contenu);
  const a = document.createElement("a");
  a.href = url;
  a.download = nom;
  a.click();
  URL.revokeObjectURL(url);
}

export function exporterPdf(nuits: Nuit[], reglages: Reglages) {
  telechargerPdf({ nuits, reglages }, "agenda-sommeil.pdf");
}

export function exporterPng(nuits: Nuit[]) {
  const canvas = document.createElement("canvas");
  dessinerAgenda(canvas, nuits, {
    largeur: 1200,
    hauteurLigne: 30,
    couleurBarre: "#4b5563",
    couleurTexte: "#111111",
    couleurTrait: "#888888",
  });
  canvas.toBlob((blob) => blob && telecharger(blob, "agenda-sommeil.png"));
}

export function exporterCsv(nuits: Nuit[]) {
  const entetes = [
    "Date",
    "Nuit",
    "Coucher",
    "Delai endormissement (min)",
    "Lever",
    "Duree sommeil (min)",
    "Nb reveils",
    "Temps eveille (min)",
    "Sieste debut",
    "Sieste fin",
    "Qualite sommeil",
    "Qualite reveil",
    "Forme journee",
    "Remarques",
  ];
  const lignes = nuits.map((n) => {
    const m = mesurer(n);
    return [
      n.date,
      dateCellule(n.date),
      n.heureCoucher,
      String(n.delaiEndormissement),
      n.heureLever,
      String(Math.round(m.tempsSommeil)),
      String(m.nbReveils),
      String(Math.round(m.tempsEveilNocturne)),
      n.sieste?.debut ?? "",
      n.sieste?.fin ?? "",
      n.qualiteSommeil,
      n.qualiteReveil,
      n.formeJournee,
      n.commentaire.replace(/\r?\n/g, " "),
    ];
  });
  const csv = [entetes, ...lignes]
    .map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
    .join("\r\n");
  telecharger(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }), "agenda-sommeil.csv");
}

export function exporterJson(nuits: Nuit[], reglages: Reglages) {
  const donnees = { version: 1, exporteLe: new Date().toISOString(), reglages, nuits };
  telecharger(
    new Blob([JSON.stringify(donnees, null, 2)], { type: "application/json" }),
    "journal-sommeil.json",
  );
}

export interface Sauvegarde {
  version: number;
  reglages?: Reglages;
  nuits: Nuit[];
}

export async function lireSauvegarde(fichier: File): Promise<Sauvegarde> {
  const texte = await fichier.text();
  const donnees = JSON.parse(texte) as Sauvegarde;
  if (!Array.isArray(donnees?.nuits)) throw new Error("Fichier de sauvegarde invalide");
  return donnees;
}