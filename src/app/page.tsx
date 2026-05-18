import { Suspense } from "react";
import { getOrCreatePeriod, formatCurrency } from "@/lib/budget";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MonthNav } from "@/components/MonthNav";
import { DashboardChart } from "@/components/DashboardChart";
import { TrendingUp, ReceiptText, CheckCircle2, Wallet } from "lucide-react";
import type { ElementType } from "react";

interface PageProps {
  searchParams: Promise<{ month?: string; year?: string }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const now = new Date();
  const month = parseInt(sp.month ?? "") || now.getMonth() + 1;
  const year = parseInt(sp.year ?? "") || now.getFullYear();

  const period = await getOrCreatePeriod(month, year);

  const [expenses, income] = await Promise.all([
    prisma.expenseEntry.findMany({
      where: { budgetPeriodId: period.id },
      include: { recurringExpense: true },
      orderBy: [{ isPaid: "asc" }, { id: "asc" }],
    }),
    prisma.incomeEntry.findMany({ where: { budgetPeriodId: period.id } }),
  ]);

  const totalIncome = income.reduce((s, e) => s + e.amount, 0);
  const totalBudgeted = expenses.reduce((s, e) => s + e.amount, 0);
  const totalSpent = expenses.filter((e) => e.isPaid).reduce((s, e) => s + e.amount, 0);
  const remaining = totalIncome - totalBudgeted;

  const unpaidBills = expenses.filter(
    (e) => !e.isPaid && e.recurringExpense
  ).slice(0, 6);

  const recentSpending = expenses
    .filter((e) => !e.recurringExpense)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const chartData = [
    { name: "Paid Bills", value: totalSpent, fill: "#22c55e" },
    { name: "Unpaid Bills", value: totalBudgeted - totalSpent, fill: "#f59e0b" },
    { name: "Income Remaining", value: Math.max(remaining, 0), fill: "#6366f1" },
  ].filter((d) => d.value > 0);

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
        <Suspense>
          <MonthNav month={month} year={year} />
        </Suspense>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard
          label="Total Income"
          value={formatCurrency(totalIncome)}
          valueColor="text-foreground"
          Icon={TrendingUp}
          iconColor="text-green-600"
          iconBg="bg-green-50"
        />
        <SummaryCard
          label="Total Budgeted"
          value={formatCurrency(totalBudgeted)}
          valueColor="text-foreground"
          Icon={ReceiptText}
          iconColor="text-muted-foreground"
          iconBg="bg-zinc-100"
        />
        <SummaryCard
          label="Total Paid"
          value={formatCurrency(totalSpent)}
          valueColor="text-foreground"
          Icon={CheckCircle2}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <SummaryCard
          label="Income Remaining"
          value={formatCurrency(remaining)}
          valueColor={remaining >= 0 ? "text-green-700" : "text-red-600"}
          Icon={Wallet}
          iconColor={remaining >= 0 ? "text-green-600" : "text-red-500"}
          iconBg={remaining >= 0 ? "bg-green-50" : "bg-red-50"}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <DashboardChart data={chartData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Unpaid Bills</CardTitle>
          </CardHeader>
          <CardContent>
            {unpaidBills.length === 0 ? (
              <p className="text-sm text-muted-foreground">All bills paid! 🎉</p>
            ) : (
              <ul className="space-y-2">
                {unpaidBills.map((e) => {
                  const dueDay = e.recurringExpense?.dueDay;
                  const isOverdue = dueDay && new Date().getDate() > dueDay;
                  return (
                    <li key={e.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
                      <span className="text-foreground">{e.description}</span>
                      <div className="flex items-center gap-2">
                        {isOverdue && <Badge variant="destructive" className="text-xs">Overdue</Badge>}
                        {dueDay && <span className="text-muted-foreground text-xs">Due {dueDay}</span>}
                        <span className="font-semibold text-foreground">{formatCurrency(e.amount)}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {recentSpending.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Spending</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {recentSpending.map((e) => (
                <li key={e.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
                  <span className="text-foreground">{e.description ?? "—"}</span>
                  <span className="font-semibold text-foreground">{formatCurrency(e.amount)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  valueColor,
  Icon,
  iconColor,
  iconBg,
}: {
  label: string;
  value: string;
  valueColor: string;
  Icon: ElementType;
  iconColor: string;
  iconBg: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-5">
        <div className="flex items-start justify-between mb-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-none">{label}</p>
          <div className={`p-1.5 rounded-md ${iconBg} shrink-0`}>
            <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
          </div>
        </div>
        <p className={`text-xl font-bold ${valueColor}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
