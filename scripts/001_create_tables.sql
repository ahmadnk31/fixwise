-- Create users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'shop')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create repair_shops table
CREATE TABLE IF NOT EXISTS public.repair_shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  expertise TEXT[] DEFAULT '{}',
  price_range TEXT,
  rating DECIMAL(3, 2) DEFAULT 0.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create diagnoses table
CREATE TABLE IF NOT EXISTS public.diagnoses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  user_input TEXT NOT NULL,
  ai_response JSONB NOT NULL,
  photo_url TEXT,
  estimated_cost TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create leads table
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnosis_id UUID NOT NULL REFERENCES public.diagnoses(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES public.repair_shops(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'completed')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repair_shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own data" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for repair_shops table
CREATE POLICY "Anyone can view repair shops" ON public.repair_shops
  FOR SELECT USING (true);

CREATE POLICY "Shop owners can update their own shops" ON public.repair_shops
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Shop owners can insert their own shops" ON public.repair_shops
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Shop owners can delete their own shops" ON public.repair_shops
  FOR DELETE USING (auth.uid() = owner_id);

-- RLS Policies for diagnoses table
CREATE POLICY "Anyone can view diagnoses" ON public.diagnoses
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert diagnoses" ON public.diagnoses
  FOR INSERT WITH CHECK (true);

-- RLS Policies for leads table
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_repair_shops_location ON public.repair_shops(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_repair_shops_owner ON public.repair_shops(owner_id);
CREATE INDEX IF NOT EXISTS idx_diagnoses_user ON public.diagnoses(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_shop ON public.leads(shop_id);
CREATE INDEX IF NOT EXISTS idx_leads_diagnosis ON public.leads(diagnosis_id);
