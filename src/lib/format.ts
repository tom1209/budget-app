export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(amount);
}

export function monthName(month: number): string {
  return new Date(2000, month - 1, 1).toLocaleString("default", { month: "long" });
}
