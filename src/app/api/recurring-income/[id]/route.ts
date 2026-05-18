import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if (body.source != null) data.source = body.source;
  if (body.amount != null) data.amount = Number(body.amount);
  if (body.frequency != null) data.frequency = body.frequency;
  if (body.dayOfWeek !== undefined) data.dayOfWeek = body.dayOfWeek != null ? Number(body.dayOfWeek) : null;
  if (body.anchorDate !== undefined) data.anchorDate = body.anchorDate ?? null;
  if (body.dayOfMonth !== undefined) data.dayOfMonth = body.dayOfMonth != null ? Number(body.dayOfMonth) : null;
  if (body.notes !== undefined) data.notes = body.notes ?? null;
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;

  const item = await prisma.recurringIncome.update({
    where: { id: Number(id) },
    data,
  });

  return NextResponse.json(item);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.recurringIncome.update({
    where: { id: Number(id) },
    data: { isActive: false },
  });
  return NextResponse.json({ ok: true });
}
