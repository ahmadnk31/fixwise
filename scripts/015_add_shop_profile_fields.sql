-- Add shop profile fields to repair_shops table
ALTER TABLE repair_shops
ADD COLUMN IF NOT EXISTS profile_image TEXT,
ADD COLUMN IF NOT EXISTS gallery_images TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS social_media JSONB DEFAULT '{}';

COMMENT ON COLUMN repair_shops.profile_image IS 'URL to shop profile image';
COMMENT ON COLUMN repair_shops.gallery_images IS 'Array of URLs to shop gallery images';
COMMENT ON COLUMN repair_shops.bio IS 'Short bio/about section for the shop';
COMMENT ON COLUMN repair_shops.description IS 'Detailed description of the shop and services';
COMMENT ON COLUMN repair_shops.social_media IS 'JSON object with social media links (e.g., {facebook: "", instagram: "", twitter: "", website: ""})';

