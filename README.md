# SmartSolve

GTO poker trainer with AI-powered hand analysis.

## Setup

```bash
npm install
npm run dev
```

Opens at http://localhost:3000

## Deploy

```bash
npm run build
```

Deploy the `dist` folder to Vercel, Netlify, or any static host.

## Features

- GTO preflop range study charts (RFI + BB defense, solver-verified)
- Mixed strategy support on borderline hands
- Preflop trainer (RFI + vs RFI modes, timed mode)
- AI hand analysis from screenshots (any poker client including WPT Gold)
- Custom spot solver via natural language
- Range builder with GTO comparison overlay
- Equity calculator (Monte Carlo, 50k sims)
- Bankroll tracker with session logging and profit charts

## Data Source

GTO chart data ported from [AHTOOOXA/poker-charts](https://github.com/AHTOOOXA/poker-charts) (MIT License).
6-max NLHE, 100bb deep.
