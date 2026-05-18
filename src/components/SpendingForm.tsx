"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Category, SubCategory } from "@/generated/prisma/client";

interface SpendingFormProps {
  periodId: number;
  categories: Category[];
  subCategories: SubCategory[];
  month: number;
  year: number;
}

export function SpendingForm({ periodId, categories, subCategories, month, year }: SpendingFormProps) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [subCategoryId, setSubCategoryId] = useState<number | null>(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  const relevantSubs = subCategories.filter(
    (sc) => categoryId && sc.categoryId === categoryId
  );

  async function submit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!categoryId || !amount) return;
    setSaving(true);
    await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        budgetPeriodId: periodId,
        categoryId,
        subCategoryId: subCategoryId ?? null,
        amount: parseFloat(amount),
        description: description || null,
        date,
      }),
    });
    router.push(`/spending?month=${month}&year=${year}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="space-y-1.5">
        <Label>Amount ($)</Label>
        <Input
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          autoFocus
          className="text-lg"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Description</Label>
        <Input
          placeholder="e.g. Dinner at Earls"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Category</Label>
        <div className="grid grid-cols-2 gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => { setCategoryId(cat.id); setSubCategoryId(null); }}
              className={cn(
                "rounded-lg border px-4 py-3 text-sm font-medium text-left transition-colors",
                categoryId === cat.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-foreground hover:bg-accent"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {relevantSubs.length > 0 && (
        <div className="space-y-2">
          <Label>Sub-category <span className="text-zinc-400 font-normal">(optional)</span></Label>
          <div className="grid grid-cols-2 gap-2">
            {relevantSubs.map((sc) => (
              <button
                key={sc.id}
                type="button"
                onClick={() => setSubCategoryId(sc.id === subCategoryId ? null : sc.id)}
                className={cn(
                  "rounded-lg border px-3 py-2 text-sm text-left transition-colors",
                  subCategoryId === sc.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:bg-accent"
                )}
              >
                {sc.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <Label>Date</Label>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={!categoryId || !amount || saving} className="flex-1">
          {saving ? "Saving…" : "Save"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  );
}
