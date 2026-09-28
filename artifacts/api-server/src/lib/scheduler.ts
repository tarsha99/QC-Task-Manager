import { and, eq, lt, notInArray } from "drizzle-orm";
import { db, tasksTable } from "@workspace/db";
import { logger } from "./logger";
import { formatCalendarDate, formatTime, toScheduledInstant } from "./task-utils";

let schedulerTimer: NodeJS.Timeout | undefined;
let lastRunAt: Date | undefined;

export async function seedDemoTasks(): Promise<void> {
  const existing = await db.select({ id: tasksTable.id }).from(tasksTable).limit(1);
  if (existing.length > 0) {
    return;
  }

  const now = new Date();
  const demo = [
    { title: "Review release checklist", minutes: 90, description: "Validate the final QA pass before the next handoff." },
    { title: "Submit QC report", minutes: 24 * 60, description: "Send the completed quality report to the project lead." },
    { title: "Team sync", minutes: 48 * 60, description: "Weekly project check-in and blocker review." },
  ];
  await db.insert(tasksTable).values(
    demo.map((item) => {
      const scheduled = new Date(now.getTime() + item.minutes * 60_000);
      const scheduledDate = formatCalendarDate(scheduled);
      const scheduledTime = formatTime(scheduled);
      return {
        title: item.title,
        description: item.description,
        scheduledDate,
        scheduledTime,
        scheduledAt: toScheduledInstant(scheduledDate, scheduledTime),
        status: "Scheduled",
      };
    }),
  );
  logger.info("Seeded demo tasks");
}

export function isSchedulerRunning(): boolean {
  return Boolean(schedulerTimer);
}

export async function promoteDueTasks(): Promise<void> {
  const now = new Date();
  lastRunAt = now;

  try {
    await db
      .update(tasksTable)
      .set({ status: "Due", updatedAt: now })
      .where(
        and(
          lt(tasksTable.scheduledAt, now),
          notInArray(tasksTable.status, ["Completed", "Cancelled", "Due"]),
        ),
      );
  } catch (error) {
    logger.error({ err: error }, "Scheduler failed to promote due tasks");
  }
}

export function getSchedulerLastRunAt(): Date | undefined {
  return lastRunAt;
}

export function startScheduler(): void {
  if (schedulerTimer) {
    return;
  }

  void promoteDueTasks();
  schedulerTimer = setInterval(() => {
    void promoteDueTasks();
  }, 15_000);
  schedulerTimer.unref();
  logger.info("Task scheduler started");
}

export async function stopScheduler(): Promise<void> {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = undefined;
  }
}