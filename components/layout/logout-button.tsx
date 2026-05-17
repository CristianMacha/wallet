"use client";

import { LogOut } from "lucide-react";

export function LogoutButton() {
  async function handleLogout() {
    await fetch("/api/session", { method: "DELETE" });
    window.location.href = "/login";
  }

  return (
    <button
      onClick={handleLogout}
      className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
      aria-label="Cerrar sesión"
    >
      <LogOut className="h-4 w-4" />
    </button>
  );
}
