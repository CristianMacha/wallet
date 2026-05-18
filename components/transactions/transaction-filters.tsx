"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useTransition, useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";

interface Member {
  id: string;
  name: string;
  alias: string | null;
}

interface TransactionFiltersProps {
  members?: Member[];
  showMemberFilter?: boolean;
}

export function TransactionFilters({ members = [], showMemberFilter = true }: TransactionFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(searchParams.get("q") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleSearch(value: string) {
    setSearchValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      startTransition(() => updateParam("q", value));
    }, 400);
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  return (
    <div className="space-y-2">
      {/* Búsqueda por descripción */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="search"
          placeholder="Buscar por descripción..."
          value={searchValue}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {/* Tipo */}
        <select
          value={searchParams.get("type") ?? ""}
          onChange={(e) => updateParam("type", e.target.value)}
          className="shrink-0 rounded-full border border-input bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Todos los tipos</option>
          <option value="DEPOSIT">Depósitos</option>
          <option value="EXPENSE">Gastos</option>
        </select>

        {/* Moneda */}
        <select
          value={searchParams.get("currency") ?? ""}
          onChange={(e) => updateParam("currency", e.target.value)}
          className="shrink-0 rounded-full border border-input bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Todas las monedas</option>
          <option value="PEN">Soles (S/.)</option>
          <option value="USD">Dólares ($)</option>
        </select>

        {/* Miembro */}
        {showMemberFilter && members.length > 0 && (
          <select
            value={searchParams.get("memberId") ?? ""}
            onChange={(e) => updateParam("memberId", e.target.value)}
            className="shrink-0 rounded-full border border-input bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Todos</option>
            <option value="_self">Mi cuenta</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.alias ? `${m.name} - ${m.alias}` : m.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Rango de fechas */}
      <div className="flex gap-2">
        <div className="flex-1">
          <input
            type="date"
            value={searchParams.get("from") ?? ""}
            onChange={(e) => updateParam("from", e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Desde"
          />
        </div>
        <div className="flex-1">
          <input
            type="date"
            value={searchParams.get("to") ?? ""}
            onChange={(e) => updateParam("to", e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Hasta"
          />
        </div>
      </div>
    </div>
  );
}
