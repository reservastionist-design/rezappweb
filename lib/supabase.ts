import { createClient } from '@supabase/supabase-js'

// Environment variables ile güvenli konfigürasyon
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sbityfrhgfqhebssljtk.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiaXR5ZnJoZ2ZxaGVic3NsanRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxOTkwMTEsImV4cCI6MjA3NTc3NTAxMX0.DntRyt8j0m1R06loTPQyBxT6oZcfmzbGZyvsoBwbfvg'

// Service role key SADECE server-side'da kullanılır ve environment variable'dan okunur
const supabaseServiceKey = typeof window === 'undefined' 
  ? process.env.SUPABASE_SERVICE_ROLE_KEY
  : undefined

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables!')
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

