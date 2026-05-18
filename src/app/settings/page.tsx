import { prisma } from "@/lib/prisma";
import { SettingsManager } from "@/components/SettingsManager";

export default async function SettingsPage() {
  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    include: {
      recurringExpenses: { where: { isActive: true }, orderBy: { id: "asc" } },
    },
  });

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-2xl">
      <h2 className="text-2xl font-bold text-foreground">Settings</h2>
      <SettingsManager categories={categories} />
    </div>
  );
}
