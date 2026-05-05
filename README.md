# Calisthenics Tracker

A mobile-first PWA for tracking calisthenics workouts, progressions, and training history.

## Features

- **Movement Library** — Manage exercises with photos and descriptions
- **Progressions** — Track difficulty progressions (e.g., wall push-ups → one-arm push-ups)
- **Workout Builder** — Create workouts with sets, supersets, rounds, and rest timers
- **Workout Execution** — Guided workout mode with countdown timers and rep tracking
- **History** — Review past workouts with target vs. actual performance
- **Offline-First** — All data stored locally in IndexedDB, works without internet
- **PWA** — Installable on your phone's home screen

## Tech Stack

- React 19 + TypeScript
- Vite 8
- Tailwind CSS 4 + shadcn/ui-inspired components
- Dexie.js (IndexedDB)
- TanStack Query
- React Router v7

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) on your phone or browser.

## Data

All data is stored locally in your browser's IndexedDB. Use the Export/Import buttons on the Home screen to back up or restore your data.

## Deploy

```bash
npm run build
```

Deploy the `dist/` folder to Vercel, Netlify, or any static hosting.