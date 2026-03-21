import { NextFunction, Request, Response, Router } from "express";
import { BankingService } from "../../../core/application/bankingService";
import { ComplianceService } from "../../../core/application/complianceService";
import { PoolService } from "../../../core/application/poolService";
import { RouteService } from "../../../core/application/routeService";
import { DomainError } from "../../../core/domain/errors";
import {
  optionalNumber,
  requireInteger,
  requirePositiveNumber,
  requireQueryString,
} from "../../../shared/parsers";

interface Services {
  routeService: RouteService;
  complianceService: ComplianceService;
  bankingService: BankingService;
  poolService: PoolService;
}

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

function wrap(handler: AsyncHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

export function createHttpRouter(services: Services): Router {
  const router = Router();

  router.get("/", (_req, res) => {
    res.json({
      success: true,
      message: "Varuna Marine backend is up.",
    });
  });

  router.get("/health", (_req, res) => {
    res.json({
      success: true,
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  router.get("/api/v1/ping", (_req, res) => {
    res.json({
      success: true,
      message: "pong",
    });
  });

  router.get(
    "/routes",
    wrap(async (_req, res) => {
      const routes = await services.routeService.getAllRoutes();
      res.json({ success: true, data: routes });
    }),
  );

  router.post(
    "/routes/:id/baseline",
    wrap(async (req, res) => {
      const route = await services.routeService.markBaseline(req.params.id);
      res.json({ success: true, data: route });
    }),
  );

  router.get(
    "/routes/comparison",
    wrap(async (req, res) => {
      const threshold = optionalNumber(req.query.threshold) ?? 0;
      const year = optionalNumber(req.query.year);
      const result = await services.routeService.compareRoutes(threshold, year);
      res.json({ success: true, data: result });
    }),
  );

  router.get(
    "/compliance/cb",
    wrap(async (req, res) => {
      const shipId = requireQueryString(req.query.shipId, "shipId");
      const year = requireInteger(req.query.year, "year");

      const record = await services.complianceService.computeComplianceBalance(shipId, year);
      res.json({ success: true, data: record });
    }),
  );

  router.get(
    "/compliance/adjusted-cb",
    wrap(async (req, res) => {
      const shipId = requireQueryString(req.query.shipId, "shipId");
      const year = requireInteger(req.query.year, "year");

      const result = await services.complianceService.getAdjustedComplianceBalance(shipId, year);
      res.json({ success: true, data: result });
    }),
  );

  router.get(
    "/banking/records",
    wrap(async (req, res) => {
      const shipId = requireQueryString(req.query.shipId, "shipId");
      const year = optionalNumber(req.query.year);

      const entries = await services.bankingService.getRecords(shipId, year);
      res.json({ success: true, data: entries });
    }),
  );

  router.post(
    "/banking/bank",
    wrap(async (req, res) => {
      const shipId = requireQueryString(req.body.shipId, "shipId");
      const year = requireInteger(req.body.year, "year");
      const amount = typeof req.body.amount === "undefined" ? undefined : requirePositiveNumber(req.body.amount, "amount");

      const result = await services.bankingService.bankPositiveCompliance({ shipId, year, amount });
      res.json({ success: true, data: result });
    }),
  );

  router.post(
    "/banking/apply",
    wrap(async (req, res) => {
      const shipId = requireQueryString(req.body.shipId, "shipId");
      const year = requireInteger(req.body.year, "year");
      const amount = requirePositiveNumber(req.body.amount, "amount");

      const result = await services.bankingService.applyBankToDeficit({ shipId, year, amount });
      res.json({ success: true, data: result });
    }),
  );

  router.get(
    "/banking/latest-apply",
    wrap(async (req, res) => {
      const shipId = requireQueryString(req.query.shipId, "shipId");
      const year = requireInteger(req.query.year, "year");

      const snapshot = await services.bankingService.getLatestApplySnapshot(shipId, year);
      if (!snapshot) {
        res.json({ success: true, data: null });
        return;
      }

      res.json({
        success: true,
        data: {
          shipId: snapshot.shipId,
          year: snapshot.year,
          originalDeficit: snapshot.cbBefore,
          appliedAmount: snapshot.applied,
          adjustedComplianceBalance: snapshot.cbAfter,
          applications: [],
        },
      });
    }),
  );

  router.get(
    "/banking/apply-summary",
    wrap(async (req, res) => {
      const shipId = requireQueryString(req.query.shipId, "shipId");
      const year = requireInteger(req.query.year, "year");

      const summary = await services.bankingService.getApplySummary(shipId, year);
      res.json({ success: true, data: summary });
    }),
  );

  router.post(
    "/pools",
    wrap(async (req, res) => {
      if (!Array.isArray(req.body.shipIds) || req.body.shipIds.length === 0) {
        throw new DomainError("shipIds must be a non-empty array", 400);
      }

      const shipIds = req.body.shipIds.map((id: unknown) => requireQueryString(id, "shipIds[]"));
      const year = requireInteger(req.body.year, "year");

      const result = await services.poolService.createPool({ shipIds, year });
      res.json({ success: true, data: result });
    }),
  );

  return router;
}
