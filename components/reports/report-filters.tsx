"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface Member {
  id: string;
  name: string;
  alias: string | null;
}

interface ReportFiltersProps {
  members: Member[];
  showSelf?: boolean;
}

export function ReportFilters({ members, showSelf = true }: ReportFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <select
      value={searchParams.get("memberId") ?? ""}
      onChange={(e) => update("memberId", e.target.value)}
      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
    >
      <option value="">Todos</option>
      {showSelf && <option value="_self">Mi cuenta</option>}
      {members.map((m) => (
        <option key={m.id} value={m.id}>
          {m.alias || m.name}
        </option>
      ))}
    </select>
  );
}
