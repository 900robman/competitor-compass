# Architecture Documentation

**Project**: Competitor Compass  
**Last Updated**: February 15, 2026  
**Status**: Phase 3 (Interview Chatbot) - 40% Complete

---

## System Overview

Competitor Compass is an automated competitor intelligence platform that discovers, tracks, and analyzes competitor websites to generate actionable business insights and website content recommendations.

### Core Purpose
- Automate competitive research (replacing manual spreadsheet-based processes)
- Discover and map entire competitor web presences
- Extract and analyze competitor content
- Generate AI-powered insights and website content
- Enable informed business strategy and website redesign decisions

---

## Technology Stack

### Frontend
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Lovable (React/TypeScript frontend platform)
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui components
- **Routing**: React Router v6
- **State Management**: React hooks (useState, useEffect)
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
- **Web Scraping**: Firecrawl API (Map & Scrape operations)
- **AI Processing**: Anthropic Claude API (Sonnet 4.5)
  - Document analysis
  - Interview chatbot
  - Content generation
  - Insight extraction

### Development Tools
- **Version Control**: GitHub (https://github.com/900robman/competitor-compass.git)
- **Database Management**: Supabase Dashboard
- **Workflow Management**: n8n Web Interface (https://n8n.offshoot.co.nz)
- **API Testing**: PowerShell (Invoke-RestMethod)

---

## Database Schema

### Core Tables

#### `projects`
Primary container for user's competitive intelligence work.
```sql
- id (uuid, PK)
- user_id (uuid, FK → auth.users)
- name (text)
- description (text)
- created_at (timestamptz)
- updated_at (timestamptz)
```

#### `competitors`
Tracks competitor companies and their websites.
```sql
- id (uuid, PK)
- project_id (uuid, FK → projects)
- name (text) - Company name
- main_url (text) - Primary website URL
- status (text) - 'Pending', 'Mapped', 'Scraped', etc.
- last_crawled_at (timestamptz) - Last site mapping timestamp
- crawl_config (jsonb) - Firecrawl configuration (maxDepth, excludePaths)
- active_crawl_job_id (uuid, FK → crawl_jobs, nullable) - Currently running job
- created_at (timestamptz)
- updated_at (timestamptz)
```

#### `competitor_pages`
Individual pages discovered on competitor websites.
```sql
- id (uuid, PK)
- competitor_id (uuid, FK → competitors, CASCADE)
- crawl_job_id (uuid, FK → crawl_jobs, SET NULL) - Discovery job link
- url (text, unique per competitor)
- title (text, nullable)
- category (text) - Auto-categorized: Homepage, Pricing, Product, Blog, etc.
- status (text) - 'Discovered', 'Active', 'Archived'
- scrape_status (text) - 'pending', 'processing', 'success', 'failed'
- markdown_content (text, nullable) - Firecrawl markdown output
- html_content (text, nullable) - Raw HTML
- metadata (jsonb, nullable) - Links, images, structure data
- last_scraped_at (timestamptz, nullable)
- created_at (timestamptz)
- updated_at (timestamptz)

Indexes:
- idx_competitor_pages_competitor_id
- idx_competitor_pages_crawl_job_id
- idx_competitor_pages_scrape_status
```

#### `crawl_jobs`
Tracks all Firecrawl operations (mapping, scraping).
```sql
- id (uuid, PK)
- competitor_id (uuid, FK → competitors, CASCADE)
- n8n_execution_id (text, nullable) - Links to n8n execution for debugging
- crawl_type (text) - 'map', 'scrape', 'crawl'
- status (text) - 'queued', 'processing', 'completed', 'failed'
- pages_discovered (integer, default 0)
- pages_processed (integer, default 0)
- request_payload (jsonb) - Original request for replay/debugging
- started_at (timestamptz, nullable)
- completed_at (timestamptz, nullable)
- error_message (text, nullable)
- created_at (timestamptz)

Indexes:
- idx_crawl_jobs_competitor_id
- idx_crawl_jobs_status
- idx_crawl_jobs_created_at (DESC)
```

#### `competitor_insights`
AI-generated competitive intelligence.
```sql
- id (uuid, PK)
- competitor_id (uuid, FK → competitors, CASCADE)
- source_page_id (uuid, FK → competitor_pages, SET NULL)
- insight_type (text) - 'feature', 'pricing', 'positioning', etc.
- title (text)
- content (text)
- metadata (jsonb) - Structured extracted data
- created_at (timestamptz)
- updated_at (timestamptz)

Indexes:
- idx_competitor_insights_competitor_id
- idx_competitor_insights_source_page
- idx_competitor_insights_type
```

### Interview System Tables

#### `interview_sessions`
Anonymous interview sessions for website content generation.
```sql
- id (uuid, PK)
- project_id (uuid, FK → projects, nullable)
- session_token (text, unique) - Shareable access token
- status (text) - 'active', 'completed', 'abandoned'
- context_summary (jsonb) - Rolling summary of learned information
- has_uploaded_docs (boolean, default false)
- website_analyzed (boolean, default false)
- total_questions_asked (integer, default 0)
- created_at (timestamptz)
- completed_at (timestamptz, nullable)
- updated_at (timestamptz)

Indexes:
- idx_interview_sessions_token (unique)
- idx_interview_sessions_project_id
```

#### `interview_messages`
Chat history for interview sessions.
```sql
- id (uuid, PK)
- session_id (uuid, FK → interview_sessions, CASCADE)
- role (text) - 'user', 'assistant', 'system'
- content (text) - Message text
- question_type (text, nullable) - 'open', 'checkbox', 'multiselect', 'yesno'
- options (jsonb, nullable) - For structured questions
- selected_options (jsonb, nullable) - User's selections
- metadata (jsonb, nullable) - Additional data
- created_at (timestamptz)

Indexes:
- idx_interview_messages_session_id
- idx_interview_messages_created_at
```

#### `interview_documents`
Documents uploaded during interview setup.
```sql
- id (uuid, PK)
- interview_session_id (uuid, FK → interview_sessions, CASCADE)
- filename (text)
- file_type (text) - 'pdf', 'docx', 'txt', 'pptx'
- file_url (text) - Supabase storage path
- file_size_bytes (integer)
- extracted_text (text, nullable)
- extracted_data (jsonb, nullable) - Claude-analyzed structured data
- processing_status (text) - 'pending', 'processing', 'completed', 'failed'
- uploaded_at (timestamptz)
- processed_at (timestamptz, nullable)

Indexes:
- idx_interview_documents_session_id
- idx_interview_documents_processing_status
```

#### `interview_context`
Analyzed context from documents and websites.
```sql
- id (uuid, PK)
- interview_session_id (uuid, FK → interview_sessions, CASCADE)
- source_type (text) - 'website', 'document', 'combined_analysis'
- source_id (uuid, nullable) - competitor_id or document_id
- context_data (jsonb) - Structured analysis results
- created_at (timestamptz)

Indexes:
- idx_interview_context_session_id
- idx_interview_context_source_type
```

#### `interview_outputs`
Generated website content from completed interviews.
```sql
- id (uuid, PK)
- interview_session_id (uuid, FK → interview_sessions, CASCADE)
- output_type (text) - 'page_content', 'section_content', 'copy_suggestions'
- page_type (text) - 'homepage', 'about', 'services', etc.
- content (jsonb) - Generated content with sections
- created_at (timestamptz)

Indexes:
- idx_interview_outputs_session_id
- idx_interview_outputs_page_type
```

#### `client_responses`
Extracted structured responses from interviews (legacy/unused).
```sql
- id (uuid, PK)
- session_id (uuid, FK → interview_sessions, CASCADE)
- question (text)
- response (text)
- extracted_data (jsonb)
- created_at (timestamptz)
```

---

## Authentication & Authorization

### Main Application
- **Auth Provider**: Supabase Auth
- **Method**: Email/password (can be extended to OAuth)
- **User Management**: Standard Supabase auth.users table
- **Session**: JWT tokens managed by Supabase

### Row Level Security (RLS)

**All tables have RLS enabled** with the following patterns:

#### User-owned Resources (projects, competitors, etc.)
```sql
-- SELECT policy example
CREATE POLICY "Users can view their own projects"
  ON projects FOR SELECT
  USING (user_id = auth.uid());

-- INSERT policy example  
CREATE POLICY "Users can create their own projects"
  ON projects FOR INSERT
  WITH CHECK (user_id = auth.uid());
```

#### Cascading Access (competitor_pages via competitors)
```sql
CREATE POLICY "Users can view pages for their competitors"
  ON competitor_pages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM competitors c
      JOIN projects p ON c.project_id = p.id
      WHERE c.id = competitor_pages.competitor_id
      AND p.user_id = auth.uid()
    )
  );
```

#### Public Interview Access (token-based, no auth)
```sql
-- Interview sessions accessible by token (no auth required)
CREATE POLICY "Anyone can view interview sessions by token"
  ON interview_sessions FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert interview sessions"
  ON interview_sessions FOR INSERT
  WITH CHECK (true);
```

**Important**: n8n workflows use `service_role` key to bypass RLS for automation.

### Supabase Storage

#### Bucket: `interview-documents`
- **Public**: true (allows anonymous uploads)
- **Size Limit**: 10MB per file
- **Allowed File Types**: PDF, DOCX, DOC, TXT, PPTX
- **Path Structure**: `{session_token}/{filename}`

**Storage RLS Policies**:
```sql
-- Allow public uploads
CREATE POLICY "Anyone can upload interview documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'interview-documents');

-- Allow public updates (for upsert)
CREATE POLICY "Anyone can update interview documents"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'interview-documents');

-- Allow public reads
CREATE POLICY "Anyone can read interview documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'interview-documents');
```

---

## Major Features

### ✅ Phase 1: Database Foundation (Complete)
- Multi-tenant project/competitor structure
- Job tracking system for all operations
- RLS policies for security
- Firecrawl integration schema

### ✅ Phase 2: Site Mapping (Complete)
- **Feature**: Automated competitor website discovery
- **Trigger**: Database webhook on competitor INSERT
- **Process**: Firecrawl Map API → discovers all URLs
- **Output**: Populated competitor_pages with auto-categorization
- **Categories**: Homepage, Pricing, Product, Blog, About, Support, Careers, Documentation, Legal, Case Studies, Uncategorized

**Auto-categorization Logic**:
```javascript
// Based on URL patterns
/pricing|plans/ → Pricing
/product|features/ → Product
/blog|article|news/ → Blog
/about|company|team/ → About
/contact|support|help/ → Support
/careers|jobs/ → Careers
/docs|documentation|api/ → Documentation
/legal|terms|privacy/ → Legal
/case-stud|customer/ → Case Studies
Root domain → Homepage
Default → Uncategorized
```

### 🔄 Phase 3: Interview Chatbot (40% Complete)

#### ✅ Completed Sub-features
1. **Database Schema** (100%)
   - All interview tables created
   - Storage bucket configured
   - RLS policies implemented

2. **Document Upload UI** (100%)
   - Drag & drop interface
   - Multi-file support
   - Status tracking (Uploading → Pending → Processing → Ready)
   - Website analysis display
   - Navigation flow (setup → chat)

3. **Document Storage** (100%)
   - Files upload to Supabase Storage
   - Database records created
   - Session flags updated

4. **Document Processing Core** (70%)
   - Edge Function: `process-interview-document`
   - ✅ TXT file extraction
   - ✅ Claude API integration for analysis
   - ✅ Structured data extraction (services, audience, differentiators, etc.)
   - ✅ Context storage in database
   - ⏳ PDF extraction (needs PDF.js)
   - ⏳ DOCX extraction (needs mammoth.js)

5. **Chat Interface** (100%)
   - Basic chat UI with bubbles
   - Message history loading
   - Real-time updates
   - Markdown rendering

6. **Claude Integration** (100%)
   - n8n workflow for message processing
   - Sonnet 4.5 API calls
   - Extracted data parsing using `<extracted_data>` tags
   - Context-aware responses

#### ⏳ Pending Sub-features
- Auto-trigger document processing (trigger disabled, manual works)
- PDF/DOCX text extraction libraries
- Website content analysis (scrape competitor_pages)
- Combined context generation
- Dynamic question types (checkbox, multiselect, yes/no)
- Interview completion detection
- Content generation workflow
- Output display UI

### 📋 Planned Features
- **Phase 4**: Batch page scraping workflow
- **Phase 5**: Content analysis dashboard
- **Phase 6**: AI-powered insights generation
- **Phase 7**: Competitor comparison tools
- **Phase 8**: Change tracking & alerts

---

## n8n Workflows

### Workflow 1: "Competitor - Map Site from Main URL"
**Status**: Published and Active  
**Webhook**: `https://n8n.offshoot.co.nz/webhook/competitor/map`

**Trigger**: Database webhook on `competitors` table INSERT  
**Query Param**: `max_urls` (optional, default: 100)

**Flow**:
```
Webhook → Get Competitor → Create Crawl Job → Firecrawl Map 
  → Edit Fields → Split Links → Create Page Records 
  → Aggregate Results → Update Job Success → Update Competitor 
  → Respond Success
```

**Tables Modified**:
- `crawl_jobs`: Creates job, updates status/counts/timestamps
- `competitor_pages`: Inserts discovered pages with categories
- `competitors`: Updates `last_crawled_at`

**Error Handling**: Partial implementation (path exists but needs full connection)

**Key Nodes**:
1. **Webhook - Map Site**: Receives Supabase database webhook
2. **Get Competitor**: Fetches competitor details from database
3. **Create Crawl Job**: Inserts tracking record with 'processing' status
4. **Firecrawl Map**: Calls Firecrawl Map API to discover URLs
   - Limit: Dynamic from query param
   - Timeout: 120s
   - Sitemap: Ignored
5. **Split Links**: Converts array to individual items
6. **Create Page Records**: Inserts into competitor_pages with auto-category
7. **Aggregate Results**: Counts pages discovered/processed
8. **Update Job Success**: Marks crawl_job as 'completed'
9. **Update Competitor**: Sets last_crawled_at timestamp
10. **Respond Success**: Returns JSON response to webhook caller

**Testing**:
```powershell
Invoke-RestMethod -Uri "https://n8n.offshoot.co.nz/webhook/competitor/map?max_urls=10" `
  -Method Post -ContentType "application/json" `
  -Body '{"type":"INSERT","table":"competitors","record":{"id":"UUID","name":"test","main_url":"https://example.com/"}}'
```

### Workflow 2: "Competitor Compass - Client Interview Chatbot"
**Status**: Published and Active  
**Webhook**: `https://n8n.offshoot.co.nz/webhook/interview/message`

**Trigger**: Edge Function call when user sends message

**Flow**:
```
Webhook → Get Session → Get Messages → Format for Claude 
  → Claude API Call → Parse Response → Extract Data 
  → Store Message → Store Response → Return to User
```

**Tables Modified**:
- `interview_messages`: Inserts user message and assistant response
- `client_responses`: Stores extracted structured data

**Key Features**:
- Full conversation history passed to Claude
- System prompt defines interview behavior
- Extracts structured data using `<extracted_data>` tags
- Handles errors gracefully

**Claude System Prompt** (summarized):
- You're conducting a business interview
- Ask targeted questions about services, audience, differentiators
- Extract structured data in XML tags
- Keep questions conversational and adaptive
- Don't repeat information already provided

### Workflow 3: "Competitor - Scrape Page" (Planned)
**Status**: Not yet built  
**Purpose**: Extract content from discovered pages using Firecrawl Scrape API

**Requirements**:
- Input: page_id or batch of page_ids
- Process: Firecrawl Scrape API calls
- Extract: markdown, HTML, title, metadata
- Update: competitor_pages with content
- Track: scrape_status progression

---

## Edge Functions

### Function 1: `interview-public`
**Runtime**: Deno  
**Endpoint**: `https://bsloebohbsepdfoldsud.supabase.co/functions/v1/interview-public`  
**Auth**: Anonymous (no bearer token required for public interviews)

**Actions**:
1. **create_session**
   - Creates new interview session
   - Generates unique token
   - Links to project (optional)

2. **get_session**
   - Retrieves session by token
   - Returns session details

3. **send_message**
   - Saves user message to database
   - Forwards to n8n workflow for Claude processing
   - Returns immediately (async processing)

4. **get_messages**
   - Fetches all messages for session
   - Ordered chronologically

5. **upload_document** (implicit)
   - Handled via direct Supabase Storage upload from frontend
   - Creates record in interview_documents

6. **update_session**
   - Updates session flags (has_uploaded_docs, etc.)

7. **start_interview**
   - Creates initial greeting message
   - Includes context about uploaded docs and website
   - Updates session status

**Environment Variables**:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `N8N_WEBHOOK_URL` (for interview messages)

### Function 2: `process-interview-document`
**Runtime**: Deno  
**Endpoint**: `https://bsloebohbsepdfoldsud.supabase.co/functions/v1/process-interview-document`  
**Auth**: Anonymous (public interviews)

**Purpose**: Extract text from uploaded documents and analyze with Claude

**Process**:
1. Downloads file from Supabase Storage
2. Extracts text based on file type:
   - ✅ TXT: Direct read
   - ⏳ PDF: Needs PDF.js implementation
   - ⏳ DOCX: Needs mammoth.js implementation
3. Sends extracted text to Claude API for analysis
4. Stores extracted_text and extracted_data in database
5. Creates interview_context record
6. Updates processing_status to 'completed'

**Claude Analysis Prompt**:
```
Extract structured business information from this document:
- services (array of service names)
- target_audience (description)
- mission_vision (mission/vision statement)
- differentiators (unique value propositions)
- pricing_info (if mentioned)
- contact_preferences (how they prefer contact)
- brand_values (core values)
- confidence (high/medium/low)
Return JSON only, no markdown.
```

**Environment Variables**:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY` (needs to be added to Supabase secrets)

**Trigger Options**:
- Manual: Call via fetch from browser console
- Automatic: Database trigger (currently disabled due to pg_net config issues)

**Manual Test**:
```javascript
const response = await fetch('https://bsloebohbsepdfoldsud.supabase.co/functions/v1/process-interview-document', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer [ANON_KEY]'
  },
  body: JSON.stringify({ document_id: 'uuid-here' })
});
```

---

## Data Flow - Key User Journeys

### Journey 1: Adding a Competitor
```
User Action: Create new competitor in UI
  ↓
Frontend: POST to Supabase (competitors table)
  ↓
Database: INSERT triggers webhook to n8n
  ↓
n8n Workflow: "Competitor - Map Site"
  ├─ Creates crawl_job (status: processing)
  ├─ Calls Firecrawl Map API
  ├─ Receives array of discovered URLs
  ├─ Inserts each URL into competitor_pages
  ├─ Auto-categorizes based on URL patterns
  ├─ Updates crawl_job (status: completed)
  └─ Updates competitor.last_crawled_at
  ↓
Frontend: Polls/refreshes to show discovered pages
```

**Database State After**:
- `competitors`: 1 new row with last_crawled_at set
- `crawl_jobs`: 1 new row with status='completed'
- `competitor_pages`: N new rows (discovered pages)

### Journey 2: Interview Session Start
```
User Action: Clicks interview link (/interview/:token)
  ↓
Frontend: Loads InterviewChatPage
  ├─ Checks if messages exist
  └─ If no messages → Redirects to /interview/:token/setup
  ↓
Setup Page: Displays
  ├─ Website analysis card (shows scraped page count)
  ├─ Document upload dropzone
  └─ "Skip & Start" or "Start Interview" buttons
  ↓
User Action: Upload documents (optional)
  ↓
Frontend: 
  ├─ Uploads to Supabase Storage (interview-documents bucket)
  ├─ Creates record in interview_documents (status: pending)
  ├─ Polls for processing_status updates
  └─ Shows status: Uploading → Pending → Processing → Ready
  ↓
[Automatic or Manual Trigger]:
Edge Function: process-interview-document
  ├─ Downloads file from storage
  ├─ Extracts text (TXT works, PDF/DOCX need implementation)
  ├─ Sends to Claude API for analysis
  ├─ Stores extracted_data (services, audience, etc.)
  ├─ Creates interview_context record
  └─ Updates processing_status to 'completed'
  ↓
User Action: Clicks "Start Interview"
  ↓
Frontend: Calls Edge Function (start_interview action)
  ├─ Passes context: doc count, page count
  └─ Receives initial greeting
  ↓
Edge Function: Creates initial message
  ├─ Content: "I've reviewed N documents and your website (M pages)"
  ├─ Asks first question about services
  └─ Stores in interview_messages
  ↓
Frontend: Navigates to /interview/:token
  ├─ Loads all messages
  └─ Displays chat interface
```

**Database State After**:
- `interview_sessions`: has_uploaded_docs=true (if docs uploaded)
- `interview_documents`: 1+ rows with processing_status='completed'
- `interview_context`: 1+ rows with analyzed data
- `interview_messages`: 1 row (initial greeting)

### Journey 3: Interview Conversation
```
User Action: Types response in chat
  ↓
Frontend: Calls Edge Function (send_message action)
  ├─ Saves user message to database
  └─ Forwards to n8n webhook
  ↓
n8n Workflow: "Interview Chatbot"
  ├─ Gets full conversation history
  ├─ Formats for Claude API
  ├─ Calls Claude Sonnet 4.5
  ├─ Receives response
  ├─ Parses <extracted_data> tags
  ├─ Stores assistant message
  └─ Stores extracted responses
  ↓
Frontend: Polls for new messages
  ├─ Displays Claude's response
  └─ Waits for next user input
  ↓
[Repeat until interview complete]
```

**Database State During**:
- `interview_messages`: 2 rows per exchange (user + assistant)
- `client_responses`: N rows with extracted data
- `interview_sessions.total_questions_asked`: Increments

### Journey 4: Content Generation (Planned)
```
Interview Complete Detection:
  ↓
n8n Workflow: Sets interview_sessions.status = 'completed'
  ↓
Triggers: Content generation workflow
  ├─ Reads full interview transcript
  ├─ Reads context_summary
  ├─ Calls Claude API for each page type
  ├─ Generates: Homepage, About, Services, etc.
  └─ Stores in interview_outputs
  ↓
Frontend: Shows completion screen
  ├─ Displays generated content
  ├─ Allows copy/download
  └─ Offers editing options
```

---

## Third-Party Integrations

### Firecrawl API
**Purpose**: Reliable web scraping and content extraction  
**Account**: Credentials stored in n8n  
**APIs Used**:
- **Map API**: Discovers URLs on website (synchronous, fast)
  - Input: Single URL
  - Output: Array of discovered URLs
  - Limit: Configurable (default 100)
  - Timeout: 120s recommended
- **Scrape API**: Extracts content from specific pages (planned)
  - Input: Single URL or batch
  - Output: Markdown, HTML, metadata
  - Async polling for large batches

**Rate Limits**: Monitor during batch operations (not yet determined)

**Configuration in n8n**:
- API key stored in credentials
- Base URL: Firecrawl API endpoint
- Timeout: 120000ms (2 minutes)
- Ignore Sitemap: true (excludes sitemap.xml from results)

### Anthropic Claude API
**Purpose**: AI-powered analysis and content generation  
**Model**: Claude Sonnet 4.5 (`claude-sonnet-4-20250514`)  
**Use Cases**:
1. **Document Analysis**: Extract business info from PDFs/docs
2. **Interview Chatbot**: Conduct intelligent business interviews
3. **Insight Generation**: Analyze competitor content (planned)
4. **Content Creation**: Generate website copy (planned)

**API Configuration**:
- Endpoint: https://api.anthropic.com/v1/messages
- Max Tokens: 1000 (configurable per use case)
- Temperature: Default (0.7-1.0 depending on task)

**Cost Estimates**:
- Document analysis: ~$0.02-0.04 per session
- Interview (12 questions): ~$0.15-0.25 per session
- Content generation: ~$0.10-0.20 per session
- **Total per interview**: ~$0.30-0.50

**API Key Storage**:
- n8n: Stored in credentials (already configured)
- Supabase Edge Functions: Needs `ANTHROPIC_API_KEY` in secrets

---

## Deployment Setup

### Supabase
- **Project**: Competitor_Intelligence_Dashboard
- **Region**: (not specified - check Supabase dashboard)
- **Database**: PostgreSQL 15+
- **Authentication**: Enabled
- **Storage**: Enabled (interview-documents bucket)
- **Edge Functions**: Deployed via Supabase CLI

**Database Webhooks**:
- **Site Mapping Trigger**:
  - Table: `competitors`
  - Event: INSERT
  - URL: `https://n8n.offshoot.co.nz/webhook/competitor/map?max_urls=50`
  - Method: POST

### n8n
- **Instance**: Self-hosted on Digital Ocean
- **URL**: https://n8n.offshoot.co.nz
- **Version**: 2.5.2+
- **Infrastructure**: Docker container on Digital Ocean Droplet
- **Container Name**: `n8n-docker-caddy-n8n-1`

**Restart Command**:
```bash
docker restart n8n-docker-caddy-n8n-1
```

**Access**:
- SSH: `ssh root@[droplet-ip]`
- Logs: `docker logs n8n-docker-caddy-n8n-1 -f`

**Workflow Publishing**:
- Critical: Workflows must be published for production webhooks
- Production webhook path: `/webhook/`
- Test webhook path: `/webhook-test/`
- Known issue: Sometimes need to export/import workflow to fix webhook routing

### Frontend (Lovable)
- **Platform**: Lovable hosting
- **URL**: https://intel-spotter-09.lovable.app
- **Framework**: React + TypeScript + Tailwind
- **Build**: Automatic on git push
- **Environment Variables**: Configured in Lovable dashboard
  - VITE_SUPABASE_URL
  - VITE_SUPABASE_ANON_KEY

### GitHub
- **Repository**: https://github.com/900robman/competitor-compass.git
- **Branches**: Main (production)
- **Deploy**: Push to main triggers Lovable rebuild

---

## Key Technical Decisions

### 1. Read/Write Separation
**Decision**: Frontend reads from database, all writes go through n8n workflows

**Rationale**:
- Centralized data processing and validation
- Better error handling and retry logic
- Complete audit trail via crawl_jobs
- Enables complex multi-step operations
- Prevents data corruption from concurrent writes

**Implementation**:
- Frontend: Direct Supabase queries with RLS
- Backend: n8n webhooks for all mutations
- Authentication: Service role key in n8n bypasses RLS

### 2. Token-Based Interview Access
**Decision**: Anonymous interviews using shareable tokens instead of user accounts

**Rationale**:
- Removes friction (no signup required)
- Enables easy sharing with clients
- Maintains privacy (no personal email collection)
- Simplifies UX for one-time use

**Trade-offs**:
- Can't easily retrieve past interviews
- No user account linkage
- Requires careful RLS policy design

### 3. Firecrawl Over Custom Scraping
**Decision**: Use Firecrawl API instead of building custom web scraper

**Rationale**:
- Handles JavaScript rendering
- Manages rate limiting and retries
- Provides clean markdown output
- Reduces maintenance burden
- More reliable than headless browser approach

**Costs**: Pay-per-use, but saves significant development time

### 4. n8n for Workflows vs. Supabase Functions
**Decision**: Use n8n for complex multi-step workflows

**Rationale**:
- Visual workflow builder (easier to debug)
- Better error handling UI
- Can retry failed steps
- Execution history and logs
- No code deploy for workflow changes

**When to use Edge Functions instead**:
- Simple single-purpose operations
- Need TypeScript type safety
- Tight integration with Supabase features

### 5. Auto-Categorization Over Manual Tagging
**Decision**: Automatically categorize pages during discovery

**Rationale**:
- Immediate organization of discovered content
- No manual categorization effort
- Pattern-based approach covers 90%+ of cases
- Can be refined later with AI

**Trade-offs**: Some pages miscategorized, but acceptable for v1

---

## Development Environment

### Local Development (Not Yet Set Up)
**Note**: Currently using Lovable for frontend development. Local setup pending migration to Claude Desktop workflow.

**Planned Local Stack**:
- Node.js 18+ and npm
- Git
- Supabase CLI (for Edge Functions)
- PowerShell (for API testing)

### Current Development Workflow
1. **Frontend Changes**: Make via Lovable interface with detailed prompts
2. **Database Changes**: Execute via Supabase SQL Editor
3. **Workflow Changes**: Edit in n8n web interface
4. **Edge Functions**: Deploy via Supabase CLI
5. **Testing**: PowerShell scripts + browser console + Supabase logs

### Monitoring & Debugging
- **Database Logs**: Supabase Dashboard → Database → Logs
- **Edge Function Logs**: Supabase Dashboard → Functions → [function] → Logs
- **n8n Execution History**: n8n Dashboard → Executions
- **Storage Files**: Supabase Dashboard → Storage → interview-documents
- **Network Requests**: Browser DevTools

---

## Known Issues & Workarounds

### Issue 1: Document Processing Trigger Disabled
**Problem**: Database trigger for auto-processing causes upload failures  
**Cause**: pg_net extension not configured (needs Supabase URL and service_role_key)  
**Workaround**: Manual Edge Function trigger via browser console  
**Status**: Pending configuration

### Issue 2: PDF/DOCX Extraction Not Implemented
**Problem**: Can't extract text from PDF or DOCX files  
**Cause**: Libraries (PDF.js, mammoth.js) not added to Edge Function  
**Workaround**: Test with TXT files or manually insert extracted_text  
**Status**: Implementation needed

### Issue 3: n8n Workflow Publishing Quirk
**Problem**: After changes, production webhook sometimes returns 404  
**Workaround**: Export workflow → Import as new → Publish  
**Status**: Known n8n behavior, workaround reliable

### Issue 4: No Website Analysis Yet
**Problem**: Can't leverage scraped competitor pages in interviews  
**Cause**: Feature not yet built (Milestone 3)  
**Workaround**: Manual reference to competitor content  
**Status**: Planned for next phase

---

## Future Architecture Considerations

### Scaling Considerations
- **Database**: Supabase handles scaling automatically
- **Edge Functions**: Stateless, scale horizontally
- **n8n**: May need dedicated workers for heavy workloads
- **Storage**: Implement cleanup for old interview documents

### Performance Optimization
- **Context Summary**: Limit size to prevent token bloat in Claude API
- **Website Analysis**: Cache results per competitor (don't re-analyze)
- **Prompt Caching**: Implement for system instructions
- **Database Queries**: Add indexes as query patterns emerge

### Security Enhancements
- **Rate Limiting**: Add to Edge Functions to prevent abuse
- **Token Expiry**: Implement expiration for interview tokens
- **File Scanning**: Add virus scanning for uploaded documents
- **Input Validation**: Strengthen validation in Edge Functions

### Feature Extensions
- **Multi-language Support**: Internationalize interview chatbot
- **Custom Question Sets**: Allow users to define interview templates
- **Integration APIs**: Webhooks for third-party integrations
- **Analytics Dashboard**: Track interview metrics and quality

---

## Quick Reference

### Important URLs
- **Lovable App**: https://intel-spotter-09.lovable.app
- **n8n Instance**: https://n8n.offshoot.co.nz
- **GitHub Repo**: https://github.com/900robman/competitor-compass.git
- **Supabase Dashboard**: https://supabase.com/dashboard (project: Competitor_Intelligence_Dashboard)

### Webhook Endpoints
- **Site Mapping**: `https://n8n.offshoot.co.nz/webhook/competitor/map`
- **Interview Chat**: `https://n8n.offshoot.co.nz/webhook/interview/message`

### Edge Function Endpoints
- **Interview Public**: `https://bsloebohbsepdfoldsud.supabase.co/functions/v1/interview-public`
- **Process Document**: `https://bsloebohbsepdfoldsud.supabase.co/functions/v1/process-interview-document`

### Storage Buckets
- **interview-documents**: Public bucket for document uploads (10MB limit)

---

**Last Updated**: February 15, 2026  
**Next Review**: After Phase 3 completion
