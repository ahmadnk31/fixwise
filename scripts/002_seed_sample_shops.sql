-- Insert sample repair shops for testing
-- Note: These shops have no owner_id initially and can be claimed by shop owners later

INSERT INTO public.repair_shops (name, email, phone, address, latitude, longitude, expertise, price_range, rating)
VALUES
  (
    'TechFix Pro',
    'contact@techfixpro.com',
    '555-0101',
    '123 Main St, San Francisco, CA 94102',
    37.7749,
    -122.4194,
    ARRAY['iPhone', 'Samsung', 'Screen Repair', 'Battery Replacement'],
    '$$',
    4.5
  ),
  (
    'Mobile Medics',
    'info@mobilemedics.com',
    '555-0102',
    '456 Market St, San Francisco, CA 94103',
    37.7849,
    -122.4094,
    ARRAY['iPhone', 'iPad', 'MacBook', 'Water Damage'],
    '$$$',
    4.8
  ),
  (
    'Quick Fix Electronics',
    'hello@quickfix.com',
    '555-0103',
    '789 Mission St, San Francisco, CA 94104',
    37.7649,
    -122.4294,
    ARRAY['Android', 'Laptop', 'Tablet', 'Data Recovery'],
    '$',
    4.2
  ),
  (
    'Repair Hub',
    'support@repairhub.com',
    '555-0104',
    '321 Valencia St, San Francisco, CA 94110',
    37.7649,
    -122.4214,
    ARRAY['iPhone', 'Samsung', 'Google Pixel', 'Screen Repair'],
    '$$',
    4.6
  );
