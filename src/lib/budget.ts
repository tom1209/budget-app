import { prisma } from "@/lib/prisma";
import type { BudgetPeriod, RecurringIncome } from "@/generated/prisma/client";

export type { BudgetPeriod };
export { formatCurrency, monthName } from "@/lib/format";

// ---------------------------------------------------------------------------
// Month occurrence calculation for recurring income
// ---------------------------------------------------------------------------

export function getMonthOccurrences(
  ri: Pick<RecurringIncome, "frequency" | "dayOfWeek" | "anchorDate" | "dayOfMonth">,
  month: number,
  year: number
): Date[] {
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0);

  if (ri.frequency === "monthly") {
    if (!ri.dayOfMonth) return [];
    const day = Math.min(ri.dayOfMonth, monthEnd.getDate());
    return [new Date(year, month - 1, day)];
  }

  if (ri.frequency === "weekly") {
    if (ri.dayOfWeek == null) return [];
    const dates: Date[] = [];
    const offset = (ri.dayOfWeek - monthStart.getDay() + 7) % 7;
    for (let d = 1 + offset; d <= monthEnd.getDate(); d += 7) {
      dates.push(new Date(year, month - 1, d));
    }
    return dates;
  }

  if (ri.frequency === "biweekly") {
    if (ri.dayOfWeek == null || !ri.anchorDate) return [];
    // Parse anchor as local date (noon to sidestep DST)
    const [ay, am, ad] = ri.anchorDate.split("-").map(Number);
    const anchor = new Date(ay, am - 1, ad, 12, 0, 0);
    const MS = 86_400_000;
    const anchorMs = anchor.getTime();
    const startMs = monthStart.getTime();
    const endMs = monthEnd.getTime();

    const daysSinceAnchor = Math.round((startMs - anchorMs) / MS);
    const rem = ((daysSinceAnchor % 14) + 14) % 14;
    let cur = startMs + (rem === 0 ? 0 : 14 - rem) * MS;

    const dates: Date[] = [];
    while (cur <= endMs) {
      dates.push(new Date(cur));
      cur += 14 * MS;
    }
    return dates;
  }

  return [];
}

// ---------------------------------------------------------------------------
// Cash-flow forecast
// ---------------------------------------------------------------------------

export type ForecastEvent = {
  type: "income" | "bill";
  day: number;
  label: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  isCovered?: boolean;
};

export type ForecastResult = {
  currentBalance: number;
  events: ForecastEvent[];
};

export function calculateForecast({
  incomeEntries,
  paidExpenses,
  unpaidBills,
  today,
  month,
  year,
}: {
  incomeEntries: Array<{ source: string; amount: number; date: Date | string }>;
  paidExpenses: Array<{ amount: number }>;
  unpaidBills: Array<{
    description: string | null;
    amount: number;
    recurringExpense: { dueDay: number | null } | null;
  }>;
  today: Date;
  month: number;
  year: number;
}): ForecastResult {
  const todayDay = today.getDate();
  const isCurrentPeriod =
    month === today.getMonth() + 1 && year === today.getFullYear();

  const toDay = (d: Date | string) => new Date(d).getDate();

  // Income already in hand: everything on or before today (or all, for past periods)
  const receivedIncome = incomeEntries
    .filter((e) => !isCurrentPeriod || toDay(e.date) <= todayDay)
    .reduce((s, e) => s + e.amount, 0);

  const paidAmount = paidExpenses.reduce((s, e) => s + e.amount, 0);
  let balance = receivedIncome - paidAmount;
  const currentBalance = balance;

  // Future income entries (date > today, current period only)
  const futureIncome = (
    isCurrentPeriod
      ? incomeEntries.filter((e) => toDay(e.date) > todayDay)
      : []
  ).sort((a, b) => toDay(a.date) - toDay(b.date));

  // Sort bills by dueDay (bills without a dueDay go to end of month)
  const daysInMonth = new Date(year, month, 0).getDate();
  const sortedBills = [...unpaidBills].sort(
    (a, b) =>
      (a.recurringExpense?.dueDay ?? daysInMonth) -
      (b.recurringExpense?.dueDay ?? daysInMonth)
  );

  const events: ForecastEvent[] = [];
  let incIdx = 0;

  for (const bill of sortedBills) {
    const billDay = bill.recurringExpense?.dueDay ?? daysInMonth;

    // Absorb any paychecks that land on or before this bill's due day
    while (incIdx < futureIncome.length && toDay(futureIncome[incIdx].date) <= billDay) {
      const inc = futureIncome[incIdx];
      events.push({
        type: "income",
        day: toDay(inc.date),
        label: inc.source,
        amount: inc.amount,
        balanceBefore: balance,
        balanceAfter: balance + inc.amount,
      });
      balance += inc.amount;
      incIdx++;
    }

    events.push({
      type: "bill",
      day: billDay,
      label: bill.description ?? "Bill",
      amount: bill.amount,
      balanceBefore: balance,
      balanceAfter: balance - bill.amount,
      isCovered: balance >= bill.amount,
    });
    balance -= bill.amount;
  }

  // Remaining paychecks after all bills
  while (incIdx < futureIncome.length) {
    const inc = futureIncome[incIdx];
    events.push({
      type: "income",
      day: toDay(inc.date),
      label: inc.source,
      amount: inc.amount,
      balanceBefore: balance,
      balanceAfter: balance + inc.amount,
    });
    balance += inc.amount;
    incIdx++;
  }

  return { currentBalance, events };
}

// ---------------------------------------------------------------------------
// Period bootstrap
// ---------------------------------------------------------------------------

export async function getOrCreatePeriod(month: number, year: number): Promise<BudgetPeriod> {
  const existing = await prisma.budgetPeriod.findUnique({
    where: { month_year: { month, year } },
  });
  if (existing) return existing;

  const period = await prisma.budgetPeriod.create({ data: { month, year } });

  // Seed recurring expense entries
  const expenseTemplates = await prisma.recurringExpense.findMany({
    where: { isActive: true },
    include: { category: true },
  });
  if (expenseTemplates.length > 0) {
    await prisma.expenseEntry.createMany({
      data: expenseTemplates.map((t) => ({
        budgetPeriodId: period.id,
        recurringExpenseId: t.id,
        categoryId: t.categoryId,
        amount: t.amount ?? 0,
        description: t.name,
        isPaid: false,
      })),
    });
  }

  // Seed recurring income entries
  const incomeTemplates = await prisma.recurringIncome.findMany({
    where: { isActive: true },
  });
  const incomeRows: Array<{
    budgetPeriodId: number;
    recurringIncomeId: number;
    source: string;
    amount: number;
    date: Date;
    notes: string | null;
  }> = [];
  for (const t of incomeTemplates) {
    for (const date of getMonthOccurrences(t, month, year)) {
      incomeRows.push({
        budgetPeriodId: period.id,
        recurringIncomeId: t.id,
        source: t.source,
        amount: t.amount,
        date,
        notes: t.notes,
      });
    }
  }
  if (incomeRows.length > 0) {
    await prisma.incomeEntry.createMany({ data: incomeRows });
  }

  return period;
}
