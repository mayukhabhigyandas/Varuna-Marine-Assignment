import cors from "cors";
import express from "express";
import { createHttpRouter } from "../../adapters/inbound/http/createHttpRouter";
import { buildServices } from "./buildServices";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

export function createServer() {
  const app = express();
  const services = buildServices();

  app.use(cors());
  app.use(express.json());

  app.use(createHttpRouter(services));
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
