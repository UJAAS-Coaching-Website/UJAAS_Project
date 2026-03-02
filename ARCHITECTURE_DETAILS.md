# UJAAS Technical Architecture & Logic Map

This document provides a deep dive into the internal logic of the UJAAS codebase, detailing how pages, components, and elements interact.

---

## 1. Core Orchestrator: `App.tsx`
`App.tsx` acts as the "Brain" of the application. It handles the highest level of state and routing.

### Logic & Connections:
- **Routing Engine:** Instead of a library like React Router, it uses a custom `window.history.pushState` and `popstate` listener logic. 
  - *Logic:* `parsePath()` reads the URL -> `setTabFromPath()` updates the `activeTab` and `adminBatch` state -> React re-renders the corresponding Dashboard.
- **Global State Management:** 
  - `user`: Tracks the authenticated user (Student, Faculty, Admin).
  - `landingData`: Shared configuration for the public landing page.
  - `publishedTests`: The master list of all Tests and DPPs.
  - `adminBatches`: The source of truth for all coaching batches.
- **Persistence Logic:** Uses `useEffect` hooks to sync state to `localStorage` (keys: `ujaasPublishedTests`, `ujaasAdminBatches`, etc.), ensuring data survives page refreshes.

---

## 2. Authentication Logic: `Login.tsx` & `auth.ts`
- **Element:** Login Form.
- **Logic:** 
  1. User enters `loginId` and `password`.
  2. `Login.tsx` calls `api/auth.ts`.
  3. If successful, `localStorage.setItem('ujaasToken', token)` is called.
  4. The `onLogin` callback in `App.tsx` is triggered, updating the `user` state and redirecting to the correct Dashboard.

---

## 3. Administrator Logic (`AdminDashboard.tsx`)
The Admin interface is built on a "Sidebar-to-Content" mapping logic.

### A. Batch Management
- **Element:** `BatchCard` / `CreateBatch` Form.
- **Logic:** 
  - Creating a batch triggers `addAdminBatch` in `App.tsx`.
  - Selecting a batch updates the `adminBatch` state, which filters the view to show only data (students/notes) for that specific batch.
  - **Connection:** Updates to batches immediately reflect in the Faculty and Student dropdowns because they all consume the same `adminBatches` state.

### B. Landing Page Editor
- **Element:** `LandingPageEditor` sections (Faculty, Achievers, Visions).
- **Logic:** Each input (text or image upload) triggers a functional update to the `landingData` object in `App.tsx`.
- **Image Handling:** Uses Base64 encoding for local storage persistence (with a "Storage Full" warning logic in `App.tsx`).

### C. Test Creation (`CreateTestSeries.tsx` / `CreateDPP.tsx`)
- **Logic:** A complex multi-step form state.
- **Element:** Question Upload.
  - *Logic:* Parses input into a JSON structure (`Question` interface) containing text, options, and correct answers.
- **Connection:** On "Publish", the test is added to the `publishedTests` array in `App.tsx`, making it instantly visible to Students in the targeted batches.

---

## 4. Student Logic (`StudentDashboard.tsx`)
The Student interface is consumer-centric, driven by the `activeTab` state.

### A. Test Series Section (`TestSeriesSection.tsx`)
- **Logic:** Filters `publishedTests` from `App.tsx` where `test.batches` includes the student's assigned batch.
- **Connection:** Clicking "Start Test" launches the `StudentTestTaking.tsx` component.

### B. Exam Engine (`StudentTestTaking.tsx`)
- **State Logic:**
  - `currentIndex`: Tracks the active question.
  - `answers`: An object mapping `questionId` to `selectedIndex`.
  - `timeLeft`: A `setInterval` timer that triggers `handleSubmit` automatically when it reaches zero.
- **Visual Feedback Logic:** The "Question Palette" (circles) changes color based on question status:
  - *Gray:* Not visited.
  - *Red:* Visited but not answered.
  - *Green:* Answered.
  - *Purple:* Marked for review.

### C. Performance Analytics (`StudentAnalytics.tsx`)
- **Logic:** Maps raw test attempt scores into a Recharts `LineChart` and `RadarChart`.
- **Connection:** Data is pulled from the student's history and compared against "Batch Average" logic.

---

## 5. Faculty Logic (`FacultyDashboard.tsx`)
Faculty logic is a hybrid of Admin (content creation) and Student (viewing data).

### A. Content Upload (`UploadNotes.tsx` / `QuestionUploadForm.tsx`)
- **Logic:** Faculty selects a batch -> Uploads file/text -> Data is pushed to the `notes` or `questionBank` state.
- **Connection:** Uploaded notes appear in the `NotesSection.tsx` for students in that specific batch.

### B. Student Ranking Logic (`StudentRankingsEnhanced.tsx`)
- **Logic:** Performs a sort on the student list based on `testScores` or `overallRating`.
- **Element:** Search Bar.
  - *Logic:* A `useMemo` hook filters the student list in real-time as the faculty types a name or roll number.

---

## 6. UI Logic & Styling (`frontend/src/components/ui`)
- **Shadcn Logic:** Every component (Button, Dialog, Select) uses `class-variance-authority` (CVA) to manage styles.
- **Color Migration Logic:** 
  - **File:** `colors.ts` and `globals.css`.
  - **Logic:** CSS Variables (`--primary`, `--teal-600`) are defined in `globals.css`. Components reference these variables, allowing for a "One-Stop" theme change by simply updating the CSS variables.

---

## 7. Data Flow Summary
1. **Input:** Admin creates a Test.
2. **State Update:** `App.tsx` updates `publishedTests` and `localStorage`.
3. **Propagation:** `StudentDashboard` detects change in `publishedTests`.
4. **Conditional Rendering:** If `test.batch == student.batch`, a "New Test" notification appears in `NotificationCenter.tsx`.
5. **Action:** Student takes test -> `test_attempts` table (or local state) is updated -> `StudentAnalytics` re-renders with new data.
