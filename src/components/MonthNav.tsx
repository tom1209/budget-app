"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { monthName } from "@/lib/format";

interface MonthNavProps {
  month: number;
  year: number;
}

export function MonthNav({ month, year }: MonthNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function navigate(m: number, y: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", String(m));
    params.set("year", String(y));
    router.push(`${pathname}?${params.toString()}`);
  }

  function prev() {
    if (month === 1) navigate(12, year - 1);
    else navigate(month - 1, year);
  }

  function next() {
    if (month === 12) navigate(1, year + 1);
    else navigate(month + 1, year);
  }

  const now = new Date();
  const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear();

  return (
    <div className="flex items-center gap-1">
      <Button variant="outline" size="sm" onClick={prev} className="px-2">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm font-semibold text-foreground min-w-24 sm:min-w-36 text-center tabular-nums">
        {monthName(month)} {year}
      </span>
      <Button variant="outline" size="sm" onClick={next} className="px-2">
        <ChevronRight className="h-4 w-4" />
      </Button>
      {!isCurrentMonth && (
        <Button
          variant="ghost"
          size="sm"
          className="text-zinc-500 text-xs ml-1"
          onClick={() => navigate(now.getMonth() + 1, now.getFullYear())}
        >
          Today
        </Button>
      )}
    </div>
  );
}
