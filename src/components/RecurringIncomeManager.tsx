"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import type { RecurringIncome } from "@/generated/prisma/client";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const FREQ_LABELS: Record<string, string> = { monthly: "Monthly", weekly: "Weekly", biweekly: "Bi-weekly" };

function scheduleLabel(r: RecurringIncome): string {
  if (r.frequency === "monthly") return `Monthly on day ${r.dayOfMonth ?? "?"}`;
  if (r.frequency === "weekly") return `Every ${DAY_NAMES[r.dayOfWeek ?? 0]}`;
  if (r.frequency === "biweekly") return `Every other ${DAY_NAMES[r.dayOfWeek ?? 0]}`;
  return r.frequency;
}

interface Props {
  items: RecurringIncome[];
}

export function RecurringIncomeManager({ items: initial }: Props) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  // form state
  const [source, setSource] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState("biweekly");
  const [dayOfWeek, setDayOfWeek] = useState("5"); // Friday
  const [anchorDate, setAnchorDate] = useState("");
  const [dayOfMonth, setDayOfMonth] = useState("1");

  function resetForm() {
    setSource(""); setAmount(""); setFrequency("biweekly");
    setDayOfWeek("5"); setAnchorDate(""); setDayOfMonth("1");
    setAdding(false);
  }

  async function submit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const body: Record<string, unknown> = { source, amount: parseFloat(amount), frequency };
    if (frequency === "monthly") body.dayOfMonth = parseInt(dayOfMonth);
    if (frequency === "weekly") body.dayOfWeek = parseInt(dayOfWeek);
    if (frequency === "biweekly") { body.dayOfWeek = parseInt(dayOfWeek); body.anchorDate = anchorDate; }

    const res = await fetch("/api/recurring-income", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const created = await res.json();
      setItems((prev) => [...prev, created]);
      resetForm();
      router.refresh();
    }
    setSaving(false);
  }

  async function remove(id: number) {
    const res = await fetch(`/api/recurring-income/${id}`, { method: "DELETE" });
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.id !== id));
      router.refresh();
    }
  }

  return (
    <div className="space-y-3">
      {/* Existing items */}
      {items.length > 0 && (
        <div className="bg-card rounded-lg border divide-y">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{item.source}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">{scheduleLabel(item)}</span>
                  <Badge variant="outline" className="text-xs">{FREQ_LABELS[item.frequency]}</Badge>
                </div>
              </div>
              <span className="text-sm font-semibold text-green-500">{formatCurrency(item.amount)}<span className="text-muted-foreground font-normal text-xs"> /occurrence</span></span>
              <button
                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                onClick={() => remove(item.id)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      {adding ? (
        <form onSubmit={submit} className="bg-muted rounded-lg border p-4 space-y-3">
          <p className="text-sm font-medium text-foreground">New Recurring Income</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Source / Name</Label>
              <Input placeholder="e.g. Tom Paycheck" value={source} onChange={(e) => setSource(e.target.value)} className="h-8 text-sm" required />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Amount per occurrence ($)</Label>
              <Input type="number" step="0.01" min="0" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-8 text-sm" required />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Frequency</Label>
              <Select value={frequency} onValueChange={(v) => v && setFrequency(v)}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Bi-weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {frequency === "monthly" && (
              <div className="space-y-1">
                <Label className="text-xs">Day of month</Label>
                <Input type="number" min="1" max="31" value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)} className="h-8 text-sm" required />
              </div>
            )}

            {(frequency === "weekly" || frequency === "biweekly") && (
              <div className="space-y-1">
                <Label className="text-xs">Day of week</Label>
                <Select value={dayOfWeek} onValueChange={(v) => v && setDayOfWeek(v)}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DAY_NAMES.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            {frequency === "biweekly" && (
              <div className="space-y-1 col-span-2">
                <Label className="text-xs">Reference payday <span className="text-muted-foreground">(a known payday date)</span></Label>
                <Input type="date" value={anchorDate} onChange={(e) => setAnchorDate(e.target.value)} className="h-8 text-sm" required />
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={saving}>{saving ? "Adding…" : "Add"}</Button>
            <Button type="button" size="sm" variant="ghost" onClick={resetForm}>Cancel</Button>
          </div>
        </form>
      ) : (
        <Button size="sm" variant="outline" onClick={() => setAdding(true)}>+ Add Recurring Income</Button>
      )}
    </div>
  );
}
