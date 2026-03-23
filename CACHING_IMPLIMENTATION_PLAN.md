# Performance Optimization Plan: Lazy Loading, Caching, and Skeletons

## Goal Description
Implement a comprehensive strategy to optimize the frontend load time and backend response time using React Code Splitting (`React.lazy`, `Suspense`), component-specific Skeleton Loaders, and Redis Caching with surgical cache invalidation. This feature-by-feature plan details how to transform the system's performance and provide a smooth user experience.

> [!NOTE] 
> The overall goal is to make the website feel as fast as a native mobile app. We will do this by:
> 
> 1. **Lazy Loading:** Not downloading the whole website at once. We only download the specific dashboard you are logging into. When you click a new tab (like "Test Series"), we download that specific tab seamlessly in the background.
> 2. **Skeleton Loaders:** While a new tab is downloading (which takes a fraction of a second), we show a grey "skeleton" shape of the content so the screen doesn't go blank. This makes the app feel highly responsive.
> 3. **Redis Caching:** Memory storage for the database. Instead of asking the main database for the heavy list of students every single time, we save a copy in a super-fast "cache". We only go back to the main database to recalculate when something actually changes.

## User Review Required
Please review the specific invalidation rules for Redis. When data changes, Redis cache must be cleared so users don't see old data. If you have custom rules about how long data should live before refreshing (TTL - Time to Live), please specify! 

---

### Global Architecture

#### Frontend: Route-Based & Component-Based Code Splitting
- **[MODIFY] [frontend/src/App.tsx](file:///d:/UJAAS_Project/frontend/src/App.tsx) / [frontend/src/main.tsx](file:///d:/UJAAS_Project/frontend/src/main.tsx)**
  - Convert all heavy dashboard imports (Admin, Student, Faculty) to `React.lazy`.
  - Wrap routing logic in a single `<Suspense fallback={<GlobalLoadingSpinner />}>` that acts as the highest level fallback.

> [!NOTE]
> Instead of downloading a massive 3MB file when you open the site, the site is chopped into many tiny pieces. A student logging in only downloads the piece they need (~500KB), making the initial login lighting fast.

#### Backend: Redis Middleware
- **[NEW] `backend/middleware/redisCache.js`**
  - Create a generic caching middleware `checkCache(keyPrefix, ttl)` to intercept GET requests.
- **[NEW] `backend/utils/cacheInvalidator.js`**
  - Create helper functions to flush specific Redis key patterns (e.g., `flushPattern('batches:*')`).

> [!NOTE]
>  We are creating a "middle-man" between the website and the Database. When the website asks for data, the middle-man checks if it already knows the answer. If yes, it replies instantly. If no, it asks the Database, memorizes the answer, and then replies.

---

### Feature 1: The Student Dashboard

#### Frontend Lazy Loading & Skeletons
- **Initial Load:** `StudentDashboard.tsx` shell, Sidebar, Header, and `StudentOverview` (Dashboard Home).
- **Lazy Loaded Sections:**
  - `EnrolledBatches`: Falls back to `<CardGridSkeleton />`.
  - `TestSeries`: Falls back to `<TableSkeleton />` or customized `<TestSeriesSkeleton />`.
  - `QuestionBank`: Falls back to `<QuestionListSkeleton />`.
  - `Performance`: Falls back to `<AnalyticsChartSkeleton />`.
- **Pre-fetching:** Implement `onMouseEnter` prefetching mechanics on Sidebar Links so chunks download *before* the click occurs.

> [!NOTE] 
> By the time you actually click the "Question Bank" button, the website noticed your mouse hovering over it and already started downloading it. This makes clicks feel completely instantaneous.

#### Backend Caching (`studentController.js` / API routes)
- **`GET /api/student/:id/enrollments`**: 
  - Cache Key: `student:{id}:enrollments`.
  - Invalidate: When the admin approves/adds a student to a new batch. TTL: 24 hours.
- **`GET /api/student/:id/performance`**:
  - Cache Key: `student:{id}:performance`.
  - Invalidate: Immediately after a student submits a new test. TTL: 24 hours.
- **`GET /api/batches/live` (Global Schedule)**:
  - Cache Key: `global:live-classes`.
  - Invalidate: When a faculty starts/stops a live stream. TTL: 5 minutes.

> [!NOTE] 
> A student's performance report only changes when they finish a test. Therefore, it is perfectly safe to memorize it ("cache" it) for 24 hours straight, preventing massive recalculations every time they visit the dashboard.

---

### Feature 2: The Admin Dashboard

#### Frontend Lazy Loading & Skeletons
- **Initial Load:** `AdminDashboard.tsx` shell, Sidebar, Header, and `AdminOverview` (Revenue/Student Count widgets).
- **Lazy Loaded Sections:**
  - `StudentManagement`: Falls back to `<TableSkeleton />`.
  - `FacultyManagement`: Falls back to `<TableSkeleton />`.
  - `BatchManagement`: Falls back to `<CardGridSkeleton />`.
  - `RevenueAnalytics`: Falls back to `<AnalyticsChartSkeleton />`.

#### Backend Caching (`adminController.js` / API routes)
- **`GET /api/admin/metrics` (Top level counts)**:
  - Cache Key: `admin:metrics:overview`.
  - Invalidate: Nightly cron job, OR manually when a large batch of students is imported. TTL: 1 hour.
- **`GET /api/admin/system-logs`**:
  - Cache Key: `admin:logs:{page}`.
  - Invalidate: TTL: 5 minutes (volatile data, keep cache short).
- **Pagination Required:** Since Admins view *all* students, the `/api/students` endpoint must use `LIMIT` and `OFFSET`. We will not cache the entire 100,000 student directory in a single Redis key; instead, cache per page (`students:page:1`, `students:page:2`).

> [!NOTE]  
> The Admin Dashboard shows *everything*, so pagination is required to not freeze the browser. 

---

### Feature 3: The Faculty Dashboard

#### Frontend Lazy Loading & Skeletons
- **Initial Load:** `FacultyDashboard.tsx` shell, Sidebar, Header, and `FacultyOverview` (Today's classes).
- **Lazy Loaded Sections:**
  - `MyBatches`: Falls back to `<CardGridSkeleton />`.
  - `ScheduleManagement`: Falls back to `<CalendarSkeleton />`.
  - `TestCreator` / `QuestionUploader`: Falls back to `<FormSkeleton />`.

#### Backend Caching (`facultyController.js` / API routes)
- **`GET /api/faculty/:id/schedule`**:
  - Cache Key: `faculty:{id}:schedule`.
  - Invalidate: When the admin or faculty updates the calendar. TTL: 12 hours.
- **`GET /api/faculty/:id/batches`**:
  - Cache Key: `faculty:{id}:batches`.
  - Invalidate: When the admin assigns or removes the faculty from a batch. TTL: 24 hours.

---

### Feature 4: Core Shared Modules (Test Series & Question Bank)

These are heavy modules used by multiple roles. They require the most aggressive pagination and caching strategies.

#### Pagination & Virtualization
- **Frontend Action:** Implement `react-window` or an `IntersectionObserver` infinite scroll.
- **Why?** Even if Redis loads 5,000 questions instantly, rendering 5,000 DOM elements will freeze the browser. 

> [!NOTE] 
> "Virtualization" is a neat trick where the website only draws the 20 questions you are currently looking at on the screen, even if there are 5,000 questions in total. As you scroll down, it deletes the top questions and draws the new ones, saving tons of memory.

#### Test Series Caching
- **`GET /api/tests/available`**:
  - Cache Key: `tests:available:page:{n}`.
  - Invalidate: Delete `tests:available:*` when a new test is published.

#### Question Bank Caching
- **`GET /api/questions?topic={topic}&difficulty={diff}`**:
  - Cache Key: `questions:{topic}:{diff}:page:{n}`.
  - Invalidate: Delete `questions:*` when an Admin/Faculty edits or adds a question.

## Verification Plan

### Automated Tests
- N/A (Performance testing requires explicit benchmark scripts).

### Manual Verification
1. **Network Tab Check (Code Splitting):** Open DevTools -> Network -> JS. Load the dashboard. Verify that ONLY `DashboardOverview.js` loads. Click "Test Series" and verify that a new chunk `TestSeriesSection.js` downloads.
2. **Speed Test (Redis):** Open DevTools -> Network. Click "Batches". See that the first `GET /api/batches` takes ~200ms. Refresh the page. Click "Batches" again. Verify the request now takes ~10ms (Cache Hit).
3. **Invalidation Check:** As an Admin, add a new Batch. Switch to the Student view and verify the new Batch appears instantly (verifying the cache was destroyed and rebuilt correctly).
4. **Skeleton Visual Check:** Throttle network speed to "Fast 3G" in DevTools. Click a new sidebar tab and verify the component-specific skeleton completely fills the shell without layout shifts before the actual component renders.
