# PickStack (픽스택)

AI-powered smart content curation PWA for SNS creators. Save links, text, or images from any platform and get automated summaries, categorization, and content ideation.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Lovable Cloud (Supabase) — Auth, Database, Edge Functions, Storage
- **AI**: Gemini Flash (summaries, OCR, content generation)
- **Animations**: Framer Motion

## Getting Started

### Prerequisites

- Node.js 18+
- npm or bun

### Installation

```bash
git clone <YOUR_REPO_URL>
cd pickstack
npm install
npm run dev
```

The app runs at `http://localhost:8080`.

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=<your-supabase-project-url>
VITE_SUPABASE_PUBLISHABLE_KEY=<your-supabase-anon-key>
VITE_SUPABASE_PROJECT_ID=<your-supabase-project-id>
```

### Edge Function Secrets

The following secrets must be configured in your backend (Edge Functions environment):

| Secret | Description | Required |
|--------|-------------|----------|
| `LOVABLE_API_KEY` | Lovable AI gateway key (auto-provided in Lovable Cloud) | Yes |
| `TOSS_SECRET_KEY` | TossPayments secret key for payment processing | For payments |

## Features

- 📎 **Smart Save** — Paste any URL or text, AI extracts metadata & generates 3-line summaries
- 🏷️ **Auto-Categorization** — AI classifies content into customizable categories
- 🔍 **Full-Text Search** — Search across titles, tags, keywords, and AI-generated snippets
- 🎨 **Creator Mode** — Manage channels, content calendar, trend radar, and news feed
- 💡 **Idea Engine** — Generate content ideas from saved items or keywords
- 📊 **AI Reports** — Get insights on your saved content patterns
- 🔗 **Sharing** — Share individual items or curated collections via public links
- 💳 **Premium** — TossPayments integration for subscription upgrades

## Project Structure

```
src/
├── components/       # UI components
├── contexts/         # React contexts (Auth, Categories)
├── hooks/            # Custom hooks
├── integrations/     # Supabase client & types (auto-generated)
├── pages/            # Route pages
├── types/            # TypeScript types
└── utils/            # Utilities
supabase/
├── functions/        # Edge Functions
│   ├── analyze-content/
│   ├── confirm-payment/
│   ├── generate-cover/
│   ├── generate-draft/
│   ├── generate-feed/
│   └── generate-ideas/
└── migrations/       # Database migrations
```

## License

Private project.
