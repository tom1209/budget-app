"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/format";
import type { IncomeEntry } from "@/generated/prisma/client";

const INCOME_SOURCES = ["Tom", "Justine", "CCB", "Bluewater", "Other"];

interface IncomeManagerProps {
  entries: IncomeEntry[];
  periodId: number;
}

export function IncomeManager({ entries: initial, periodId }: IncomeManagerProps) {
  const router = useRouter();
  const [entries, setEntries] = useState(initial);
  const [source, setSource] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function addEntry(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!source || !amount) return;
    setSaving(true);
    const res = await fetch("/api/income", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ budgetPeriodId: periodId, source, amount: parseFloat(amount), date, notes: notes || null }),
    });
    if (res.ok) {
      const entry = await res.json();
      setEntries((prev) => [entry, ...prev]);
      setAmount("");
      setNotes("");
      router.refresh();
    }
    setSaving(false);
  }

  async function deleteEntry(id: number) {
    const res = await fetch(`/api/income/${id}`, { method: "DELETE" });
    if (res.ok) {
      setEntries((prev) => prev.filter((e) => e.id !== id));
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={addEntry} className="bg-card rounded-lg border p-5 space-y-4 max-w-md">
        <h3 className="font-medium text-foreground">Log Income</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Source</Label>
            <Select value={source} onValueChange={(v) => setSource(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent>
                {INCOME_SOURCES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Amount ($)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Notes <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input placeholder="e.g. bi-weekly" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <Button type="submit" disabled={!source || !amount || saving}>
          {saving ? "Saving…" : "Add Income"}
        </Button>
      </form>

      <div className="bg-card rounded-lg border divide-y">
        {entries.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">No income logged yet.</p>
        )}
        {entries.map((entry) => (
          <div key={entry.id} className="flex items-center gap-3 px-4 py-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{entry.source}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(entry.date).toLocaleDateString("en-CA")}
                {entry.notes && ` · ${entry.notes}`}
              </p>
            </div>
            <span className="text-sm font-semibold text-green-500">{formatCurrency(entry.amount)}</span>
            <button
              className="text-muted-foreground/40 hover:text-destructive transition-colors text-xs"
              onClick={() => deleteEntry(entry.id)}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
