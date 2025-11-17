import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

// Use globalThis to persist the client across hot module reloads
const globalForSupabase = globalThis as unknown as {
  supabaseClient: SupabaseClient | undefined
}

export function createClient() {
  if (globalForSupabase.supabaseClient) {
    return globalForSupabase.supabaseClient
  }

  const client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  globalForSupabase.supabaseClient = client
  return client
}
