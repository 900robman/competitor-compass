export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          created_at?: string
        }
      }
      competitors: {
        Row: {
          id: string
          project_id: string
          name: string
          main_url: string
          status: string
          last_crawled_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          main_url: string
          status?: string
          last_crawled_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          name?: string
          main_url?: string
          status?: string
          last_crawled_at?: string | null
          created_at?: string
        }
      }
      competitor_insights: {
        Row: {
          id: string
          competitor_id: string
          url: string
          title: string | null
          content: string | null
          summary: string | null
          created_at: string
        }
        Insert: {
          id?: string
          competitor_id: string
          url: string
          title?: string | null
          content?: string | null
          summary?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          competitor_id?: string
          url?: string
          title?: string | null
          content?: string | null
          summary?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Project = Database['public']['Tables']['projects']['Row']
export type Competitor = Database['public']['Tables']['competitors']['Row']
export type CompetitorInsight = Database['public']['Tables']['competitor_insights']['Row']
