"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import type { ExpenseEntry, RecurringExpense } from "@/generated/prisma/client";

type BillEntry = ExpenseEntry & { recurringExpense: RecurringExpense | null };

interface BillsListProps {
  expenses: BillEntry[];
  periodId: number;
}

export function BillsList({ expenses: initial }: BillsListProps) {
  const router = useRouter();
  const [expenses, setExpenses] = useState(initial);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [filter, setFilter] = useState<"all" | "unpaid" | "paid">("all");

  const filtered = expenses.filter((e) => {
    if (filter === "paid") return e.isPaid;
    if (filter === "unpaid") return !e.isPaid;
    return true;
  });

  async function togglePaid(entry: BillEntry) {
    const next = !entry.isPaid;
    const res = await fetch(`/api/expenses/${entry.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPaid: next }),
    });
    if (res.ok) {
      const updated = await res.json();
      setExpenses((prev) => prev.map((e) => (e.id === entry.id ? { ...e, ...updated } : e)));
      router.refresh();
    }
  }

  async function saveAmount(entry: BillEntry) {
    const amount = parseFloat(editAmount);
    if (isNaN(amount)) return;
    const res = await fetch(`/api/expenses/${entry.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });
    if (res.ok) {
      const updated = await res.json();
      setExpenses((prev) => prev.map((e) => (e.id === entry.id ? { ...e, ...updated } : e)));
      setEditingId(null);
      router.refresh();
    }
  }

  const today = new Date().getDate();
  const totalAmount = expenses.reduce((s, e) => s + e.amount, 0);
  const paidAmount = expenses.filter((e) => e.isPaid).reduce((s, e) => s + e.amount, 0);
  const paidCount = expenses.filter((e) => e.isPaid).length;
  const paidPct = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;

  return (
    <div className="space-y-4">
      {expenses.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{paidCount} of {expenses.length} bills paid</span>
            <span>{formatCurrency(paidAmount)} of {formatCurrency(totalAmount)}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-500"
              style={{ width: `${paidPct}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {(["all", "unpaid", "paid"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
            className="capitalize"
          >
            {f}
          </Button>
        ))}
      </div>

      <div className="bg-card rounded-lg border divide-y">
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">No bills to show.</p>
        )}
        {filtered.map((entry) => {
          const dueDay = entry.recurringExpense?.dueDay;
          const isOverdue = !entry.isPaid && dueDay && today > dueDay;

          return (
            <div
              key={entry.id}
              className={`flex items-center gap-4 px-4 py-3 ${entry.isPaid ? "opacity-50" : ""}`}
            >
              <Checkbox
                checked={entry.isPaid}
                onCheckedChange={() => togglePaid(entry)}
                className="shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${entry.isPaid ? "line-through text-muted-foreground" : "text-foreground"}`}>
                  {entry.description}
                </p>
                {entry.paidAt && (
                  <p className="text-xs text-muted-foreground">
                    Paid {new Date(entry.paidAt).toLocaleDateString("en-CA")}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {isOverdue && <Badge variant="destructive" className="text-xs">Overdue</Badge>}
                {dueDay && !entry.isPaid && (
                  <span className="text-xs text-muted-foreground">Due {dueDay}</span>
                )}
                {editingId === entry.id ? (
                  <div className="flex items-center gap-1">
                    <Input
                      className="w-24 h-7 text-sm"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && saveAmount(entry)}
                      autoFocus
                    />
                    <Button size="sm" className="h-7 px-2 text-xs" onClick={() => saveAmount(entry)}>Save</Button>
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setEditingId(null)}>✕</Button>
                  </div>
                ) : (
                  <button
                    className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                    onClick={() => { setEditingId(entry.id); setEditAmount(String(entry.amount)); }}
                  >
                    {entry.amount === 0
                      ? <span className="text-muted-foreground italic text-xs">Set amount</span>
                      : formatCurrency(entry.amount)}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
