-- CreateTable
CREATE TABLE "RecurringIncome" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "source" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "frequency" TEXT NOT NULL DEFAULT 'monthly',
    "dayOfWeek" INTEGER,
    "anchorDate" TEXT,
    "dayOfMonth" INTEGER,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_IncomeEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "budgetPeriodId" INTEGER NOT NULL,
    "recurringIncomeId" INTEGER,
    "source" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    CONSTRAINT "IncomeEntry_budgetPeriodId_fkey" FOREIGN KEY ("budgetPeriodId") REFERENCES "BudgetPeriod" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "IncomeEntry_recurringIncomeId_fkey" FOREIGN KEY ("recurringIncomeId") REFERENCES "RecurringIncome" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_IncomeEntry" ("amount", "budgetPeriodId", "date", "id", "notes", "source") SELECT "amount", "budgetPeriodId", "date", "id", "notes", "source" FROM "IncomeEntry";
DROP TABLE "IncomeEntry";
ALTER TABLE "new_IncomeEntry" RENAME TO "IncomeEntry";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
