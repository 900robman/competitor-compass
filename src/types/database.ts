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
          website: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          website?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          website?: string | null
          created_at?: string
        }
      }
      competitors: {
        Row: {
          id: string
          project_id: string
          name: string
          main_url: string
          crawl_config: Json | null
          active_crawl_job_id: string | null
          last_crawled_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          main_url: string
          crawl_config?: Json | null
          active_crawl_job_id?: string | null
          last_crawled_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          name?: string
          main_url?: string
          crawl_config?: Json | null
          active_crawl_job_id?: string | null
          last_crawled_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      crawl_jobs: {
        Row: {
          id: string
          competitor_id: string
          job_type: string
          status: string
          firecrawl_job_id: string | null
          started_at: string
          completed_at: string | null
          error_message: string | null
          result_data: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          competitor_id: string
          job_type: string
          status?: string
          firecrawl_job_id?: string | null
          started_at?: string
          completed_at?: string | null
          error_message?: string | null
          result_data?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          competitor_id?: string
          job_type?: string
          status?: string
          firecrawl_job_id?: string | null
          started_at?: string
          completed_at?: string | null
          error_message?: string | null
          result_data?: Json | null
          created_at?: string
        }
      }
      competitor_pages: {
        Row: {
          id: string
          competitor_id: string
          url: string
          title: string | null
          description: string | null
          markdown_content: string | null
          html_content: string | null
          metadata: Json | null
          category: string | null
          last_scraped_at: string | null
          scrape_status: string | null
          crawl_job_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          competitor_id: string
          url: string
          title?: string | null
          description?: string | null
          markdown_content?: string | null
          html_content?: string | null
          metadata?: Json | null
          category?: string | null
          last_scraped_at?: string | null
          scrape_status?: string | null
          crawl_job_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          competitor_id?: string
          url?: string
          title?: string | null
          description?: string | null
          markdown_content?: string | null
          html_content?: string | null
          metadata?: Json | null
          category?: string | null
          last_scraped_at?: string | null
          scrape_status?: string | null
          crawl_job_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      competitor_insights: {
        Row: {
          id: string
          competitor_id: string
          source_page_id: string | null
          content: string | null
          category: string | null
          confidence_score: number | null
          extracted_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          competitor_id: string
          source_page_id?: string | null
          content?: string | null
          category?: string | null
          confidence_score?: number | null
          extracted_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          competitor_id?: string
          source_page_id?: string | null
          content?: string | null
          category?: string | null
          confidence_score?: number | null
          extracted_at?: string
          created_at?: string
          updated_at?: string
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
export type CrawlJob = Database['public']['Tables']['crawl_jobs']['Row']
export type CompetitorPage = Database['public']['Tables']['competitor_pages']['Row']
export type CompetitorInsight = Database['public']['Tables']['competitor_insights']['Row']
