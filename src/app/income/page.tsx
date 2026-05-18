import { Suspense } from "react";
import { getOrCreatePeriod, formatCurrency } from "@/lib/budget";
import { prisma } from "@/lib/prisma";
import { MonthNav } from "@/components/MonthNav";
import { IncomeManager } from "@/components/IncomeManager";
import { RecurringIncomeManager } from "@/components/RecurringIncomeManager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PageProps {
  searchParams: Promise<{ month?: string; year?: string }>;
}

export default async function IncomePage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const now = new Date();
  const month = parseInt(sp.month ?? "") || now.getMonth() + 1;
  const year = parseInt(sp.year ?? "") || now.getFullYear();

  const period = await getOrCreatePeriod(month, year);

  const [entries, recurringItems] = await Promise.all([
    prisma.incomeEntry.findMany({
      where: { budgetPeriodId: period.id },
      orderBy: { date: "desc" },
    }),
    prisma.recurringIncome.findMany({
      where: { isActive: true },
      orderBy: { id: "asc" },
    }),
  ]);

  const total = entries.reduce((s, e) => s + e.amount, 0);

  // Projected monthly total from recurring income (sum of all occurrences this month)
  const recurringTotal = entries
    .filter((e) => e.recurringIncomeId != null)
    .reduce((s, e) => s + e.amount, 0);

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Income</h2>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(total)} this month
            {recurringTotal > 0 && ` · ${formatCurrency(recurringTotal)} from recurring`}
          </p>
        </div>
        <Suspense>
          <MonthNav month={month} year={year} />
        </Suspense>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recurring Income</CardTitle>
        </CardHeader>
        <CardContent>
          <RecurringIncomeManager items={recurringItems} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">This Month's Income</CardTitle>
        </CardHeader>
        <CardContent>
          <IncomeManager entries={entries} periodId={period.id} />
        </CardContent>
      </Card>
    </div>
  );
}
