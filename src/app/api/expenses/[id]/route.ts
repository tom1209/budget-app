import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = {};

  if (typeof body.isPaid === "boolean") {
    data.isPaid = body.isPaid;
    data.paidAt = body.isPaid ? new Date() : null;
    data.paidBy = body.paidBy ?? null;
  }

  if (body.amount != null) data.amount = Number(body.amount);
  if (body.description != null) data.description = body.description;

  const entry = await prisma.expenseEntry.update({
    where: { id: Number(id) },
    data,
    include: { subCategory: true, recurringExpense: true },
  });

  return NextResponse.json(entry);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.expenseEntry.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
