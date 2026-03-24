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

### ShipEmission seeded data (different routes)

The following rows are inserted from `backend/prisma/seed.ts`.

| shipId | routeId | year | vesselType | fuelType | fuelConsumptionTons | distanceKm | totalEmissionsTonnes | actualIntensity |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SHIP_R001 | R001 | 2024 | Container | HFO | 5000 | 12000 | 4500 | 91.0 |
| SHIP_R002 | R002 | 2024 | BulkCarrier | LNG | 4800 | 11500 | 4200 | 88.0 |
| SHIP_R003 | R003 | 2024 | Tanker | MGO | 5100 | 12500 | 4700 | 93.5 |
| SHIP_R004 | R004 | 2025 | RoRo | HFO | 4900 | 11800 | 4300 | 89.2 |
| SHIP_R002 | R005 | 2025 | Container | LNG | 4950 | 11900 | 4400 | 90.5 |

Note: SHIP_R002 is allotted to two routes across years: R002 in 2024 and R005 in 2025.

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

## Sample API Requests and Responses

### 1) Get Compliance Balance

**Request:**

```bash
curl -X GET "http://localhost:3000/compliance/cb?shipId=SHIP_R001&year=2024"
```

**Response:**

```json
{
    "success": true,
    "data": {
        "id": 10,
        "shipId": "SHIP_R001",
        "year": 2024,
        "targetIntensity": 89.3368,
        "actualIntensity": 91,
        "energyInScopeMj": 205000000,
        "complianceBalance": -340956000.0000007,
        "createdAt": "2026-03-21T10:03:51.847Z"
    }
}
```

### 2) Bank Positive Compliance

**Request:**

```bash
curl -X POST "http://localhost:3000/banking/bank" \
  -H "Content-Type: application/json" \
  -d '{
    "shipId": "SHIP_R002",
    "year": 2024,
    "amount": 263082239
  }'
```

**Response:**

```json
{
    "success": true,
    "data": {
        "entry": {
            "id": "28de8b8c-3fbf-4202-9872-eed2a4186631",
            "shipId": "SHIP_R002",
            "year": 2024,
            "amount": 263082239,
            "usedAmount": 0,
            "sourceComplianceYear": 2024,
            "createdAt": "2026-03-21T10:44:24.321Z"
        },
        "remainingBankable": 0.9999993145465851
    }
}
```

### 3) Apply Banked Surplus

**Request:**

```bash
curl -X POST "http://localhost:3000/banking/apply" \
  -H "Content-Type: application/json" \
  -d '{
        "shipId": "SHIP_R002",
        "year": 2025,
        "amount": 236071440
}'
```

**Response:**

```json
{
    "success": true,
    "data": {
        "shipId": "SHIP_R002",
        "year": 2025,
        "originalDeficit": -236071440.0000007,
        "appliedAmount": 236071440,
        "adjustedComplianceBalance": -6.854534149169922e-7,
        "applications": [
            {
                "entryId": "28de8b8c-3fbf-4202-9872-eed2a4186631",
                "appliedAmount": 236071440
            }
        ]
    }
}
```

### 4) Create Pool

**Request:**

```bash
curl -X POST "http://localhost:3000/pools" \
  -H "Content-Type: application/json" \
  -d '{
    "shipIds": ["SHIP_R002", "SHIP_R004"],
    "year": 2025
  }'
```

**Response:**

```json
{
    "success": true,
    "data": {
        "pool": {
            "id": "pool-1774089986212",
            "year": 2025,
            "shipIds": [
                "SHIP_R002",
                "SHIP_R004"
            ],
            "createdAt": "2026-03-21T10:46:26.215Z"
        },
        "totalCbBefore": 27483119.999998074,
        "totalCbAfter": 27483119.999998074,
        "transfers": [
            {
                "fromShipId": "SHIP_R004",
                "toShipId": "SHIP_R002",
                "amount": 6.854534149169922e-7
            }
        ],
        "members": [
            {
                "poolId": "pool-1774089986212",
                "shipId": "SHIP_R002",
                "year": 2025,
                "cbBefore": -6.854534149169922e-7,
                "cbAfter": 0
            },
            {
                "poolId": "pool-1774089986212",
                "shipId": "SHIP_R004",
                "year": 2025,
                "cbBefore": 27483119.99999876,
                "cbAfter": 27483119.999998074
            }
        ]
    }
}
```

### 5) Get Bank Apply Summary

**Request:**

```bash
curl -X GET "http://localhost:3000/banking/apply-summary?shipId=SHIP_R002&year=2025"
```

**Response:**

```json
{
    "success": true,
    "data": {
        "shipId": "SHIP_R002",
        "year": 2024,
        "cbBefore": 263082239.9999993,
        "applied": 0,
        "cbAfter": 263082239.9999993
    }
}
```

## Frontend UI Overview

### Routes Tab
- Displays all routes with GHG intensity, baseline comparison, and compliance status.

### Compliance Tab
- Shows compliance balance, target intensity, and actual intensity.

### Banking Tab
- **Bank Positive CB**: Bank surplus compliance balance to later years.
- **Apply Banked Surplus**: Apply previously banked surplus to cover deficit.
- Cards display: `cb_before`, `applied` (total sum), and `cb_after`.

### Pooling Tab
- Select multiple ships and create a pool for the selected year.
- Validates pool rules: no deficit worsening, surplus stays non-negative.
- Displays ship balances before/after pool and transfers between ships.

### Compare Tab
- Compare routes by GHG intensity, show percent difference vs. baseline.
- Highlight compliant/non-compliant routes.
