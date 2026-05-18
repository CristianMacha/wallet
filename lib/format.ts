export function formatMemberName(name: string, alias: string | null | undefined): string {
  return alias ? `${name} - ${alias}` : name;
}

export function formatPEN(amount: number): string {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatCurrency(amount: number, currency: "PEN" | "USD"): string {
  return currency === "PEN" ? formatPEN(amount) : formatUSD(amount);
}
