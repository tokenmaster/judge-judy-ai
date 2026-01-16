# Judge Judy AI ⚖️

A multiplayer AI-powered dispute resolution game where two parties present their case and an AI judge delivers the verdict.

## Features

- **Multiplayer**: Create a case and share a room code with the other party
- **4 Judge Personalities**: Judge Judy, The Fair Arbiter, Chaotic Neutral, The Bro
- **AI Cross-Examination**: The judge asks probing questions based on testimony
- **Credibility System**: AI evaluates responses for consistency, accountability, and specificity
- **Objections**: Each party gets one objection during cross-examination
- **Snap Judgments**: The judge can end the case early if evidence is overwhelming
- **Real-time Sync**: Both parties see updates instantly via Supabase

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Real-time subscriptions)
- **AI**: Claude API (Anthropic)

---

## Setup Instructions

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd judge-judy-app
npm install
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Once created, go to **SQL Editor** and run this schema:

```sql
-- Create the cases table
CREATE TABLE cases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  category TEXT,
  judge TEXT DEFAULT 'judy',
  stakes TEXT,
  party_a_name TEXT,
  party_b_name TEXT,
  party_a_session TEXT,
  party_b_session TEXT,
  phase TEXT DEFAULT 'waiting',
  current_turn TEXT DEFAULT 'A',
  exam_round INTEGER DEFAULT 0,
  exam_target TEXT DEFAULT 'A',
  statement_a TEXT,
  statement_b TEXT,
  current_question TEXT,
  credibility_a INTEGER DEFAULT 50,
  credibility_b INTEGER DEFAULT 50,
  objections_used_a BOOLEAN DEFAULT FALSE,
  objections_used_b BOOLEAN DEFAULT FALSE,
  verdict JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the responses table
CREATE TABLE responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  round INTEGER,
  party TEXT,
  party_name TEXT,
  question TEXT,
  answer TEXT,
  is_clarification BOOLEAN DEFAULT FALSE,
  credibility_change INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the objections table
CREATE TABLE objections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  objector_party TEXT,
  objector_name TEXT,
  target TEXT,
  type TEXT,
  reason TEXT,
  is_question_objection BOOLEAN DEFAULT FALSE,
  sustained BOOLEAN,
  ruling_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable real-time for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE cases;
ALTER PUBLICATION supabase_realtime ADD TABLE responses;
ALTER PUBLICATION supabase_realtime ADD TABLE objections;

-- Enable Row Level Security
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE objections ENABLE ROW LEVEL SECURITY;

-- Allow public access (for demo purposes)
CREATE POLICY "Allow public read" ON cases FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON cases FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON cases FOR UPDATE USING (true);

CREATE POLICY "Allow public read" ON responses FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON responses FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read" ON objections FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON objections FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON objections FOR UPDATE USING (true);
```

3. Go to **Settings > API** and copy:
   - Project URL
   - `anon` public key

### 3. Get Anthropic API Key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an API key
3. Copy the key

### 4. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_ANTHROPIC_API_KEY=your-anthropic-api-key
```

### 5. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Vercel

### Option 1: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/judge-judy-ai)

### Option 2: Manual Deploy

1. Push your code to GitHub

2. Go to [vercel.com](https://vercel.com) and sign in

3. Click **"New Project"** and import your GitHub repo

4. Add Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_ANTHROPIC_API_KEY`

5. Click **Deploy**

---

## How to Play

### Creating a Case (Party A)

1. Click **"Create New Case"**
2. Fill in the dispute details:
   - What's the dispute?
   - Your name (Party A)
   - Opponent's name (Party B)
   - What's at stake?
   - Category
   - Choose a judge
3. Click **"Create Case & Get Room Code"**
4. Share the 6-character room code with the other party

### Joining a Case (Party B)

1. Click **"Join Existing Case"**
2. Enter the room code
3. Click **"Join Case"**

### Gameplay

1. **Opening Statements**: Each party writes their side of the story
2. **Cross-Examination**: The AI judge asks questions (2 rounds, each party questioned)
3. **Objections**: Each party can object once to a question
4. **Verdict**: The judge delivers the final ruling

---

## Judge Personalities

| Judge | Style |
|-------|-------|
| **Judge Judy** | Sharp-tongued, no-nonsense, devastating one-liners |
| **The Fair Arbiter** | Calm, wise, focused on understanding both sides |
| **Chaotic Neutral** | Unpredictable, dramatic, reality TV energy |
| **The Bro** | Chill but insightful, uses "brother" liberally |

---

## Project Structure

```
judge-judy-app/
├── src/
│   ├── app/
│   │   ├── globals.css      # Tailwind CSS
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Main page
│   ├── components/
│   │   ├── JudgeJudyGame.tsx # Main game component
│   │   └── ui.tsx           # UI components
│   └── lib/
│       ├── supabase.ts      # Supabase client
│       ├── constants.ts     # Game constants
│       └── ai.ts            # Claude API functions
├── .env.example
├── package.json
├── tailwind.config.js
└── README.md
```

---

## License

MIT
