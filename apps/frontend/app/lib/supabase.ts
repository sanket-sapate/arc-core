import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://tvalxojatdvwqtiwxcch.supabase.co"
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2YWx4b2phdGR2d3F0aXd4Y2NoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNzQxOTEsImV4cCI6MjA4NTc1MDE5MX0.zaFu3OSqOuDQtITy1fdflWT_ake4Dgi4k3eBXEOVF8U"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
