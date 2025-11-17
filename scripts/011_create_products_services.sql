-- Create products/services table
CREATE TABLE IF NOT EXISTS public.shop_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.repair_shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'product' or 'service'
  type TEXT, -- e.g., 'screen_repair', 'battery_replacement', 'phone_case', etc.
  price NUMERIC(10, 2),
  image_url TEXT,
  in_stock BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.shop_products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can view products" ON public.shop_products;
DROP POLICY IF EXISTS "Shop owners can insert their products" ON public.shop_products;
DROP POLICY IF EXISTS "Shop owners can update their products" ON public.shop_products;
DROP POLICY IF EXISTS "Shop owners can delete their products" ON public.shop_products;

-- Create policies
CREATE POLICY "Anyone can view products"
ON public.shop_products FOR SELECT
TO public
USING (true);

CREATE POLICY "Shop owners can insert their products"
ON public.shop_products FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.repair_shops
    WHERE repair_shops.id = shop_id
    AND repair_shops.owner_id = auth.uid()
  )
);

CREATE POLICY "Shop owners can update their products"
ON public.shop_products FOR UPDATE
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.repair_shops
    WHERE repair_shops.id = shop_id
    AND repair_shops.owner_id = auth.uid()
  )
);

CREATE POLICY "Shop owners can delete their products"
ON public.shop_products FOR DELETE
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.repair_shops
    WHERE repair_shops.id = shop_id
    AND repair_shops.owner_id = auth.uid()
  )
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_shop_products_shop_id ON public.shop_products(shop_id);
