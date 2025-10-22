import { createClient } from '@supabase/supabase-js'

// Hardcoded values for Netlify deployment
const supabaseUrl = 'https://sbityfrhgfqhebssljtk.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiaXR5ZnJoZ2ZxaGVic3NsanRrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTE5OTAxMSwiZXhwIjoyMDc1Nzc1MDExfQ.jWTtlkYqQoHWMqPuit3pE6_b9E8S24finRLtz3eBLNU'

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})