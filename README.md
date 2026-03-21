# Varuna Marine Assignment

## Overview

Varuna Marine is a full-stack TypeScript project for compliance operations in a shipping context.

The system supports:
- Route and baseline route comparison
- Compliance balance calculation
- Banking positive compliance and applying banked surplus
- Pool creation with rule validation across selected ships

Project structure:
- backend: Express + Prisma + PostgreSQL (Supabase)
- frontend: React + Vite + TypeScript

## Architecture Summary (Hexagonal Structure)

The backend follows a hexagonal style (ports and adapters):

- Core domain layer
	- Folder: backend/src/core/domain
	- Contains domain models, constants, and domain errors.

- Core application layer
	- Folder: backend/src/core/application
	- Contains business services (banking, compliance, pooling, routes).
	- Depends on abstract ports, not concrete database or HTTP implementations.

- Ports layer
	- Folder: backend/src/core/ports
	- Defines repository interfaces used by application services.

- Adapters layer
	- Inbound adapter: HTTP router in backend/src/adapters/inbound/http
	- Outbound adapter: Prisma repositories in backend/src/adapters/outbound/postgres

- Infrastructure layer
	- Folder: backend/src/infrastructure
	- Wires server, middleware, Prisma client, and service composition.

The frontend also mirrors separation of concerns:
- core: domain types and application service contracts
- adapters/infrastructure: API client implementations
- adapters/ui: tabs, hooks, and presentational components

## Setup and Run Instructions

### Prerequisites

- Node.js 20+ recommended
- npm
- PostgreSQL database (Supabase is used in this project)

### 1) Install dependencies

From the project root:

1. Install backend dependencies

```bash
cd backend
npm install
```

2. Install frontend dependencies

```bash
cd ../frontend
npm install
```

### 2) Configure environment (backend)

Create a backend .env file with at least:
- DATABASE_URL
- DIRECT_URL
- PORT (optional, defaults to 3000)

### 3) Database migration and Prisma client

From backend:

- Apply migrations

```bash
npx prisma migrate deploy
```

- Generate Prisma client

```bash
npx prisma generate
```

- Optional: seed data

```bash
npm run prisma:seed
```

### 4) Run backend

From backend:

- Development mode

```bash
npm run dev
```

- Production style

```bash
npm run build
npm run start
```

The backend listens on PORT from environment or 3000 by default.

### 5) Run frontend

From frontend:

- Development mode

```bash
npm run dev
```

- Build and preview

```bash
npm run build
npm run preview
```

## How To Execute Tests

Backend tests are implemented with Vitest.

From backend:

- Run all tests

```bash
npm run test
```

- Run unit tests only

```bash
npm run test:unit
```

- Run integration tests only

```bash
npm run test:integration
```

- Run data tests only

```bash
npm run test:data
```

- Watch mode

```bash
npm run test:watch
```

Frontend currently includes build and lint checks; dedicated test scripts are not configured in package scripts.
