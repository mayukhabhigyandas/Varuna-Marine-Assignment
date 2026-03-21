-- Keep this migration idempotent and compatible with PostgreSQL variants.
-- SERIAL is not a real type for ALTER COLUMN and can fail in some environments.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'ship_compliance'
  ) THEN
    -- Ensure id remains bigint-backed and primary keyed.
    ALTER TABLE "ship_compliance" ALTER COLUMN "id" TYPE BIGINT;

    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.table_constraints
      WHERE table_schema = 'public'
        AND table_name = 'ship_compliance'
        AND constraint_name = 'ship_compliance_pkey'
    ) THEN
      ALTER TABLE "ship_compliance"
      ADD CONSTRAINT "ship_compliance_pkey" PRIMARY KEY ("id");
    END IF;
  END IF;
END $$;
