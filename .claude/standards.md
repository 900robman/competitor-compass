# Development Standards

**Project**: Competitor Compass  
**Last Updated**: February 15, 2026

---

## Code Style & Formatting

### TypeScript/JavaScript
- **Indentation**: 2 spaces (not tabs)
- **Quotes**: Single quotes for strings (`'example'`)
- **Semicolons**: Use semicolons (not optional)
- **Line Length**: 100 characters max (flexible for readability)
- **Trailing Commas**: Use in multi-line arrays/objects

### React Components
- **Naming**: PascalCase for components (`InterviewChatPage.tsx`)
- **File Extension**: `.tsx` for React components, `.ts` for utilities
- **Exports**: Named exports for utilities, default export for page components

```typescript
// Good - Page component
export default function InterviewChatPage() {
  return <div>...</div>;
}

// Good - Utility function
export function formatSessionToken(token: string): string {
  return token.replace(/^interview-/, '');
}
```

### CSS/Tailwind
- **Approach**: Tailwind utility classes preferred over custom CSS
- **Order**: Logical grouping (layout → spacing → colors → typography)
- **Custom Classes**: Avoid unless absolutely necessary
- **Responsive**: Mobile-first approach (`sm:`, `md:`, `lg:`)

```tsx
// Good - Organized Tailwind classes
<div className="flex flex-col gap-4 p-6 bg-white rounded-lg shadow-md">
  <h2 className="text-xl font-semibold text-gray-900">Title</h2>
</div>
```

### SQL
- **Keywords**: UPPERCASE (`SELECT`, `FROM`, `WHERE`)
- **Table/Column Names**: lowercase with underscores (`interview_sessions`)
- **Indentation**: Align clauses for readability
- **Comments**: Use `--` for single-line comments

```sql
-- Good
SELECT 
  id,
  session_token,
  created_at
FROM interview_sessions
WHERE status = 'active'
ORDER BY created_at DESC;
```

---

## Component Patterns

### Page Components
**Location**: `src/pages/`  
**Pattern**: One component per file, default export

```typescript
// src/pages/InterviewChatPage.tsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export default function InterviewChatPage() {
  const { token } = useParams();
  const [messages, setMessages] = useState([]);
  
  useEffect(() => {
    // Load messages
  }, [token]);
  
  return (
    <div className="container mx-auto">
      {/* Page content */}
    </div>
  );
}
```

### Reusable Components
**Location**: `src/components/`  
**Pattern**: Named export, self-contained

```typescript
// src/components/ui/MessageBubble.tsx
interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
}

export function MessageBubble({ role, content }: MessageBubbleProps) {
  return (
    <div className={role === 'user' ? 'ml-auto' : 'mr-auto'}>
      {content}
    </div>
  );
}
```

### Custom Hooks
**Location**: `src/hooks/`  
**Naming**: Prefix with `use` (`useInterview`)  
**Pattern**: Return tuple or object

```typescript
// src/hooks/useInterview.ts
import { useState, useEffect } from 'react';

export function useInterview(sessionToken: string) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Fetch session
  }, [sessionToken]);
  
  return { session, loading };
}
```

---

## File Organization

### Directory Structure
```
competitor-compass/
├── .claude/                    # Claude Desktop coordination files
│   ├── architecture.md
│   ├── standards.md
│   └── context.md
├── src/
│   ├── pages/                  # Page components (routes)
│   │   ├── InterviewChatPage.tsx
│   │   └── InterviewSetupPage.tsx
│   ├── components/             # Reusable components
│   │   ├── ui/                 # shadcn/ui components
│   │   └── interview/          # Feature-specific components
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utilities and helpers
│   │   ├── supabase.ts         # Supabase client
│   │   └── utils.ts            # General utilities
│   ├── types/                  # TypeScript type definitions
│   │   └── database.ts         # Supabase database types
│   └── App.tsx                 # Root component
├── supabase/
│   ├── functions/              # Edge Functions
│   │   ├── interview-public/
│   │   └── process-interview-document/
│   └── migrations/             # Database migrations
├── public/                     # Static assets
├── package.json
├── tsconfig.json
└── README.md
```

### File Naming Conventions
- **Components**: PascalCase (`InterviewChatPage.tsx`)
- **Hooks**: camelCase with `use` prefix (`useInterview.ts`)
- **Utilities**: camelCase (`formatDate.ts`)
- **Types**: PascalCase or camelCase (`database.ts`, `Interview.ts`)
- **Constants**: SCREAMING_SNAKE_CASE in dedicated file (`CONSTANTS.ts`)

---

## Naming Conventions

### Variables & Functions
- **camelCase**: Standard for variables and functions
- **Descriptive**: Prefer clarity over brevity
- **Boolean Prefixes**: `is`, `has`, `should`, `can`

```typescript
// Good
const sessionToken = 'interview-abc123';
const hasUploadedDocs = true;
const isProcessing = false;

function getInterviewSession(token: string) { }
function shouldShowSetupPage() { }
```

### Database Entities
- **Tables**: Plural, snake_case (`interview_sessions`)
- **Columns**: snake_case (`session_token`, `created_at`)
- **Foreign Keys**: `{table_singular}_id` (`competitor_id`)
- **Timestamps**: `created_at`, `updated_at`, `deleted_at` (if soft delete)
- **Boolean Flags**: Positive phrasing (`is_active`, `has_uploaded_docs`)

### Constants
- **SCREAMING_SNAKE_CASE**: For true constants
- **Group Related**: Use objects or enums

```typescript
// Good
const MAX_FILE_SIZE_MB = 10;
const INTERVIEW_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  ABANDONED: 'abandoned'
} as const;

// Or use enums
enum InterviewStatus {
  Active = 'active',
  Completed = 'completed',
  Abandoned = 'abandoned'
}
```

### Types & Interfaces
- **PascalCase**: For types and interfaces
- **Descriptive Suffixes**: `Props`, `Response`, `Data` when helpful
- **Prefix `I`**: Avoided (not using Hungarian notation)

```typescript
// Good
interface InterviewSession {
  id: string;
  token: string;
  status: string;
}

type MessageBubbleProps = {
  role: 'user' | 'assistant';
  content: string;
};

type ApiResponse<T> = {
  data: T;
  error?: string;
};
```

---

## TypeScript Patterns

### Type Safety
- **Strict Mode**: Enabled (`strict: true` in tsconfig)
- **Explicit Types**: For function parameters and returns
- **Type Inference**: Use for simple variable assignments
- **Avoid `any`**: Use `unknown` if type truly unknown

```typescript
// Good
function processDocument(documentId: string): Promise<ProcessResult> {
  // Implementation
}

// Avoid
function processDocument(documentId: any): any {
  // Implementation
}
```

### Database Types
- **Generated Types**: Use Supabase CLI to generate types
- **Location**: `src/types/database.ts`
- **Pattern**: Import and use generated types

```typescript
// src/types/database.ts (auto-generated)
export type Database = {
  public: {
    Tables: {
      interview_sessions: {
        Row: {
          id: string;
          session_token: string;
          // ...
        };
        Insert: { /* ... */ };
        Update: { /* ... */ };
      };
    };
  };
};

// Usage in component
import { Database } from '@/types/database';

type InterviewSession = Database['public']['Tables']['interview_sessions']['Row'];
```

### Async/Await
- **Prefer `async/await`**: Over `.then()` chains
- **Error Handling**: Use `try/catch` blocks
- **Return Types**: Explicitly type `Promise<T>`

```typescript
// Good
async function fetchSession(token: string): Promise<InterviewSession | null> {
  try {
    const { data, error } = await supabase
      .from('interview_sessions')
      .select('*')
      .eq('session_token', token)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to fetch session:', error);
    return null;
  }
}
```

### Unions & Discriminated Unions
- **Use for State**: Multiple possible states
- **Type Guards**: Create when needed

```typescript
// Good - Discriminated union
type ProcessingStatus = 
  | { status: 'pending' }
  | { status: 'processing'; progress: number }
  | { status: 'completed'; result: string }
  | { status: 'failed'; error: string };

// Type guard
function isCompleted(status: ProcessingStatus): status is { status: 'completed'; result: string } {
  return status.status === 'completed';
}
```

---

## Supabase Integration Patterns

### Client Initialization
- **Single Instance**: Create once, export
- **Location**: `src/lib/supabase.ts`

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Query Patterns
- **Select**: Explicit column selection when possible
- **Filters**: Chain `.eq()`, `.in()`, etc. for clarity
- **Single vs Multiple**: Use `.single()` when expecting one row
- **Error Handling**: Always check `error` before using `data`

```typescript
// Good - Explicit select, error handling
async function getSessionMessages(sessionId: string) {
  const { data, error } = await supabase
    .from('interview_messages')
    .select('id, role, content, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
  
  return data;
}
```

### Insert Patterns
- **Return Data**: Use `.select()` after insert to get created row
- **Single Insert**: Prefer object over array for single row

```typescript
// Good
async function createSession(projectId: string) {
  const { data, error } = await supabase
    .from('interview_sessions')
    .insert({
      project_id: projectId,
      session_token: `interview-${crypto.randomUUID()}`,
      status: 'active'
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}
```

### Storage Patterns
- **Upload**: Use descriptive paths
- **Public Access**: Specify `public: true` for buckets
- **Error Handling**: Check upload response

```typescript
// Good - Structured storage path
async function uploadDocument(sessionToken: string, file: File) {
  const filePath = `${sessionToken}/${file.name}`;
  
  const { data, error } = await supabase.storage
    .from('interview-documents')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) throw error;
  return data;
}
```

---

## Edge Function Patterns

### Function Structure
- **Single Entry Point**: `index.ts` exports handler
- **Action Routing**: Use action parameter for multiple operations
- **Error Responses**: Consistent format

```typescript
// supabase/functions/interview-public/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, ...params } = await req.json();
    
    // Route based on action
    switch (action) {
      case 'create_session':
        return await createSession(params);
      case 'send_message':
        return await sendMessage(params);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
```

### Environment Variables
- **Access**: Use `Deno.env.get()`
- **Validation**: Check for required vars at startup
- **Secrets**: Store in Supabase Dashboard → Edge Functions → Secrets

```typescript
// Good - Validate environment
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing required environment variables');
}

const supabase = createClient(supabaseUrl, serviceRoleKey);
```

### Response Patterns
- **Consistent Structure**: `{ success, data?, error? }`
- **Appropriate Status Codes**: 200, 400, 500
- **CORS Headers**: Always include

```typescript
// Good - Consistent response
function successResponse(data: any) {
  return new Response(
    JSON.stringify({ success: true, data }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

function errorResponse(message: string, status = 400) {
  return new Response(
    JSON.stringify({ success: false, error: message }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}
```

---

## n8n Workflow Patterns

### Workflow Organization
- **Naming**: Descriptive, includes entity (`Competitor - Map Site`)
- **Comments**: Add notes to complex nodes
- **Error Paths**: Always implement error handling branches
- **Testing**: Use pinned data during development, remove before publish

### Node Patterns
- **Prefer Native Nodes**: Use Supabase/Firecrawl nodes over HTTP requests
- **Single Responsibility**: One node does one thing well
- **Pass-Through Debugging**: Add "Edit Fields" nodes with test data during dev
- **Code Nodes**: Use sparingly, prefer native nodes

```javascript
// Code node - Run Once for All Items
// Good - Simple transformation
const links = $input.first().json.links || [];
return links;

// Avoid - Complex logic better suited for native nodes
// (Do filtering, sorting, database ops with native nodes instead)
```

### Data Flow
- **Access Previous Nodes**: 
  - In "Run Once for Each Item": `$node["Node Name"].json[0]`
  - In expressions: `$('Node Name').item.json.field`
- **Type Conversion**: Convert query params to numbers
  - `{{ Number($json.query.max_urls) || 100 }}`

### Database Operations (Supabase Node)
- **Always Use Supabase Node**: Not generic PostgreSQL node
- **Filter Syntax**: `id = $json.body.record.id`
- **Return Values**: Select fields needed for next nodes
- **Credentials**: Use `service_role` key (bypasses RLS)

---

## Error Handling Standards

### Frontend Error Handling
- **User-Facing**: Show friendly messages
- **Logging**: Console.error for debugging
- **Fallbacks**: Provide graceful degradation

```typescript
// Good
try {
  const session = await fetchSession(token);
  if (!session) {
    throw new Error('Session not found');
  }
  setSession(session);
} catch (error) {
  console.error('Failed to load session:', error);
  setError('Unable to load interview session. Please check your link.');
}
```

### Edge Function Error Handling
- **Try/Catch**: Wrap async operations
- **Specific Errors**: Catch and handle specific error types
- **Client Response**: Return structured error objects

```typescript
// Good
try {
  const response = await fetch(apiUrl, options);
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }
  return await response.json();
} catch (error) {
  console.error('API call failed:', error);
  return errorResponse(error.message);
}
```

### n8n Error Handling
- **Error Branches**: Connect all nodes to error path
- **Error Logging**: Update crawl_jobs with error_message
- **Clear State**: Reset active_crawl_job_id on failure
- **User Notification**: Return error in webhook response

---

## Testing Approach

### Manual Testing (Current Standard)
- **Database**: Test queries in Supabase SQL Editor before implementing
- **Edge Functions**: Test with curl or browser fetch
- **Workflows**: Use n8n test webhooks with pinned data
- **Frontend**: Browser DevTools + manual clicking

### Testing Workflows
**PowerShell for API Testing**:
```powershell
# Test n8n webhook
Invoke-RestMethod -Uri "https://n8n.offshoot.co.nz/webhook/competitor/map?max_urls=10" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"type":"INSERT","table":"competitors","record":{"id":"uuid","name":"test","main_url":"https://example.com/"}}'
```

**Browser Console for Edge Functions**:
```javascript
// Test document processing
const response = await fetch('https://bsloebohbsepdfoldsud.supabase.co/functions/v1/process-interview-document', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer [ANON_KEY]'
  },
  body: JSON.stringify({ document_id: 'uuid-here' })
});
const result = await response.json();
console.log(result);
```

### Acceptance Criteria
- **Feature Complete**: All checkboxes in plan document marked
- **Error Handling**: All error paths tested
- **User Experience**: Flows work end-to-end
- **Data Integrity**: Database state correct after operations
- **Performance**: Response times acceptable (<3s for API calls)

---

## Git Workflow

### Branch Strategy (Proposed)
- **main**: Production-ready code
- **develop**: Integration branch (if needed)
- **feature/***: New features
- **fix/***: Bug fixes

*Note: Currently working directly on main with Lovable. Local git workflow TBD.*

### Commit Message Format
**Pattern**: `<type>: <description>`

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding/updating tests
- `chore`: Maintenance tasks

**Examples**:
```
feat: add document upload to interview setup page
fix: correct RLS policy for interview_documents
docs: update architecture.md with edge function details
refactor: extract message formatting to utility function
chore: upgrade Supabase client to v2.39.0
```

### Pull Request Standards (Future)
- **Title**: Same format as commit messages
- **Description**: What changed and why
- **Testing**: How it was tested
- **Screenshots**: For UI changes

---

## Documentation Standards

### Code Comments
- **When to Comment**: Complex logic, non-obvious decisions, workarounds
- **When Not to Comment**: Self-explanatory code
- **Format**: `//` for single line, `/* */` for blocks

```typescript
// Good - Explains why, not what
// Disable auto-trigger to prevent race condition with storage upload
const shouldAutoTrigger = false;

// Avoid - States the obvious
// Set loading to true
setLoading(true);
```

### Function Documentation
- **Complex Functions**: Add JSDoc comments
- **Public APIs**: Always document parameters and returns
- **Internal Helpers**: Comments optional if self-explanatory

```typescript
/**
 * Processes an uploaded interview document by extracting text
 * and analyzing it with Claude API.
 * 
 * @param documentId - UUID of the document in interview_documents table
 * @returns Processing result with extracted data
 * @throws Error if document not found or processing fails
 */
async function processInterviewDocument(documentId: string): Promise<ProcessResult> {
  // Implementation
}
```

### README Updates
- **Keep Current**: Update after major features
- **Include**: Setup instructions, environment variables, deployment steps
- **Link**: Reference architecture.md for detailed docs

---

## Performance Best Practices

### Database Queries
- **Select Specific Columns**: Don't use `SELECT *` unless needed
- **Use Indexes**: Add indexes for frequently queried columns
- **Limit Results**: Use `.limit()` for large tables
- **Pagination**: Implement for lists over 50 items

### React Performance
- **Memoization**: Use `useMemo` and `useCallback` for expensive operations
- **Avoid Inline Functions**: In render loops
- **Lazy Loading**: Split code with `React.lazy()` for large pages

```typescript
// Good - Memoize expensive computation
const sortedMessages = useMemo(() => {
  return messages.sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}, [messages]);
```

### API Calls
- **Debounce**: User input that triggers searches
- **Batch**: Multiple operations when possible
- **Cache**: Store frequently accessed data
- **Abort**: Cancel pending requests when component unmounts

---

## Security Standards

### Input Validation
- **Never Trust User Input**: Validate in Edge Functions
- **Sanitize**: Before database insertion
- **File Uploads**: Validate type and size

```typescript
// Good - Validate file type
const ALLOWED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];

if (!ALLOWED_TYPES.includes(file.type)) {
  throw new Error('Invalid file type');
}

if (file.size > 10 * 1024 * 1024) { // 10MB
  throw new Error('File too large');
}
```

### Environment Variables
- **Never Commit**: Add to `.gitignore`
- **Use Prefixes**: `VITE_` for Vite, `SUPABASE_` for Supabase
- **Secrets**: Store sensitive keys in Supabase Dashboard

### RLS Policies
- **Enable on All Tables**: Unless specifically public
- **Test Policies**: Verify access restrictions work
- **Service Role**: Only use in backend (Edge Functions, n8n)

---

## Lovable Development Patterns

### Prompt Structure
- **Be Specific**: Include exact file names and locations
- **Provide Context**: Reference existing components by name
- **Include Code**: Paste exact code when possible
- **Clear Acceptance Criteria**: List what "done" looks like

**Example Good Prompt**:
```
Update the InterviewSetupPage component at src/pages/InterviewSetupPage.tsx:

1. Add a new state variable for tracking upload progress
2. Update the handleUpload function to call updateSession Edge Function after upload
3. Add a status polling useEffect that checks processing_status every 2 seconds
4. Display status indicator: "Uploading" → "Pending" → "Processing" → "Ready ✓"

Acceptance criteria:
- Upload progress shows percentage
- Status updates automatically without refresh
- Ready state shows green checkmark
- Errors display user-friendly messages
```

### Iteration Strategy
- **One Change at a Time**: Don't combine multiple features
- **Test Between Changes**: Verify each change works before next
- **Provide Feedback**: Tell Lovable what worked or didn't

### Component Referencing
- **Use Exact Names**: `InterviewChatPage` not "the chat page"
- **Specify Paths**: `src/pages/InterviewChatPage.tsx`
- **Reference Props**: "The MessageBubble component's `role` prop"

---

## Database Migration Standards

### Migration Files
- **Naming**: Descriptive, sequential (`001_create_crawl_jobs.sql`)
- **One Purpose**: Each migration does one thing
- **Reversible**: Include rollback logic when possible
- **Test**: Run on dev before production

### Migration Content
- **Check Existence**: Use `IF NOT EXISTS` for idempotent migrations
- **Explicit Types**: Don't rely on defaults
- **Add Indexes**: In same migration as table creation

```sql
-- Good migration structure
-- Migration: 001_create_interview_documents
-- Purpose: Add document upload support to interview system

-- Create table
CREATE TABLE IF NOT EXISTS public.interview_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_session_id uuid NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
  filename text NOT NULL,
  file_type text NOT NULL,
  processing_status text DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  created_at timestamp with time zone DEFAULT now()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_interview_documents_session_id 
  ON interview_documents(interview_session_id);
CREATE INDEX IF NOT EXISTS idx_interview_documents_processing_status 
  ON interview_documents(processing_status);

-- Add RLS policies
ALTER TABLE interview_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view documents"
  ON interview_documents FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert documents"
  ON interview_documents FOR INSERT
  WITH CHECK (true);
```

---

## Deployment Checklist

### Before Deploying Edge Functions
- [ ] Test locally with `supabase functions serve`
- [ ] Verify environment variables are set in Supabase Dashboard
- [ ] Check CORS headers are included
- [ ] Remove console.logs (or make conditional on dev env)
- [ ] Test with real data, not just mocked

### Before Publishing n8n Workflows
- [ ] Remove pinned test data from all nodes
- [ ] Test with production webhook URL
- [ ] Verify database credentials use service_role key
- [ ] Add error handling branches
- [ ] Document webhook URL and parameters
- [ ] If webhook doesn't work after publish, try export/import trick

### Before Deploying Frontend
- [ ] Test all new pages/components
- [ ] Check console for errors
- [ ] Verify mobile responsiveness
- [ ] Update environment variables if needed
- [ ] Push to GitHub (triggers Lovable build)

---

## Common Patterns & Solutions

### Pattern: Polling for Status Updates
```typescript
// Poll processing_status every 2 seconds
useEffect(() => {
  if (!documentId || status === 'completed' || status === 'failed') return;
  
  const interval = setInterval(async () => {
    const { data } = await supabase
      .from('interview_documents')
      .select('processing_status')
      .eq('id', documentId)
      .single();
    
    if (data) {
      setStatus(data.processing_status);
    }
  }, 2000);
  
  return () => clearInterval(interval);
}, [documentId, status]);
```

### Pattern: Conditional Redirects
```typescript
// Redirect to setup if no messages exist
useEffect(() => {
  async function checkMessages() {
    const { data } = await supabase
      .from('interview_messages')
      .select('id')
      .eq('session_id', sessionId)
      .limit(1);
    
    if (!data || data.length === 0) {
      navigate(`/interview/${token}/setup`);
    }
  }
  
  checkMessages();
}, [sessionId, token, navigate]);
```

### Pattern: Extracted Data Parsing
```typescript
// Parse <extracted_data> tags from Claude response
function parseExtractedData(content: string): Record<string, any> | null {
  const match = content.match(/<extracted_data>(.*?)<\/extracted_data>/s);
  if (!match) return null;
  
  try {
    return JSON.parse(match[1]);
  } catch (error) {
    console.error('Failed to parse extracted data:', error);
    return null;
  }
}
```

---

## Anti-Patterns to Avoid

### Database
- ❌ Using `SELECT *` when specific columns needed
- ❌ Not checking `error` before using `data` from Supabase
- ❌ Hardcoding UUIDs in code (use variables/parameters)
- ❌ Creating tables without indexes on foreign keys
- ❌ Not enabling RLS on tables with user data

### React
- ❌ Mutating state directly: `messages.push(newMessage)` ❌
  - ✅ Use: `setMessages([...messages, newMessage])`
- ❌ Not cleaning up subscriptions/intervals in useEffect
- ❌ Fetching data in render (use useEffect)
- ❌ Inline object/array creation in dependencies: `useEffect(() => {}, [{}])`

### TypeScript
- ❌ Using `any` type liberally
- ❌ Ignoring TypeScript errors with `@ts-ignore`
- ❌ Not typing function return values
- ❌ Using `as` casts without verification

### n8n
- ❌ Using complex code nodes instead of native nodes
- ❌ Not implementing error handling branches
- ❌ Leaving pinned test data before publishing
- ❌ Using `anon` key instead of `service_role` key

---

## Quick Reference Snippets

### Create Interview Session
```typescript
const { data: session, error } = await supabase
  .from('interview_sessions')
  .insert({
    project_id: projectId,
    session_token: `interview-${crypto.randomUUID()}`,
    status: 'active'
  })
  .select()
  .single();
```

### Upload File to Storage
```typescript
const { data, error } = await supabase.storage
  .from('interview-documents')
  .upload(`${sessionToken}/${file.name}`, file, {
    cacheControl: '3600',
    upsert: false
  });
```

### Fetch with Error Handling
```typescript
const { data, error } = await supabase
  .from('interview_messages')
  .select('*')
  .eq('session_id', sessionId)
  .order('created_at', { ascending: true });

if (error) {
  console.error('Failed to fetch messages:', error);
  setError('Unable to load messages');
  return;
}

setMessages(data);
```

### Edge Function CORS Headers
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

---

**Last Updated**: February 15, 2026  
**Next Review**: After local development setup complete
