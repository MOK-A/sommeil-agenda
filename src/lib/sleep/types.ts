/** Modèle de données de l'agenda de sommeil (stockage 100% local). */

/** Échelle d'appréciation du document papier. */
export type Note = "TB" | "B" | "Moy" | "M" | "TM";

export const NOTES: { value: Note; label: string }[] = [
  { value: "TB", label: "Très bonne" },
  { value: "B", label: "Bonne" },
  { value: "Moy", label: "Moyenne" },
  { value: "M", label: "Mauvaise" },
  { value: "TM", label: "Très mauvaise" },
];

/** Intervalle horaire "HH:MM" → "HH:MM". */
export interface Interval {
  id: string;
  debut: string;
  fin: string;
}

export interface Nuit {
  id: string;
  /** Date du coucher, format ISO YYYY-MM-DD. La nuit couvre 20h J → 20h J+1. */
  date: string;
  heureCoucher: string;
  /** Délai d'endormissement en minutes (0 = immédiat). */
  delaiEndormissement: number;
  reveils: Interval[];
  heureLever: string;
  sieste: Interval | null;
  /** Somnolences ressenties dans la journée (marqueurs "S"). */
  somnolences: string[];
  qualiteSommeil: Note;
  qualiteReveil: Note;
  formeJournee: Note;
  commentaire: string;
  majLe: string;
}

export interface Reglages {
  nom: string;
  prenom: string;
  dateNaissance: string;
  centre: string;
  theme: "clair" | "sombre" | "systeme";
  format24h: boolean;
  rappelSoir: string | null;
  rappelMatin: string | null;
}

export const REGLAGES_DEFAUT: Reglages = {
  nom: "",
  prenom: "",
  dateNaissance: "",
  centre: "",
  theme: "systeme",
  format24h: true,
  rappelSoir: null,
  rappelMatin: null,
};