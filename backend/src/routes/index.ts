import { Router } from "express";

export const apiRouter = Router();

apiRouter.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "Varuna Marine backend is up.",
  });
});

apiRouter.get("/health", (_req, res) => {
  res.json({
    success: true,
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

apiRouter.get("/api/v1/ping", (_req, res) => {
  res.json({
    success: true,
    message: "pong",
  });
});
