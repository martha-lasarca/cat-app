import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Client for public operations
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)

// Admin client for server-side operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Database types
export interface Database {
  public: {
    Tables: {
      catalogues: {
        Row: {
          id: string
          name: string
          slug: string
          custom_link: string | null
          created_at: string
          updated_at: string
          slides: any[]
          products: any[]
        }
        Insert: {
          id?: string
          name: string
          slug: string
          custom_link?: string | null
          created_at?: string
          updated_at?: string
          slides?: any[]
          products?: any[]
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          custom_link?: string | null
          created_at?: string
          updated_at?: string
          slides?: any[]
          products?: any[]
        }
      }
      quote_logs: {
        Row: {
          id: string
          email: string
          share_link: string
          catalogue_name: string
          total_amount: number
          pdf_url: string
          timestamp: string
          items: any[]
        }
        Insert: {
          id?: string
          email: string
          share_link: string
          catalogue_name: string
          total_amount: number
          pdf_url: string
          timestamp?: string
          items: any[]
        }
        Update: {
          id?: string
          email?: string
          share_link?: string
          catalogue_name?: string
          total_amount?: number
          pdf_url?: string
          timestamp?: string
          items?: any[]
        }
      }
    }
  }
}
