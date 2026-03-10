# UJAAS Supabase Storage Configuration

## Buckets to Create

In Supabase, you create **buckets** (not folders). Go to **Supabase Dashboard → Storage → New Bucket**.

| # | Bucket Name | Public? | File Size Limit | Allowed MIME Types | Purpose |
|---|---|---|---|---|---|
| 1 | `landing-faculty` | ✅ Yes | 2 MB | `image/jpeg, image/png, image/webp` | Faculty photos on landing page |
| 2 | `landing-achievers` | ✅ Yes | 2 MB | `image/jpeg, image/png, image/webp` | Achiever photos on landing page |
| 3 | `landing-visions` | ✅ Yes | 2 MB | `image/jpeg, image/png, image/webp` | Founder/Director photos on landing page |
| 4 | `landing-branding` | ✅ Yes | 5 MB | `image/jpeg, image/png, image/webp, image/svg+xml` | Logo, hero banners |
| 5 | `notes` | ❌ No | 50 MB | `application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/vnd.ms-powerpoint, application/vnd.openxmlformats-officedocument.presentationml.presentation, image/jpeg, image/png` | Study notes (PDFs, DOCs, PPTs) |
| 6 | `timetables` | ❌ No | 5 MB | `image/jpeg, image/png, image/webp` | Timetable images |
| 7 | `questions` | ❌ No | 5 MB | `image/jpeg, image/png, image/webp` | Question, option & solution images |
| 8 | `avatars` | ❌ No | 2 MB | `image/jpeg, image/png, image/webp` | User profile pictures |

---

## How to Create Each Bucket

### Step 1: Go to Supabase Dashboard → Storage
### Step 2: Click "New Bucket" for each one

For **public** buckets (landing-*):
- Toggle **"Public bucket"** ON
- This means anyone can READ files without auth

For **private** buckets (notes, questions, avatars, timetables):
- Leave **"Public bucket"** OFF
- Files are accessed via signed URLs from your backend

---

## RLS Policies (SQL)

Run these in **Supabase Dashboard → SQL Editor**:

### Public Buckets (landing-*) — Allow anyone to read, only admins upload

```sql
-- Allow public read for all landing buckets
CREATE POLICY "Public read landing-faculty"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'landing-faculty');

CREATE POLICY "Public read landing-achievers"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'landing-achievers');

CREATE POLICY "Public read landing-visions"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'landing-visions');

CREATE POLICY "Public read landing-branding"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'landing-branding');

-- Allow authenticated admins to upload/update/delete in landing buckets
CREATE POLICY "Admin upload landing-faculty"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'landing-faculty'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Admin upload landing-achievers"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'landing-achievers'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Admin upload landing-visions"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'landing-visions'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Admin upload landing-branding"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'landing-branding'
    AND auth.role() = 'authenticated'
  );

-- Allow delete on landing buckets
CREATE POLICY "Admin delete landing-faculty"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'landing-faculty' AND auth.role() = 'authenticated');

CREATE POLICY "Admin delete landing-achievers"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'landing-achievers' AND auth.role() = 'authenticated');

CREATE POLICY "Admin delete landing-visions"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'landing-visions' AND auth.role() = 'authenticated');

CREATE POLICY "Admin delete landing-branding"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'landing-branding' AND auth.role() = 'authenticated');
```

### Private Buckets — Authenticated read/write

```sql
-- NOTES: authenticated users can read, authenticated users can upload
CREATE POLICY "Auth read notes"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'notes' AND auth.role() = 'authenticated');

CREATE POLICY "Auth upload notes"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'notes' AND auth.role() = 'authenticated');

CREATE POLICY "Auth delete notes"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'notes' AND auth.role() = 'authenticated');

-- QUESTIONS: same pattern
CREATE POLICY "Auth read questions"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'questions' AND auth.role() = 'authenticated');

CREATE POLICY "Auth upload questions"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'questions' AND auth.role() = 'authenticated');

CREATE POLICY "Auth delete questions"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'questions' AND auth.role() = 'authenticated');

-- TIMETABLES: same pattern
CREATE POLICY "Auth read timetables"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'timetables' AND auth.role() = 'authenticated');

CREATE POLICY "Auth upload timetables"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'timetables' AND auth.role() = 'authenticated');

CREATE POLICY "Auth delete timetables"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'timetables' AND auth.role() = 'authenticated');

-- AVATARS: same pattern
CREATE POLICY "Auth read avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Auth upload avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Auth delete avatars"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');
```

---

## File Path Patterns Inside Each Bucket

| Bucket | File Path Pattern | Example |
|---|---|---|
| `landing-faculty` | `{slug}.jpg` | `dr-rajesh-kumar.jpg` |
| `landing-achievers` | `{slug}.jpg` | `rahul-kumar-2025.jpg` |
| `landing-visions` | `{slug}.jpg` | `shri-gs-sharma.jpg` |
| `landing-branding` | `{filename}` | `logo.svg`, `hero-banner.jpg` |
| `notes` | `{batch}/{subject}/{uuid}-{filename}` | `12th-jee/physics/a1b2c3-wave-optics.pdf` |
| `timetables` | `{batch}/{filename}` | `12th-jee/timetable-march.jpg` |
| `questions` | `{test_id}/{type}-{question_id}.jpg` | `test-123/q-q1.jpg`, `test-123/opt-q1-0.jpg` |
| `avatars` | `{role}/{user_id}.jpg` | `students/uuid-123.jpg` |

---

## Public URL Pattern (for landing-* buckets)

```
https://[PROJECT_REF].supabase.co/storage/v1/object/public/[BUCKET]/[PATH]
```

Example:
```
https://zcgpdmavhhvtgzlgomoq.supabase.co/storage/v1/object/public/landing-faculty/dr-rajesh-kumar.jpg
```

## Signed URL Pattern (for private buckets)

Generated by your backend using the Supabase client. Expires after a set duration (e.g., 1 hour).

---

## Backend `.env` Additions

```env
SUPABASE_URL=https://zcgpdmavhhvtgzlgomoq.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

> Find the service role key in: Supabase Dashboard → Settings → API → service_role key

---

## Setup Checklist

- [ ] Create bucket `landing-faculty` (Public)
- [ ] Create bucket `landing-achievers` (Public)
- [ ] Create bucket `landing-visions` (Public)
- [ ] Create bucket `landing-branding` (Public)
- [ ] Create bucket `notes` (Private)
- [ ] Create bucket `timetables` (Private)
- [ ] Create bucket `questions` (Private)
- [ ] Create bucket `avatars` (Private)
- [ ] Run the RLS policies SQL in SQL Editor
- [ ] Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to backend `.env`