import type { Task } from "@workspace/db";

export const APP_TIME_ZONE = "Asia/Kolkata";
const IST_OFFSET = "+05:30";

export type TaskStatus =
  | "Scheduled"
  | "Upcoming"
  | "Due"
  | "Completed"
  | "Cancelled";

export function formatCalendarDate(value: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

export function formatTime(value: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: APP_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(value);
}

export function toScheduledInstant(
  scheduledDate: string,
  scheduledTime: string,
): Date {
  return new Date(`${scheduledDate}T${scheduledTime}:00${IST_OFFSET}`);
}

export function dateInputToCalendarDate(value: Date): string {
  return formatCalendarDate(value);
}

export function deriveStatus(
  task: Pick<Task, "status" | "scheduledAt">,
  now = new Date(),
): TaskStatus {
  if (task.status === "Completed" || task.status === "Cancelled") {
    return task.status;
  }

  const scheduledAt = new Date(task.scheduledAt).getTime();
  const current = now.getTime();
  const oneDay = 24 * 60 * 60 * 1000;

  if (scheduledAt <= current) {
    return "Due";
  }

  if (scheduledAt <= current + oneDay) {
    return "Upcoming";
  }

  return "Scheduled";
}

export function serializeTask(task: Task) {
  return {
    ...task,
    status: deriveStatus(task),
    scheduledAt: new Date(task.scheduledAt),
    createdAt: new Date(task.createdAt),
    updatedAt: new Date(task.updatedAt),
    completedAt: task.completedAt ? new Date(task.completedAt) : null,
  };
}