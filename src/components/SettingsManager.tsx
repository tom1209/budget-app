"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import type { Category, RecurringExpense } from "@/generated/prisma/client";

type CategoryWithExpenses = Category & { recurringExpenses: RecurringExpense[] };

interface SettingsManagerProps {
  categories: CategoryWithExpenses[];
}

export function SettingsManager({ categories: initial }: SettingsManagerProps) {
  const router = useRouter();
  const [categories, setCategories] = useState(initial);
  const [activeTab, setActiveTab] = useState<"absolute" | "variable">("absolute");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editDueDay, setEditDueDay] = useState("");
  const [editFreq, setEditFreq] = useState("monthly");

  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newDueDay, setNewDueDay] = useState("");
  const [newFreq, setNewFreq] = useState("monthly");
  const [newCatId, setNewCatId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);

  const currentCategories = categories.filter((c) => c.type === activeTab);

  function startEdit(exp: RecurringExpense) {
    setEditingId(exp.id);
    setEditName(exp.name);
    setEditAmount(exp.amount != null ? String(exp.amount) : "");
    setEditDueDay(exp.dueDay != null ? String(exp.dueDay) : "");
    setEditFreq(exp.frequency);
  }

  async function saveEdit(exp: RecurringExpense) {
    const res = await fetch(`/api/recurring/${exp.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editName,
        amount: editAmount !== "" ? parseFloat(editAmount) : null,
        dueDay: editDueDay !== "" ? parseInt(editDueDay) : null,
        frequency: editFreq,
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      setCategories((prev) =>
        prev.map((c) => ({
          ...c,
          recurringExpenses: c.recurringExpenses.map((e) => (e.id === exp.id ? updated : e)),
        }))
      );
      setEditingId(null);
      router.refresh();
    }
  }

  async function removeExpense(id: number) {
    const res = await fetch(`/api/recurring/${id}`, { method: "DELETE" });
    if (res.ok) {
      setCategories((prev) =>
        prev.map((c) => ({
          ...c,
          recurringExpenses: c.recurringExpenses.filter((e) => e.id !== id),
        }))
      );
      router.refresh();
    }
  }

  async function addExpense(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const catId = newCatId ?? currentCategories[0]?.id;
    if (!newName || !catId) return;
    setAdding(true);
    const res = await fetch("/api/recurring", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName,
        categoryId: catId,
        amount: newAmount !== "" ? parseFloat(newAmount) : null,
        frequency: newFreq,
        dueDay: newDueDay !== "" ? parseInt(newDueDay) : null,
      }),
    });
    if (res.ok) {
      const created = await res.json();
      setCategories((prev) =>
        prev.map((c) =>
          c.id === catId ? { ...c, recurringExpenses: [...c.recurringExpenses, created] } : c
        )
      );
      setNewName("");
      setNewAmount("");
      setNewDueDay("");
      setNewFreq("monthly");
      router.refresh();
    }
    setAdding(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Button
          variant={activeTab === "absolute" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("absolute")}
        >
          Absolute Expenses
        </Button>
        <Button
          variant={activeTab === "variable" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("variable")}
        >
          Variable Expenses
        </Button>
      </div>

      {currentCategories.map((cat) => (
        <div key={cat.id} className="space-y-3">
          <h3 className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">{cat.name}</h3>
          <div className="bg-card rounded-lg border divide-y">
            {cat.recurringExpenses.map((exp) => (
              <div key={exp.id} className="px-4 py-3">
                {editingId === exp.id ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Name</Label>
                        <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8 text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Amount ($)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="varies"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Due Day</Label>
                        <Input
                          type="number"
                          min="1"
                          max="31"
                          placeholder="—"
                          value={editDueDay}
                          onChange={(e) => setEditDueDay(e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Frequency</Label>
                        <Select value={editFreq} onValueChange={(v) => setEditFreq(v ?? "monthly")}>
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="biweekly">Bi-weekly</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="annual">Annual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="h-7 text-xs" onClick={() => saveEdit(exp)}>Save</Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingId(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{exp.name}</p>
                      <div className="flex gap-2 mt-0.5">
                        {exp.dueDay && <span className="text-xs text-muted-foreground">Due {exp.dueDay}</span>}
                        <Badge variant="outline" className="text-xs">{exp.frequency}</Badge>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {exp.amount != null ? formatCurrency(exp.amount) : <span className="italic text-xs">varies</span>}
                    </span>
                    <button className="text-xs text-muted-foreground hover:text-foreground transition-colors" onClick={() => startEdit(exp)}>Edit</button>
                    <button className="text-xs text-muted-foreground/40 hover:text-destructive transition-colors" onClick={() => removeExpense(exp.id)}>✕</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="bg-muted rounded-lg border p-4 space-y-3">
        <h3 className="font-medium text-foreground text-sm">Add Recurring Expense</h3>
        <form onSubmit={addExpense} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Name</Label>
              <Input
                placeholder="e.g. Credit Card #2"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="h-8 text-sm"
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Category</Label>
              <Select
                value={newCatId ? String(newCatId) : (currentCategories[0] ? String(currentCategories[0].id) : "")}
                onValueChange={(v) => setNewCatId(Number(v))}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currentCategories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Amount ($)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="leave blank if varies"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Due Day</Label>
              <Input
                type="number"
                min="1"
                max="31"
                placeholder="day of month"
                value={newDueDay}
                onChange={(e) => setNewDueDay(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
          </div>
          <Button type="submit" size="sm" disabled={!newName || adding}>
            {adding ? "Adding…" : "Add"}
          </Button>
        </form>
      </div>
    </div>
  );
}
