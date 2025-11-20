-- Restrict standard shop owners to a single shop while allowing admins to manage many

DROP POLICY IF EXISTS "Shop owners can insert their own shops" ON public.repair_shops;

CREATE POLICY "Shop owners can insert their own shops" ON public.repair_shops
  FOR INSERT
  WITH CHECK (
    public.is_admin() OR (
      auth.uid() = owner_id
      AND NOT EXISTS (
        SELECT 1 FROM public.repair_shops
        WHERE owner_id = auth.uid()
      )
    )
  );

