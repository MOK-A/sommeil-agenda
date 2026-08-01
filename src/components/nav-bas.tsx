import { Link } from "@tanstack/react-router";
import { BarChart3, Home, Settings } from "lucide-react";

const ONGLETS = [
  { to: "/", label: "Journal", icone: Home },
  { to: "/statistiques", label: "Résultats", icone: BarChart3 },
  { to: "/parametres", label: "Paramètres", icone: Settings },
] as const;

/** Navigation inférieure, cible tactile large (accessibilité). */
export function NavBas() {
  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-card/90 backdrop-blur-xl"
    >
      <ul className="mx-auto flex max-w-3xl items-stretch justify-around px-2 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {ONGLETS.map(({ to, label, icone: Icone }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-xs font-medium text-muted-foreground transition-colors"
              activeProps={{ className: "text-primary bg-secondary/70" }}
            >
              <Icone className="size-5" aria-hidden />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}