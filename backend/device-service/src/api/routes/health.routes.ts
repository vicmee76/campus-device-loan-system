import { Router } from "express";
import { db } from "../../database/connection";

const router = Router();

/**
 * Liveness probe: service is running
 */
router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

/**
 * Readiness probe: DB is reachable
 */
router.get("/ready", async (_req, res) => {
  try {
    await db.raw("SELECT 1");
    res.json({ ready: true });
  } catch (error) {
    res.status(500).json({ ready: false, error: "Database unreachable" });
  }
});

/**
 * Metrics endpoint (basic Prometheus style)
 */
router.get("/metrics", (_req, res) => {
  res.set("Content-Type", "text/plain");

  const metrics = [
    "# HELP http_service_status Always 1 if service is alive",
    "# TYPE http_service_status gauge",
    "http_service_status 1"
  ].join("\n");

  res.send(metrics);
});

export default router;

