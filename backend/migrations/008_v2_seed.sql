-- 008_v2_seed.sql
-- Seed data for the v2 schema

-- Clear existing data (optional, but good for a fresh start with demo data)
-- TRUNCATE users, batches, tests, notes, notifications, landing_page_data, prospect_queries RESTART IDENTITY CASCADE;

-- 1. Landing Page Data
INSERT INTO landing_page_data (section_key, content)
VALUES
('hero', '{"title": "UJAAS: Illuminating Paths to Excellence", "subtitle": "Premium coaching for JEE and NEET with expert faculty and personalized care.", "cta": "Get Started", "bg_image": "/assets/hero-bg.jpg"}'),
('faculty', '[
  {"name": "Dr. Rajesh Kumar", "subject": "Physics", "designation": "Head of Department", "experience": "15+ Years", "image": "https://i.pravatar.cc/150?u=rajesh"},
  {"name": "Mrs. Sunita Sharma", "subject": "Mathematics", "designation": "Senior Faculty", "experience": "12+ Years", "image": "https://i.pravatar.cc/150?u=sunita"}
]'),
('visions', '[
  {"name": "Shri G.S. Sharma", "designation": "Founder & Director", "vision": "Our vision is to provide quality education that is accessible and transformative for every student.", "image": "https://i.pravatar.cc/150?u=sharma"}
]'),
('achievers', '[
  {"name": "Aryan Singh", "rank": "AIR 42", "exam": "JEE Advanced 2025", "image": "https://i.pravatar.cc/150?u=aryan"},
  {"name": "Isha Patel", "rank": "AIR 156", "exam": "NEET 2025", "image": "https://i.pravatar.cc/150?u=isha"}
]')
ON CONFLICT (section_key) DO UPDATE SET content = EXCLUDED.content;

-- 2. Ensure Slug and Subjects for existing batches
UPDATE batches SET slug = '11th-jee', subjects = ARRAY['Physics', 'Chemistry', 'Mathematics'] WHERE name = '11th JEE';
UPDATE batches SET slug = '11th-neet', subjects = ARRAY['Physics', 'Chemistry', 'Biology'] WHERE name = '11th NEET';
UPDATE batches SET slug = '12th-jee', subjects = ARRAY['Physics', 'Chemistry', 'Mathematics'] WHERE name = '12th JEE';
UPDATE batches SET slug = '12th-neet', subjects = ARRAY['Physics', 'Chemistry', 'Biology'] WHERE name = '12th NEET';

-- 3. Add some questions to the existing tests
DO $$
DECLARE
    v_test_id UUID;
BEGIN
    SELECT id INTO v_test_id FROM tests WHERE title = 'Weekly Test - Physics' LIMIT 1;
    IF v_test_id IS NOT NULL THEN
        INSERT INTO questions (test_id, subject, section, type, question_text, options, correct_ans, marks, neg_marks, order_index)
        VALUES
        (v_test_id, 'Physics', 'Section A', 'MCQ', 'A particle moves with constant velocity. What is its acceleration?', '["Zero", "Constant", "Variable", "Infinite"]', '0', 4, 1, 1),
        (v_test_id, 'Physics', 'Section A', 'MCQ', 'The unit of force is?', '["Joule", "Watt", "Newton", "Pascal"]', '2', 4, 1, 2);
    END IF;

    SELECT id INTO v_test_id FROM tests WHERE title = 'Mathematics DPP #1' LIMIT 1;
    IF v_test_id IS NOT NULL THEN
        INSERT INTO questions (test_id, subject, section, type, question_text, correct_ans, marks, neg_marks, order_index)
        VALUES
        (v_test_id, 'Mathematics', 'Numerical', 'Numerical', 'Solve for x: 2x + 5 = 15', '5', 4, 0, 1);
    END IF;
END $$;

-- 4. Update faculty profile info
UPDATE faculties f
SET designation = 'Senior HOD', experience = '15+ Years', bio = 'Expert in Physics with over 15 years of teaching experience for JEE aspirants.'
FROM users u
WHERE f.user_id = u.id AND u.login_id = 'faculty@ujaas.com';

-- 5. Add student ratings with subjects
UPDATE student_ratings SET subject = 'Physics' WHERE subject IS NULL;

-- 6. Add some prospect queries
INSERT INTO prospect_queries (name, email, phone, course, message, status)
VALUES
('Rahul Gupta', 'rahul@example.com', '+91 90000 12345', 'JEE 2-Year Program', 'Interested in joining for 11th JEE.', 'new'),
('Anjali Verma', 'anjali@example.com', '+91 91111 22222', 'NEET Crash Course', 'Need details about the upcoming crash course.', 'contacted');

-- 7. Add batch_id to notifications
UPDATE notifications n
SET batch_id = b.id
FROM batches b
WHERE b.slug = '11th-jee' AND n.title LIKE '%Welcome%';
