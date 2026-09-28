import { createInsertSchema } from "drizzle-zod";
import {
  date,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const tasksTable = pgTable(
  "tasks",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    scheduledDate: date("scheduled_date", { mode: "string" }).notNull(),
    scheduledTime: text("scheduled_time").notNull(),
    scheduledAt: timestamp("scheduled_at", {
      withTimezone: true,
    }).notNull(),
    status: text("status").notNull().default("Scheduled"),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", {
      withTimezone: true,
    }),
  },
  (table) => ({
    scheduledAtIdx: index("tasks_scheduled_at_idx").on(table.scheduledAt),
    statusIdx: index("tasks_status_idx").on(table.status),
  }),
);

export const insertTaskSchema = createInsertSchema(tasksTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasksTable.$inferSelect;