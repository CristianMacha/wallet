"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Clock, Users, BarChart2, PlusCircle, LogOut, Sun, Moon, MoreHorizontal, X, Landmark, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/layout/theme-provider";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Inicio", icon: Home },
  { href: "/historial", label: "Historial", icon: Clock },
  { href: "/transaction/new", label: "Nuevo", icon: PlusCircle, highlight: true },
  { href: "/miembros", label: "Miembros", icon: Users },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/session", { method: "DELETE" });
    router.push("/login");
  }

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sheet */}
      {open && (
        <div className="fixed bottom-16 left-0 right-0 z-50 max-w-lg mx-auto px-4 pb-2">
          <div className="rounded-xl border border-border bg-background shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-sm font-medium">Más opciones</span>
              <button
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <Link
              href="/prestamos"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 w-full px-4 py-3.5 text-sm text-left hover:bg-muted/50 transition-colors border-b border-border"
            >
              <Landmark className="h-4 w-4 text-muted-foreground" />
              <span>Préstamos</span>
            </Link>
            <Link
              href="/deudas"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 w-full px-4 py-3.5 text-sm text-left hover:bg-muted/50 transition-colors border-b border-border"
            >
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span>Deudas</span>
            </Link>
            <Link
              href="/reportes"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 w-full px-4 py-3.5 text-sm text-left hover:bg-muted/50 transition-colors border-b border-border"
            >
              <BarChart2 className="h-4 w-4 text-muted-foreground" />
              <span>Reportes</span>
            </Link>
            <button
              onClick={() => { toggle(); setOpen(false); }}
              className="flex items-center gap-3 w-full px-4 py-3.5 text-sm text-left hover:bg-muted/50 transition-colors border-b border-border"
            >
              {theme === "dark" ? <Sun className="h-4 w-4 text-muted-foreground" /> : <Moon className="h-4 w-4 text-muted-foreground" />}
              <span>{theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3.5 text-sm text-left text-destructive hover:bg-destructive/5 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
          {navItems.map(({ href, label, icon: Icon, highlight }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 flex-1 py-2 text-xs transition-colors",
                  highlight ? "text-primary" : isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5", highlight && "h-6 w-6")} />
                <span>{label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setOpen((v) => !v)}
            className={cn(
              "flex flex-col items-center gap-0.5 flex-1 py-2 text-xs transition-colors",
              open ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span>Más</span>
          </button>
        </div>
      </nav>
    </>
  );
}
