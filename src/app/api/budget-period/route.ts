import { NextRequest, NextResponse } from "next/server";
import { getOrCreatePeriod } from "@/lib/budget";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const month = parseInt(searchParams.get("month") ?? "");
  const year = parseInt(searchParams.get("year") ?? "");

  if (isNaN(month) || isNaN(year)) {
    return NextResponse.json({ error: "month and year are required" }, { status: 400 });
  }

  const period = await getOrCreatePeriod(month, year);

  const [expenses, income] = await Promise.all([
    prisma.expenseEntry.findMany({
      where: { budgetPeriodId: period.id },
      include: { recurringExpense: true, subCategory: true },
      orderBy: [{ isPaid: "asc" }, { date: "asc" }],
    }),
    prisma.incomeEntry.findMany({
      where: { budgetPeriodId: period.id },
      orderBy: { date: "asc" },
    }),
  ]);

  return NextResponse.json({ period, expenses, income });
}
