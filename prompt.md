# AI Article Writer & Rewriter — Full Stack Next.js App

## Project Overview
Build a full-stack Next.js 14 (App Router) AI-powered article creation and rewriting tool for WordPress sites. The app will be deployed on Vercel, uses Supabase as the database, and integrates with WordPress via a custom plugin.

---

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS — calm, minimal design with dark mode support
- **Database:** Supabase (PostgreSQL)
- **AI Providers:** OpenAI (GPT), Google Gemini, OpenRouter (unified for free/paid models)
- **Markdown Editor:** react-md-editor (free, supports write + preview tabs)
- **Language:** English UI, Arabic content support (RTL-aware)
- **Deployment:** Vercel

---

## Database Schema (Supabase)

### Tables:

**`instruction_templates`**
- id (uuid, PK)
- name (text)
- type (enum: 'writing' | 'checking')
- content (text) — the prompt template
- created_at (timestamp)

**`generated_articles`**
- id (uuid, PK)
- title (text)
- description (text)
- slug (text)
- content (text) — markdown
- categories (text[])
- tags (text[])
- featured_image_url (text)
- wp_post_id (integer, nullable)
- status (enum: 'draft' | 'published' | 'saved')
- created_at (timestamp)

**`app_settings`**
- id (uuid, PK)
- key (text, unique)
- value (text)
— stores: openai_api_key, gemini_api_key, openrouter_api_key, wp_site_url, wp_api_key

---

## App Pages & Structure

/app
/page.tsx → Home (article generator)
/templates/page.tsx → Instruction templates manager
/articles/page.tsx → Saved articles history
/admin/page.tsx → Admin settings (API keys)
/api
/generate/route.ts → AI article generation
/rewrite/route.ts → AI article checking & rewriting
/wp/posts/route.ts → Proxy to WordPress posts list
/wp/categories/route.ts → Proxy to WordPress categories
/wp/tags/route.ts → Proxy to WordPress tags
/wp/publish/route.ts → Publish or save draft to WordPress


---

## Page 1: Home / Article Generator (`/`)

### Layout:
- Top section: 
  - Large textarea for the user prompt
  - Dropdown: select AI model (GPT-4o, GPT-3.5, Gemini Pro, Gemini Flash, OpenRouter free model selector)
  - Dropdown: select writing instruction template (fetched from Supabase)
  - Button: "Generate Article"

### After generation — Article Form Section:
Show the following fields (all editable):
- **Title** (text input)
- **Description / Excerpt** (textarea)
- **Slug** (text input — auto-generated in English from title using slugify, editable)
- **Categories** (multi-select dropdown fetched from WordPress + option to type and add new category)
- **Tags** (multi-select tag input fetched from WordPress + option to add new tags)
- **Featured Image Upload** (file input):
  - On upload: filename = slug, alt text = title, description = title
  - Show preview thumbnail
- **Content Editor** (react-md-editor with Write/Preview tabs, full markdown support)

### Action Buttons (below the form):
- **Publish to WordPress** — publishes immediately
- **Save as Draft** — saves to WordPress as draft
- **Save Locally** — saves to Supabase generated_articles table

---

## Page 2: Article Checking / Verification

### Tabs (within the Home page, below the article form):
Use a tabbed interface with two tabs:

**Tab 1: "Original Article"**
- Shows the generated article form as described above

**Tab 2: "Corrected Article"**
- Appears after clicking the "Verify" button
- Shows the rewritten article returned by AI
- Has its own editable fields (title, description, slug, categories, tags, content editor)
- Has a "Update Original" button → replaces Tab 1 content with Tab 2 content
- Has its own Publish / Save Draft / Save Locally buttons
- Shows a summary box: "Changes Made" — bullet list of what the AI changed

### Verify Button behavior:
- Takes the full article (title + description + content) from Tab 1
- Sends it to the selected checking instruction template
- Sends it to the selected AI model
- Returns: rewritten article + changes summary
- Displays result in Tab 2

---

## Page 3: Templates Manager (`/templates`)

### Layout:
- List of existing templates (cards) with Edit / Delete buttons
- "New Template" button opens a form/modal:
  - Template Name (text)
  - Template Type (radio: Writing / Checking)
  - Template Content (large textarea — supports variables like {{title}}, {{content}})
  - Save button

### WordPress Article Import (on the same page):
- Section titled "Import from WordPress"
- Dropdown to select a WordPress article:
  - Shows 10 articles per page with pagination (prev/next)
  - Each item shows: title + date
- When article is selected, show a preview form with:
  - Title, Description, Slug, Categories, Tags, Content (read-only markdown view)
  - "Load into Generator" button → sends data to Home page generator form

---

## Page 4: Admin Settings (`/admin`)

### Sections:
1. **AI API Keys**
   - OpenAI API Key (password input + save)
   - Google Gemini API Key (password input + save)
   - OpenRouter API Key (password input + save)

2. **WordPress Connection**
   - WordPress Site URL (text input)
   - WordPress API Key (generated by the WordPress plugin — password input + save)
   - "Test Connection" button — calls WP REST API and shows success/error

3. **Admin Password**
   - Change admin password for this app

All values stored encrypted in Supabase `app_settings` table.
Add a simple password gate on `/admin` (env-based password, not full auth).

---

## AI Integration

### Providers:

**OpenAI:**
```typescript
// Use openai npm package
// Models: gpt-4o, gpt-3.5-turbo
```

**Google Gemini:**
```typescript
// Use @google/genai npm package
// Models: gemini-3.8-flash, gemini-3.5-flash, gemini-3.5-flash-lite, gemini-3.1-pro-preview
```

**OpenRouter:**
```typescript
// Use fetch with https://openrouter.ai/api/v1/chat/completions
// Show model selector dropdown with popular free models:
// meta-llama/llama-3-8b-instruct:free
// mistralai/mistral-7b-instruct:free
// google/gemma-2-9b-it:free
```

### Generation Flow:
1. Combine: user prompt + selected writing template content
2. Send to selected AI provider
3. Parse response — expect JSON with fields: title, description, slug, content (markdown), suggested_categories, suggested_tags
4. Populate the article form

### Verification Flow:
1. Combine: article data + selected checking template content
2. Send to selected AI provider
3. Parse response — expect JSON with fields: title, description, slug, content (markdown), changes_summary (array of strings)
4. Display in Tab 2

### AI Response Format (instruct the model via system prompt):

Respond ONLY with a valid JSON object. No markdown fences. No explanation.
Format:
{
"title": "...",
"description": "...",
"slug": "english-slug-here",
"content": "full markdown content here",
"suggested_categories": ["cat1", "cat2"],
"suggested_tags": ["tag1", "tag2"],
"changes_summary": ["change 1", "change 2"] // only for verification
}


---

## WordPress Plugin

### Plugin Details:
- Plugin Name: AI Writer Connector
- Single file plugin: `ai-writer-connector.php`
- On activation: generates a unique API key and stores it in wp_options
- The API key is shown in the plugin settings page in WordPress admin

### Plugin Settings Page (in WP Admin):
- Shows the generated API key (with copy button)
- "Regenerate Key" button
- Shows connection status

### Plugin REST API Endpoints:
All endpoints are under `/wp-json/ai-writer/v1/` and require the API key in header: `X-AI-Writer-Key: {key}`

**GET `/posts`**
- Query params: `page` (default 1), `per_page` (default 10)
- Returns: array of { id, title, excerpt, slug, date, categories, tags, content }
- Also returns total count and total pages for pagination

**GET `/posts/{id}`**
- Returns full post data including content (converted to markdown if possible)

**GET `/categories`**
- Returns all categories: { id, name, slug, count }

**GET `/tags`**
- Returns all tags: { id, name, slug, count }

**POST `/posts`**
- Body: { title, description, slug, content, categories[], tags[], status, featured_image_base64, featured_image_filename, featured_image_alt, featured_image_description }
- Creates post (published or draft based on status)
- If featured_image_base64 provided: upload to media library with correct filename/alt/description, attach to post
- Returns: { post_id, post_url, status }

**POST `/categories`**
- Body: { name }
- Creates new category, returns { id, name, slug }

**POST `/tags`**
- Body: { name }
- Creates new tag, returns { id, name, slug }

---

## UI/UX Design Requirements

### Theme:
- Tailwind CSS
- Calm minimal design — use slate/zinc color palette
- Dark mode: full support using Tailwind `dark:` classes + next-themes
- Language toggle: English / Arabic (RTL layout when Arabic)
- Font: Inter for English, Cairo or Tajawal for Arabic content

### Components to build:
- `<ModelSelector />` — dropdown with grouped options (OpenAI / Gemini / OpenRouter)
- `<TemplateSelector />` — dropdown for writing or checking templates
- `<ArticleForm />` — full article fields form (reusable for both tabs)
- `<MarkdownEditor />` — wraps react-md-editor with write/preview mode
- `<ImageUpload />` — handles file selection, slug-based rename logic, preview
- `<WordPressPostPicker />` — paginated list (10/page) with prev/next navigation
- `<CategoryTagSelector />` — multi-select with add-new functionality
- `<ChangeSummaryBox />` — shows bullet list of AI changes
- `<AdminGate />` — simple password protection for /admin

---

## Key Implementation Notes

1. All WordPress API calls go through Next.js `/api/wp/*` routes (proxy) — never expose WP credentials to the browser
2. Store all API keys in Supabase `app_settings`, fetch server-side only
3. Slug auto-generation: use the `slugify` npm package, force lowercase, replace spaces with hyphens, remove Arabic characters
4. Image upload: convert to base64 in browser, send to WordPress plugin which decodes and uploads via wp_upload_bits()
5. For OpenRouter model list: hardcode a curated list of 8-10 models (free + paid) in a config file
6. react-md-editor is the markdown editor — install: `@uiw/react-md-editor`
7. Use `@supabase/supabase-js` for all DB operations
8. Add loading states and error toasts (use sonner or react-hot-toast) on all async actions
9. The WordPress article content comes as HTML — convert to Markdown using `turndown` npm package before displaying in editor

---

## Environment Variables (.env.local)

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_PASSWORD=

(API keys for AI and WordPress are stored in Supabase, not in .env)

---

## File Structure

The tree below is the App Router layout. `app/layout.tsx` is required by Next.js.
API routes for templates, articles, settings, and the admin gate are included because those pages cannot persist data through the WordPress proxy alone.
`types/index.ts` lives inside `types/`.

```
/
├── app/
│   ├── layout.tsx
│   ├── globals.css
│   ├── page.tsx
│   ├── templates/page.tsx
│   ├── articles/page.tsx
│   ├── admin/page.tsx
│   └── api/
│       ├── generate/route.ts
│       ├── rewrite/route.ts
│       ├── templates/route.ts
│       ├── templates/[id]/route.ts
│       ├── articles/route.ts
│       ├── articles/[id]/route.ts
│       ├── settings/route.ts
│       ├── settings/test/route.ts
│       ├── admin/login/route.ts
│       ├── admin/logout/route.ts
│       ├── admin/session/route.ts
│       ├── admin/password/route.ts
│       └── wp/
│           ├── posts/route.ts
│           ├── post/[id]/route.ts
│           ├── categories/route.ts
│           ├── tags/route.ts
│           └── publish/route.ts
├── components/
│   ├── Providers.tsx
│   ├── AppShell.tsx
│   ├── ModelSelector.tsx
│   ├── TemplateSelector.tsx
│   ├── ArticleForm.tsx
│   ├── MarkdownEditor.tsx
│   ├── ImageUpload.tsx
│   ├── WordPressPostPicker.tsx
│   ├── CategoryTagSelector.tsx
│   ├── ChangeSummaryBox.tsx
│   └── AdminGate.tsx
├── lib/
│   ├── supabase.ts
│   ├── settings.ts
│   ├── crypto.ts
│   ├── auth.ts
│   ├── wordpress.ts
│   ├── markdown.ts
│   ├── slugify.ts
│   └── ai/
│       ├── index.ts
│       ├── prompt.ts
│       ├── openai.ts
│       ├── gemini.ts
│       └── openrouter.ts
├── config/
│   └── models.ts
├── supabase/
│   └── schema.sql
├── wordpress-plugin/
│   └── ai-writer-connector.php
└── types/
    └── index.ts
```


---

## Build Order (tell Cursor to follow this order)
1. Supabase schema + types
2. WordPress Plugin (PHP file)
3. lib/ utilities (supabase, ai providers, wordpress proxy)
4. API routes
5. Reusable components
6. Pages (Home → Templates → Admin → Articles)
7. Dark mode + RTL support
8. Error handling + loading states