# CalorieTrack

A simple personal calorie & macro tracker for steady weight loss.

## Features

- Daily calorie goal with a progress ring and "remaining" readout
- Weight-loss target calculator (Mifflin–St Jeor BMR + activity, with a deficit for your chosen pace)
- Type-ahead food search over a built-in database that auto-fills calories and macros
- Servings multiplier, foods grouped by meal, and quick re-add of recent foods
- Browse any day; everything saves locally in your browser (no account needed)

## Run locally

```bash
npm install
npm run dev
```

Opens at http://localhost:3000

## Deploy to Vercel (e.g. qhaw.com)

1. Push this folder to a GitHub repo you own.
2. Go to https://vercel.com → New Project → import that repo.
   (If this folder isn't the repo root, set the Vercel "Root Directory" to `calorietrack`.)
3. Vercel auto-detects Vite — just click Deploy.
4. In the project's **Settings → Domains**, add `qhaw.com`, then update your
   domain's DNS records as Vercel instructs (an A record or nameserver change).

No environment variables or backend required — it's a static site.
