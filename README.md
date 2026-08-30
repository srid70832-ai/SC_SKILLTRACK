# SC SMART POLL AI — "Voice to Poll in Seconds"

SC SMART POLL AI is a complete full-stack web application designed for colleges, schools, training centers, and communities to manage their polling system effortlessly. Administrators can build rich polls using speech or text in seconds, while students get a dedicated, distraction-free environment to submit votes.

---

## 🎨 Design Philosophy & Features

- **"Voice to Poll" Generator**: Administrators can click the microphone, dictate their poll (e.g. *"Create a poll for AI&DS A section. How many problems did you solve today? Options 0 1 2 3. Deadline tonight 10 PM"*), and Gemini will automatically structure the poll fields for instant publishing.
- **"Text to Poll" Parsing**: Staff can also type any short natural language prompt to let AI do the form filling automatically.
- **Targeted Distribution & QR Codes**: Instantly generate WhatsApp share strings, shareable links, and slide-ready QR Codes for classrooms.
- **Live Tracking & Participation**: Real-time percentage bars, counted response counts, and active distribution of student selections.
- **Defaulters Detection (Non-Responders)**: Automatic identification of students who missed the poll, with one-click **Send Reminder** notifications.
- **Academic Reports (PDF & Excel)**: Generate multi-sheet `.xlsx` files with poll outcomes and student profiles, or print clean vector vector-styled PDF Summaries and Defaulter Sheets.
- **Developed By SC TECH © 2026**

---

## 🚀 Quick Start & Deployment

### 1. Configure Secrets
Create or update your `.env` file with your **Gemini API Key** and development URL:
```env
GEMINI_API_KEY="YOUR_GOOGLE_AI_STUDIO_KEY"
APP_URL="http://localhost:3000"
```

### 2. Install & Start Development Server
```bash
npm install
npm run dev
```
The server will boot on port `3000`. Open `http://localhost:3000` in your browser.

---

## 🔑 Test Credentials

For quick evaluation, use the following pre-seeded credentials:

### 1. Staff Account (Dashboard, Statistics, PDF/Excel, AI summaries)
- **Username**: `staff`
- **Password**: `staff123`

### 2. Student Accounts (Single-page, voting interface, instant verification)
- **Username (Register No)**: `717822AD001` (Arjun Kumar), `717822AD002` (Kavin Raj), `717822AD003` (Hari Prasath), `717822AD004` (Surya Prakash), `717822AD005` (Naveen Chandran)
- **Password**: `student123`

---

## 💾 Database Schema

The production-ready schema for Supabase is located in `/supabase_schema.sql`.
Tables generated:
- `users` — Auth accounts with Role-Based Access Control (Staff/Student).
- `students` — Detailed student register database (Roll Number, Register Number, Section, Status, etc).
- `polls` — Poll records containing targeted parameters, options, deadlines.
- `poll_options` / `poll_responses` — Student selections matched with unique indexes.
- `notifications` — Log of sent SMS / Email reminders.

---

*Developed By SC TECH © 2026*
