"use client";

import { formatCurrency } from "@/lib/format";
import type { ForecastResult } from "@/lib/budget";
import { TrendingUp, Receipt, AlertTriangle, CheckCircle2 } from "lucide-react";

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

interface Props {
  forecast: ForecastResult;
  month: number;
  year: number;
}

export function CashFlowForecast({ forecast, month, year }: Props) {
  const { currentBalance, events } = forecast;
  const monthLabel = MONTH_NAMES[month - 1];

  if (events.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-6">
        No upcoming bills or income to forecast.
      </div>
    );
  }

  const hasShortfall = events.some((e) => e.type === "bill" && !e.isCovered);

  return (
    <div className="space-y-4">
      {/* Current balance header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Balance right now</p>
          <p className={`text-2xl font-bold ${currentBalance >= 0 ? "text-foreground" : "text-destructive"}`}>
            {formatCurrency(currentBalance)}
          </p>
        </div>
        {hasShortfall && (
          <div className="flex items-center gap-1.5 text-amber-500 text-sm font-medium">
            <AlertTriangle className="h-4 w-4" />
            Shortfall detected
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="bg-card rounded-lg border divide-y">
        {events.map((event, i) => {
          const isIncome = event.type === "income";
          const covered = event.isCovered ?? true;

          return (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5">
              {/* Icon */}
              <div className={`shrink-0 p-1.5 rounded-md ${isIncome ? "bg-green-500/10" : covered ? "bg-muted" : "bg-destructive/10"}`}>
                {isIncome
                  ? <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                  : covered
                    ? <Receipt className="h-3.5 w-3.5 text-muted-foreground" />
                    : <Receipt className="h-3.5 w-3.5 text-destructive" />
                }
              </div>

              {/* Date + label */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${isIncome ? "text-green-400" : covered ? "text-foreground" : "text-destructive"}`}>
                  {event.label}
                </p>
                <p className="text-xs text-muted-foreground">{monthLabel} {event.day}</p>
              </div>

              {/* Amount */}
              <span className={`text-sm font-semibold shrink-0 ${isIncome ? "text-green-500" : covered ? "text-foreground" : "text-destructive"}`}>
                {isIncome ? "+" : "−"}{formatCurrency(event.amount)}
              </span>

              {/* Running balance — hidden on small screens */}
              <span className={`hidden sm:block text-sm tabular-nums shrink-0 w-24 text-right ${event.balanceAfter < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                {formatCurrency(event.balanceAfter)}
              </span>

              {/* Coverage indicator for bills */}
              {!isIncome && (
                <div className="shrink-0 w-5">
                  {covered
                    ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                    : <AlertTriangle className="h-4 w-4 text-amber-500" />
                  }
                </div>
              )}
              {isIncome && <div className="shrink-0 w-5" />}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground px-1">
        <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" /> Covered</span>
        <span className="flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-amber-500" /> Shortfall</span>
        <span className="hidden sm:block ml-auto">Running balance →</span>
      </div>
    </div>
  );
}
