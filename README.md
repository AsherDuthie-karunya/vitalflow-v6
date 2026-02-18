# 🩺 VitaFlow — AI Health Monitoring Agent

An intelligent **AI-powered Health Monitoring Agent** that compresses medical history and wellness data to reduce processing costs while delivering personalized health insights, workout planning, and daily routine optimization.

🔗 **Live App:** [vitalflow-v6.lovable.app](https://vitalflow-v6.lovable.app/)

---

## ✨ Features

- **🩺 Health Dashboard** — Track daily metrics (heart rate, blood pressure, weight, sleep, steps, mood, calories, water intake) with visual summaries
- **🏋️ Workout Planner & Tracker** — Log workouts with exercises, duration, and calories burned; supports multiple workout types
- **📅 Routine Scheduler** — Create and track daily routines by category and day of week, with completion tracking
- **🤖 AI Health Coach** — Chat with a context-aware AI that analyzes your health data, workouts, and routines to give personalized recommendations
- **🔐 Authentication** — Secure email/password signup and login with per-user data isolation

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, shadcn/ui, Framer Motion |
| Backend | Lovable Cloud (Supabase) |
| AI | Lovable AI Gateway (Gemini 3 Flash) |
| Auth | Email/password with Row Level Security |

---

## 📁 Project Structure

```
src/
├── components/       # Shared UI components & layout
├── hooks/            # Custom hooks (auth, mobile detection)
├── integrations/     # Backend client & types
├── lib/              # AI streaming utilities
├── pages/            # Route pages
│   ├── Dashboard.tsx # Health metrics tracking
│   ├── Workouts.tsx  # Workout logger
│   ├── Routines.tsx  # Routine scheduler
│   ├── AiCoach.tsx   # AI chat interface
│   └── Auth.tsx      # Login / signup
└── index.css         # Design system tokens
```

---

## 🚀 Getting Started

This project is built with [Lovable](https://lovable.dev). To run locally:

```bash
git clone <repo-url>
cd <project>
npm install
npm run dev
```

Environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`) are configured automatically when using Lovable Cloud.

---

## 📜 License

MIT
