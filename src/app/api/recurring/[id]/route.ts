import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if (body.name != null) data.name = body.name;
  if (body.amount !== undefined) data.amount = body.amount != null ? Number(body.amount) : null;
  if (body.frequency != null) data.frequency = body.frequency;
  if (body.dueDay !== undefined) data.dueDay = body.dueDay != null ? Number(body.dueDay) : null;
  if (body.notes !== undefined) data.notes = body.notes ?? null;
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;

  const expense = await prisma.recurringExpense.update({
    where: { id: Number(id) },
    data,
  });

  return NextResponse.json(expense);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.recurringExpense.update({
    where: { id: Number(id) },
    data: { isActive: false },
  });
  return NextResponse.json({ ok: true });
}
