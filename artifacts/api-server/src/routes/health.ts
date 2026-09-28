import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { isSchedulerRunning } from "../lib/scheduler";

const router: IRouter = Router();

router.get(["/healthz", "/health"], async (_req, res): Promise<void> => {
  let database = "connected";
  try {
    await db.execute(sql`select 1`);
  } catch {
    database = "disconnected";
  }
  const data = HealthCheckResponse.parse({
    status: database === "connected" && isSchedulerRunning() ? "healthy" : "degraded",
    database,
    scheduler: isSchedulerRunning() ? "running" : "stopped",
    api: "healthy",
  });
  res.status(data.status === "healthy" ? 200 : 503).json(data);
});

export default router;
