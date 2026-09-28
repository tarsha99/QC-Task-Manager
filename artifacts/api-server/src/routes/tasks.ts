import { and, asc, desc, eq, ilike, or } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  CompleteTaskParams,
  CompleteTaskResponse,
  CreateTaskBody,
  CreateTaskResponse,
  DeleteTaskParams,
  GetDashboardStatsResponse,
  GetDueTasksResponse,
  GetRecentActivityQueryParams,
  GetRecentActivityResponse,
  GetTaskParams,
  GetTaskResponse,
  ListTasksQueryParams,
  ListTasksResponse,
  UpdateTaskBody,
  UpdateTaskParams,
  UpdateTaskResponse,
} from "@workspace/api-zod";
import { db, tasksTable } from "@workspace/db";
import {
  dateInputToCalendarDate,
  deriveStatus,
  serializeTask,
  toScheduledInstant,
} from "../lib/task-utils";

const router: IRouter = Router();

async function findTask(id: number) {
  const [task] = await db.select().from(tasksTable).where(eq(tasksTable.id, id));
  return task;
}

function toDateInput(value: Date): string {
  return dateInputToCalendarDate(value);
}

function normalizeTaskBody(body: {
  title: string;
  description?: string | null;
  scheduledDate: Date;
  scheduledTime: string;
}) {
  const scheduledDate = toDateInput(body.scheduledDate);
  const scheduledAt = toScheduledInstant(scheduledDate, body.scheduledTime);
  if (Number.isNaN(scheduledAt.getTime())) {
    throw new Error("Invalid scheduled date or time");
  }
  return {
    title: body.title.trim(),
    description: body.description?.trim() || null,
    scheduledDate,
    scheduledTime: body.scheduledTime,
    scheduledAt,
  };
}

router.get("/tasks", async (req, res): Promise<void> => {
  const parsed = ListTasksQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { status, search, limit } = parsed.data;
  const where = search
    ? or(
        ilike(tasksTable.title, `%${search}%`),
        ilike(tasksTable.description, `%${search}%`),
      )
    : undefined;
  const rows = await db
    .select()
    .from(tasksTable)
    .where(where)
    .orderBy(asc(tasksTable.scheduledAt))
    .limit(limit);
  const tasks = rows
    .map(serializeTask)
    .filter((task) => !status || status === "All" || task.status === status);

  res.json(ListTasksResponse.parse(tasks));
});

router.post("/tasks", async (req, res): Promise<void> => {
  const parsed = CreateTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  let values;
  try {
    values = normalizeTaskBody(parsed.data);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Invalid scheduled time" });
    return;
  }

  const now = new Date();
  const [task] = await db
    .insert(tasksTable)
    .values({ ...values, status: "Scheduled", createdAt: now, updatedAt: now })
    .returning();

  res.status(201).json(CreateTaskResponse.parse(serializeTask(task)));
});

router.get("/tasks/due", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(tasksTable)
    .where(eq(tasksTable.status, "Due"))
    .orderBy(asc(tasksTable.scheduledAt));

  res.json(GetDueTasksResponse.parse(rows.map(serializeTask)));
});

router.get("/tasks/:id", async (req, res): Promise<void> => {
  const parsed = GetTaskParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const task = await findTask(parsed.data.id);
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  res.json(GetTaskResponse.parse(serializeTask(task)));
});

router.patch("/tasks/:id", async (req, res): Promise<void> => {
  const params = UpdateTaskParams.safeParse(req.params);
  const parsed = UpdateTaskBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const current = await findTask(params.data.id);
  if (!current) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  const update: Partial<typeof tasksTable.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (parsed.data.title !== undefined) update.title = parsed.data.title.trim();
  if (parsed.data.description !== undefined) {
    update.description = parsed.data.description?.trim() || null;
  }
  if (parsed.data.status !== undefined) update.status = parsed.data.status;

  const hasScheduleChange =
    parsed.data.scheduledDate !== undefined || parsed.data.scheduledTime !== undefined;
  if (hasScheduleChange) {
    const scheduledDate =
      parsed.data.scheduledDate !== undefined
        ? toDateInput(parsed.data.scheduledDate)
        : current.scheduledDate;
    const scheduledTime = parsed.data.scheduledTime ?? current.scheduledTime;
    update.scheduledDate = scheduledDate;
    update.scheduledTime = scheduledTime;
    update.scheduledAt = toScheduledInstant(scheduledDate, scheduledTime);
    if (parsed.data.status === undefined) update.status = "Scheduled";
    update.completedAt = null;
  }

  const [task] = await db
    .update(tasksTable)
    .set(update)
    .where(eq(tasksTable.id, params.data.id))
    .returning();

  res.json(UpdateTaskResponse.parse(serializeTask(task)));
});

router.delete("/tasks/:id", async (req, res): Promise<void> => {
  const parsed = DeleteTaskParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [deleted] = await db
    .delete(tasksTable)
    .where(eq(tasksTable.id, parsed.data.id))
    .returning({ id: tasksTable.id });
  if (!deleted) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  res.sendStatus(204);
});

router.post("/tasks/:id/complete", async (req, res): Promise<void> => {
  const parsed = CompleteTaskParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [task] = await db
    .update(tasksTable)
    .set({ status: "Completed", completedAt: new Date(), updatedAt: new Date() })
    .where(eq(tasksTable.id, parsed.data.id))
    .returning();
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  res.json(CompleteTaskResponse.parse(serializeTask(task)));
});

router.get("/dashboard/stats", async (_req, res): Promise<void> => {
  const rows = await db.select().from(tasksTable).orderBy(asc(tasksTable.scheduledAt));
  const tasks = rows.map(serializeTask);
  const stats = {
    total: tasks.length,
    scheduled: tasks.filter((task) => task.status === "Scheduled").length,
    upcoming: tasks.filter((task) => task.status === "Upcoming").length,
    due: tasks.filter((task) => task.status === "Due").length,
    completed: tasks.filter((task) => task.status === "Completed").length,
    cancelled: tasks.filter((task) => task.status === "Cancelled").length,
    nextTask:
      tasks.find((task) => task.status === "Scheduled" || task.status === "Upcoming") ?? null,
  };

  res.json(GetDashboardStatsResponse.parse(stats));
});

router.get("/dashboard/activity", async (req, res): Promise<void> => {
  const parsed = GetRecentActivityQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const rows = await db
    .select()
    .from(tasksTable)
    .orderBy(desc(tasksTable.updatedAt))
    .limit(parsed.data.limit);
  const activities = rows.map((row) => {
    const task = serializeTask(row);
    const type =
      task.status === "Completed"
        ? "completed"
        : task.status === "Due"
          ? "due"
          : task.updatedAt.getTime() !== task.createdAt.getTime()
            ? "updated"
            : "created";
    return {
      id: `${task.id}-${type}-${task.updatedAt.toISOString()}`,
      type,
      message:
        type === "completed"
          ? `${task.title} was completed`
          : type === "due"
            ? `${task.title} is due now`
            : type === "updated"
              ? `${task.title} was updated`
              : `${task.title} was added to your schedule`,
      timestamp: task.updatedAt,
      task,
    };
  });

  res.json(GetRecentActivityResponse.parse(activities));
});

export default router;