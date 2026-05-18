import { Suspense } from "react";
import { getOrCreatePeriod, formatCurrency, calculateForecast } from "@/lib/budget";
import { prisma } from "@/lib/prisma";
import { MonthNav } from "@/components/MonthNav";
import { BillsList } from "@/components/BillsList";
import { CashFlowForecast } from "@/components/CashFlowForecast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PageProps {
  searchParams: Promise<{ month?: string; year?: string }>;
}

export default async function BillsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const now = new Date();
  const month = parseInt(sp.month ?? "") || now.getMonth() + 1;
  const year = parseInt(sp.year ?? "") || now.getFullYear();

  const period = await getOrCreatePeriod(month, year);

  const [expenses, incomeEntries] = await Promise.all([
    prisma.expenseEntry.findMany({
      where: { budgetPeriodId: period.id, recurringExpense: { isNot: null } },
      include: { recurringExpense: true },
      orderBy: [{ isPaid: "asc" }, { id: "asc" }],
    }),
    prisma.incomeEntry.findMany({ where: { budgetPeriodId: period.id } }),
  ]);

  const totalBudgeted = expenses.reduce((s, e) => s + e.amount, 0);
  const totalPaid = expenses.filter((e) => e.isPaid).reduce((s, e) => s + e.amount, 0);

  const paidExpenses = expenses.filter((e) => e.isPaid);
  const unpaidBills = expenses.filter((e) => !e.isPaid);

  const forecast = calculateForecast({
    incomeEntries: incomeEntries.map((e) => ({ ...e, date: e.date })),
    paidExpenses,
    unpaidBills,
    today: now,
    month,
    year,
  });

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Bills</h2>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(totalPaid)} paid of {formatCurrency(totalBudgeted)}
          </p>
        </div>
        <Suspense>
          <MonthNav month={month} year={year} />
        </Suspense>
      </div>

      <BillsList expenses={expenses} periodId={period.id} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cash Flow Forecast</CardTitle>
        </CardHeader>
        <CardContent>
          <CashFlowForecast forecast={forecast} month={month} year={year} />
        </CardContent>
      </Card>
    </div>
  );
}
