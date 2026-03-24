# Arabic Hearing Assessment Experiment (AHAE)

A specialized web platform designed to conduct hearing experiments for Arabic phonetics. Teachers can upload structured test lists via Excel, and students can participate in assessments without the need for an account.

## 🚀 Tech Stack

* **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
* **Database & Backend:** [Convex](https://www.convex.dev/) (Real-time database and serverless functions)
* **Authentication:** [Clerk](https://clerk.com/) (Google OAuth for Teacher/Admin access)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/) (@tailwindcss/postcss: ^4)
* **File Parsing:** [XLSX / SheetJS](https://sheetjs.com/) (For processing `.xlsx` uploads)


## dev:
bun create next-app@latest . --yes
bun convex
bun convex dev
---

## 🛠️ Core Features

### 👨‍🏫 Teacher Dashboard (Authenticated)
* **Google Login:** Secure access via Clerk.
* **Test Management:** Upload `.xlsx` files to generate new hearing tests.
* **Configurable Settings:** * Set custom **Break Durations** between test types.
    * Once time play "Maximum Audio Plays" (e.g., allow student to hear the word only ones when clicking).
    * No randomized question order, use the xlsx file order.
* **Live Analytics:** Real-time view of student progress and results as they happen.

### 🎓 Student Experience (Public)
* **Guest Access:** Enter Name and Email to begin (Session-based, no password required).
* **Test Selection:** Choose a specific test title from a dropdown.
* **Hearing Engine:** * High-fidelity audio playback.
    * No Arabic-specific input only slective options.
    * **Segmented Progress Bar:** Visualizing progress through different "Test Types."
* **Intermission Logic:** Automatic "Break Time" screens with countdown timers between sections.

---

## 📊 Database Schema (Convex)

### `tests`
* `teacherId`: string (Clerk ID)
* `title`: string
* `breakDuration`: number (seconds)
* `settings`: object (randomize, maxPlays, etc.)

### `questions`
* `testId`: id
* `type`: string (e.g., "Phoneme", "Word Recognition")
* `audioUrl`: string
* `correctAnswer`: string
* `options`: string[] (for MCQ)

### `submissions`
* `studentName`: string
* `studentEmail`: string
* `testId`: id
* `answers`: array of { questionId, response, isCorrect, timeTaken }
* `durations`: array of times
* `status`: "in-progress" | "completed"

---

## 📂 Project Structure

```text
├── src/
│   ├── app/                # Next.js App Router (Pages & Layouts)
│   │   ├── (admin)/        # Protected routes for teachers
│   │   ├── (student)/      # Public testing routes
│   │   └── api/            # Webhooks or specialized endpoints
│   ├── globals.css         # Tailwindcss global style
│   ├── layout.tsx          # Next global layout
│   ├── page.tsx            # Next global page
│   ├── components/         # Reusable UI (AudioPlayer, ProgressBar, Timer)
│   ├── lib/                # Utilities (Excel parsing logic)
│   └── hooks/              # Custom React hooks
├── convex/                 # Convex backend functions (Queries & Mutations)
│   ├── schema.ts           # Database definitions
│   ├── tests.ts            # CRUD for tests
│   └── trails.ts           # The Individual Trials (Parsed from the Excel sheet)
│   └── responses.ts        # The Answers (Recorded instantly after every question)
│   └── submissions.ts      # Student response handling
└── public/                 # Static assets (logos, icons)
```

## Experiment lists             
Study	Task	Trials	Manual sheet	Correct answer included?	Notes
Emphatic	Identification	48	Yes	Yes	2 repetitions; word-initial only
Emphatic	Same-Different	96	Yes	Yes	2 repetitions; balanced patterns
Emphatic	AXB	96	Yes	Yes	2 repetitions; balanced patterns
Guttural	Identification	48	Yes	Yes	2 repetitions; word-initial only
Guttural	Same-Different	96	Yes	Yes	2 repetitions; balanced patterns
Guttural	AXB	96	Yes	Yes	2 repetitions; balanced patterns

Module	Task Type	Progress Bar Segment
Module 1: Emphatic,Identification → Same-Diff → AXB,0% ————— 50%
Module 2: Guttural,Identification → Same-Diff → AXB,50% ———— 100%