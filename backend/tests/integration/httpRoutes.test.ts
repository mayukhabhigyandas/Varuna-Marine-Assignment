import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createHttpRouter } from "../../src/adapters/inbound/http/createHttpRouter";
import { DomainError } from "../../src/core/domain/errors";
import { errorHandler, notFoundHandler } from "../../src/infrastructure/server/middleware/errorHandler";

function createTestApp(services: any) {
  const app = express();
  app.use(express.json());
  app.use(createHttpRouter(services));
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

describe("HTTP Integration", () => {
  it("GET /routes returns route list", async () => {
    const app = createTestApp({
      routeService: {
        getAllRoutes: async () => [{ id: "route-1", year: 2025, name: "A", intensity: 88, isBaseline: true }],
        markBaseline: async () => {
          throw new Error("not used");
        },
        compareRoutes: async () => [],
      },
      complianceService: {
        computeComplianceBalance: async () => ({}),
        getAdjustedComplianceBalance: async () => ({}),
      },
      bankingService: {
        getRecords: async () => [],
        bankPositiveCompliance: async () => ({}),
        applyBankToDeficit: async () => ({}),
      },
      poolService: {
        createPool: async () => ({}),
      },
    });

    const response = await request(app).get("/routes");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(1);
  });

  it("GET /compliance/cb validates required query params", async () => {
    const app = createTestApp({
      routeService: {
        getAllRoutes: async () => [],
        markBaseline: async () => ({}),
        compareRoutes: async () => [],
      },
      complianceService: {
        computeComplianceBalance: async () => ({}),
        getAdjustedComplianceBalance: async () => ({}),
      },
      bankingService: {
        getRecords: async () => [],
        bankPositiveCompliance: async () => ({}),
        applyBankToDeficit: async () => ({}),
      },
      poolService: {
        createPool: async () => ({}),
      },
    });

    const response = await request(app).get("/compliance/cb");

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("Missing query parameter");
  });

  it("POST /banking/apply returns domain error for over-apply", async () => {
    const app = createTestApp({
      routeService: {
        getAllRoutes: async () => [],
        markBaseline: async () => ({}),
        compareRoutes: async () => [],
      },
      complianceService: {
        computeComplianceBalance: async () => ({}),
        getAdjustedComplianceBalance: async () => ({}),
      },
      bankingService: {
        getRecords: async () => [],
        bankPositiveCompliance: async () => ({}),
        applyBankToDeficit: async () => {
          throw new DomainError("Requested amount exceeds available banked surplus", 400);
        },
      },
      poolService: {
        createPool: async () => ({}),
      },
    });

    const response = await request(app).post("/banking/apply").send({
      shipId: "ship-002",
      year: 2025,
      amount: 1000,
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("Requested amount exceeds available banked surplus");
  });

  it("POST /pools validates invalid pool payload", async () => {
    const app = createTestApp({
      routeService: {
        getAllRoutes: async () => [],
        markBaseline: async () => ({}),
        compareRoutes: async () => [],
      },
      complianceService: {
        computeComplianceBalance: async () => ({}),
        getAdjustedComplianceBalance: async () => ({}),
      },
      bankingService: {
        getRecords: async () => [],
        bankPositiveCompliance: async () => ({}),
        applyBankToDeficit: async () => ({}),
      },
      poolService: {
        createPool: async () => ({}),
      },
    });

    const response = await request(app).post("/pools").send({
      year: 2025,
      shipIds: [],
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("shipIds must be a non-empty array");
  });
});
