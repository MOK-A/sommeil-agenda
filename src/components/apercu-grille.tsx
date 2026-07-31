import { useEffect, useRef, useState } from "react";
import { dessinerAgenda } from "@/lib/sleep/canvas";
import type { Nuit } from "@/lib/sleep/types";

/** Aperçu automatique de la grille (identique au rendu PDF). */
export function ApercuGrille({
  nuits,
  hauteurLigne = 30,
  avecDates = false,
}: {
  nuits: Nuit[];
  hauteurLigne?: number;
  avecDates?: boolean;
}) {
  const conteneur = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [largeur, setLargeur] = useState(0);

  useEffect(() => {
    const el = conteneur.current;
    if (!el) return;
    const observateur = new ResizeObserver(([entree]) => {
      if (entree) setLargeur(entree.contentRect.width);
    });
    observateur.observe(el);
    return () => observateur.disconnect();
  }, []);

  useEffect(() => {
    if (!canvas.current || largeur < 40) return;
    const style = getComputedStyle(document.documentElement);
    dessinerAgenda(canvas.current, nuits, {
      largeur,
      hauteurLigne,
      avecDates,
      fond: style.getPropertyValue("--card").trim() || "#fff",
      couleurTexte: style.getPropertyValue("--foreground").trim() || "#111",
      couleurTrait: style.getPropertyValue("--muted-foreground").trim() || "#888",
      couleurBarre: style.getPropertyValue("--nuit").trim() || "#4b5563",
    });
  }, [nuits, largeur, hauteurLigne, avecDates]);

  return (
    <div ref={conteneur} className="w-full">
      <canvas ref={canvas} role="img" aria-label="Aperçu de la nuit sur la grille de l'agenda" />
    </div>
  );
}