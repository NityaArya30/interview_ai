# IntelliView — AI Interview Preparation Platform

IntelliView helps candidates practice technical interviews and DSA problems, review feedback, and track preparation progress.

**Live Demo:** https://intelliview.lovable.app/  
**Repository:** https://github.com/NityaArya30/interview_ai

## Screenshots

Live website preview (click to open the application):

![IntelliView live app preview](https://image.thum.io/get/width/1200/crop/800/https://intelliview.lovable.app/)

## Features

- **Interview tracks:** Web Development, DSA, Machine Learning, Data Science, AI/ML Specialized, and System Design.
- **DSA practice:** Coding challenges, difficulty selection, in-browser code editor, test cases, and evaluation.
- **AI-assisted feedback:** Review answers and scores with feedback components.
- **Performance dashboard:** Average scores, completed sessions, questions answered, practice time, streaks, score trends, role distribution, and skill visualizations.
- **Session history:** Revisit past practice sessions and results.
- **Profile and leaderboard:** User profile and leaderboard experiences.
- **Interview tools:** Session flow, voice recorder, webcam preview, emotion indicator, feedback cards, and session summaries.

## Architecture

```text
Candidate
  |
  v
React + TypeScript + Vite
  +-- Home and interview selection
  +-- Interview and DSA sessions
  +-- Dashboard, history, leaderboard, profile
  +-- Authentication
  |
  v
Custom Hooks
  +-- useAuth
  +-- useInterviewSession
  |
  v
Supabase
  +-- Authentication and user identity
  +-- interview_sessions
  +-- interview_answers
  +-- interview-ai Edge Function
```

## Project Structure

| Path | Purpose |
| --- | --- |
| `src/pages/` | Home, authentication, dashboard, history, leaderboard, and profile |
| `src/components/` | Interview flows, DSA sessions, code editor, feedback, voice/webcam, shared UI |
| `src/hooks/` | Authentication and interview-session logic |
| `src/data/dsaProblems.ts` | DSA problem data and category helpers |
| `src/integrations/supabase/` | Supabase client and database types |
| `supabase/functions/interview-ai/` | Server-side interview AI function |
| `supabase/migrations/` | Database schema migrations |

## Technology Stack

- React 18, TypeScript, Vite
- React Router
- Tailwind CSS, shadcn/ui, Radix UI
- Supabase and Supabase Edge Functions
- Recharts and Framer Motion
- Monaco Editor React
- React Hook Form and Zod
- Vitest, Testing Library, ESLint



## Skills Demonstrated

### AI, Machine Learning, and Generative AI
- **Generative AI integration:** Calling an LLM through the Lovable AI Gateway for interview question generation, answer feedback, and code/test-case evaluation.
- **LLM prompting:** Role-aware prompts, difficulty-based question generation, and structured evaluation instructions.
- **AI-assisted assessment:** Feedback and scoring workflows for technical answers and DSA submissions.
- **Applied AI integration:** Connecting frontend interview workflows to a server-side AI function rather than exposing the AI credential in client code.

### Computer Vision and Camera Integration
- Browser webcam access using the MediaDevices API and `getUserMedia`.
- Live video preview, camera permissions, stream lifecycle management, and camera on/off controls.
- Emotion-indicator UI prototype for the interview experience.

> **Accuracy note:** The current webcam component provides camera capture and a simulated emotion indicator. The repository code reviewed does not implement actual face recognition or a trained facial-expression recognition model, so those are not claimed as completed features.

### Full-Stack and Backend Integration
- React, TypeScript, and Vite
- Supabase authentication and user-scoped session data
- Supabase Edge Functions using Deno
- REST-style request handling and JSON responses
- Environment-based secrets and authenticated AI requests

### Data, Algorithms, and Developer Tools
- DSA problem categories and difficulty levels
- Monaco Editor integration for coding practice
- AI-assisted test-case evaluation workflow
- Session history, scoring, and performance analytics
- Recharts visualizations for progress tracking

### UI Engineering and Quality
- Tailwind CSS, shadcn/ui, and Radix UI
- React Router, reusable components, and custom hooks
- Framer Motion animations
- React Hook Form and Zod
- Vitest, Testing Library, and ESLint

## Run Locally

Requirements: Node.js, npm, and the project’s Supabase environment configuration for connected backend features.

```bash
git clone https://github.com/NityaArya30/interview_ai.git
cd interview_ai
npm install
npm run dev
```

Production build and checks:

```bash
npm run build
npm run lint
npm test
```

Configure the environment variables expected by `src/integrations/supabase/client.ts` locally. Never commit private keys, service-role credentials, resumes, transcripts, or other sensitive user data.

## User Journey

```text
Open app -> Sign in -> Choose interview type
   -> Answer questions / solve a coding problem
   -> Review feedback and session summary
   -> Track progress in dashboard and history
   -> Practice again
```

## Future Improvements

Potential enhancements include downloadable reports, personalized practice plans, richer progress comparisons, expanded role-specific question banks, and more detailed analytics.
