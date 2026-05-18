import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL ?? "file:./prisma/dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  const absoluteCat = await prisma.category.create({
    data: { name: "Absolute Expenses", type: "absolute", order: 0 },
  });

  const variableCat = await prisma.category.create({
    data: { name: "Variable Expenses", type: "variable", order: 1 },
  });

  await prisma.category.create({
    data: { name: "Income", type: "income", order: 2 },
  });

  await prisma.subCategory.createMany({
    data: [
      { name: "Eating Out", categoryId: variableCat.id },
      { name: "Kids Activities", categoryId: variableCat.id },
      { name: "Shopping", categoryId: variableCat.id },
      { name: "Other Spending", categoryId: variableCat.id },
    ],
  });

  const absoluteExpenses = [
    { name: "Mortgage", dueDay: 1 },
    { name: "Car Payment #1", dueDay: null },
    { name: "Credit Card #1", dueDay: null },
    { name: "LOC", dueDay: null },
    { name: "Phone Bill", dueDay: null },
    { name: "Student Loans", dueDay: null },
    { name: "Car & Home Insurance", dueDay: null },
    { name: "Day Care", dueDay: 1 },
    { name: "Cable & Internet", dueDay: null },
    { name: "Gas for Car", dueDay: null },
    { name: "Electricity/Water", dueDay: null },
    { name: "Gas (House)", dueDay: null },
    { name: "Bank Fees", dueDay: null },
    { name: "Life Insurance", dueDay: null },
    { name: "Hot Water Tank Rental", dueDay: null },
    { name: "Property Tax", dueDay: null },
  ];

  for (const expense of absoluteExpenses) {
    await prisma.recurringExpense.create({
      data: {
        name: expense.name,
        categoryId: absoluteCat.id,
        frequency: "monthly",
        dueDay: expense.dueDay,
      },
    });
  }

  const variableExpenses = [
    "Groceries",
    "Toiletries",
    "Spotify",
    "Netflix/Prime/Disney",
    "iCloud",
    "RESP",
    "Family Fun",
    "Dinner Out",
    "Lunches/Starbucks (Tom)",
    "Lunches/Starbucks (Justine)",
    "Overflow",
    "Extra Curriculars",
    "OTHER",
  ];

  for (const name of variableExpenses) {
    await prisma.recurringExpense.create({
      data: { name, categoryId: variableCat.id, frequency: "monthly" },
    });
  }

  console.log("Database seeded successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
