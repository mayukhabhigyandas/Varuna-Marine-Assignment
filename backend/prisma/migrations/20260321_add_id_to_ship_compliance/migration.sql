DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM information_schema.tables
		WHERE table_schema = 'public' AND table_name = 'ship_compliance'
	) THEN
		ALTER TABLE "ship_compliance" ADD COLUMN IF NOT EXISTS "id" BIGSERIAL;
		ALTER TABLE "ship_compliance" DROP CONSTRAINT IF EXISTS "ComplianceRecord_pkey";
		ALTER TABLE "ship_compliance" DROP CONSTRAINT IF EXISTS "ship_compliance_pkey";
		ALTER TABLE "ship_compliance" ADD CONSTRAINT "ship_compliance_pkey" PRIMARY KEY ("id");
		CREATE UNIQUE INDEX IF NOT EXISTS "ship_compliance_shipId_year_key"
			ON "ship_compliance"("shipId", "year");
	ELSIF EXISTS (
		SELECT 1
		FROM information_schema.tables
		WHERE table_schema = 'public' AND table_name = 'ComplianceRecord'
	) THEN
		ALTER TABLE "ComplianceRecord" ADD COLUMN IF NOT EXISTS "id" BIGSERIAL;
		ALTER TABLE "ComplianceRecord" DROP CONSTRAINT IF EXISTS "ComplianceRecord_pkey";
		ALTER TABLE "ComplianceRecord" DROP CONSTRAINT IF EXISTS "ship_compliance_pkey";
		ALTER TABLE "ComplianceRecord" ADD CONSTRAINT "ship_compliance_pkey" PRIMARY KEY ("id");
		CREATE UNIQUE INDEX IF NOT EXISTS "ship_compliance_shipId_year_key"
			ON "ComplianceRecord"("shipId", "year");
	ELSE
		RAISE EXCEPTION 'Neither ship_compliance nor ComplianceRecord exists for migration 20260321_add_id_to_ship_compliance';
	END IF;
END $$;
