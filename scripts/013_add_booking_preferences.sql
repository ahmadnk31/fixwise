-- Add booking preferences to repair_shops table
ALTER TABLE public.repair_shops
ADD COLUMN IF NOT EXISTS booking_preferences JSONB DEFAULT '{
  "max_bookings_per_day": 10,
  "max_bookings_per_slot": 1,
  "working_hours": {
    "start": "09:00",
    "end": "17:00"
  },
  "slot_duration_minutes": 30,
  "buffer_time_minutes": 15,
  "advance_booking_days": 30,
  "same_day_booking_allowed": true,
  "auto_confirm": false,
  "require_phone": false
}'::jsonb;

-- Create index for booking preferences queries
CREATE INDEX IF NOT EXISTS idx_repair_shops_booking_prefs ON public.repair_shops USING GIN (booking_preferences);

