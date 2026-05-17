"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { saveExchangeRate } from "@/actions/exchange-rate-actions";
import { Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";

interface ExchangeRateBannerProps {
  rate: number | null;
  date: Date | null;
  isToday: boolean;
}

export function ExchangeRateBanner({ rate: initialRate, date, isToday }: ExchangeRateBannerProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [rate, setRate] = useState(initialRate);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    const num = parseFloat(value);
    if (!value || isNaN(num) || num <= 0) {
      setError("Ingresa un valor válido");
      return;
    }
    setLoading(true);
    setError(null);
    const result = await saveExchangeRate({ rate: num });
    if (result.error) {
      setError(result.error);
      toast.error(result.error);
    } else {
      setRate(num);
      setEditing(false);
      setValue("");
      toast.success("Tipo de cambio guardado");
    }
    setLoading(false);
  }

  return (
    <div className="rounded-lg border border-border bg-muted/50 px-4 py-3">
      {editing ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Tipo de cambio (S/. por $1)</p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Ej: 3.75"
              autoFocus
              className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={handleSave}
              disabled={loading}
              className="p-1.5 text-primary hover:text-primary/80 transition-colors"
              aria-label="Guardar"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={() => { setEditing(false); setValue(""); setError(null); }}
              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Cancelar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div>
            {rate ? (
              <>
                <p className="text-xs text-muted-foreground">
                  Tipo de cambio{" "}
                  {!isToday && date && (
                    <span className="italic">
                      (último: {format(date, "d MMM", { locale: es })})
                    </span>
                  )}
                </p>
                <p className="text-sm font-medium">
                  S/. {rate.toFixed(2)} por $1
                </p>
              </>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                Sin tipo de cambio registrado
              </p>
            )}
          </div>
          <button
            onClick={() => setEditing(true)}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Editar tipo de cambio"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
