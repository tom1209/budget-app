"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import type { ExpenseEntry, SubCategory } from "@/generated/prisma/client";

type Entry = ExpenseEntry & { subCategory: SubCategory | null };

interface SpendingListProps {
  entries: Entry[];
  subCategories: SubCategory[];
  periodId: number;
  variableCategoryId: number;
}

export function SpendingList({ entries: initial, subCategories }: SpendingListProps) {
  const router = useRouter();
  const [entries, setEntries] = useState(initial);
  const [activeFilter, setActiveFilter] = useState<number | null>(null);

  const filtered = activeFilter
    ? entries.filter((e) => e.subCategoryId === activeFilter)
    : entries;

  async function deleteEntry(id: number) {
    const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    if (res.ok) {
      setEntries((prev) => prev.filter((e) => e.id !== id));
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={activeFilter === null ? "default" : "outline"}
          onClick={() => setActiveFilter(null)}
        >
          All
        </Button>
        {subCategories.map((sc) => (
          <Button
            key={sc.id}
            size="sm"
            variant={activeFilter === sc.id ? "default" : "outline"}
            onClick={() => setActiveFilter(sc.id)}
          >
            {sc.name}
          </Button>
        ))}
      </div>

      <div className="bg-card rounded-lg border divide-y">
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">No spending logged yet.</p>
        )}
        {filtered.map((entry) => (
          <div key={entry.id} className="flex items-center gap-3 px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{entry.description ?? "—"}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground">
                  {new Date(entry.date).toLocaleDateString("en-CA")}
                </span>
                {entry.subCategory && (
                  <Badge variant="secondary" className="text-xs">{entry.subCategory.name}</Badge>
                )}
              </div>
            </div>
            <span className="text-sm font-medium text-foreground shrink-0">{formatCurrency(entry.amount)}</span>
            <button
              className="text-muted-foreground/40 hover:text-destructive transition-colors text-xs shrink-0"
              onClick={() => deleteEntry(entry.id)}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {filtered.length > 0 && (
        <div className="flex justify-end text-sm font-medium text-muted-foreground">
          Total: {formatCurrency(filtered.reduce((s, e) => s + e.amount, 0))}
        </div>
      )}
    </div>
  );
}
