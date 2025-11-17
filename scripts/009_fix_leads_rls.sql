-- Drop and recreate RLS policies for leads table to fix permission issues

-- Drop existing policies
DROP POLICY IF EXISTS "Shop owners can view leads for their shops" ON public.leads;
DROP POLICY IF EXISTS "Anyone can create leads" ON public.leads;
DROP POLICY IF EXISTS "Shop owners can update leads for their shops" ON public.leads;

-- Recreate policies with correct permissions

-- Allow anyone to create leads (no authentication required for MVP)
CREATE POLICY "Anyone can create leads" ON public.leads
  FOR INSERT 
  WITH CHECK (true);

-- Shop owners can view leads for their shops
CREATE POLICY "Shop owners can view leads for their shops" ON public.leads
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.repair_shops
      WHERE repair_shops.id = leads.shop_id
      AND repair_shops.owner_id = auth.uid()
    )
  );

-- Shop owners can update leads for their shops
CREATE POLICY "Shop owners can update leads for their shops" ON public.leads
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.repair_shops
      WHERE repair_shops.id = leads.shop_id
      AND repair_shops.owner_id = auth.uid()
    )
  );

-- Verify RLS is enabled
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
