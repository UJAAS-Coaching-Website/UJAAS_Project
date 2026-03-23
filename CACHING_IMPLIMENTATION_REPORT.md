# Caching Implementation Report

## Overview
This report details the implementation of caching across the UJAAS Coaching Website backend. The goal of this caching layer is to drastically improve database performance, reduce server response times, and provide a seamless, instantaneous experience for end-users (Students, Faculty, and Admins).

## Type of Caching Used
**Redis In-Memory Data Store (via Upstash)**
We implemented a **Read-Through / Write-Invalidate** caching strategy using Redis. 
- **Read-Through:** When a user requests data, the system first checks the lightning-fast Redis memory. If the data is there (a "Cache Hit"), it is returned instantly without touching the main PostgreSQL database. If it is missing (a "Cache Miss"), the system fetches it from the database, stores a copy in Redis for future requests, and then returns it to the user.
- **Write-Invalidate:** When data is created, updated, or deleted (e.g., an Admin adds a new batch, or a Student submits a test), the specific Redis cache keys holding the old data are instantly deleted ("invalidated"). The next time that data is requested, it is freshly fetched from the database and re-cached.

## Elements Using Caching

The following core components and API routes have been fortified with Redis caching:

### 1. Student Routes (`/api/students`)
*   **Cached Data:** Student profiles, directory list, and search queries (Admin/Faculty views). 
*   **Cache Keys:** `admin:students:query:*`, `admin:students:{id}`
*   **Time-To-Live (TTL):** 10 minutes to 30 minutes.
*   **Invalidation Triggers:** When a student is created, updated, deleted, or assigned/removed from a batch.

### 2. Batch Routes (`/api/batches`)
*   **Cached Data:** The global list of all active batches, specific batch details, batch student lists, and batch faculty lists.
*   **Cache Keys:** `global:batches:list`, `batch:{id}:details`, `batch:{id}:students`, `batch:{id}:faculty`
*   **Time-To-Live (TTL):** 10 minutes.
*   **Invalidation Triggers:** Adding/removing students, assigning faculty, updating batch details, or deleting a batch.

### 3. Test Series Routes (`/api/tests`)
*   **Cached Data:** The available test lists for students/faculty/admins, past test attempts, specific test details, test analysis, and result summaries.
*   **Cache Keys:** `tests:list:*`, `student:{id}:test_attempts`, `attempts:{id}:result`, `test:{id}:details`, `test:{id}:analysis`
*   **Time-To-Live (TTL):** 10 minutes to 1 hour.
*   **Invalidation Triggers:** When an admin creates/updates/deletes a test, or when a student presses "Submit" on a new test attempt.

### 4. Question Bank Routes (`/api/questions`)
*   **Cached Data:** Lists of question files sorted by difficulty, subject, or batch.
*   **Cache Keys:** `questions:query:*`
*   **Time-To-Live (TTL):** 1 hour.
*   **Invalidation Triggers:** When faculty uploads a new question file or deletes an existing one.

### 5. Faculty Routes (`/api/faculty`)
*   **Cached Data:** The directory list of faculty members.
*   **Cache Keys:** `admin:faculty:list`
*   **Time-To-Live (TTL):** 1 hour.
*   **Invalidation Triggers:** When an admin creates, edits, or deletes a faculty member's profile.

---

## Testing Plan

To ensure the caching is working correctly without serving stale data, the following testing plan should be executed.

### Part 1: Manual Verification Plan

#### 1. Measure the "Cache Hit" Speed Boost
*   **Action:** Log in as an Admin. Open your browser's Developer Tools (`F12`) and go to the **Network** tab. Ensure "Disable cache" is unchecked.
*   **Step 1:** Click on the "Batches" or "Test Series" tab. Watch the Network tab and note the [Time](file:///d:/UJAAS_Project/frontend/src/components/StudentDashboard.tsx#291-292) it takes for the GET request (e.g., `250ms`). This is a **Cache Miss** (fetching from the database).
*   **Step 2:** Click away to a different tab, and then click back to "Batches" or "Test Series". 
*   **Expected Result:** The exact same GET request should now take approximately **10ms to 30ms**. This proves the **Cache Hit** was successful and the data was served from Redis.

#### 2. Verify Surgical Cache Invalidation
*   **Action:** Log in as an Admin. Go to the "Batches" section.
*   **Step 1:** Create a brand new Batch (e.g., "NEET Target 2027"). 
*   **Step 2:** Immediately check the Batches list.
*   **Expected Result:** The newly created Batch should appear immediately. If the caching invalidation failed, you would not see the new batch until the TTL expired. Seeing it instantly proves the `POST /api/batches` successfully triggered the invalidator and deleted the `global:batches:list` cache key.

#### 3. Verify Cross-User Invalidation
*   **Action:** Open two different browser windows (or one normal, one Incognito). Log into Window A as an Admin, and Window B as a Student.
*   **Step 1:** In Window B (Student), navigate to the "Question Bank" to load the cached list.
*   **Step 2:** In Window A (Admin/Faculty), upload a new practice paper.
*   **Step 3:** In Window B (Student), refresh the page.
*   **Expected Result:** The student should see the newly uploaded practice paper immediately, proving the Admin's action correctly wiped the global question cache.

### Part 2: Automated Testing Plan (Postman / Jest)

If you wish to set up automated test scripts in the future, follow this sequence:

#### Test Case 1: Database Check vs Cache Check
*   **Script:** Send a `GET /api/batches` request.
*   **Assert:** Status is `200 OK`. Record the `responseTime` (e.g., T1).
*   **Script:** Send a second `GET /api/batches` request immediately after.
*   **Assert:** Status is `200 OK`. Record the `responseTime` (e.g., T2). Assert that `T2` is significantly less than `T1` (e.g., `T2 < T1 * 0.4`), confirming secondary load bypassed the database.

#### Test Case 2: Mutation Invalidates Cache
*   **Script:** Send a `GET /api/faculty`. 
*   **Script:** Send a `POST /api/faculty` to strictly create a mock faculty member named "Test Teacher".
*   **Script:** Send a second `GET /api/faculty`.
*   **Assert:** The response JSON payload for the second GET request contains "Test Teacher". This proves the POST request actively cleared the cache in the background.
*   **Cleanup:** Send a `DELETE /api/faculty/{id}` to remove the mock teacher, verifying the cache is wiped cleanly once again.

#### Test Case 3: TTL (Time-To-Live) Database Synchronization
*   **Requirement:** Temporarily set a TTL to a short duration for testing (e.g., 5 seconds on a test endpoint).
*   **Script:** Send a `GET /api/test-endpoint` to cache the data.
*   **Script:** Manually modify the database bypassing the API (to simulate external DB changes without triggering our [invalidateCache](file:///d:/UJAAS_Project/backend/src/middleware/redisCache.js#56-83) middleware).
*   **Script:** Wait 6 seconds.
*   **Script:** Send another `GET /api/test-endpoint`.
*   **Assert:** The response contains the *new* database metric, proving the Redis cache naturally died and refreshed itself from the source of truth after expiration.
