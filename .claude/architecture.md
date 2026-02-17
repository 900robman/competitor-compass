# Architecture Documentation

**Project**: Competitor Compass
**Last Updated**: February 17, 2026
**Status**: Phase 3 (Interview Chatbot) - ~80% Complete

---

## System Overview

Competitor Compass is an automated competitor intelligence platform that discovers, tracks, and analyzes competitor websites to generate actionable business insights and website content recommendations.

### Core Purpose
- Automate competitive research (replacing manual spreadsheet-based processes)
- Discover and map entire competitor web presences
- Extract and analyze competitor content via batch scraping
- Conduct AI-powered client interviews to gather business context
- Generate website content informed by competitive intelligence

---

## Technology Stack

### Frontend
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite (migrated from Lovable to Claude Desktop workflow)
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui components
- **Routing**: React Router v6
- **State Management**: React hooks + TanStack Query
- **Deployment**: Lovable hosting platform
- **Production URL**: https://intel-spotter-09.lovable.app

### Backend
- **Database**: Supabase (PostgreSQL 15+)
- **Authentication**: Supabase Auth (user-based auth for main app, token-based for interviews)
- **Storage**: Supabase Storage (for interview documents)
- **Edge Functions**: Deno runtime (TypeScript)
- **Workflow Automation**: n8n (self-hosted on Digital Ocean)
- **Infrastructure**: Digital Ocean Droplet (Docker containerized n8n)

### External Services
- **Web Scraping**: Firecrawl API (Map & Batch Scrape operations)
- **AI Processing**: Anthropic Claude API (Sonnet 4.5 — `claude-sonnet-4-20250514`)
  - Document analysis
  - Interview chatbot
  - Content generation
  - Insight extraction (planned)
- **Vector Search**: pgvector extension (installed; used in `competitor_insights`)

### Development Tools
- **Version Control**: GitHub (https://github.com/900robman/competitor-compass.git)
- **Database Management**: Supabase Dashboard
- **Workflow Management**: n8n Web Interface (https://n8n.offshoot.co.nz)
- **API Testing**: PowerShell (Invoke-RestMethod)
- **Local Dev**: Claude Desktop workflow (VS Code + Git worktrees)

---

## Database Schema

There are two schemas in use: `public` (main app) and `redesign` (legacy/unused — contains an older copy of interview tables from an earlier iteration; the active tables are all in `public`).

### Core Tables (public schema)

#### `projects`
Primary container for user's competitive intelligence work.
```sql
- id (uuid, PK)
- user_id (uuid, FK → auth.users)
- name (text)
- description (text, nullable)
- website (text, nullable) -- client's own website URL
- created_at (timestamptz)
```

#### `competitors`
Tracks competitor companies and their websites.
```sql
- id (uuid, PK)
- project_id (uuid, FK → projects)
- name (text)
- main_url (text)
- status (text) - 'Pending', 'Mapped', 'Scraped', etc.
- last_crawled_at (timestamptz, nullable)
- crawl_config (jsonb, nullable) - Firecrawl configuration
- active_crawl_job_id (uuid, FK → crawl_jobs, nullable)
- company_type (text) - enum: 'direct_competitor', 'indirect_competitor',
                        'geographic_competitor', 'aspirational', 'market_leader',
                        'emerging_threat', 'partner', 'customer'
- tags (text[], default []) - flexible custom tags
- monitoring_priority (text) - 'high', 'medium', 'low'
- relationship_notes (text, nullable)
- is_active (boolean, default true)
- created_at (timestamptz)
```

#### `competitor_pages`
Individual pages discovered on competitor websites.
```sql
- id (uuid, PK)
- competitor_id (uuid, FK → competitors, CASCADE)
- crawl_job_id (uuid, FK → crawl_jobs, SET NULL)
- url (text, unique) - globally unique URL
- title (text, nullable)
- category (text, default 'Uncategorized') - set by categorize_job_pages RPC
- status (text, default 'Discovered') - 'Discovered', 'Active', 'Archived'
- scrape_status (text, default 'not_scraped')
  - enum: 'not_scraped', 'pending', 'processing', 'success', 'failed'
- markdown_content (text, nullable)
- html_content (text, nullable)
- metadata (jsonb, nullable)
- last_scraped_at (timestamptz, nullable)
- created_at (timestamptz)

Note: 222 pages currently in database (real data from mapped competitors)
```

#### `crawl_jobs`
Tracks all Firecrawl operations (mapping, scraping).
```sql
- id (uuid, PK)
- competitor_id (uuid, FK → competitors, CASCADE)
- n8n_execution_id (text, nullable)
- crawl_type (text) - enum: 'map', 'scrape', 'crawl'
- status (text, default 'queued') - enum: 'queued', 'processing', 'completed', 'failed'
- pages_discovered (integer, default 0)
- pages_processed (integer, default 0)
- request_payload (jsonb, nullable)
- response_data (jsonb, nullable)
- started_at (timestamptz, nullable)
- completed_at (timestamptz, nullable)
- error_message (text, nullable)
- created_at (timestamptz)

Note: 10 jobs in database currently
```

#### `page_categories`
Database-driven configuration for URL-based page categorisation (replaces hardcoded patterns).
```sql
- id (uuid, PK)
- name (text, unique)
- url_patterns (text[]) - array of substring patterns to match (case-insensitive)
- description (text, nullable)
- color (text, nullable) - hex for UI display
- icon (text, nullable) - icon name for UI
- priority (integer, default 100) - lower = higher priority (checked in order)
- is_active (boolean, default true)
- created_at (timestamptz)
- updated_at (timestamptz)

Note: 17 categories configured
```

#### `competitor_insights`
AI-generated competitive intelligence (schema ready; no data yet).
```sql
- id (uuid, PK)
- competitor_id (uuid, FK → competitors, CASCADE)
- source_page_id (uuid, FK → competitor_pages, SET NULL)
- url (text)
- title (text, nullable)
- content (text, nullable)
- summary (text, nullable)
- insight_type (text, nullable)
- metadata (jsonb, nullable)
- embedding (vector, nullable) - pgvector for semantic search
- created_at (timestamptz)
```

#### `sitemaps`
Hierarchical sitemap for the redesigned client website (schema ready; no data yet).
```sql
- id (uuid, PK)
- project_id (uuid, FK → projects)
- page_slug (text)
- page_title (text)
- parent_page_id (uuid, FK → sitemaps, nullable) - for nesting
- page_order (integer, default 0)
- priority (integer, 1-10)
- rationale (text, nullable)
- competitor_references (jsonb, default {})
- status (text) - enum: 'planned', 'in_progress', 'completed', 'archived'
- metadata (jsonb, default {})
- created_at / updated_at (timestamptz)
```

#### `wireframe_sections`
Section-level wireframe specs for each sitemap page (schema ready; no data yet).
```sql
- id (uuid, PK)
- sitemap_page_id (uuid, FK → sitemaps)
- section_type (text) - e.g. 'hero', 'features_grid', 'testimonials'
- section_order (integer, default 0)
- section_title (text, nullable)
- content_requirements (jsonb, default {})
- competitor_examples (jsonb, nullable)
- design_notes (text, nullable)
- status (text) - enum: 'planned', 'content_needed', 'content_ready', 'designed', 'developed'
- metadata (jsonb, default {})
- created_at / updated_at (timestamptz)
```

#### `content_drafts`
Versioned content drafts with approval workflow (schema ready; no data yet).
```sql
- id (uuid, PK)
- wireframe_section_id (uuid, FK → wireframe_sections)
- content_markdown (text)
- content_html (text, nullable)
- version (integer, default 1)
- status (text) - enum: 'draft', 'review', 'revision_needed', 'approved', 'rejected', 'published'
- feedback (text, nullable)
- approved_by (uuid, FK → auth.users, nullable)
- approved_at (timestamptz, nullable)
- source_info (jsonb, default {})
- metadata (jsonb, default {})
- created_at / updated_at (timestamptz)
```

### Interview System Tables (public schema)

#### `interview_sessions`
Anonymous interview sessions for website content generation.
```sql
- id (uuid, PK)
- project_id (uuid, FK → projects)
- session_token (text, unique) - shareable access token (format: "interview-{uuid}")
- status (text, default 'active') - enum: 'active', 'completed', 'expired', 'cancelled'
- context_summary (jsonb, default {}) - rolling summary of learned info
- has_uploaded_docs (boolean, default false)
- website_analyzed (boolean, default false)
- total_questions_asked (integer, default 0)
- started_at (timestamptz)
- completed_at (timestamptz, nullable)
- last_activity_at (timestamptz)
- metadata (jsonb, nullable)
- created_at (timestamptz)

Note: 1 active session in database (real interview in progress with 55 messages)
```

#### `interview_messages`
Chat history for interview sessions.
```sql
- id (uuid, PK)
- session_id (uuid, FK → interview_sessions, CASCADE)
- role (text) - enum: 'user', 'assistant', 'system'
- content (text)
- question_type (text, nullable) - enum: 'open', 'checkbox', 'multiselect', 'yesno'
- options (jsonb, nullable) - for structured question types
- selected_options (jsonb, nullable) - user's checkbox/multiselect selections
- metadata (jsonb, nullable) - token usage, model version, etc.
- created_at (timestamptz)

Note: 55 messages in database from an active interview
```

#### `client_responses`
Structured data extracted from interview conversations by Claude.
```sql
- id (uuid, PK)
- session_id (uuid, FK → interview_sessions, CASCADE)
- question_category (text) - e.g. 'services', 'target_audience', 'pricing_model'
- extracted_data (jsonb)
- confidence_score (numeric, 0-1, nullable)
- source_message_ids (uuid[], default [])
- created_at / updated_at (timestamptz)

Note: 25 extracted data records in database. This table IS actively used
(previously labelled legacy/unused — that was incorrect).
```

#### `interview_documents`
Documents uploaded during interview setup.
```sql
- id (uuid, PK)
- interview_session_id (uuid, FK → interview_sessions, CASCADE)
- filename (text)
- file_type (text) - enum: 'pdf', 'docx', 'txt', 'pptx'
- file_url (text) - Supabase storage path
- file_size_bytes (integer)
- extracted_text (text, nullable)
- extracted_data (jsonb, nullable) - Claude-analyzed structured data
- processing_status (text) - enum: 'pending', 'processing', 'completed', 'failed'
- uploaded_at (timestamptz)
- processed_at (timestamptz, nullable)
```

#### `interview_context`
Analyzed context from documents and websites.
```sql
- id (uuid, PK)
- interview_session_id (uuid, FK → interview_sessions, CASCADE)
- source_type (text) - enum: 'website', 'document', 'combined_analysis'
- source_id (uuid, nullable)
- context_data (jsonb, default {})
- created_at (timestamptz)
```

#### `interview_outputs`
Generated website content from completed interviews.
```sql
- id (uuid, PK)
- interview_session_id (uuid, FK → interview_sessions, CASCADE)
- output_type (text) - enum: 'page_content', 'section_content', 'copy_suggestions'
- page_type (text, nullable)
- content (jsonb, default {})
- created_at (timestamptz)
```

### Legacy / Unused Schema

#### `redesign` schema
Contains older versions of `interview_sessions`, `interview_messages`, and `client_responses` from a previous iteration. These tables have no active data and are superseded by the `public` schema equivalents. They can be ignored.

---

## Database Functions (RPCs)

Key custom functions beyond pgvector utilities:

- **`categorize_job_pages(job_id)`** — Called by the Map Site workflow after URL insertion. Applies category rules from the `page_categories` table to newly discovered pages for a given crawl job.
- **`categorize_page_url(url)`** — Helper used by `categorize_job_pages` to match a single URL against the `page_categories` patterns.
- **`get_competitors_by_type(type)`** — Returns competitors filtered by `company_type`.
- **`get_competitors_needing_scrape()`** — Returns competitors that have unmapped/unscraped pages.
- **`match_competitor_content(query_embedding, ...)`** — Vector similarity search on `competitor_insights`.
- **`trigger_document_processing`** / **`trigger_document_processing_webhook`** — Functions for auto-triggering document processing (currently configured but pg_net issues may affect reliability).

---

## Authentication & Authorization

### Main Application
- **Auth Provider**: Supabase Auth
- **Method**: Email/password
- **User Management**: Standard Supabase auth.users table
- **Session**: JWT tokens managed by Supabase

### Row Level Security (RLS)
All tables have RLS enabled. Key patterns:

- **User-owned resources** (`projects`, `competitors`, etc.): `user_id = auth.uid()`
- **Cascading access** (`competitor_pages` via `competitors`): EXISTS subquery through parent chain
- **Public interview access**: `interview_sessions` and related tables allow anonymous access by token (no auth required for interview flow)

**Important**: n8n workflows use `service_role` key to bypass RLS for automation.

### Supabase Storage

#### Bucket: `interview-documents`
- **Public**: true (allows anonymous uploads)
- **Size Limit**: 10MB per file
- **Allowed File Types**: PDF, DOCX, DOC, TXT, PPTX
- **Path Structure**: `{session_token}/{filename}`

---

## Feature Status

### ✅ Phase 1: Database Foundation (Complete)
- Multi-tenant project/competitor structure
- Job tracking system for all operations
- RLS policies for security
- Firecrawl integration schema
- pgvector extension installed

### ✅ Phase 2: Site Mapping (Complete)
- **Feature**: Automated competitor website discovery
- **Trigger**: Database webhook on competitor INSERT
- **Process**: Firecrawl Map API → discovers all URLs → filters sitemaps/robots.txt
- **Categorisation**: Database-driven via `page_categories` table + `categorize_job_pages` RPC
- **Output**: Populated `competitor_pages` with auto-categorisation
- **Result**: 222 pages discovered across 4 real competitors

**Categorisation** is now driven by the `page_categories` database table (17 categories, configurable via Settings UI) rather than hardcoded JavaScript patterns.

### ✅ Phase 3a: Batch Page Scraping (Complete)
- **Workflow**: "Competitor - Scrape Pages (Batch)"
- **Webhook**: `https://n8n.offshoot.co.nz/webhook/competitor/scrape-batch`
- **Input**: `competitor_id` OR `project_id`
- **Process**: Fetches all `scrape_status = 'pending'` pages → Firecrawl batch scrape → async status polling → writes content back
- **Output**: `markdown_content`, `html_content`, `title`, `metadata` written to `competitor_pages`

### ✅ Phase 3b: Interview Chatbot (Complete — core flow)
- Full interview conversation with Claude Sonnet 4.5
- Dynamic question types: open, checkbox, multiselect, yes/no
- Structured data extraction via `<extracted_data>` tags → stored in `client_responses`
- Document upload and context processing
- Document context injected into Claude system prompt
- 55 real messages in database from an active session

### 🔄 Phase 3c: Interview — Remaining Items
- ✅ PDF/DOCX text extraction (`unpdf` + `mammoth` — both implemented)
- ✅ Auto-trigger on `interview_documents` INSERT (database trigger added Feb 17, 2026)
- ⏳ Interview completion detection and status transition
- ⏳ Content generation workflow (populating `interview_outputs`)
- ⏳ Output display UI

### 📋 Planned Phases
- **Phase 4**: AI insights generation from scraped competitor content (using `competitor_insights` + pgvector)
- **Phase 5**: Sitemap builder UI (using `sitemaps` + `wireframe_sections` tables)
- **Phase 6**: Content drafts with approval workflow (using `content_drafts` table)
- **Phase 7**: Competitor comparison tools (category-by-category analysis)
- **Phase 8**: Change tracking & alerts

---

## n8n Workflows

### Workflow 1: "Competitor - Map Site from Main URL"
**Status**: Published and Active
**Webhook**: `https://n8n.offshoot.co.nz/webhook/competitor/map_site`
**Trigger**: Database webhook on `competitors` table INSERT

**Flow**:
```
Webhook → Get Competitor → Create Crawl Job → Firecrawl Map (limit 500)
  → Edit Fields → Split Links → Exclude Sitemaps (filter robots.txt/sitemap.xml)
  → Create Page Records (category: 'Uncategorized') → Aggregate Results
  → HTTP Request: categorize_job_pages RPC → Update Job Success
  → Update Competitor (status='Mapped', last_crawled_at) → Respond Success
```

**Key Details**:
- URL limit: 500 (not configurable via query param in current version)
- Sitemap/robots.txt URLs filtered out before inserting pages
- Categorisation happens via Supabase RPC call after all pages inserted (not inline JS)
- Competitor status updated to `'Mapped'` on completion
- Error handling: partial (no explicit error path connected)

**Tables Modified**:
- `crawl_jobs`: INSERT (processing) → UPDATE (completed)
- `competitor_pages`: INSERT (all discovered URLs)
- `competitors`: UPDATE `last_crawled_at`, `status = 'Mapped'`

**Testing**:
```powershell
Invoke-RestMethod -Uri "https://n8n.offshoot.co.nz/webhook/competitor/map_site" `
  -Method Post -ContentType "application/json" `
  -Body '{"body":{"record":{"id":"UUID","name":"test","main_url":"https://example.com/"}}}'
```

---

### Workflow 2: "Competitor - Scrape Pages (Batch)"
**Status**: Published and Active
**Webhook**: `https://n8n.offshoot.co.nz/webhook/competitor/scrape-batch`
**Trigger**: Manual call (from UI or direct API call)

**Input** (POST body): `{ "competitor_id": "uuid" }` OR `{ "project_id": "uuid" }`

**Flow**:
```
Webhook / Manual Trigger → Determine Query Type → Get Pending Pages
  → Prepare Firecrawl Batch (build URL list + page_mapping)
  → Create Batch Scrape Job (crawl_jobs INSERT)
  → Mark All Pages Processing (scrape_status = 'processing')
  → Firecrawl Batch Scrape (async)
  → Wait 30 seconds
  → Get Batch Scrape Status (poll Firecrawl)
  → If complete/failed → branch:
      Success: Process Batch Results → Find Page by URL
               → Merge Scrape Data with Page ID → Update Page with Content
               → Find Active Scrape Job → Update Job Success → Respond Success
      Failure: Handle Batch Failure → Find Crawl Job by Batch
               → Update Job Failed → Respond Failed (500)
      Still running: Wait 15 seconds → loop back to Get Batch Scrape Status
```

**Key Details**:
- Accepts either `competitor_id` (scrape one competitor) or `project_id` (scrape all competitors in project)
- Scrapes ALL pages with `scrape_status = 'pending'` for the given scope
- Firecrawl returns both `markdown` and `html` formats
- URL normalisation: lowercase, trailing slash removed, for matching back to `competitor_pages`
- Async polling loop: waits 30s initially, then 15s between retries until Firecrawl reports complete/failed
- Has full success and failure paths

**Tables Modified**:
- `crawl_jobs`: INSERT (scrape type) → UPDATE (completed/failed)
- `competitor_pages`: UPDATE `scrape_status`, `markdown_content`, `html_content`, `title`, `metadata`, `last_scraped_at`

---

### Workflow 3: "Competitor Compass - Client Interview Chatbot"
**Status**: Published and Active
**Webhook**: `https://n8n.offshoot.co.nz/webhook/redesign/interview-chat`
**Trigger**: Edge Function `interview-public` (send_message action)

**Flow**:
```
Webhook → Validate Session (get session by token) → Get Project
  ├─ Get History (last 20 messages) → Format Messages (sorted by created_at)
  ├─ Get Document Context (interview_context table) → Format Context
  └─ Build Prompt (system prompt with question format instructions)
  → Merge (3 inputs: messages, context, system prompt)
  → Combine Prompt and Context (prepend context text to system prompt)
  → Call Anthropic (claude-sonnet-4-20250514, max_tokens: 1000)
  → Parse Response (extract <extracted_data> tags, strip from message)
  ├─ Parse Question Type (detect JSON structured questions: yesno/checkbox/multiselect)
  │   → Save User Message (with selected_options if provided)
  │   → Save Assistant Message (with question_type, options, metadata)
  │   → Respond (returns main_response text)
  └─ Has Data? (if extracted_data present)
      → Save Extracted Data (client_responses table)
      → Respond
```

**Dynamic Question Types**:
Claude returns plain text for open questions, or a JSON object for structured questions:
```json
{
  "question_type": "checkbox|multiselect|yesno",
  "question_text": "Question text",
  "options": ["Option 1", "Option 2", ...],
  "explanation": "Why asking this"
}
```
The workflow parses this JSON, stores `question_type` and `options` in `interview_messages`, and the frontend renders the appropriate UI component.

**Context Injection**:
- Reads `interview_context` table for the session
- Detects document types: `resume` or `business_document`
- Formats context summary into system prompt preamble
- Includes strong instructions to Claude to acknowledge uploaded documents

**Data Extraction**:
Claude appends `<extracted_data category="...">{ json }</extracted_data>` to responses. Workflow:
1. Extracts and parses this XML block
2. Strips it from the message shown to the user
3. Saves to `client_responses` with `question_category` and `extracted_data`

**Categories extracted**: `services`, `target_audience`, `unique_value_props`, `pricing_model`, `brand_voice`, `content_priorities`

**Tables Modified**:
- `interview_messages`: INSERT user message + assistant response (with question_type, options)
- `client_responses`: INSERT extracted structured data (when present)

**Conversation Strategy** (from system prompt):
- 70% structured questions (checkbox/multiselect/yesno), 30% open-ended
- Open questions reserved for: unique differentiators, brand story, specific challenges
- Builds on context from uploaded documents

---

## Edge Functions

### Function 1: `n8n-proxy`
**Runtime**: Deno
**Endpoint**: `https://bsloebohbsepdfoldsud.supabase.co/functions/v1/n8n-proxy`
**Auth**: Anonymous (JWT verification disabled)
**Purpose**: Proxies requests to n8n webhooks (avoids CORS issues from browser)

### Function 2: `interview-public`
**Runtime**: Deno
**Endpoint**: `https://bsloebohbsepdfoldsud.supabase.co/functions/v1/interview-public`
**Auth**: Anonymous (JWT verification disabled — public interviews)

**Actions**:
1. **create_session** — Creates new interview session, generates unique token
2. **get_session** — Retrieves session by token
3. **send_message** — Saves user message, forwards to n8n webhook, returns immediately
4. **get_messages** — Fetches all messages for session (ordered by created_at)
5. **update_session** — Updates session flags (has_uploaded_docs, etc.)
6. **start_interview** — Creates initial greeting message, updates session status

**Environment Variables**:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `N8N_WEBHOOK_URL` (points to interview-chat webhook)

### Function 3: `process-interview-document`
**Runtime**: Deno
**Endpoint**: `https://bsloebohbsepdfoldsud.supabase.co/functions/v1/process-interview-document`
**Auth**: Anonymous

**Purpose**: Extract text from uploaded documents and analyse with Claude

**Process**:
1. Downloads file from Supabase Storage
2. Extracts text based on file type:
   - ✅ TXT: Direct read
   - ⏳ PDF: Not yet implemented (needs library)
   - ⏳ DOCX: Not yet implemented (needs library)
3. Sends extracted text to Claude API for analysis
4. Stores `extracted_text` and `extracted_data` in `interview_documents`
5. Creates `interview_context` record with structured analysis
6. Updates `processing_status` to `'completed'`

**Claude Analysis Output** (stored in `interview_context.context_data`):
- For resumes: `document_type`, `unique_background`, `relevant_credentials`, `relevant_expertise`, `key_differentiators`, `years_experience`
- For business docs: `document_type`, `services`, `target_audience`, `differentiators`, `mission_vision`, `pricing_info`

**Trigger**: Manual call (database trigger exists but reliability depends on pg_net config)

---

## Frontend Pages & Routes

```
/ (auth required)                    → ProjectsPage (list all projects)
/project/:projectId                  → ProjectWorkspacePage (competitors list, stats)
/project/:projectId/competitor/:id   → CompetitorDetailPage (pages, insights, history)
/project/:projectId/compare          → CompareCategoriesPage (category comparison across competitors)
/project/:projectId/settings         → SettingsPage (categories, company types, general)
/auth                                → AuthPage
/interview/:token                    → InterviewChatPage (chat UI, public/no auth)
/interview/:token/setup              → InterviewSetupPage (doc upload, setup, public/no auth)
/profile                             → ProfilePage (auth required)
```

### Key Frontend Components
- **`InterviewChatPage`**: Main chat interface with dynamic question rendering
- **`QuestionTypes`**: Renders checkbox, multiselect, yesno question UI components
- **`MidInterviewUpload`**: Allows document upload during an active interview session
- **`ClientInterviewTab`**: Tab on CompetitorDetailPage for managing interview sessions
- **`CompetitorActions`**: Buttons for "Map Site" / "Re-map Site" and "Scrape Pending Pages" — both call the `n8n-proxy` edge function. Scrape button shows a pending count badge and is disabled when none are pending. Both have confirmation dialogs with time/credit estimates.
- **`DiscoveredPagesTable`**: Shows all pages for a competitor with scrape status
- **`CategoriesSettings`**: UI to manage `page_categories` table (add/edit/delete categories)
- **`CompanyTypeSelect`** / **`CompanyTypeBadge`**: Company type management UI

---

## Data Flow — Key User Journeys

### Journey 1: Adding a Competitor & Site Mapping
```
User: Creates new competitor in UI
  ↓
Frontend: INSERT into competitors table
  ↓
Database webhook → n8n "Map Site" workflow
  ├─ Creates crawl_job (processing)
  ├─ Calls Firecrawl Map API (up to 500 URLs)
  ├─ Filters out sitemap.xml/robots.txt
  ├─ Inserts all URLs into competitor_pages (category: Uncategorized)
  ├─ Calls categorize_job_pages RPC → updates categories from page_categories table
  ├─ Updates crawl_job (completed)
  └─ Updates competitor (status=Mapped, last_crawled_at)
  ↓
Frontend: Polls/refreshes → shows discovered pages with categories
```

### Journey 2: Scraping Pages
```
User: Triggers scrape from UI (or direct API call)
  ↓
POST to n8n scrape-batch webhook with competitor_id
  ├─ Fetches all pending pages for competitor
  ├─ Creates crawl_job (scrape type)
  ├─ Marks all pages as 'processing'
  ├─ Sends batch to Firecrawl
  ├─ Polls until complete (30s + 15s loops)
  ├─ Writes markdown/html/title/metadata to each page
  └─ Updates crawl_job (completed)
  ↓
Frontend: Pages now have content (scrape_status=success)
```

### Journey 3: Interview Session (Complete Flow)
```
User (client): Opens interview link /interview/:token
  ↓
Frontend: If no messages → redirect to /interview/:token/setup
  ↓
Setup Page:
  ├─ Shows document upload dropzone
  ├─ Upload → Supabase Storage → interview_documents record (pending)
  ├─ Polls processing_status → triggers process-interview-document
  └─ "Start Interview" button
  ↓
Start Interview: interview-public edge function (start_interview action)
  └─ Creates initial greeting message in interview_messages
  ↓
Chat Page: /interview/:token
  ├─ Loads all messages from database
  └─ Displays chat UI with dynamic question components
  ↓
User response loop:
  User types/selects answer
    → interview-public (send_message) → n8n interview-chat webhook
    → Validate session, get history, get document context
    → Build system prompt (with document context prepended)
    → Claude API call (last 20 messages as history)
    → Parse response: extract structured data + question type
    → Save user message (with selected_options)
    → Save assistant message (with question_type, options)
    → If extracted_data → save to client_responses
    → Return response to frontend
    ↓
  Frontend polls for new messages → renders with appropriate question UI
  [Repeat until complete]
```

---

## Third-Party Integrations

### Firecrawl API
**Purpose**: Reliable web scraping and content extraction
**APIs Used**:
- **Map API**: Synchronous URL discovery (up to 500 URLs, ignores sitemaps by default)
- **Batch Scrape API**: Async batch extraction of multiple pages
  - Formats: markdown + html
  - Timeout: 120s per page
  - Returns a batch ID; status must be polled

**Configuration in n8n**:
- API key stored in n8n credentials ("Firecrawl account")
- Timeout: 120000ms

### Anthropic Claude API
**Purpose**: AI-powered analysis and content generation
**Model**: Claude Sonnet 4.5 (`claude-sonnet-4-20250514`)
**Use Cases**:
1. **Document Analysis**: Extract business info from uploaded docs
2. **Interview Chatbot**: Conduct intelligent structured business interviews
3. **Insight Generation**: Analyse competitor content (planned — pgvector ready)
4. **Content Creation**: Generate website copy (planned)

**API Configuration**:
- Endpoint: `https://api.anthropic.com/v1/messages`
- Max Tokens: 1000 per interview message (configurable)
- Credentials: Stored in n8n ("Anthropic account") and Supabase secrets

**Cost Estimates**:
- Interview (12 questions): ~$0.15–0.25 per session
- Document analysis: ~$0.02–0.04 per document
- **Total per interview**: ~$0.20–0.30

---

## Deployment Setup

### Supabase
- **Project ID**: `bsloebohbsepdfoldsud`
- **Project Name**: Competitor_Intelligence_Dashboard
- **Database**: PostgreSQL 15+ with pgvector extension
- **Authentication**: Enabled (email/password)
- **Storage**: Enabled (`interview-documents` bucket, public, 10MB limit)
- **Edge Functions**: 3 deployed (`n8n-proxy`, `interview-public`, `process-interview-document`)

**Database Webhooks** (configured in Supabase):
- **Site Mapping Trigger**:
  - Table: `competitors`
  - Event: INSERT
  - URL: `https://n8n.offshoot.co.nz/webhook/competitor/map_site`
  - Method: POST

### n8n
- **Instance**: Self-hosted on Digital Ocean
- **URL**: https://n8n.offshoot.co.nz
- **Infrastructure**: Docker container (`n8n-docker-caddy-n8n-1`)
- **Active Workflows**: 3 (all published)

**Useful Commands**:
```bash
ssh root@[droplet-ip]
docker restart n8n-docker-caddy-n8n-1
docker logs n8n-docker-caddy-n8n-1 -f
```

**Webhook Paths**:
- Production: `/webhook/`
- Test (n8n UI testing): `/webhook-test/`
- Known issue: After workflow changes, sometimes need to deactivate + reactivate to fix routing

### Frontend (Lovable)
- **Platform**: Lovable hosting
- **URL**: https://intel-spotter-09.lovable.app
- **Framework**: React + TypeScript + Vite + Tailwind
- **Deploy**: Push to main → Lovable rebuild
- **Environment Variables** (Lovable dashboard):
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

### GitHub
- **Repository**: https://github.com/900robman/competitor-compass.git
- **Primary Branch**: main
- **Local Dev**: Claude Desktop workflow with git worktrees

---

## Key Technical Decisions

### 1. Database-Driven Page Categorisation
**Decision**: Categories stored in `page_categories` table, applied via `categorize_job_pages` RPC, configurable via Settings UI.

**Rationale**: Allows non-developer adjustment of categories without code changes. The 17 configured categories cover most page types, and the priority ordering ensures correct matching.

**vs. Previous**: Earlier doc described hardcoded JavaScript patterns in n8n — this was replaced.

### 2. Token-Based Interview Access
**Decision**: Anonymous interviews using shareable tokens, no account required.

**Rationale**: Removes friction for clients; enables easy link sharing; maintains privacy.

**Trade-offs**: Can't retrieve past interviews without the token; no user account linkage.

### 3. n8n for Workflows vs. Supabase Edge Functions
**Decision**: n8n for complex multi-step workflows; Edge Functions for simple request/response.

**Edge Functions**: `interview-public` (session management, message routing), `process-interview-document` (file processing + Claude call), `n8n-proxy` (CORS bypass)

**n8n Workflows**: Site mapping, batch scraping, interview chat orchestration

### 4. Firecrawl Batch Scrape (Async)
**Decision**: Use Firecrawl's batch scrape API with polling rather than sequential per-page scraping.

**Rationale**: Much faster for large sites; Firecrawl handles parallelisation. The 30s initial wait + 15s polling loop handles the async nature.

### 5. Structured + Open Question Hybrid
**Decision**: Claude aims for 70% structured (checkbox/multiselect/yesno) / 30% open questions.

**Rationale**: Structured questions are faster for clients and produce cleaner extracted data. Open questions reserved for genuinely unique information.

### 6. Frontend Read/Write Pattern
**Decision**: Frontend reads data directly from Supabase. Writes are split based on complexity — not routed uniformly through workflows.

**The rule in practice**:
- **Complex, multi-step operations** that touch external services (Firecrawl, Claude API, n8n) go through edge functions or n8n workflows. These need retry logic, job tracking, status management, and orchestration that doesn't belong in the frontend.
- **Simple CRUD** on configuration data and metadata (categories, project settings, session flags, document records) goes direct to Supabase with RLS providing the security boundary.

**Examples of each**:
- ✅ Through workflow/edge function: triggering site mapping, batch scraping, interview chat (all involve Claude or Firecrawl)
- ✅ Direct to Supabase: creating a category, updating `has_uploaded_docs`, inserting a document record, updating project name

**What this is not**: A blanket "all writes go through workflows" rule. That would add indirection with no benefit for simple operations and is not what the code does.

---

## Known Issues

### Issue 1: PDF Image-Based Documents
**Problem**: `process-interview-document` handles PDF and DOCX fully (via `unpdf` and `mammoth`), but image-based PDFs (scanned documents with no text layer) cannot have text extracted — the function returns a fallback message rather than failing.
**Workaround**: Ask clients to provide text-based PDFs or DOCX files where possible
**Status**: Known limitation of text extraction without OCR; acceptable for now

### Issue 2: Interview Completion Detection
**Problem**: No automated detection of when an interview is complete
**Workaround**: Manual status update
**Status**: Planned

### Issue 3: Content Generation Not Built
**Problem**: `interview_outputs` table exists but no workflow populates it
**Status**: Planned

### Issue 4: n8n Webhook Publishing Quirk
**Problem**: After changes, production webhook sometimes returns 404
**Workaround**: Deactivate → reactivate workflow (or export/import)
**Status**: Known n8n behaviour

### ~~Issue 5: Scrape Trigger~~ — Resolved
**Status**: ✅ Not an issue. `CompetitorActions` has a fully built "Scrape Pending Pages" button that calls the `n8n-proxy` edge function. The button shows a pending page count badge, is disabled when there are no pending pages, and includes a confirmation dialog with time and Firecrawl credit estimates.

---

## Quick Reference

### Important URLs
- **App**: https://intel-spotter-09.lovable.app
- **n8n**: https://n8n.offshoot.co.nz
- **GitHub**: https://github.com/900robman/competitor-compass.git
- **Supabase Dashboard**: https://supabase.com/dashboard (project: Competitor_Intelligence_Dashboard)

### n8n Webhook Endpoints
- **Site Mapping**: `POST https://n8n.offshoot.co.nz/webhook/competitor/map_site`
- **Batch Scrape**: `POST https://n8n.offshoot.co.nz/webhook/competitor/scrape-batch`
- **Interview Chat**: `POST https://n8n.offshoot.co.nz/webhook/redesign/interview-chat`

### Edge Function Endpoints
- **n8n Proxy**: `https://bsloebohbsepdfoldsud.supabase.co/functions/v1/n8n-proxy`
- **Interview Public**: `https://bsloebohbsepdfoldsud.supabase.co/functions/v1/interview-public`
- **Process Document**: `https://bsloebohbsepdfoldsud.supabase.co/functions/v1/process-interview-document`

### Storage Buckets
- **interview-documents**: Public bucket, 10MB limit, path: `{session_token}/{filename}`

### Database Row Counts (as of Feb 17, 2026)
- `projects`: 2
- `competitors`: 4
- `competitor_pages`: 222
- `crawl_jobs`: 10
- `page_categories`: 17
- `interview_sessions`: 1 (active)
- `interview_messages`: 55
- `client_responses`: 25

---

**Last Updated**: February 17, 2026
**Next Review**: After Phase 3c completion (interview outputs + PDF support)
