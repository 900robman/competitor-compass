# Current Context

**Last Updated**: February 17, 2026

---

## Current Status

The interview chatbot core flow is complete and verified in production (55 messages, 25 extracted data records from a real session). PDF/DOCX extraction is implemented. The auto-trigger for document processing was added today. The scrape pipeline is fully operational end-to-end.

We are now moving into the next development phase. Three features have been agreed on, in priority order:

---

## Upcoming Features — Agreed Priority Order

### 🔴 Feature 1: Interview Completion & Output Generation (IN PROGRESS)
### 🟠 Feature 2: AI Insights from Scraped Content (Phase 4)
### 🟡 Feature 3: Sitemap Builder UI (Phase 5)

---

## Feature 1: Interview Completion & Output Generation

**Priority**: Highest
**Status**: Starting now

### The Problem
The interview chatbot has no ending. Claude continues the conversation indefinitely — no signal that enough has been covered, no transition to "done", and `interview_outputs` is empty. The interview collects data well but produces no deliverable.

### What Needs to Be Built

#### Part A: Completion Detection
Claude needs to recognise when sufficient information has been gathered across the key categories and wrap up the session gracefully.

- Claude signals completion by including a `<interview_complete>true</interview_complete>` tag in its response (same pattern as `<extracted_data>`)
- The n8n workflow detects this tag and:
  - Strips it from the displayed message (same as extracted_data)
  - Updates `interview_sessions.status` → `'completed'`
  - Updates `interview_sessions.completed_at`
- The frontend detects `status = 'completed'` and transitions the UI to a "complete" state (locks input, shows completion message, offers to view outputs)

**Completion criteria Claude should use** (to be defined in system prompt):
- Services/offerings covered ✅
- Target audience identified ✅
- Key differentiators captured ✅
- Brand voice/tone understood ✅
- At least one open-ended question answered (story/background)
- Typically 10–15 questions minimum

#### Part B: Output Generation
Once an interview is marked complete, a workflow reads all `client_responses` for the session and generates structured website copy, storing it in `interview_outputs`.

**Output types to generate** (matching `interview_outputs.output_type` enum):
- `page_content` — Full page recommendations (homepage, about, services)
- `copy_suggestions` — Key headline/tagline options, value proposition statements

**Tables involved**:
- Read from: `client_responses` (all records for session), `interview_context` (document analysis)
- Write to: `interview_outputs` (one row per output type/page)
- Update: `interview_sessions.status` if not already completed

#### Part C: Output Display UI
A view in the frontend where the agency/user can see the generated outputs from a completed interview session. Most likely a new tab or section in `ClientInterviewTab` or a dedicated page.

### Key Data Available for Output Generation
The `client_responses` table already has 25 structured records including:
- `services` — what the client offers
- `target_audience` — who they serve
- `unique_value_props` — differentiators
- `pricing_model` — how they charge
- `brand_voice` — tone and personality
- `content_priorities` — what matters most on the site

### Components to Modify / Create
- **n8n**: "Competitor Compass - Client Interview Chatbot" workflow — add completion detection in Parse Response node, add session update step
- **n8n**: New workflow (or additional branch) for output generation triggered on session completion
- **Edge Function**: `interview-public` — may need a `get_outputs` action added
- **Frontend**: `InterviewChatPage` — handle `completed` session status in UI
- **Frontend**: `ClientInterviewTab` — show completed sessions with outputs link
- **Frontend**: New component or page for viewing `interview_outputs`

---

## Feature 2: AI Insights from Scraped Content (Phase 4)

**Priority**: High (after Feature 1)
**Status**: Planned

### The Problem
222 scraped pages are sitting in the database with full markdown content. There is no workflow yet that reads this content, sends it to Claude for analysis, and writes structured competitive intelligence back.

### What Needs to Be Built
- n8n workflow that reads `competitor_pages` where `scrape_status = 'success'`
- Sends content to Claude for analysis (services, pricing, messaging, positioning)
- Writes structured results to `competitor_insights` with `embedding` vectors (pgvector)
- UI to surface insights per competitor and across competitors

### Infrastructure Already Ready
- `competitor_insights` table (schema complete, 0 rows)
- `match_competitor_content` RPC (vector similarity search)
- pgvector extension installed
- 222 pages of scraped content ready to process

---

## Feature 3: Sitemap Builder UI (Phase 5)

**Priority**: Medium (after Feature 2)
**Status**: Planned

### The Problem
The `sitemaps` and `wireframe_sections` tables exist but have no UI and no data. This is where competitive intelligence and interview outputs converge into a recommended site structure for the client.

### What Needs to Be Built
- UI to create and manage a hierarchical sitemap (`sitemaps` table)
- Section-level wireframe specs per page (`wireframe_sections` table)
- Reference competitor pages as evidence for each recommendation
- Eventually connect to content drafts (`content_drafts` table)

### Dependencies
- Feature 2 (insights) should be complete first — the sitemap builder's value comes from being informed by competitive intelligence
- Feature 1 outputs feed into content recommendations per page

---

## What Was Completed Before This Session (for reference)

- ✅ Interview chatbot core flow (n8n workflow + edge functions)
- ✅ Dynamic question types (checkbox, multiselect, yesno, open)
- ✅ Structured data extraction via `<extracted_data>` tags → `client_responses`
- ✅ Document upload + processing (PDF via `unpdf`, DOCX via `mammoth`, TXT direct)
- ✅ Auto-trigger on `interview_documents` INSERT (added Feb 17, 2026)
- ✅ Site mapping workflow (Firecrawl Map → `competitor_pages`)
- ✅ Batch scrape workflow (Firecrawl Batch → markdown/html content)
- ✅ Database-driven page categorisation (`page_categories` table + `categorize_job_pages` RPC)
- ✅ Company type classification on competitors
- ✅ Settings UI for categories and company types
- ✅ CompetitorActions UI with Map and Scrape Pending buttons
- ✅ selected_options saving correctly for multiselect questions
- ✅ `<extracted_data>` tags stripped from chat display

---

## Quick Reference

### Key Endpoints
- **Interview Chat Webhook**: `POST https://n8n.offshoot.co.nz/webhook/redesign/interview-chat`
- **Interview Public Edge Function**: `https://bsloebohbsepdfoldsud.supabase.co/functions/v1/interview-public`
- **n8n**: https://n8n.offshoot.co.nz

### Key Tables for Feature 1
- `interview_sessions` — status field to update on completion
- `interview_messages` — full conversation history
- `client_responses` — 25 structured extracted records (the input for output generation)
- `interview_context` — document analysis context
- `interview_outputs` — where generated content goes (currently empty)
