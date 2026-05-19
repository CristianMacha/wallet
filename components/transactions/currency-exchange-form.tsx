"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { createCurrencyExchange } from "@/actions/transaction-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";

interface Member {
  id: string;
  name: string;
  alias: string | null;
}

type Direction = "USD_TO_PEN" | "PEN_TO_USD";

interface CurrencyExchangeFormProps {
  members: Member[];
  onMemberChange?: (memberId: string) => void;
}

export function CurrencyExchangeForm({ members, onMemberChange }: CurrencyExchangeFormProps) {
  const router = useRouter();
  const today = format(new Date(), "yyyy-MM-dd");

  const [memberId, setMemberId] = useState("");
  const [direction, setDirection] = useState<Direction>("USD_TO_PEN");
  const [usdAmount, setUsdAmount] = useState("");
  const [penAmount, setPenAmount] = useState("");
  const [date, setDate] = useState(today);
  const [loading, setLoading] = useState(false);

  const isUsdToPen = direction === "USD_TO_PEN";

  const implicitRate = (() => {
    const usd = parseFloat(usdAmount);
    const pen = parseFloat(penAmount);
    if (!usd || !pen || usd <= 0 || pen <= 0) return null;
    const rate = isUsdToPen ? pen / usd : usd / pen;
    return rate.toFixed(4);
  })();

  function toggleDirection() {
    setDirection((d) => d === "USD_TO_PEN" ? "PEN_TO_USD" : "USD_TO_PEN");
    setUsdAmount("");
    setPenAmount("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const result = await createCurrencyExchange({
      memberId,
      usdAmount: parseFloat(usdAmount),
      penAmount: parseFloat(penAmount),
      date,
      direction,
    });

    if (result.error) {
      toast.error(result.error);
    } else {
      const memberName = memberId === "_self"
        ? "mi cuenta"
        : (members.find((m) => m.id === memberId)?.alias ||
           members.find((m) => m.id === memberId)?.name || "");
      toast.success(`Cambio registrado para ${memberName}`);
      setUsdAmount("");
      setPenAmount("");
      router.refresh();
    }
    setLoading(false);
  }

  const fromLabel = isUsdToPen ? "Dólares entregados" : "Soles entregados";
  const fromPrefix = isUsdToPen ? "$" : "S/.";
  const fromValue = isUsdToPen ? usdAmount : penAmount;
  const fromSet = isUsdToPen ? setUsdAmount : setPenAmount;

  const toLabel = isUsdToPen ? "Soles recibidos" : "Dólares recibidos";
  const toPrefix = isUsdToPen ? "S/." : "$";
  const toValue = isUsdToPen ? penAmount : usdAmount;
  const toSet = isUsdToPen ? setPenAmount : setUsdAmount;

  return (
    <form onSubmit={handleSubmit} className="space-y-5 px-4 py-6">
      {/* Miembro */}
      <div className="space-y-1.5">
        <Label htmlFor="ex-member">
          Miembro <span className="text-destructive">*</span>
        </Label>
        <select
          id="ex-member"
          value={memberId}
          onChange={(e) => {
            setMemberId(e.target.value);
            onMemberChange?.(e.target.value);
          }}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Selecciona una cuenta</option>
          <option value="_self">Mi cuenta personal</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.alias ? `${m.name} - ${m.alias}` : m.name}
            </option>
          ))}
        </select>
      </div>

      {/* Monto entregado */}
      <div className="space-y-1.5">
        <Label htmlFor="from-amount">
          {fromLabel} <span className="text-destructive">*</span>
        </Label>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground w-7 shrink-0">{fromPrefix}</span>
          <Input
            id="from-amount"
            type="number"
            step="0.01"
            min="0.01"
            value={fromValue}
            onChange={(e) => fromSet(e.target.value)}
            placeholder="0.00"
            className="flex-1"
          />
        </div>
      </div>

      {/* Toggle dirección + TC implícito */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <button
            type="button"
            onClick={toggleDirection}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors border border-border rounded-full px-3 py-1"
          >
            <ArrowLeftRight className="h-3.5 w-3.5" />
            {isUsdToPen ? "$ → S/." : "S/. → $"}
          </button>
          <div className="flex-1 h-px bg-border" />
        </div>
        {implicitRate && (
          <p className="text-center text-xs text-muted-foreground">
            TC implícito:{" "}
            <span className="font-medium text-foreground">
              {isUsdToPen ? `S/. ${implicitRate} por $1` : `$1 por S/. ${implicitRate}`}
            </span>
          </p>
        )}
      </div>

      {/* Monto recibido */}
      <div className="space-y-1.5">
        <Label htmlFor="to-amount">
          {toLabel} <span className="text-destructive">*</span>
        </Label>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground w-7 shrink-0">{toPrefix}</span>
          <Input
            id="to-amount"
            type="number"
            step="0.01"
            min="0.01"
            value={toValue}
            onChange={(e) => toSet(e.target.value)}
            placeholder="0.00"
            className="flex-1"
          />
        </div>
      </div>

      {/* Fecha */}
      <div className="space-y-1.5">
        <Label htmlFor="ex-date">
          Fecha <span className="text-destructive">*</span>
        </Label>
        <Input
          id="ex-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Registrando..." : "Registrar cambio"}
      </Button>

      <button
        type="button"
        onClick={() => router.push("/dashboard")}
        className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
      >
        Ir al dashboard
      </button>
    </form>
  );
}
