import { createClient } from '@supabase/supabase-js'

// Netlify deployment için hardcoded values (public keys güvenli)
const supabaseUrl = 'https://sbityfrhgfqhebssljtk.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiaXR5ZnJoZ2ZxaGVic3NsanRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxOTkwMTEsImV4cCI6MjA3NTc3NTAxMX0.DntRyt8j0m1R06loTPQyBxT6oZcfmzbGZyvsoBwbfvg'

// Service role key sadece server-side'da kullanılır
const supabaseServiceKey = typeof window === 'undefined' 
  ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiaXR5ZnJoZ2ZxaGVic3NsanRrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTE5OTAxMSwiZXhwIjoyMDc1Nzc1MDExfQ.jWTtlkYqQoHWMqPuit3pE6_b9E8S24finRLtz3eBLNU'
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

