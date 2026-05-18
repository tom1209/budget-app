import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const items = await prisma.recurringIncome.findMany({
    where: { isActive: true },
    orderBy: { id: "asc" },
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { source, amount, frequency, dayOfWeek, anchorDate, dayOfMonth, notes } = body;

  if (!source || amount == null) {
    return NextResponse.json({ error: "source and amount are required" }, { status: 400 });
  }

  const item = await prisma.recurringIncome.create({
    data: {
      source,
      amount: Number(amount),
      frequency: frequency ?? "monthly",
      dayOfWeek: dayOfWeek != null ? Number(dayOfWeek) : null,
      anchorDate: anchorDate ?? null,
      dayOfMonth: dayOfMonth != null ? Number(dayOfMonth) : null,
      notes: notes ?? null,
    },
  });

  return NextResponse.json(item, { status: 201 });
}
