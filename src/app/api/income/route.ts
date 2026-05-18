import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { budgetPeriodId, source, amount, date, notes } = body;

  if (!budgetPeriodId || !source || amount == null) {
    return NextResponse.json({ error: "budgetPeriodId, source, and amount are required" }, { status: 400 });
  }

  const entry = await prisma.incomeEntry.create({
    data: {
      budgetPeriodId: Number(budgetPeriodId),
      source,
      amount: Number(amount),
      date: date ? new Date(date) : new Date(),
      notes: notes ?? null,
    },
  });

  return NextResponse.json(entry, { status: 201 });
}
