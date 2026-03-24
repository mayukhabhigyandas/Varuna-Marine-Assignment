# AI Agent Workflow Log

## Agents Used

- **GitHub Copilot** (Claude Haiku 4.5): Used for code generation, implementation, refactoring, and technical debugging throughout the session.
- **ChatGPT 5.3**: Used for clarifying assignment requirements, understanding domain definitions (compliance balance, banking rules, pooling semantics), and validating business logic constraints.

### Agent Workflow Integration

**ChatGPT 5.3** → **GitHub Copilot** → **Verification Loop**:
1. **ChatGPT 5.3** clarified business requirements (e.g., "what does banking mean in shipping compliance?", "how do pools work?")
2. **GitHub Copilot** converted those clarified requirements into implementation (types, services, routes)
3. **Copilot** validated against tests and typecheck to ensure correctness

**Example Flow**:
- User asks: "Make CB_BEFORE show real CB and applied show total sum"
- ChatGPT 5.3 clarifies: Real CB = current compliance balance from compliance record; applied = cumulative sum of all apply snapshots for that year
- Copilot generates: `getApplySummary()` method aggregating real CB + cumulative applied
- Copilot validates: Tests pass, no TypeErrors, builds successfully

## Prompts & Outputs

### Example 1: Banking Snapshot Schema and Migration

**Prompt:**
```
Make schema store cbBefore, cbAfter, and applied, and show in UI
```

**Generated Output:**

Backend Prisma Model:
```prisma
model BankApplySnapshot {
  id        String   @id @default(uuid())
  shipId    String
  year      Int
  cbBefore  Float
  applied   Float
  cbAfter   Float
  createdAt DateTime @default(now())

  @@index([shipId, year, createdAt])
}

```

Frontend Entity Type:
```typescript
export interface ApplySummary {
  shipId: string;
  year: number;
  cbBefore: bigint;
  applied: bigint;
  cbAfter: bigint;
}
```

Repository Method (Postgres Adapter):
```typescript
async sumAppliedSnapshots(shipId: string, year: number): Promise<number> {
    const result = await this.prisma.bankApplySnapshot.aggregate({
      where: { shipId, year },
      _sum: { applied: true },
    });

    return result._sum.applied ?? 0;
  }
```

**Result:** Successfully implemented persistent storage of banking snapshots across all layers—schema, DB migration, backend service, and frontend UI binding.

---

### Example 2: Banking Semantics Alignment (Real CB + Cumulative Applied)

**Prompt:**
```
Make code such that CB_BEFORE is real CB and applied is total sum applied. In pooling cbBefore and cbAfter should be same as banking page.
```

**Generated Banking Service Method:**
```typescript
async getApplySummary(shipId: string, year: number) {
    const cbRecord = await this.complianceService.getOrComputeComplianceBalance(shipId, year);
    const totalApplied = await this.bankRepository.sumAppliedSnapshots(shipId, year);

    return {
      shipId,
      year,
      cbBefore: cbRecord.complianceBalance,
      applied: totalApplied,
      cbAfter: cbRecord.complianceBalance + totalApplied,
    };
  }
```

**New HTTP Endpoint:**
```typescript
// createHttpRouter.ts
router.get(
    "/banking/apply-summary",
    wrap(async (req, res) => {
      const shipId = requireQueryString(req.query.shipId, "shipId");
      const year = requireInteger(req.query.year, "year");

      const summary = await services.bankingService.getApplySummary(shipId, year);
      res.json({ success: true, data: summary });
    }),
  );
```

**Frontend Hook Update (useBankingTab.ts):**
```typescript
// Before: used getLatestBankApply()
// After: uses getBankApplySummary()
  const applySummary = await service.getBankApplySummary(shipId, year);//not the exact code but similar to show 
  const cbBefore = applySummary?.cbBefore ?? compliance?.complianceBalance ?? 0;
  const applied = applySummary?.applied ?? 0;
  const cbAfter = applySummary?.cbAfter ?? cbBefore;
  const currentBalance = cbAfter;
```

**Pooling Alignment (usePoolingTab.ts):**
```typescript
// Changed from: complianceService.getComplianceBalance()
// To: bankingService.getBankApplySummary()
// Now pooling uses same effective balance as banking page
```

**Validation:**
- Ran integration test `httpRoutes.test.ts` to verify `/banking/apply-summary` returns correct values.
- Verified pooling calculations use apply-summary baseline, ensuring consistent CB across pages.
- Build and typecheck passed (0 errors).

**Result:** Unified CB semantics across Banking and Pooling pages—both now use `cbBefore` (real compliance balance) + `applied` (cumulative applied sum) = `cbAfter` (effective balance).

---

### Example 3: Pool Duplicate Prevention

**Prompt:**
```
Create pool should not be again clickable or same ships in same year
```

**Backend Validation (poolService.ts):**
```typescript
async createPool(input: CreatePoolInput){
  // Normalize ship IDs for order-independent comparison
  const uniqueShipIds = normalizeShipSet(input.shipIds);
    if (uniqueShipIds.length === 0) {
      throw new DomainError("shipIds cannot be empty", 400);
    }

    const existingPools = await this.poolRepository.listByYear(input.year);
    const duplicateExists = existingPools.some((pool) => {
      const existingShipIds = normalizeShipSet(pool.shipIds);
      if (existingShipIds.length !== uniqueShipIds.length) {
        return false;
      }

      return existingShipIds.every((shipId, index) => shipId === uniqueShipIds[index]);
    });

    if (duplicateExists) {
      throw new DomainError("Pool already exists for the same ships in this year", 400);
    }
  // ... proceed with pool creation
}
```

**Frontend UI Disable (usePoolingTab.ts & PoolingTab.tsx):**
```typescript
const [hasCreatedCurrentSelection, setHasCreatedCurrentSelection] = useState(false);

const handleCreatePool = async () => {
  const result = await poolService.createPool(selectedShips, year);
  setHasCreatedCurrentSelection(true); // Disable button after creation
}; //I have implemented using useMemo but behaviour is same

// In UI:
<button disabled={hasCreatedCurrentSelection}>Create Pool</button>
<p>{hasCreatedCurrentSelection && "Pool already created for these ships in this year"}</p>
```

**Validation:**
- Added unit test checking that duplicate pool returns error.
- Tested via frontend: create pool → button disables → cannot re-create same combination.
- Ran `npm run test:unit` — pool duplicate test passed.

**Result:** Duplicate pools prevented at both API level (error) and UI level (button disabled with user message).

---

### Example 4: Database Schema Refactoring (Table Rename + ID Addition)

**Prompt:**
```
Change the table name ComplianceRecord to ship_compliance
Add id column in table ship_compliance
```

**Generated Prisma Schema Changes:**
```prisma
model ComplianceRecord {
  id        Int    @id @default(autoincrement())
  shipId    String
  year      Int
  targetIntensity Float
  actualIntensity Float
  energyInScopeMj BigInt
  complianceBalance Int
  createdAt DateTime  @default(now())

  @@unique([shipId, year])
  @@map("ship_compliance")
}
```

**Generated Migrations:**

Migration 1 - Table Rename (with idempotency):
```sql
DO $$ BEGIN
  ALTER TABLE "ComplianceRecord" RENAME TO "ship_compliance";
EXCEPTION WHEN undefined_table THEN
  NULL;
END $$;
```

Migration 2 - Add ID Column (with idempotency):
```sql
DO $$ BEGIN
  ALTER TABLE "ship_compliance" ADD COLUMN "id" BIGSERIAL PRIMARY KEY;
EXCEPTION WHEN duplicate_column THEN
  NULL;
END $$;
```

**Issues Encountered & Corrections:**

Initial error: P3006 (Migration failed due to shadow DB replay)
- **Problem:** Migrations assumed table state that wasn't guaranteed in fresh shadow DB.
- **Fix:** Wrapped SQL in `DO $$...IF EXISTS...END $$` blocks with exception handling for idempotency.

Refined idempotent migration:
```sql
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ship_compliance') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='ship_compliance' AND column_name='id') THEN
      ALTER TABLE "ship_compliance" ADD COLUMN "id" BIGSERIAL PRIMARY KEY;
    END IF;
  END IF;
END $$;
```

**Validation:**
- Ran `npx prisma migrate deploy` successfully.
- Verified schema in Supabase: `ship_compliance` table created with `id` PK and `(shipId, year)` unique constraint.
- Ran `npm run test:data` — schema and seed tests passed.

**Result:** Database refactoring completed successfully with safe, replayable migrations.

---

## Validation / Corrections

### Correction 1: Backend Service Wiring After Schema Change

**Issue Found:** After updating poolService to depend on bankingService, the service composition in `buildServices.ts` needed updating.

**Original Code:**
```typescript
const poolService = new PoolService(
  complianceService,   // Wrong: was raw compliance, not banking
  poolRepo
);
```

**Corrected Code:**
```typescript
const poolService = new PoolService(
  bankingService,      // Correct: now uses apply-aware service
  poolRepo
);
```

**Validation:** Ran build and typecheck; 0 errors.

---

### Correction 2: Prisma Migration Idempotency

**Issue Found:** Initial migration used direct ALTER TABLE without existence checks, causing P3006 errors on shadow DB replay.

**Original Migration (20260321090000_id.sql):**
```sql
ALTER TABLE "ComplianceRecord" ADD COLUMN "id" BIGSERIAL PRIMARY KEY;
```

**Corrected Migration:**
```sql
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ship_compliance') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='ship_compliance' AND column_name='id') THEN
      ALTER TABLE "ship_compliance" ADD COLUMN "id" BIGSERIAL PRIMARY KEY;
    END IF;
  END IF;
END $$;
```

**Validation:** Ran `prisma migrate deploy` and `prisma generate` successfully; no P3006 errors.

---

## Observations

### Where Agent Saved Time

1. **Boilerplate Generation**: Generated complete Prisma models, repository methods, and TypeScript interfaces without manual scaffolding.
   - Example: BankApplySnapshot model + repository implementations generated in seconds.
   - Saved ~30 minutes of manual typing and structure setup.

2. **Service Layer Abstraction**: Automatically created proper layering (ports → adapters → infrastructure) without violations.
   - Frontend service methods properly delegated through ports/adapters.
   - All dependency injections aligned with hexagonal architecture.

3. **Error Handling & Validation**: Intelligently added validation at both API and UI layers.
   - Apply-block constraint implemented as backend error + frontend disable.
   - Pool duplicate check implemented at both DB and app logic levels (defense in depth).

4. **Pattern Recognition**: When given "align pooling with banking," agent immediately understood to change the CB baseline source across multiple files.
   - Single concept ("use apply-summary") translated to coordinated changes across 4+ files.
   - Saved manual tracing of dependencies.

5. **Test Integration**: Generated unit tests and integration tests that match existing patterns.
   - New tests follow Vitest conventions already in use.
   - Mocks properly structured for repository layer.

### Where Agent Failed or Hallucinated

1. **Prisma Migration Safety (Initial)**: First migration attempt did not account for shadow DB replay order.
   - Generated: Simple `ALTER TABLE` statements.
   - Reality: Required idempotent DO blocks with IF EXISTS checks for Prisma validate to pass.
   - **Resolution**: Manual intervention to add defensive SQL; agent then correctly applied corrections on second request.

2. **Incomplete Type Coverage**: Frontend entity types initially missed `ApplySummary` interface.
   - Generated: Port methods without corresponding domain entity.
   - Reality: Frontend needed explicit `ApplySummary` interface matching service contract.
   - **Resolution**: Requested type definition; agent added it immediately and wired through layers.

### How Agent Combined Tools Effectively

1. **Read + Analyze + Generate Cycle**:
   - Used read_file to understand existing patterns (e.g., existing service signatures).
   - Analyzed patterns (e.g., how complianceService is structured).
   - Generated new code mirroring the same patterns consistently.
   - Result: All new code felt native to existing codebase.

2. **Multi-File Coordination**:
   - Understood dependencies (bankingService depends on complianceService, poolService depends on both).
   - Updated all 5+ files in coordinated batch to maintain consistency.
   - Used multi-replace operations to apply changes simultaneously.
   - Result: No broken imports or type mismatches across refactoring.

3. **Validation Loop**:
   - Generated code → ran tests in terminal → interpreted results → refined code.
   - Example: Migration error → analyzed Prisma docs → revised with idempotency → re-deployed successfully.
   - Never assumed a change was correct; validated after each step.

4. **Documentation as Specification**:
   - Added README examples AFTER implementation.
   - Used examples to verify behavior matched documented contract.
   - Example: cURL request in README served as acceptance test for endpoint.

---

## Best Practices Followed

### 1. **Hexagonal Architecture Consistency**
- **Practice**: All new features respect layers (domain → application → ports → adapters → infrastructure).
- **Example**: BankApplySnapshot added as domain model → ported via repository interface → implemented in Postgres adapter → wired in service layer.
- **Benefit**: New code integrates seamlessly with existing structure; no shortcuts or shortcuts.

### 2. **Test-Driven Validation**
- **Practice**: Generated unit tests alongside implementation; ran tests before declaring work complete.
- **Example**: Pool duplicate test added → verified test fails before guard → verified test passes after guard implemented.
- **Benefit**: Catch bugs early; proofs of correctness.

### 3. **Unified Data Sources**
- **Practice**: When same data represented multiple places, consolidated to single source of truth.
- **Example**: Instead of banking showing raw CB and pooling showing projected CB, both now use apply-summary.
- **Benefit**: Eliminates user confusion from inconsistent UI; single source to test and verify.

### 4. **Clear Documentation with Examples**
- **Practice**: README includes working cURL examples, expected responses, and UI descriptions.
- **Example**: `/banking/apply-summary` endpoint documented with request/response payloads.
- **Benefit**: Onboarding faster; fewer support questions.

### 5. **Defensive Validation (Backend + Frontend)**
- **Practice**: Critical constraints checked at both API level (error) and UI level (disable/message).
- **Example**: Apply-block checked in service (error) and hook (button disabled).
- **Benefit**: Prevents accidental invalid state; better UX from early feedback.

### 6. **Type Safety Throughout**
- **Practice**: Full TypeScript; no `any` types; explicit interfaces for all contracts.
- **Example**: `ApplySummary` interface defined and used consistently across FE/BE.
- **Benefit**: Compiler catches issues; refactoring is safe.

---

