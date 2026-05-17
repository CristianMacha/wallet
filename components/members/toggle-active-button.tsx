"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toggleMemberActive } from "@/actions/member-actions";

interface ToggleActiveButtonProps {
  memberId: string;
  isActive: boolean;
}

export function ToggleActiveButton({ memberId, isActive: initialActive }: ToggleActiveButtonProps) {
  const [isActive, setIsActive] = useState(initialActive);
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setLoading(true);
    setConfirming(false);
    await toggleMemberActive(memberId, !isActive);
    setIsActive((prev) => !prev);
    setLoading(false);
  }

  return (
    <div className="space-y-2">
      <p className="text-sm">
        Estado actual:{" "}
        <span className={isActive ? "text-green-600 font-medium" : "text-muted-foreground font-medium"}>
          {isActive ? "Activo" : "Inactivo"}
        </span>
      </p>

      {confirming ? (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            {isActive
              ? "El miembro quedará oculto de las vistas principales. ¿Continuar?"
              : "El miembro volverá a aparecer en las vistas principales. ¿Continuar?"}
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant={isActive ? "destructive" : "default"} onClick={handleToggle} disabled={loading}>
              {loading ? "Guardando..." : "Confirmar"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setConfirming(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <Button
          size="sm"
          variant={isActive ? "outline" : "secondary"}
          onClick={handleToggle}
          disabled={loading}
        >
          {isActive ? "Desactivar miembro" : "Reactivar miembro"}
        </Button>
      )}
    </div>
  );
}
