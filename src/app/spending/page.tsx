import { Suspense } from "react";
import Link from "next/link";
import { getOrCreatePeriod, formatCurrency } from "@/lib/budget";
import { prisma } from "@/lib/prisma";
import { MonthNav } from "@/components/MonthNav";
import { SpendingList } from "@/components/SpendingList";
import { Button } from "@/components/ui/button";

interface PageProps {
  searchParams: Promise<{ month?: string; year?: string; sub?: string }>;
}

export default async function SpendingPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const now = new Date();
  const month = parseInt(sp.month ?? "") || now.getMonth() + 1;
  const year = parseInt(sp.year ?? "") || now.getFullYear();

  const period = await getOrCreatePeriod(month, year);

  const [variableCat, subCategories, entries] = await Promise.all([
    prisma.category.findFirst({ where: { type: "variable" } }),
    prisma.subCategory.findMany({ orderBy: { id: "asc" } }),
    prisma.expenseEntry.findMany({
      where: { budgetPeriodId: period.id, recurringExpense: { is: null } },
      include: { subCategory: true },
      orderBy: { date: "desc" },
    }),
  ]);

  const totalSpent = entries.reduce((s, e) => s + e.amount, 0);

  const queryString = `month=${month}&year=${year}`;

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Spending</h2>
          <p className="text-sm text-muted-foreground">Total: {formatCurrency(totalSpent)}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Suspense>
            <MonthNav month={month} year={year} />
          </Suspense>
          <Link href={`/spending/new?${queryString}`}>
            <Button size="sm">+ Log Spending</Button>
          </Link>
        </div>
      </div>

      <SpendingList
        entries={entries}
        subCategories={subCategories}
        periodId={period.id}
        variableCategoryId={variableCat?.id ?? 0}
      />
    </div>
  );
}
