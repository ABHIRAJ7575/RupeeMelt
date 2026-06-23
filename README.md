# 💸 RupeeMelt

> A personal finance dashboard that watches your money with unblinking precision and zero emotional involvement.  
> The name is accurate.

**[→ Live App](https://rupeemelt.web.app/)**

---

## What Is This

RupeeMelt is a premium single-user financial dashboard that tracks every rupee flowing in and out of your life - with real-time cloud sync, a "Happy Dark" glassmorphic UI, and enough micro-animations to make staring at your expenses feel almost enjoyable.

It will not tell you to spend less. It will not send motivational push notifications. What it will do is record every transaction with mathematical precision, animate the balance change like an old mechanical odometer, and play a small coin clink sound when money comes in.

There is no sound when money goes out. Design decision. Final.

---

## Tech Stack

<p align="left">
  <a href="https://react.dev" title="React"><img src="https://skillicons.dev/icons?i=react" width="48" height="48" alt="React" /></a>&nbsp;
  <a href="https://www.typescriptlang.org" title="TypeScript"><img src="https://skillicons.dev/icons?i=ts" width="48" height="48" alt="TypeScript" /></a>&nbsp;
  <a href="https://vitejs.dev" title="Vite"><img src="https://skillicons.dev/icons?i=vite" width="48" height="48" alt="Vite" /></a>&nbsp;
  <a href="https://supabase.com" title="Supabase"><img src="https://skillicons.dev/icons?i=supabase" width="48" height="48" alt="Supabase" /></a>&nbsp;
  <a href="https://firebase.google.com" title="Firebase Hosting"><img src="https://skillicons.dev/icons?i=firebase" width="48" height="48" alt="Firebase" /></a>&nbsp;
  <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" title="Custom CSS"><img src="https://skillicons.dev/icons?i=css" width="48" height="48" alt="CSS" /></a>
</p>

Also in the mix: `react-countup` for odometer animations, `jsPDF` + `jspdf-autotable` for PDF export, `MUI Icons` for iconography, and the browser's own `Web Audio API` for the coin sound - because paying for an audio file in 2025 is not the move.

---

## Features

### Guided Ledger Engine
A two-step transaction wizard. Step one: money in or money out? Step two: cash or online? That is it. No 47-category dropdown, no tag system, no "miscellaneous" option that becomes the default for literally everything. A clean, fluid flow that gets out of the way.

### Real-Time Metrics Dashboard
Four cards. One dashboard. Zero refresh buttons.

| Metric | What It Tracks |
|---|---|
| Total Net Balance | The number you open the app to check |
| Total Inflows | Every deposit, ever |
| Total Expenses | Every withdrawal, accumulated |
| Cash on Hand | Offline cash - tracked separately from digital |

All four update live the moment a transaction is saved. No loading spinners. No prayers required.

### Odometer Balance Animations
`react-countup` drives every balance transition. Updates roll like a mechanical counter - not a flat number swap. If the balance is going down, it goes down with some dignity at least.

### Coin Clink on Deposits
The browser's native `Web Audio API` generates a synthetic coin clink programmatically on every deposit. No audio file, no CDN dependency - just sine waves doing maths in real time. It fires at zero latency. There is no equivalent sound for withdrawals. The silence is intentional and slightly philosophical.

### Sarcastic Reset Protocol
A master reset button that wipes the entire Supabase database. Protected by two consecutive confirmation dialogs, both with copy that is mildly judgy. The first prompt asks if you are sure. The second implies you are not. This feature exists because at least one developer has been there at 2 AM and understands the assignment.

### PDF Ledger Export
`jsPDF` paired with `jspdf-autotable` compiles the full transaction history into a downloadable, formatted PDF on demand. Print it. Hand it to your CA. Let them ask you why 23 entries are categorised as just "weekend."

### Mobile Numeric Keyboard Hijack
Input fields force the numeric dialpad on mobile via targeted HTML attributes. You cannot type a word into the amount field. Strict decimal sanitization runs on every keystroke. The app trusts the user but verifies the data - like a good relationship.

### Floating Coin Micro-Interaction
A glass overlay with animated floating coins triggers on every successful transaction. Dopamine, engineered. A toast notification would have been three lines of code. This was more. Absolutely worth it.

---

## How It Works

```
Open RupeeMelt
      │
      ▼
Two-Step Transaction Wizard
      │
      ├── Deposit logged
      │       ├── Coin clink fires via Web Audio API
      │       └── Floating coin animation plays
      │
      └── Withdrawal logged
              └── Silence
                  (the coin animation still plays - life is unfair, the UI is consistent)
      │
      ▼
Transaction saved to Supabase (PostgreSQL)
      │
      ▼
Dashboard recalculates in real time
      ├── Net Balance rolls via react-countup
      ├── Cash on Hand updates the offline vs. online split
      └── All four metric cards refresh - no page reload
      │
      ▼
Optional: Download full ledger as PDF
      │
      ▼
Optional: Hit reset, read the judgy prompt, and reconsider your life choices
```

---

## Local Setup

```bash
# Clone
git clone https://github.com/ABHIRAJ7575/rupeemelt.git
cd rupeemelt

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Add your Supabase credentials
```

**.env**

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

```bash
# Run locally
npm run dev

# Production build
npm run build

# Deploy
firebase deploy
```

---

## Project Structure

```
rupeemelt/
├── src/
│   ├── components/        # Dashboard cards, wizard, reset modal, coin overlay
│   ├── lib/               # Supabase client, audio engine, PDF generator
│   ├── styles/            # Custom CSS - glassmorphism, particles, container queries
│   └── main.tsx
├── public/
├── index.html
├── vite.config.ts
└── firebase.json          # SPA routing config for Firebase Hosting
```

---

## Why No UI Library

Tailwind, ShadCN, Bootstrap, MUI components - none of them are here. The entire visual identity is hand-rolled pure CSS: the "Happy Dark" frosted glass system, a vanilla JS floating particle loop, and fluid container queries for the responsive layout.

Why? Because pulling in a full component library to render four metric cards and a modal adds weight this project does not need. When a README says "lightweight build," this one actually means it.

---

## Author

Built by **Abhiraj Dixit**

<a href="https://linkedin.com/in/abhiraj-dixit-6aa386313" title="LinkedIn"><img src="https://skillicons.dev/icons?i=linkedin" width="40" height="40" alt="LinkedIn" /></a>&nbsp;
<a href="https://github.com/ABHIRAJ7575" title="GitHub"><img src="https://skillicons.dev/icons?i=github" width="40" height="40" alt="GitHub" /></a>

---

*If the balance is green, the app is working. If the balance is red, the app is still working - the situation is just yours to handle.*