

## Two Changes

### 1. Fix: Top Category card showing wrong data

The "Top Category" stats card in `CompetitorQuickStats.tsx` reads category from `(p.metadata as any)?.category` (the old location), but categories are now stored in the direct `p.category` column. This will be updated to use `p.category` as the primary source, falling back to metadata for legacy data.

### 2. Feature: Add "Website" field to Projects

Allow each project to have its own website URL. This site's pages can then be mapped and scraped just like competitor sites.

---

### How it works

**Database (migration)**
- Add a `website` column (`text`, nullable) to the `projects` table.

**Backend (existing pattern)**
- No new edge functions needed. The existing `firecrawl-map` and `firecrawl-scrape` edge functions (or the n8n webhook pattern already used for competitors) will be reused.
- Project pages will be stored in `competitor_pages` by creating a special "self" competitor record for the project's own website, OR by adding a new `project_pages` table. The simpler approach: when a project website is set, a hidden/internal competitor record is created for it so all existing mapping, scraping, and category logic works without duplication.

**Frontend changes**

| File | Change |
|---|---|
| `src/types/database.ts` | Add `website: string \| null` to the `projects` table types |
| `src/components/competitors/CompetitorQuickStats.tsx` | Fix line 24: use `p.category ?? (p.metadata as any)?.category ?? 'Uncategorized'` |
| `src/pages/ProjectsPage.tsx` | Add a "Website URL" input field (prefilled with `http://`) to the Create Project dialog |
| `src/pages/CompetitorListPage.tsx` | Show the project's own website at the top of the page with Map/Scrape actions (reusing `CompetitorActions`). When a website is set and no internal competitor exists for it, auto-create one. |
| `src/lib/api.ts` | Update `createProject` to accept and pass the `website` field |
| `src/hooks/useProjects.ts` | Update `useCreateProject` to pass `website` |

### Technical Details

**Self-competitor approach**: When the user sets a project website, the system creates a competitor record with a convention (e.g., the competitor name matches the project name with a flag in `crawl_config` like `{ is_project_site: true }`). This lets all existing page discovery, scraping, category assignment, and table UI work without building parallel systems. The project website competitor can be visually distinguished or shown in a separate section on the competitor list page.

**Flow**:
```text
User creates/edits project with website URL
  -> Competitor record created (flagged as project site)
  -> User clicks Map/Scrape (same UI as competitors)
  -> Pages stored in competitor_pages
  -> All existing category, search, comparison features work
```

