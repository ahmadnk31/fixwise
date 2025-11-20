-- Ensure admin users can bypass standard RLS policies

-- Users table policies
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own data" ON public.users;

CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can insert their own data" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id OR public.is_admin());

-- Repair shops policies
DROP POLICY IF EXISTS "Shop owners can update their own shops" ON public.repair_shops;
DROP POLICY IF EXISTS "Shop owners can insert their own shops" ON public.repair_shops;
DROP POLICY IF EXISTS "Shop owners can delete their own shops" ON public.repair_shops;

CREATE POLICY "Shop owners can update their own shops" ON public.repair_shops
  FOR UPDATE USING (auth.uid() = owner_id OR public.is_admin());

CREATE POLICY "Shop owners can insert their own shops" ON public.repair_shops
  FOR INSERT WITH CHECK (auth.uid() = owner_id OR public.is_admin());

CREATE POLICY "Shop owners can delete their own shops" ON public.repair_shops
  FOR DELETE USING (auth.uid() = owner_id OR public.is_admin());

-- Leads policies
DROP POLICY IF EXISTS "Shop owners can view leads for their shops" ON public.leads;
DROP POLICY IF EXISTS "Shop owners can update leads for their shops" ON public.leads;

CREATE POLICY "Shop owners can view leads for their shops" ON public.leads
  FOR SELECT USING (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.repair_shops
      WHERE repair_shops.id = leads.shop_id
        AND repair_shops.owner_id = auth.uid()
    )
  );

CREATE POLICY "Shop owners can update leads for their shops" ON public.leads
  FOR UPDATE USING (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.repair_shops
      WHERE repair_shops.id = leads.shop_id
        AND repair_shops.owner_id = auth.uid()
    )
  );

-- Shop products policies
DROP POLICY IF EXISTS "Shop owners can insert their products" ON public.shop_products;
DROP POLICY IF EXISTS "Shop owners can update their products" ON public.shop_products;
DROP POLICY IF EXISTS "Shop owners can delete their products" ON public.shop_products;

CREATE POLICY "Shop owners can insert their products"
ON public.shop_products FOR INSERT
WITH CHECK (
  public.is_admin() OR
  EXISTS (
    SELECT 1 FROM public.repair_shops
    WHERE repair_shops.id = shop_products.shop_id
      AND repair_shops.owner_id = auth.uid()
  )
);

CREATE POLICY "Shop owners can update their products"
ON public.shop_products FOR UPDATE
USING (
  public.is_admin() OR
  EXISTS (
    SELECT 1 FROM public.repair_shops
    WHERE repair_shops.id = shop_products.shop_id
      AND repair_shops.owner_id = auth.uid()
  )
);

CREATE POLICY "Shop owners can delete their products"
ON public.shop_products FOR DELETE
USING (
  public.is_admin() OR
  EXISTS (
    SELECT 1 FROM public.repair_shops
    WHERE repair_shops.id = shop_products.shop_id
      AND repair_shops.owner_id = auth.uid()
  )
);

-- Bookings policy (updates)
DROP POLICY IF EXISTS "Shop owners can update their shop bookings" ON public.bookings;

CREATE POLICY "Shop owners can update their shop bookings"
  ON public.bookings FOR UPDATE
  USING (
    public.is_admin() OR
    shop_id IN (
      SELECT id FROM public.repair_shops WHERE owner_id = auth.uid()
    )
  );

