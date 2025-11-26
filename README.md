# Football Player PDF Generator

A Next.js application that allows users to search for football players and generate comprehensive PDF reports using a ChatGPT-style interface.

## Features

- **ChatGPT-style Interface**: Modern chat interface built with ShadCN UI
- **Player Search**: Search for football players by name from Airtable
- **Airtable Integration**: Uses Airtable as the primary data source via REST API
- **Comprehensive PDF Reports**: Generate detailed PDF reports including:
  - Player profile and basic information
  - Position statistics
  - League appearances and statistics
  - Performance analysis
  - Strengths and weaknesses
  - Injury records
  - Transfer history
- **Server-side PDF Generation**: Uses Puppeteer for high-quality PDF generation

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   Create a `.env.local` file in the root directory:
   ```env
   # Airtable API Key (Required)
   AIRTABLE_API_KEY=your_airtable_api_key_here
   
   # Optional: App URL
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. **Get Airtable API Key**
   
   **Airtable API Key (Required):**
   - Visit [Airtable Account](https://airtable.com/account)
   - Go to the "Developer" section or visit [Create Token](https://airtable.com/create/tokens)
   - Click "Create new token"
   - Give it a name (e.g., "Football Player PDF Generator")
   - Set the scopes:
     - **Data**: `data.records:read` (to read player data)
     - **Schema**: `schema.bases:read` (to read base structure)
   - Select the base: `tagged_images.csv` (or your base name)
   - Copy the token and add it to `.env.local` as `AIRTABLE_API_KEY`
   - **Important**: Keep your API key secret and never commit it to version control
   
   **Base Configuration:**
   - Base ID: `appLkDMJZrxnOCpPF`
   - Table ID: `tblwfa8UVh8Uoigp5` (Football Players table)
   - These are already configured in the code

4. **Run Development Server**
   ```bash
   npm run dev
   ```

5. **Open Browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

1. Enter a football player's name in the chat input
2. If multiple players are found, select the desired player
3. The system will fetch player data and generate a PDF
4. Download the PDF using the download button in the chat

## Technology Stack

- **Next.js 14+** - React framework with App Router
- **TypeScript** - Type safety
- **ShadCN UI** - Component library
- **Tailwind CSS** - Styling
- **Puppeteer** - PDF generation
- **Airtable REST API** - Primary data source for player information
- **Zod** - Input validation

## Project Structure

```
/
├── app/
│   ├── api/
│   │   ├── player/route.ts    # Player search API
│   │   └── pdf/route.ts       # PDF generation API
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Main chat interface
│   └── globals.css            # Global styles
├── components/
│   ├── ui/                    # ShadCN UI components
│   └── pdf/
│       └── player-report.tsx  # PDF template
├── lib/
│   ├── api-football.ts        # API-Football client
│   ├── data-processor.ts      # Data transformation
│   ├── pdf-generator.ts       # PDF generation
│   └── utils.ts               # Utilities
└── types/
    └── player.ts              # TypeScript types
```

## Airtable Configuration

The application uses **Airtable** as the primary data source:

### Airtable Setup
- **Base ID**: `appLkDMJZrxnOCpPF`
- **Table**: "Football Players" (`tblwfa8UVh8Uoigp5`)
- **API**: Airtable REST API v0
- **Authentication**: Personal Access Token (API Key)

### Rate Limits
- Airtable free tier: 5 requests per second per base
- No daily limit on free tier
- Higher limits available on paid plans

### Data Structure
The "Football Players" table contains:
- Player profile (name, age, nationality, etc.)
- Statistics (games, goals, assists, etc.)
- Valuations (Transfermarkt, league-specific values)
- Performance data (JSON format)
- Injury records and transfer history

**Important Notes:**
- Make sure your Airtable API key has read permissions for the base
- The search is case-insensitive
- All player data comes from your Airtable base
- No external API calls are made (only Airtable)

## Notes

- Some advanced metrics (like TFG ratings, valuations) shown in the reference design may not be available in the free API tier and are calculated or marked as "N/A"
- PDF generation requires Chromium (installed automatically with Puppeteer)
- For production, consider using a headless browser service or optimizing Puppeteer configuration

## License

ISC

