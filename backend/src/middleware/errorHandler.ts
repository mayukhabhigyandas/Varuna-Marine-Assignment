import { Response } from "express";
import { ApiErrorResponse } from "../types/api";

export function errorHandler(error: unknown, res: Response): void {
  const message = error instanceof Error ? error.message : "Internal server error";

  const payload: ApiErrorResponse = {
    success: false,
    message,
  };

  res.status(500).json(payload);
}
