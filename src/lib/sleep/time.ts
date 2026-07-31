/** Utilitaires horaires : tout est manipulé en minutes depuis minuit. */

export function toMinutes(hhmm: string): number {
  const parts = hhmm.split(":").map(Number);
  return (parts[0] || 0) * 60 + (parts[1] || 0);
}

export function fromMinutes(min: number): string {
  const total = ((min % 1440) + 1440) % 1440;
  const h = Math.floor(total / 60);
  const m = Math.round(total % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Minutes écoulées depuis 20h00 (origine de la grille de l'agenda). */
export const ORIGINE = 20 * 60;

export function depuisOrigine(hhmm: string): number {
  return (toMinutes(hhmm) - ORIGINE + 1440) % 1440;
}

export function dureeHumaine(min: number): string {
  if (!isFinite(min) || min <= 0) return "0 h";
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return m ? `${h} h ${String(m).padStart(2, "0")}` : `${h} h`;
}

export function formatHeure(hhmm: string, format24h = true): string {
  if (!format24h) {
    const min = toMinutes(hhmm);
    const h = Math.floor(min / 60);
    const suffixe = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${String(min % 60).padStart(2, "0")} ${suffixe}`;
  }
  return hhmm.replace(":", "h");
}

const MOIS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

export function dateISO(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function parseISO(iso: string): Date {
  const parts = iso.split("-").map(Number);
  return new Date(parts[0] ?? 1970, (parts[1] ?? 1) - 1, parts[2] ?? 1);
}

export function ajouterJours(iso: string, n: number): string {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return dateISO(d);
}

/** "5 juin" */
export function dateCourte(iso: string): string {
  const d = parseISO(iso);
  return `${d.getDate()} ${MOIS[d.getMonth()]}`;
}

/** "Nuit du 5 au 6 juin" */
export function libelleNuit(iso: string): string {
  return `Nuit du ${dateCourte(iso)} au ${dateCourte(ajouterJours(iso, 1))}`;
}

/** "05/06 - 06/06" pour la colonne DATE du PDF. */
export function dateCellule(iso: string): string {
  const a = parseISO(iso);
  const b = parseISO(ajouterJours(iso, 1));
  const jj = (d: Date) => `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
  return `${jj(a)} - ${jj(b)}`;
}