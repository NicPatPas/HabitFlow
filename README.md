# HabitFlow

A personal habit tracking app built with Next.js, Prisma, and SQLite. Track your daily habits, visualize progress, and stay consistent with streaks, analytics, and achievement badges.

## Features

- **Habit Management** — Create habits with custom emoji, color, frequency, targets, and difficulty level
- **Daily Check-ins** — Log progress each day with values, notes, and statuses (Done / Partial / Skipped)
- **Streak Tracking** — Live streak counters with flame indicators and streak freeze protection
- **Dashboard** — At-a-glance view of today's progress, next best action, and active streaks
- **Analytics** — Weekly/monthly charts, day-of-week breakdowns, and a 365-day activity heatmap
- **Achievement Badges** — 14 unlockable milestones across bronze, silver, gold, and platinum tiers
- **Habit Templates** — 20 pre-built habits across Fitness, Mindfulness, Health, Learning, and Productivity
- **Onboarding Flow** — 3-step guided setup to get started quickly with templates
- **Light / Dark Mode** — Toggle between themes, persisted across sessions
- **Habit Detail Pages** — Per-habit stats, bar charts, heatmaps, and check-in history

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Database:** SQLite via Prisma ORM
- **Styling:** Tailwind CSS v4 + inline style theming
- **Charts:** Recharts
- **UI Components:** Radix UI + shadcn/ui
- **Icons:** Lucide React

## Getting Started

```bash
# Install dependencies
npm install

# Set up the database
npx prisma migrate dev

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/               # Next.js App Router pages
│   ├── page.tsx       # Dashboard
│   ├── habits/        # Habit library + detail pages
│   ├── today/         # Daily check-in view
│   └── analytics/     # Charts and heatmaps
├── components/        # Reusable UI components
├── contexts/          # Theme context + useColors() hook
├── lib/               # Utilities (streak logic, achievements, templates)
└── types/             # Shared TypeScript types
```

## Notes

This is a single-user MVP — no authentication required. All data is stored locally in a SQLite database via Prisma.
