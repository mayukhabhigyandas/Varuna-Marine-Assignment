import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import { apiRouter } from "./routes";
import { errorHandler } from "./middleware/errorHandler";

export const app = express();

app.use(cors());
app.use(express.json());

app.use("/", apiRouter);

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  errorHandler(err, res);
});
