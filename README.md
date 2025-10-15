# Zapp - AI Image Studio

A Next.js web application for generating and editing images using AI models from OpenRouter and FAL.ai. Features support for FLUX models, real-time streaming, batch operations, and request history tracking.

## Features

- **Multiple AI Providers**: OpenRouter (Gemini 2.5 Flash) and FAL.ai (FLUX models)
- **Two Modes**: Text-to-Image generation and Image-to-Image editing
- **Advanced Controls**: Negative prompts, guidance scale, seed control, aspect ratios
- **Batch Generation**: Generate multiple images in a single request
- **Real-time Streaming**: Live progress updates for FAL.ai requests
- **Image Management**: Download individual images or batch as ZIP, copy to clipboard
- **Request History**: Track all generation requests with database persistence
- **Rate Limiting**: Built-in rate limiting for anonymous and authenticated users
- **Settings Page**: Customize default values for all parameters

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: Neon (PostgreSQL)
- **AI Providers**: 
  - OpenRouter API (Gemini 2.5 Flash Image Preview)
  - FAL.ai (FLUX.1 models)
- **Icons**: Lucide React

## Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun
- API keys for:
  - [OpenRouter](https://openrouter.ai) (for Gemini image generation)
  - [FAL.ai](https://fal.ai) (for FLUX models)
- [Neon](https://neon.tech) database connection string (optional, for history tracking)

## Getting Started

1. **Clone the repository**

```bash
git clone <your-repo-url>
cd zapp
```

2. **Install dependencies**

```bash
npm install
# or
yarn install
# or
pnpm install
```

3. **Set up environment variables**

Copy `.env.example` to `.env.local` and fill in your API keys:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
OPENROUTER_API_KEY=sk-or-your-api-key-here
FAL_API_KEY=your-fal-api-key-here
```

4. **Set up the database** (optional, required for history tracking)

Create the history table in your Neon database:

```sql
CREATE SCHEMA IF NOT EXISTS app;

CREATE TABLE app.history (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP DEFAULT NOW(),
  user_id TEXT,
  provider TEXT NOT NULL,
  mode TEXT NOT NULL,
  model_or_endpoint TEXT NOT NULL,
  prompt TEXT NOT NULL,
  negative_prompt TEXT,
  guidance_scale NUMERIC,
  seed INTEGER,
  num_images INTEGER,
  status TEXT NOT NULL,
  duration_ms INTEGER,
  ip TEXT,
  request_id TEXT,
  raw_response JSONB,
  result_urls TEXT[],
  error TEXT
);

CREATE INDEX idx_history_user_id ON app.history(user_id);
CREATE INDEX idx_history_created_at ON app.history(created_at DESC);
```

5. **Run the development server**

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Usage

### Generating Images

1. Select **OpenRouter** or **FAL.ai** as provider
2. Choose **Generate** mode
3. Enter your prompt
4. Configure optional parameters:
   - Aspect ratio (OpenRouter)
   - Number of images (FAL.ai)
   - Negative prompt (FAL.ai)
   - Guidance scale (FAL.ai)
   - Seed (FAL.ai)
5. Click **Generate**

### Editing Images

1. Select provider (OpenRouter or FAL.ai)
2. Choose **Edit** mode
3. Upload an image file or provide an image URL
4. Enter your editing prompt
5. Configure optional parameters
6. Click **Apply Edit**

### Managing Results

- Click images to select/deselect
- Use batch actions: Copy, Download, or Download as ZIP
- View raw API responses for debugging
- Check request logs for detailed information

### Settings

Visit `/settings` to configure default values for:
- Provider and mode
- Model/endpoint selection
- Aspect ratio
- Number of images
- Guidance scale and seed
- UI preferences (show logs/raw by default)

## Project Structure

```
zapp/
├── src/
│   ├── app/
│   │   ├── api/           # API routes
│   │   │   ├── fal/       # FAL.ai endpoints
│   │   │   ├── openrouter/ # OpenRouter endpoints
│   │   │   └── history/   # History tracking
│   │   ├── settings/      # Settings page
│   │   ├── page.tsx       # Main app page
│   │   └── layout.tsx     # Root layout
│   ├── hooks/
│   │   └── useLocalSettings.ts # Settings management
│   └── lib/
│       ├── auth.ts        # User authentication
│       ├── db.ts          # Database client
│       ├── history.ts     # History persistence
│       ├── rateLimit.ts   # Rate limiting
│       ├── types.ts       # Shared types
│       └── models.ts      # Model configurations
├── public/                # Static assets
├── .env.local            # Environment variables (git-ignored)
├── .env.example          # Example environment variables
└── package.json          # Dependencies
```

## API Routes

- `POST /api/openrouter/generate` - Generate with OpenRouter
- `POST /api/openrouter/edit` - Edit with OpenRouter
- `POST /api/fal/generate` - Generate with FAL.ai (non-streaming)
- `POST /api/fal/generate/stream` - Generate with FAL.ai (streaming)
- `POST /api/fal/edit` - Edit with FAL.ai (non-streaming)
- `POST /api/fal/edit/stream` - Edit with FAL.ai (streaming)
- `GET /api/history` - Fetch request history
- `POST /api/history` - Save request to history

## Rate Limits

**Anonymous users:**
- 30 requests/hour for both generate and edit

**Authenticated users:** (requires Stack Auth setup)
- 200 requests/day for both generate and edit

## Security Notes

- Never commit `.env.local` - it contains sensitive API keys
- The `.gitignore` file is configured to exclude `.env*` files
- API keys are only accessed server-side
- Rate limiting protects against abuse
- Database credentials are never exposed to the client

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard:
   - `DATABASE_URL`
   - `OPENROUTER_API_KEY`
   - `FAL_API_KEY`
4. Deploy!

The app will automatically use Edge Runtime for optimal performance.

## Contributing

Contributions are welcome! Please ensure:
- TypeScript compilation passes: `npm run build`
- Code is properly formatted
- No sensitive data is committed

## License

MIT

## Acknowledgments

- Built with [Next.js](https://nextjs.org)
- AI models from [OpenRouter](https://openrouter.ai) and [FAL.ai](https://fal.ai)
- Database by [Neon](https://neon.tech)
- Icons by [Lucide](https://lucide.dev)
