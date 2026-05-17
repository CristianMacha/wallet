"use client";

import { useRouter, usePathname } from "next/navigation";
import { format, subMonths, addMonths } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MonthPickerProps {
  value: string;
}

export function MonthPicker({ value }: MonthPickerProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [year, month] = value.split("-").map(Number);
  const currentDate = new Date(year, month - 1, 1);
  const today = new Date();
  const isCurrentMonth =
    currentDate.getFullYear() === today.getFullYear() &&
    currentDate.getMonth() === today.getMonth();

  function navigate(date: Date) {
    router.push(`${pathname}?month=${format(date, "yyyy-MM")}`);
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-2">
      <button
        onClick={() => navigate(subMonths(currentDate, 1))}
        className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Mes anterior"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <p className="text-sm font-medium capitalize">
        {format(currentDate, "MMMM yyyy", { locale: es })}
      </p>

      <button
        onClick={() => navigate(addMonths(currentDate, 1))}
        disabled={isCurrentMonth}
        className="p-1.5 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Mes siguiente"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
