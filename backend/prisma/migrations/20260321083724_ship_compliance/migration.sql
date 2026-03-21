-- Legacy compatibility migration.
-- On a fresh migration chain, ship_compliance does not exist yet at this point,
-- so this step must be a no-op to keep shadow DB creation stable.
DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM information_schema.tables
		WHERE table_schema = 'public' AND table_name = 'ship_compliance'
	) THEN
		IF EXISTS (
			SELECT 1
			FROM information_schema.table_constraints
			WHERE table_schema = 'public'
				AND table_name = 'ship_compliance'
				AND constraint_name = 'ComplianceRecord_pkey'
		) THEN
			ALTER TABLE "ship_compliance"
			RENAME CONSTRAINT "ComplianceRecord_pkey" TO "ship_compliance_pkey";
		END IF;
	END IF;
END $$;
