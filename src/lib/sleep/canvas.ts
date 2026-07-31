/**
 * Rendu canvas de la grille (aperçu à l'écran et export PNG).
 * Utilise le même moteur que le PDF : l'utilisateur ne dessine rien.
 */
import type { Nuit } from "./types";
import { calculerRendu, COLONNES, LARGEUR } from "./grid";
import { dateCellule } from "./time";

export interface OptionsCanvas {
  largeur: number;
  hauteurLigne?: number;
  couleurTexte?: string;
  couleurTrait?: string;
  couleurBarre?: string;
  fond?: string;
  avecDates?: boolean;
}

export function dessinerAgenda(
  canvas: HTMLCanvasElement,
  nuits: Nuit[],
  options: OptionsCanvas,
) {
  const {
    largeur,
    hauteurLigne = 26,
    couleurTexte = "#1c1c22",
    couleurTrait = "#9aa0ac",
    couleurBarre = "#5b6cff",
    fond = "#ffffff",
    avecDates = true,
  } = options;

  const dpr = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
  const margeGauche = avecDates ? 74 : 8;
  const margeDroite = 8;
  const hauteurEntete = 22;
  const hauteur = hauteurEntete + nuits.length * hauteurLigne + 6;

  canvas.width = largeur * dpr;
  canvas.height = hauteur * dpr;
  canvas.style.width = `${largeur}px`;
  canvas.style.height = `${hauteur}px`;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.scale(dpr, dpr);
  ctx.fillStyle = fond;
  ctx.fillRect(0, 0, largeur, hauteur);

  const x0 = margeGauche;
  const lGrille = largeur - margeGauche - margeDroite;
  const posX = (min: number) => x0 + (min / LARGEUR) * lGrille;

  // Graduations
  ctx.font = "10px ui-sans-serif, system-ui, sans-serif";
  ctx.fillStyle = couleurTexte;
  ctx.textAlign = "center";
  for (let h = 0; h <= 24; h += 2) {
    const x = x0 + (h / 24) * lGrille;
    ctx.globalAlpha = 0.6;
    ctx.fillText(String((20 + h) % 24), Math.min(largeur - 8, Math.max(10, x)), 12);
    ctx.globalAlpha = 1;
  }

  nuits.forEach((nuit, i) => {
    const y = hauteurEntete + i * hauteurLigne;
    const h = hauteurLigne - 4;

    // Colonnes demi-heures
    ctx.strokeStyle = couleurTrait;
    for (let c = 0; c <= COLONNES; c++) {
      const x = x0 + (c * lGrille) / COLONNES;
      ctx.globalAlpha = c % 2 === 0 ? 0.35 : 0.15;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + h);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.35;
    ctx.strokeRect(x0, y, lGrille, h);
    ctx.globalAlpha = 1;

    const rendu = calculerRendu(nuit);
    for (const barre of rendu.barres) {
      const x = posX(barre.debut);
      const l = Math.max(1, posX(barre.fin) - x);
      if (barre.type === "demi") {
        // Hachures zébrées en diagonale (1/2 réveil)
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y + 3, l, h - 6);
        ctx.clip();
        ctx.strokeStyle = couleurBarre;
        ctx.lineWidth = 1.5;
        for (let d = -h; d < l + h; d += 5) {
          ctx.beginPath();
          ctx.moveTo(x + d, y + h - 3);
          ctx.lineTo(x + d + h, y + 3);
          ctx.stroke();
        }
        ctx.restore();
        continue;
      }
      ctx.fillStyle = couleurBarre;
      ctx.globalAlpha = barre.type === "sieste" ? 0.55 : 1;
      ctx.fillRect(x, y + 3, l, h - 6);
      ctx.globalAlpha = 1;
    }

    ctx.strokeStyle = couleurTexte;
    ctx.fillStyle = couleurTexte;
    const fleche = (x: number, versLeBas: boolean) => {
      ctx.beginPath();
      ctx.moveTo(x, y + 1);
      ctx.lineTo(x, y + h - 1);
      ctx.stroke();
      ctx.beginPath();
      const pointe = versLeBas ? y + h - 1 : y + 1;
      const base = versLeBas ? y + h - 5 : y + 5;
      ctx.moveTo(x - 3, base);
      ctx.lineTo(x + 3, base);
      ctx.lineTo(x, pointe);
      ctx.fill();
    };
    if (rendu.coucher !== null) fleche(posX(rendu.coucher), true);
    if (rendu.lever !== null) fleche(posX(rendu.lever), false);

    ctx.font = "bold 10px ui-sans-serif, system-ui, sans-serif";
    for (const s of rendu.somnolences) {
      ctx.fillStyle = fond;
      ctx.fillRect(posX(s) - 4, y + 3, 8, h - 6);
      ctx.fillStyle = couleurTexte;
      ctx.fillText("S", posX(s), y + h - 6);
    }

    if (avecDates) {
      ctx.textAlign = "left";
      ctx.font = "10px ui-sans-serif, system-ui, sans-serif";
      ctx.fillStyle = couleurTexte;
      ctx.fillText(dateCellule(nuit.date), 4, y + h - 6);
      ctx.textAlign = "center";
    }
  });
}