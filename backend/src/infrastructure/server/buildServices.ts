import { BankingService } from "../../core/application/bankingService";
import { ComplianceService } from "../../core/application/complianceService";
import { PoolService } from "../../core/application/poolService";
import { RouteService } from "../../core/application/routeService";
import {
  PostgresBankRepository,
  PostgresComplianceRepository,
  PostgresPoolRepository,
  PostgresRouteRepository,
  PostgresShipEmissionRepository,
} from "../../adapters/outbound/postgres/repositories";
import { prisma } from "../db/prismaClient";

export function buildServices() {
  const routeRepository = new PostgresRouteRepository(prisma);
  const shipEmissionRepository = new PostgresShipEmissionRepository(prisma);
  const complianceRepository = new PostgresComplianceRepository(prisma);
  const bankRepository = new PostgresBankRepository(prisma);
  const poolRepository = new PostgresPoolRepository(prisma);

  const routeService = new RouteService(routeRepository);
  const complianceService = new ComplianceService(
    shipEmissionRepository,
    complianceRepository,
    bankRepository,
  );
  const bankingService = new BankingService(complianceService, bankRepository);
  const poolService = new PoolService(bankingService, poolRepository);

  return {
    routeService,
    complianceService,
    bankingService,
    poolService,
  };
}
