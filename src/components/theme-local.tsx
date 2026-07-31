import { useEffect } from "react";
import { useReglages } from "@/lib/sleep/store";

/** Applique le thème choisi (clair, sombre ou système). */
export function ThemeLocal() {
  const reglages = useReglages();
  useEffect(() => {
    const racine = document.documentElement;
    const appliquer = () => {
      const sombre =
        reglages.theme === "sombre" ||
        (reglages.theme === "systeme" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);
      racine.classList.toggle("dark", sombre);
    };
    appliquer();
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", appliquer);
    return () => mq.removeEventListener("change", appliquer);
  }, [reglages.theme]);
  return null;
}