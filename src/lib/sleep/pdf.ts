/**
 * Moteur d'export PDF : reproduit fidèlement l'agenda de vigilance et de
 * sommeil (A4 paysage, grille 20h → 20h en demi-heures).
 * Aucun tracé manuel : tout est déduit des données saisies.
 */
import { jsPDF } from "jspdf";
import type { Nuit, Reglages } from "./types";
import { calculerRendu, COLONNES, LARGEUR } from "./grid";
import { dateCellule } from "./time";

const MARGE = 8;
const LARGEUR_PAGE = 297;
const HAUTEUR_PAGE = 210;
const L_DATE = 34;
const L_NOTE = 13;
const L_GRILLE = 130;
const H_ENTETE_1 = 9;
const H_ENTETE_2 = 17;
const H_LIGNE = 6.8;
const LIGNES_PAR_PAGE = 20;

const X0 = MARGE;
const L_TOTALE = LARGEUR_PAGE - 2 * MARGE;
const X_GRILLE = X0 + L_DATE;
const X_NOTES = X_GRILLE + L_GRILLE;
const X_REMARQUES = X_NOTES + 3 * L_NOTE;
const L_REMARQUES = X0 + L_TOTALE - X_REMARQUES;
const PAS = L_GRILLE / COLONNES;

const posX = (minutes: number) => X_GRILLE + (minutes / LARGEUR) * L_GRILLE;

function fleche(doc: jsPDF, x: number, y: number, h: number, versLeBas: boolean) {
  const haut = y + 1.2;
  const bas = y + h - 1.2;
  doc.setLineWidth(0.5);
  doc.line(x, haut, x, bas);
  const pointe = versLeBas ? bas : haut;
  const base = versLeBas ? bas - 1.6 : haut + 1.6;
  doc.setFillColor(0, 0, 0);
  doc.triangle(x - 1, base, x + 1, base, x, pointe, "F");
  doc.setLineWidth(0.2);
}

function entete(doc: jsPDF, reglages: Reglages, yTop: number) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("AGENDA DE VIGILANCE ET DE SOMMEIL", LARGEUR_PAGE / 2, yTop - 3, { align: "center" });

  const identite = [reglages.prenom, reglages.nom].filter(Boolean).join(" ");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  if (identite) doc.text(identite, X0, yTop - 3);
  if (reglages.centre) doc.text(reglages.centre, LARGEUR_PAGE - MARGE, yTop - 3, { align: "right" });

  // Bandeau 1
  doc.setLineWidth(0.4);
  doc.rect(X0, yTop, L_DATE, H_ENTETE_1);
  doc.rect(X_GRILLE, yTop, L_GRILLE, H_ENTETE_1);
  doc.rect(X_NOTES, yTop, 3 * L_NOTE, H_ENTETE_1);
  doc.rect(X_REMARQUES, yTop, L_REMARQUES, H_ENTETE_1);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("DATE", X0 + L_DATE / 2, yTop + 5.8, { align: "center" });
  doc.text("HEURES", X_GRILLE + L_GRILLE / 2, yTop + 5.8, { align: "center" });
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.text("Appréciation par :", X_NOTES + (3 * L_NOTE) / 2, yTop + 3.6, { align: "center" });
  doc.text("TB - B - Moy. - M - TM", X_NOTES + (3 * L_NOTE) / 2, yTop + 7.2, { align: "center" });

  // Bandeau 2
  const y2 = yTop + H_ENTETE_1;
  doc.rect(X0, y2, L_DATE, H_ENTETE_2);
  doc.rect(X_GRILLE, y2, L_GRILLE, H_ENTETE_2);
  doc.rect(X_REMARQUES, y2, L_REMARQUES, H_ENTETE_2);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("Nuit du ... au...", X0 + 2, y2 + H_ENTETE_2 / 2 + 1);
  doc.setFontSize(8);
  doc.text("TRAITEMENT ET REMARQUES", X_REMARQUES + L_REMARQUES / 2, y2 + 7, { align: "center" });
  doc.text("PARTICULIERES", X_REMARQUES + L_REMARQUES / 2, y2 + 11.5, { align: "center" });

  const titresNotes = ["QUALITE DU SOMMEIL", "QUALITE DU REVEIL", "FORME DE LA JOURNEE"];
  titresNotes.forEach((titre, i) => {
    const x = X_NOTES + i * L_NOTE;
    doc.rect(x, y2, L_NOTE, H_ENTETE_2);
    doc.setFontSize(6.2);
    const [l1, ...reste] = titre.split(" ");
    doc.text(`${l1} ${reste.slice(0, 1).join("")}`.trim(), x + L_NOTE / 2 - 1.6, y2 + H_ENTETE_2 - 1.5, {
      align: "left",
      angle: 90,
    });
    doc.text(reste.slice(1).join(" "), x + L_NOTE / 2 + 1.8, y2 + H_ENTETE_2 - 1.5, {
      align: "left",
      angle: 90,
    });
  });

  // Graduations horaires 20h → 20h
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setLineWidth(0.15);
  for (let h = 0; h <= 24; h++) {
    const x = X_GRILLE + (h / 24) * L_GRILLE;
    const heure = (20 + h) % 24;
    const yTexte = h % 2 === 0 ? y2 + 4 : y2 + 7.5;
    const align = h === 0 ? "left" : h === 24 ? "right" : "center";
    const dx = h === 0 ? 0.5 : h === 24 ? -0.5 : 0;
    doc.text(String(heure), x + dx, yTexte, { align });
    doc.line(x, y2 + H_ENTETE_2 - 5, x, y2 + H_ENTETE_2);
  }
  return y2 + H_ENTETE_2;
}

function legende(doc: jsPDF, y: number) {
  doc.setLineWidth(0.2);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  fleche(doc, X0 + 14, y - 1, 5, true);
  doc.text("heure de mise au lit", X0 + 20, y + 2.5);
  doc.setFillColor(150, 150, 150);
  doc.rect(X0 + 8, y + 5, 14, 3.4, "F");
  doc.text("sommeil ou sieste", X0 + 26, y + 8);
  fleche(doc, X0 + 14, y + 9.5, 5, false);
  doc.text("heure du lever", X0 + 20, y + 13.5);
  doc.setFont("helvetica", "bold");
  doc.text("S", X0 + 150, y + 2.5);
  doc.setFont("helvetica", "normal");
  doc.text("Somnolence dans la journée", X0 + 155, y + 2.5);
  doc.text("Zone blanche entre deux barres : réveil nocturne", X0 + 150, y + 8);
}

export interface OptionsPdf {
  nuits: Nuit[];
  reglages: Reglages;
  exemple?: boolean;
}

export function construirePdf({ nuits, reglages }: OptionsPdf): jsPDF {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const triees = nuits.slice().sort((a, b) => a.date.localeCompare(b.date));
  const pages = Math.max(1, Math.ceil(triees.length / LIGNES_PAR_PAGE));

  for (let p = 0; p < pages; p++) {
    if (p > 0) doc.addPage();
    const yTop = 18;
    let y = entete(doc, reglages, yTop);

    const lot = triees.slice(p * LIGNES_PAR_PAGE, (p + 1) * LIGNES_PAR_PAGE);
    for (let i = 0; i < LIGNES_PAR_PAGE; i++) {
      const nuit = lot[i];
      dessinerLigne(doc, y, nuit);
      y += H_LIGNE;
    }

    // Cadre extérieur
    doc.setLineWidth(0.5);
    doc.rect(X0, yTop, L_TOTALE, y - yTop);
    doc.setLineWidth(0.2);

    legende(doc, y + 6);
    doc.setFontSize(6.5);
    doc.text(`Page ${p + 1} / ${pages}`, LARGEUR_PAGE - MARGE, HAUTEUR_PAGE - 5, { align: "right" });
  }
  return doc;
}

function dessinerLigne(doc: jsPDF, y: number, nuit?: Nuit) {
  doc.setLineWidth(0.2);
  doc.setDrawColor(0, 0, 0);
  doc.rect(X0, y, L_DATE, H_LIGNE);
  doc.rect(X_GRILLE, y, L_GRILLE, H_LIGNE);
  for (let i = 0; i < 3; i++) doc.rect(X_NOTES + i * L_NOTE, y, L_NOTE, H_LIGNE);
  doc.rect(X_REMARQUES, y, L_REMARQUES, H_LIGNE);

  // Colonnes demi-heures
  doc.setDrawColor(120, 120, 120);
  for (let c = 1; c < COLONNES; c++) {
    const x = X_GRILLE + c * PAS;
    doc.setLineWidth(c % 2 === 0 ? 0.15 : 0.05);
    doc.line(x, y, x, y + H_LIGNE);
  }
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.2);
  if (!nuit) return;

  const rendu = calculerRendu(nuit);
  for (const barre of rendu.barres) {
    const x = posX(barre.debut);
    const largeur = posX(barre.fin) - x;
    if (largeur <= 0) continue;
    if (barre.type === "demi") {
      // 1/2 réveil : hachures diagonales
      const h = H_LIGNE - 2;
      doc.setDrawColor(120, 120, 120);
      doc.setLineWidth(0.3);
      for (let d = 0; d < largeur + h; d += 1.2) {
        const x1 = x + d;
        const x2 = x + d - h;
        const cx1 = Math.min(x + largeur, Math.max(x, x1));
        const cx2 = Math.min(x + largeur, Math.max(x, x2));
        const y1 = y + 1 + h - (cx1 - (x + d - h));
        const y2 = y + 1 + h - (cx2 - (x + d - h));
        doc.line(cx1, Math.min(y + 1 + h, Math.max(y + 1, y1)), cx2, Math.min(y + 1 + h, Math.max(y + 1, y2)));
      }
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.2);
      continue;
    }
    doc.setFillColor(155, 155, 155);
    doc.rect(x, y + 1, largeur, H_LIGNE - 2, "F");
  }
  if (rendu.coucher !== null) fleche(doc, posX(rendu.coucher), y, H_LIGNE, true);
  if (rendu.lever !== null) fleche(doc, posX(rendu.lever), y, H_LIGNE, false);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  for (const s of rendu.somnolences) {
    const x = posX(s);
    doc.setFillColor(255, 255, 255);
    doc.rect(x - 1.4, y + 1, 2.8, H_LIGNE - 2, "F");
    doc.text("S", x, y + H_LIGNE - 2, { align: "center" });
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(dateCellule(nuit.date), X0 + 2, y + H_LIGNE - 2.2);
  const notes = [nuit.qualiteSommeil, nuit.qualiteReveil, nuit.formeJournee];
  notes.forEach((n, i) =>
    doc.text(n, X_NOTES + i * L_NOTE + L_NOTE / 2, y + H_LIGNE - 2.2, { align: "center" }),
  );
  const remarques = [nuit.traitement, nuit.commentaire].filter((v) => v && v.trim()).join(" / ");
  if (remarques) {
    doc.setFontSize(6.5);
    const texte = doc.splitTextToSize(remarques, L_REMARQUES - 3)[0] ?? "";
    doc.text(texte, X_REMARQUES + 1.5, y + H_LIGNE - 2.2);
  }
}

export function telechargerPdf(options: OptionsPdf, nomFichier = "agenda-sommeil.pdf") {
  construirePdf(options).save(nomFichier);
}