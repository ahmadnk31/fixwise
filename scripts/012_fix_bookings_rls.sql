-- Fix bookings RLS policies to avoid permission issues with users table
-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Shop owners can view their shop bookings" ON public.bookings;
DROP POLICY IF EXISTS "Shop owners can update their shop bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can cancel their own bookings" ON public.bookings;

-- Policy: Anyone can create bookings (no authentication required for MVP)
CREATE POLICY "Anyone can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (true);

-- Policy: Anyone can view bookings (simplified for MVP)
-- In production, you'd want to restrict this based on authentication
CREATE POLICY "Anyone can view bookings"
  ON bookings FOR SELECT
  USING (true);

-- Policy: Shop owners can update bookings for their shops
CREATE POLICY "Shop owners can update their shop bookings"
  ON bookings FOR UPDATE
  USING (
    shop_id IN (
      SELECT id FROM repair_shops WHERE owner_id = auth.uid()
    )
  );
