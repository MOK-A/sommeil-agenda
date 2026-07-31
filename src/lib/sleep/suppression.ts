import { toast } from "sonner";
import type { Nuit } from "./types";
import { enregistrerNuit, supprimerNuit } from "./store";

/** Supprime une nuit en proposant d'annuler pendant quelques secondes. */
export function supprimerAvecAnnulation(nuit: Nuit) {
  supprimerNuit(nuit.id);
  toast("Nuit supprimée", {
    action: {
      label: "Annuler",
      onClick: () => {
        enregistrerNuit(nuit);
        toast.success("Suppression annulée");
      },
    },
  });
}