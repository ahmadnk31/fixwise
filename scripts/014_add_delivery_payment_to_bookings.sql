-- Add delivery option and payment amount to bookings table
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS delivery_option TEXT CHECK (delivery_option IN ('pickup', 'delivery', 'mail')),
ADD COLUMN IF NOT EXISTS payment_amount NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS delivery_address TEXT;

-- Add index for delivery option queries
CREATE INDEX IF NOT EXISTS idx_bookings_delivery_option ON public.bookings(delivery_option);

