# FixWise - AI-Powered Repair Diagnosis Platform

An AI-powered SaaS platform that helps users diagnose phone and laptop issues using OpenAI, then connects them with trusted local repair shops.

## Features

- **AI Diagnosis**: Uses OpenAI GPT-4o-mini via Vercel AI SDK to analyze device issues
- **Image Upload**: Users can upload photos of their broken devices for better diagnosis
- **Shop Directory**: Browse and search local repair shops with Google Maps integration
- **Shop Owner Portal**: Repair shop owners can manage their listings and view leads
- **Lead Management**: Connect users with repair shops and track repair requests

## Tech Stack

- **Frontend**: Next.js 16, TypeScript, TailwindCSS, ShadCN UI
- **Backend**: Supabase (Auth, Database, Storage)
- **AI**: Vercel AI SDK with OpenAI GPT-4o-mini
- **Maps**: Google Maps JavaScript API
- **Deployment**: Vercel

## Setup Instructions

### 1. Environment Variables

The following environment variables are already configured through Vercel integrations:

- Supabase (database, auth, storage)
- Google Maps API for location services
- Vercel Blob for file storage

### 2. Google Maps Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Places API
4. Create credentials (API Key)
5. Add the API key to your Vercel project environment variables

### 3. Run Database Scripts

Execute the SQL scripts in order from the `scripts/` folder:

1. `001_create_tables.sql` - Creates database schema
2. `002_seed_sample_shops.sql` - Adds sample repair shops
3. `003_create_user_trigger.sql` - Auto-creates user profiles
4. `004_fix_policies.sql` - Sets up Row Level Security
5. `005_backfill_users.sql` - Backfills existing users
6. `006_create_storage_bucket.sql` - Creates image storage bucket

### 4. Deploy

Deploy to Vercel:

\`\`\`bash
vercel deploy
\`\`\`

## Usage

### For Users

1. Visit the homepage
2. Describe your device issue in the diagnosis form
3. Optionally upload a photo of the problem
4. Get instant AI diagnosis with cost estimates
5. Click "Find Repair Shops" to see nearby options
6. Contact shops directly or create a lead

### For Shop Owners

1. Sign up for an account at `/auth/sign-up`
2. Complete your shop profile at `/shop/settings`
3. View incoming leads at `/shop/dashboard`
4. Update lead status as you process requests

## Database Schema

- **users**: User profiles (linked to Supabase Auth)
- **repair_shops**: Repair shop listings with location data
- **diagnoses**: AI diagnosis results with user input
- **leads**: Connection between diagnoses and repair shops

## API Routes

- `POST /api/diagnose` - Get AI diagnosis for device issue
- `POST /api/leads` - Create a lead for a repair shop
- `PATCH /api/leads/[id]` - Update lead status

## License

MIT
