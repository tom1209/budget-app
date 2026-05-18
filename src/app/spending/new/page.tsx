import { getOrCreatePeriod } from "@/lib/budget";
import { prisma } from "@/lib/prisma";
import { SpendingForm } from "@/components/SpendingForm";

interface PageProps {
  searchParams: Promise<{ month?: string; year?: string }>;
}

export default async function NewSpendingPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const now = new Date();
  const month = parseInt(sp.month ?? "") || now.getMonth() + 1;
  const year = parseInt(sp.year ?? "") || now.getFullYear();

  const period = await getOrCreatePeriod(month, year);

  const [categories, subCategories] = await Promise.all([
    prisma.category.findMany({
      where: { type: { in: ["variable", "absolute"] } },
      orderBy: { order: "asc" },
    }),
    prisma.subCategory.findMany({ orderBy: { id: "asc" } }),
  ]);

  return (
    <div className="p-4 sm:p-6 max-w-lg">
      <h2 className="text-2xl font-bold text-foreground mb-6">Log Spending</h2>
      <SpendingForm
        periodId={period.id}
        categories={categories}
        subCategories={subCategories}
        month={month}
        year={year}
      />
    </div>
  );
}
