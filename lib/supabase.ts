import { createClient } from '@supabase/supabase-js'

// Environment variables ile güvenli konfigürasyon
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sbityfrhgfqhebssljtk.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Service role key SADECE server-side'da kullanılır ve environment variable'dan okunur
const supabaseServiceKey = typeof window === 'undefined' 
  ? process.env.SUPABASE_SERVICE_ROLE_KEY
  : undefined

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables! NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Service role client (admin işlemler için - sadece server-side)
// Client-side'da supabaseServiceKey undefined olabilir, bu normal
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : supabase // Fallback olarak normal client kullan (client-side için)

