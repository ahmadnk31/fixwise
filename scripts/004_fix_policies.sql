-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own data" ON public.users;

DROP POLICY IF EXISTS "Anyone can view repair shops" ON public.repair_shops;
DROP POLICY IF EXISTS "Shop owners can update their own shops" ON public.repair_shops;
DROP POLICY IF EXISTS "Shop owners can insert their own shops" ON public.repair_shops;
DROP POLICY IF EXISTS "Shop owners can delete their own shops" ON public.repair_shops;

DROP POLICY IF EXISTS "Anyone can view diagnoses" ON public.diagnoses;
DROP POLICY IF EXISTS "Anyone can insert diagnoses" ON public.diagnoses;

DROP POLICY IF EXISTS "Shop owners can view leads for their shops" ON public.leads;
DROP POLICY IF EXISTS "Anyone can create leads" ON public.leads;
DROP POLICY IF EXISTS "Shop owners can update leads for their shops" ON public.leads;

-- Recreate RLS Policies for users table
CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own data" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Recreate RLS Policies for repair_shops table
CREATE POLICY "Anyone can view repair shops" ON public.repair_shops
  FOR SELECT USING (true);

CREATE POLICY "Shop owners can update their own shops" ON public.repair_shops
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Shop owners can insert their own shops" ON public.repair_shops
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Shop owners can delete their own shops" ON public.repair_shops
  FOR DELETE USING (auth.uid() = owner_id);

-- Recreate RLS Policies for diagnoses table
CREATE POLICY "Anyone can view diagnoses" ON public.diagnoses
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert diagnoses" ON public.diagnoses
  FOR INSERT WITH CHECK (true);

-- Recreate RLS Policies for leads table
CREATE POLICY "Shop owners can view leads for their shops" ON public.leads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.repair_shops
      WHERE repair_shops.id = leads.shop_id
      AND repair_shops.owner_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can create leads" ON public.leads
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Shop owners can update leads for their shops" ON public.leads
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.repair_shops
      WHERE repair_shops.id = leads.shop_id
      AND repair_shops.owner_id = auth.uid()
    )
  );
