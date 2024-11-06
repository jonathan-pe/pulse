import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Create a supabase client on the browser with project's credentials
  console.log(process.env)
  return createBrowserClient(
    process.env.SUPABASE_PUBLIC_URL!,
    process.env.SUPABASE_PUBLIC_ANON_KEY!
  )
}