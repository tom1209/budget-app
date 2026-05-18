import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    include: {
      recurringExpenses: { where: { isActive: true }, orderBy: { id: "asc" } },
      subCategories: { orderBy: { id: "asc" } },
    },
  });
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, categoryId, amount, frequency, dueDay, notes } = body;

  if (!name || !categoryId) {
    return NextResponse.json({ error: "name and categoryId are required" }, { status: 400 });
  }

  const expense = await prisma.recurringExpense.create({
    data: {
      name,
      categoryId: Number(categoryId),
      amount: amount != null ? Number(amount) : null,
      frequency: frequency ?? "monthly",
      dueDay: dueDay != null ? Number(dueDay) : null,
      notes: notes ?? null,
    },
  });

  return NextResponse.json(expense, { status: 201 });
}
