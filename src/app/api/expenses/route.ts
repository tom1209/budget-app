import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { budgetPeriodId, categoryId, subCategoryId, amount, description, date } = body;

  if (!budgetPeriodId || !categoryId || amount == null) {
    return NextResponse.json({ error: "budgetPeriodId, categoryId, and amount are required" }, { status: 400 });
  }

  const entry = await prisma.expenseEntry.create({
    data: {
      budgetPeriodId: Number(budgetPeriodId),
      categoryId: Number(categoryId),
      subCategoryId: subCategoryId ? Number(subCategoryId) : null,
      amount: Number(amount),
      description: description ?? null,
      date: date ? new Date(date) : new Date(),
      isPaid: false,
    },
    include: { subCategory: true },
  });

  return NextResponse.json(entry, { status: 201 });
}
