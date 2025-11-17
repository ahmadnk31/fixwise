-- Add business details columns to repair_shops table for EU compliance
ALTER TABLE repair_shops
ADD COLUMN IF NOT EXISTS business_name TEXT,
ADD COLUMN IF NOT EXISTS vat_number TEXT,
ADD COLUMN IF NOT EXISTS company_registration TEXT,
ADD COLUMN IF NOT EXISTS business_address TEXT,
ADD COLUMN IF NOT EXISTS business_country TEXT,
ADD COLUMN IF NOT EXISTS vat_validated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS business_type TEXT; -- 'individual', 'company', etc.

-- Add index for VAT number lookups
CREATE INDEX IF NOT EXISTS idx_repair_shops_vat_number ON repair_shops(vat_number);

COMMENT ON COLUMN repair_shops.business_name IS 'Legal business name';
COMMENT ON COLUMN repair_shops.vat_number IS 'EU VAT identification number';
COMMENT ON COLUMN repair_shops.company_registration IS 'Company registration number';
COMMENT ON COLUMN repair_shops.business_address IS 'Registered business address';
COMMENT ON COLUMN repair_shops.business_country IS 'ISO country code (e.g., DE, FR, IT)';
COMMENT ON COLUMN repair_shops.vat_validated IS 'Whether VAT number has been validated via VIES';
COMMENT ON COLUMN repair_shops.business_type IS 'Type of business entity';
