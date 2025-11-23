-- Add opening and closing hours to repair_shops table
ALTER TABLE public.repair_shops
ADD COLUMN IF NOT EXISTS opening_hours JSONB DEFAULT '{
  "monday": {"open": "09:00", "close": "17:00", "closed": false},
  "tuesday": {"open": "09:00", "close": "17:00", "closed": false},
  "wednesday": {"open": "09:00", "close": "17:00", "closed": false},
  "thursday": {"open": "09:00", "close": "17:00", "closed": false},
  "friday": {"open": "09:00", "close": "17:00", "closed": false},
  "saturday": {"open": "09:00", "close": "17:00", "closed": false},
  "sunday": {"open": "09:00", "close": "17:00", "closed": false}
}'::jsonb;

-- Create index for opening hours queries
CREATE INDEX IF NOT EXISTS idx_repair_shops_opening_hours ON public.repair_shops USING GIN (opening_hours);

