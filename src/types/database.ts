export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          website: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          website?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          website?: string | null;
          created_at?: string;
        };
      };
      competitors: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          main_url: string;
          status: string | null;
          crawl_config: Json | null;
          active_crawl_job_id: string | null;
          last_crawled_at: string | null;
          created_at: string;
          // New categorization fields
          company_type:
            | "direct_competitor"
            | "indirect_competitor"
            | "geographic_competitor"
            | "aspirational"
            | "market_leader"
            | "emerging_threat"
            | "partner"
            | "customer"
            | null;
          tags: string[] | null;
          monitoring_priority: "high" | "medium" | "low" | null;
          relationship_notes: string | null;
          is_active: boolean | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          main_url: string;
          status?: string | null;
          crawl_config?: Json | null;
          active_crawl_job_id?: string | null;
          last_crawled_at?: string | null;
          created_at?: string;
          // New categorization fields
          company_type?:
            | "direct_competitor"
            | "indirect_competitor"
            | "geographic_competitor"
            | "aspirational"
            | "market_leader"
            | "emerging_threat"
            | "partner"
            | "customer"
            | null;
          tags?: string[] | null;
          monitoring_priority?: "high" | "medium" | "low" | null;
          relationship_notes?: string | null;
          is_active?: boolean | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          name?: string;
          main_url?: string;
          status?: string | null;
          crawl_config?: Json | null;
          active_crawl_job_id?: string | null;
          last_crawled_at?: string | null;
          created_at?: string;
          // New categorization fields
          company_type?:
            | "direct_competitor"
            | "indirect_competitor"
            | "geographic_competitor"
            | "aspirational"
            | "market_leader"
            | "emerging_threat"
            | "partner"
            | "customer"
            | null;
          tags?: string[] | null;
          monitoring_priority?: "high" | "medium" | "low" | null;
          relationship_notes?: string | null;
          is_active?: boolean | null;
        };
      };
      crawl_jobs: {
        Row: {
          id: string;
          competitor_id: string;
          job_type: string;
          status: string;
          firecrawl_job_id: string | null;
          started_at: string;
          completed_at: string | null;
          error_message: string | null;
          result_data: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          competitor_id: string;
          job_type: string;
          status?: string;
          firecrawl_job_id?: string | null;
          started_at?: string;
          completed_at?: string | null;
          error_message?: string | null;
          result_data?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          competitor_id?: string;
          job_type?: string;
          status?: string;
          firecrawl_job_id?: string | null;
          started_at?: string;
          completed_at?: string | null;
          error_message?: string | null;
          result_data?: Json | null;
          created_at?: string;
        };
      };
      competitor_pages: {
        Row: {
          id: string;
          competitor_id: string;
          url: string;
          title: string | null;
          description: string | null;
          markdown_content: string | null;
          html_content: string | null;
          metadata: Json | null;
          category: string | null;
          last_scraped_at: string | null;
          scrape_status: string | null;
          crawl_job_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          competitor_id: string;
          url: string;
          title?: string | null;
          description?: string | null;
          markdown_content?: string | null;
          html_content?: string | null;
          metadata?: Json | null;
          category?: string | null;
          last_scraped_at?: string | null;
          scrape_status?: string | null;
          crawl_job_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          competitor_id?: string;
          url?: string;
          title?: string | null;
          description?: string | null;
          markdown_content?: string | null;
          html_content?: string | null;
          metadata?: Json | null;
          category?: string | null;
          last_scraped_at?: string | null;
          scrape_status?: string | null;
          crawl_job_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      competitor_insights: {
        Row: {
          id: string;
          competitor_id: string;
          source_page_id: string | null;
          content: string | null;
          category: string | null;
          confidence_score: number | null;
          extracted_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          competitor_id: string;
          source_page_id?: string | null;
          content?: string | null;
          category?: string | null;
          confidence_score?: number | null;
          extracted_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          competitor_id?: string;
          source_page_id?: string | null;
          content?: string | null;
          category?: string | null;
          confidence_score?: number | null;
          extracted_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_competitors_by_type: {
        Args: {
          target_project_id: string;
          target_type: string;
        };
        Returns: {
          id: string;
          name: string;
          main_url: string;
          company_type: string;
          monitoring_priority: string;
          last_crawled_at: string | null;
          tags: string[];
        }[];
      };
      get_competitors_needing_scrape: {
        Args: {
          target_project_id: string;
          hours_since_last_crawl?: number;
        };
        Returns: {
          id: string;
          name: string;
          main_url: string;
          company_type: string;
          monitoring_priority: string;
          last_crawled_at: string | null;
          hours_since_crawl: number;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type Competitor = Database["public"]["Tables"]["competitors"]["Row"];
export type CrawlJob = Database["public"]["Tables"]["crawl_jobs"]["Row"];
export type CompetitorPage = Database["public"]["Tables"]["competitor_pages"]["Row"];
export type CompetitorInsight = Database["public"]["Tables"]["competitor_insights"]["Row"];

// Helper types for the new categorization features
export type CompanyType =
  | "direct_competitor"
  | "indirect_competitor"
  | "geographic_competitor"
  | "aspirational"
  | "market_leader"
  | "emerging_threat"
  | "partner"
  | "customer";

export type MonitoringPriority = "high" | "medium" | "low";

// Utility type for creating competitors with type safety
export type CreateCompetitorInput = {
  project_id: string;
  name: string;
  main_url: string;
  company_type?: CompanyType;
  tags?: string[];
  monitoring_priority?: MonitoringPriority;
  relationship_notes?: string;
};
