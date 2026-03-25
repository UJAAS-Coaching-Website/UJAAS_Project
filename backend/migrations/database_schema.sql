--
-- PostgreSQL database dump
--

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', 'public', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
CREATE EXTENSION IF NOT EXISTS pgcrypto;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


--
-- Name: notification_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.notification_type AS ENUM (
    'announcement',
    'info',
    'warning'
);


--
-- Name: query_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.query_status AS ENUM (
    'new',
    'seen',
    'contacted'
);


--
-- Name: test_format; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.test_format AS ENUM (
    'JEE MAIN',
    'NEET',
    'Custom'
);


--
-- Name: test_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.test_status AS ENUM (
    'upcoming',
    'live',
    'completed',
    'draft'
);


--
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role AS ENUM (
    'student',
    'faculty',
    'admin'
);


--
-- Name: uuid_generate_v4(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.uuid_generate_v4() RETURNS uuid
    LANGUAGE sql
    AS $$ SELECT gen_random_uuid(); $$;


--
-- Name: _migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._migrations (
    id integer NOT NULL,
    name text NOT NULL,
    applied_at timestamp with time zone DEFAULT now()
);


--
-- Name: _migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public._migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: _migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public._migrations_id_seq OWNED BY public._migrations.id;


--
-- Name: batch_subjects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.batch_subjects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    batch_id uuid NOT NULL,
    subject_id uuid NOT NULL,
    total_classes numeric DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: batches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.batches (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    slug text,
    timetable_url text
);


--
-- Name: chapters; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chapters (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    order_index integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    batch_subject_id uuid
);


--
-- Name: dpp_attempts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dpp_attempts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    dpp_id uuid,
    student_id uuid,
    score numeric,
    answers jsonb,
    submitted_at timestamp with time zone DEFAULT now(),
    attempt_no integer NOT NULL,
    correct_answers integer DEFAULT 0 NOT NULL,
    wrong_answers integer DEFAULT 0 NOT NULL,
    unattempted integer DEFAULT 0 NOT NULL
);


--
-- Name: dpp_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dpp_sessions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    dpp_id uuid NOT NULL,
    student_id uuid NOT NULL,
    device_id text NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    last_seen_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: dpp_target_batches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dpp_target_batches (
    dpp_id uuid NOT NULL,
    batch_id uuid NOT NULL
);


--
-- Name: dpps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dpps (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title text NOT NULL,
    instructions text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    chapter_id uuid NOT NULL
);


--
-- Name: faculties; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.faculties (
    user_id uuid NOT NULL,
    phone text,
    designation text,
    "joining-date" date,
    experience text,
    bio text,
    subject_id uuid,
    rating numeric(3,2) DEFAULT 0,
    review_count integer DEFAULT 0
);


--
-- Name: faculty_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.faculty_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    faculty_id uuid NOT NULL,
    batch_subject_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: faculty_review_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.faculty_review_sessions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    created_by uuid,
    start_time timestamp with time zone DEFAULT now(),
    expiry_time timestamp with time zone NOT NULL,
    is_active boolean DEFAULT true
);


--
-- Name: faculty_reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.faculty_reviews (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    session_id uuid,
    student_id uuid,
    faculty_id uuid,
    rating integer,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT faculty_reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- Name: landing_achievers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.landing_achievers (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    achievement character varying(255) NOT NULL,
    year character varying(50),
    image_url text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: landing_courses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.landing_courses (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: landing_faculty; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.landing_faculty (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    subject character varying(255) NOT NULL,
    designation character varying(255),
    experience character varying(255),
    image_url text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: landing_page_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.landing_page_data (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    section_key text NOT NULL,
    content jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: landing_visions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.landing_visions (
    id character varying(255) DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    designation character varying(255),
    vision text NOT NULL,
    image_url text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    chapter_id uuid NOT NULL,
    title text NOT NULL,
    file_url text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: notification_batches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_batches (
    notification_id uuid NOT NULL,
    batch_id uuid NOT NULL
);


--
-- Name: notification_deliveries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_deliveries (
    notification_id uuid NOT NULL,
    student_id uuid NOT NULL,
    is_read boolean DEFAULT false,
    is_deleted boolean DEFAULT false
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    sender_id uuid,
    type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    is_sticky boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: prospect_queries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.prospect_queries (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    email text,
    phone text NOT NULL,
    message text,
    status public.query_status DEFAULT 'new'::public.query_status,
    created_at timestamp with time zone DEFAULT now(),
    course_id uuid
);


--
-- Name: question_bank_batch_links; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.question_bank_batch_links (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    question_bank_file_id uuid NOT NULL,
    batch_id uuid NOT NULL
);


--
-- Name: question_bank_files; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.question_bank_files (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    subject_name character varying(100) NOT NULL,
    title character varying(255) NOT NULL,
    difficulty character varying(16) NOT NULL,
    file_url text NOT NULL,
    original_file_name character varying(255) NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT question_bank_files_difficulty_check CHECK (((difficulty)::text = ANY ((ARRAY['easy'::character varying, 'medium'::character varying, 'hard'::character varying])::text[])))
);


--
-- Name: questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.questions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    test_id uuid,
    subject text NOT NULL,
    section text,
    type text NOT NULL,
    question_text text NOT NULL,
    question_img text,
    options jsonb,
    option_imgs jsonb,
    correct_ans text NOT NULL,
    marks integer DEFAULT 4,
    neg_marks numeric DEFAULT 1,
    explanation text,
    explanation_img text,
    order_index integer,
    dpp_id uuid,
    correct_answer text,
    difficulty text,
    CONSTRAINT question_source_check CHECK (((test_id IS NOT NULL) OR (dpp_id IS NOT NULL)))
);


--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refresh_tokens (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    token_hash text NOT NULL,
    family_id uuid NOT NULL,
    revoked_at timestamp with time zone,
    replaced_by_hash text,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    last_used_at timestamp with time zone
);


--
-- Name: student_ratings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_ratings (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    student_id uuid,
    attendance integer DEFAULT 0 NOT NULL,
    test_performance integer DEFAULT 0 NOT NULL,
    dpp_performance integer DEFAULT 0 NOT NULL,
    behavior integer DEFAULT 0 NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    batch_subject_id uuid,
    remarks text
);


--
-- Name: students; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.students (
    user_id uuid NOT NULL,
    roll_number text NOT NULL,
    phone text,
    address text,
    dob date,
    parent_contact text,
    join_date date,
    admin_remark text,
    assigned_batch_id uuid
);


--
-- Name: subjects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subjects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: test_attempts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.test_attempts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    test_id uuid,
    student_id uuid,
    score numeric,
    submitted_at timestamp with time zone,
    time_spent integer,
    answers jsonb DEFAULT '{}'::jsonb,
    attempt_no integer NOT NULL,
    started_at timestamp with time zone NOT NULL,
    deadline_at timestamp with time zone NOT NULL,
    auto_submitted boolean DEFAULT false NOT NULL,
    correct_answers integer DEFAULT 0 NOT NULL,
    wrong_answers integer DEFAULT 0 NOT NULL,
    unattempted integer DEFAULT 0 NOT NULL,
    device_id text
);


--
-- Name: test_target_batches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.test_target_batches (
    test_id uuid NOT NULL,
    batch_id uuid NOT NULL
);


--
-- Name: tests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tests (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title text NOT NULL,
    scheduled_at timestamp with time zone,
    duration_mins integer,
    total_marks integer,
    format public.test_format DEFAULT 'Custom'::public.test_format,
    instructions text,
    status public.test_status DEFAULT 'upcoming'::public.test_status,
    created_by uuid,
    duration_minutes integer,
    schedule_time text
);


--
-- Name: token_blacklist; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.token_blacklist (
    jti text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    login_id text,
    role text NOT NULL,
    password_hash text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    avatar_url text,
    is_active boolean DEFAULT true,
    CONSTRAINT non_student_must_have_login_id CHECK (((role = 'student'::text) OR (login_id IS NOT NULL))),
    CONSTRAINT users_role_check CHECK ((role = ANY (ARRAY['student'::text, 'faculty'::text, 'admin'::text])))
);


--
-- Name: _migrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._migrations ALTER COLUMN id SET DEFAULT nextval('public._migrations_id_seq'::regclass);


--
-- Name: _migrations _migrations_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._migrations
    ADD CONSTRAINT _migrations_name_key UNIQUE (name);


--
-- Name: _migrations _migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._migrations
    ADD CONSTRAINT _migrations_pkey PRIMARY KEY (id);


--
-- Name: batch_subjects batch_subjects_batch_id_subject_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.batch_subjects
    ADD CONSTRAINT batch_subjects_batch_id_subject_id_key UNIQUE (batch_id, subject_id);


--
-- Name: batch_subjects batch_subjects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.batch_subjects
    ADD CONSTRAINT batch_subjects_pkey PRIMARY KEY (id);


--
-- Name: batches batches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.batches
    ADD CONSTRAINT batches_pkey PRIMARY KEY (id);


--
-- Name: batches batches_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.batches
    ADD CONSTRAINT batches_slug_key UNIQUE (slug);


--
-- Name: chapters chapters_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chapters
    ADD CONSTRAINT chapters_pkey PRIMARY KEY (id);


--
-- Name: dpp_attempts dpp_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dpp_attempts
    ADD CONSTRAINT dpp_attempts_pkey PRIMARY KEY (id);


--
-- Name: dpp_sessions dpp_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dpp_sessions
    ADD CONSTRAINT dpp_sessions_pkey PRIMARY KEY (id);


--
-- Name: dpp_target_batches dpp_target_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dpp_target_batches
    ADD CONSTRAINT dpp_target_batches_pkey PRIMARY KEY (dpp_id, batch_id);


--
-- Name: dpps dpps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dpps
    ADD CONSTRAINT dpps_pkey PRIMARY KEY (id);


--
-- Name: faculties faculties_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faculties
    ADD CONSTRAINT faculties_pkey PRIMARY KEY (user_id);


--
-- Name: faculty_assignments faculty_assignments_faculty_id_batch_subject_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faculty_assignments
    ADD CONSTRAINT faculty_assignments_faculty_id_batch_subject_id_key UNIQUE (faculty_id, batch_subject_id);


--
-- Name: faculty_assignments faculty_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faculty_assignments
    ADD CONSTRAINT faculty_assignments_pkey PRIMARY KEY (id);


--
-- Name: faculty_review_sessions faculty_review_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faculty_review_sessions
    ADD CONSTRAINT faculty_review_sessions_pkey PRIMARY KEY (id);


--
-- Name: faculty_reviews faculty_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faculty_reviews
    ADD CONSTRAINT faculty_reviews_pkey PRIMARY KEY (id);


--
-- Name: faculty_reviews faculty_reviews_student_id_faculty_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faculty_reviews
    ADD CONSTRAINT faculty_reviews_student_id_faculty_id_key UNIQUE (student_id, faculty_id);


--
-- Name: landing_achievers landing_achievers_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.landing_achievers
    ADD CONSTRAINT landing_achievers_name_key UNIQUE (name);


--
-- Name: landing_achievers landing_achievers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.landing_achievers
    ADD CONSTRAINT landing_achievers_pkey PRIMARY KEY (id);


--
-- Name: landing_courses landing_courses_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.landing_courses
    ADD CONSTRAINT landing_courses_name_key UNIQUE (name);


--
-- Name: landing_courses landing_courses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.landing_courses
    ADD CONSTRAINT landing_courses_pkey PRIMARY KEY (id);


--
-- Name: landing_faculty landing_faculty_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.landing_faculty
    ADD CONSTRAINT landing_faculty_name_key UNIQUE (name);


--
-- Name: landing_faculty landing_faculty_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.landing_faculty
    ADD CONSTRAINT landing_faculty_pkey PRIMARY KEY (id);


--
-- Name: landing_page_data landing_page_data_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.landing_page_data
    ADD CONSTRAINT landing_page_data_pkey PRIMARY KEY (id);


--
-- Name: landing_page_data landing_page_data_section_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.landing_page_data
    ADD CONSTRAINT landing_page_data_section_key_key UNIQUE (section_key);


--
-- Name: landing_visions landing_visions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.landing_visions
    ADD CONSTRAINT landing_visions_pkey PRIMARY KEY (id);


--
-- Name: notes notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_pkey PRIMARY KEY (id);


--
-- Name: notification_batches notification_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_batches
    ADD CONSTRAINT notification_batches_pkey PRIMARY KEY (notification_id, batch_id);


--
-- Name: notification_deliveries notification_deliveries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_deliveries
    ADD CONSTRAINT notification_deliveries_pkey PRIMARY KEY (notification_id, student_id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: prospect_queries prospect_queries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prospect_queries
    ADD CONSTRAINT prospect_queries_pkey PRIMARY KEY (id);


--
-- Name: question_bank_batch_links question_bank_batch_links_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.question_bank_batch_links
    ADD CONSTRAINT question_bank_batch_links_pkey PRIMARY KEY (id);


--
-- Name: question_bank_batch_links question_bank_batch_links_question_bank_file_id_batch_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.question_bank_batch_links
    ADD CONSTRAINT question_bank_batch_links_question_bank_file_id_batch_id_key UNIQUE (question_bank_file_id, batch_id);


--
-- Name: question_bank_files question_bank_files_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.question_bank_files
    ADD CONSTRAINT question_bank_files_pkey PRIMARY KEY (id);


--
-- Name: questions questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_pkey PRIMARY KEY (id);


--
-- Name: student_ratings ratings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_ratings
    ADD CONSTRAINT ratings_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_hash_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_hash_key UNIQUE (token_hash);


--
-- Name: student_ratings student_ratings_student_id_batch_subject_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_ratings
    ADD CONSTRAINT student_ratings_student_id_batch_subject_id_key UNIQUE (student_id, batch_subject_id);


--
-- Name: students students_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_pkey PRIMARY KEY (user_id);


--
-- Name: students students_roll_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_roll_number_key UNIQUE (roll_number);


--
-- Name: subjects subjects_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_name_key UNIQUE (name);


--
-- Name: subjects subjects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_pkey PRIMARY KEY (id);


--
-- Name: test_attempts test_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_attempts
    ADD CONSTRAINT test_attempts_pkey PRIMARY KEY (id);


--
-- Name: test_target_batches test_target_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_target_batches
    ADD CONSTRAINT test_target_batches_pkey PRIMARY KEY (test_id, batch_id);


--
-- Name: tests tests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tests
    ADD CONSTRAINT tests_pkey PRIMARY KEY (id);


--
-- Name: token_blacklist token_blacklist_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.token_blacklist
    ADD CONSTRAINT token_blacklist_pkey PRIMARY KEY (jti);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (login_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_dpp_attempts_dpp_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dpp_attempts_dpp_id ON public.dpp_attempts USING btree (dpp_id);


--
-- Name: idx_dpp_attempts_student_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dpp_attempts_student_id ON public.dpp_attempts USING btree (student_id);


--
-- Name: idx_faculty_reviews_faculty; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_faculty_reviews_faculty ON public.faculty_reviews USING btree (faculty_id);


--
-- Name: idx_faculty_reviews_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_faculty_reviews_student ON public.faculty_reviews USING btree (student_id);


--
-- Name: idx_nb_batch; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_nb_batch ON public.notification_batches USING btree (batch_id);


--
-- Name: idx_nd_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_nd_student ON public.notification_deliveries USING btree (student_id, is_deleted);


--
-- Name: idx_questions_dpp_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_questions_dpp_id ON public.questions USING btree (dpp_id);


--
-- Name: idx_refresh_tokens_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_refresh_tokens_expires_at ON public.refresh_tokens USING btree (expires_at);


--
-- Name: idx_refresh_tokens_family_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_refresh_tokens_family_id ON public.refresh_tokens USING btree (family_id);


--
-- Name: idx_refresh_tokens_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_refresh_tokens_user_id ON public.refresh_tokens USING btree (user_id);


--
-- Name: idx_test_attempts_student_submitted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_test_attempts_student_submitted ON public.test_attempts USING btree (student_id, submitted_at DESC);


--
-- Name: idx_test_attempts_test_submitted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_test_attempts_test_submitted ON public.test_attempts USING btree (test_id, submitted_at DESC);


--
-- Name: idx_token_blacklist_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_token_blacklist_expires_at ON public.token_blacklist USING btree (expires_at);


--
-- Name: uq_dpp_attempt_student_attempt_no; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_dpp_attempt_student_attempt_no ON public.dpp_attempts USING btree (dpp_id, student_id, attempt_no);


--
-- Name: uq_dpp_session_student_dpp; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_dpp_session_student_dpp ON public.dpp_sessions USING btree (dpp_id, student_id);


--
-- Name: uq_test_attempt_one_active; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_test_attempt_one_active ON public.test_attempts USING btree (test_id, student_id) WHERE (submitted_at IS NULL);


--
-- Name: uq_test_attempt_student_attempt_no; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_test_attempt_student_attempt_no ON public.test_attempts USING btree (test_id, student_id, attempt_no);


--
-- Name: batch_subjects batch_subjects_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.batch_subjects
    ADD CONSTRAINT batch_subjects_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.batches(id) ON DELETE CASCADE;


--
-- Name: batch_subjects batch_subjects_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.batch_subjects
    ADD CONSTRAINT batch_subjects_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;


--
-- Name: chapters chapters_batch_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chapters
    ADD CONSTRAINT chapters_batch_subject_id_fkey FOREIGN KEY (batch_subject_id) REFERENCES public.batch_subjects(id);


--
-- Name: dpp_attempts dpp_attempts_dpp_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dpp_attempts
    ADD CONSTRAINT dpp_attempts_dpp_id_fkey FOREIGN KEY (dpp_id) REFERENCES public.dpps(id) ON DELETE CASCADE;


--
-- Name: dpp_attempts dpp_attempts_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dpp_attempts
    ADD CONSTRAINT dpp_attempts_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(user_id) ON DELETE CASCADE;


--
-- Name: dpp_sessions dpp_sessions_dpp_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dpp_sessions
    ADD CONSTRAINT dpp_sessions_dpp_id_fkey FOREIGN KEY (dpp_id) REFERENCES public.dpps(id) ON DELETE CASCADE;


--
-- Name: dpp_sessions dpp_sessions_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dpp_sessions
    ADD CONSTRAINT dpp_sessions_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: dpp_target_batches dpp_target_batches_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dpp_target_batches
    ADD CONSTRAINT dpp_target_batches_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.batches(id) ON DELETE CASCADE;


--
-- Name: dpp_target_batches dpp_target_batches_dpp_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dpp_target_batches
    ADD CONSTRAINT dpp_target_batches_dpp_id_fkey FOREIGN KEY (dpp_id) REFERENCES public.dpps(id) ON DELETE CASCADE;


--
-- Name: dpps dpps_chapter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dpps
    ADD CONSTRAINT dpps_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.chapters(id) ON DELETE CASCADE;


--
-- Name: dpps dpps_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dpps
    ADD CONSTRAINT dpps_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: faculties faculties_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faculties
    ADD CONSTRAINT faculties_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id);


--
-- Name: faculties faculties_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faculties
    ADD CONSTRAINT faculties_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: faculty_assignments faculty_assignments_batch_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faculty_assignments
    ADD CONSTRAINT faculty_assignments_batch_subject_id_fkey FOREIGN KEY (batch_subject_id) REFERENCES public.batch_subjects(id) ON DELETE CASCADE;


--
-- Name: faculty_assignments faculty_assignments_faculty_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faculty_assignments
    ADD CONSTRAINT faculty_assignments_faculty_id_fkey FOREIGN KEY (faculty_id) REFERENCES public.faculties(user_id) ON DELETE CASCADE;


--
-- Name: faculty_review_sessions faculty_review_sessions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faculty_review_sessions
    ADD CONSTRAINT faculty_review_sessions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: faculty_reviews faculty_reviews_faculty_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faculty_reviews
    ADD CONSTRAINT faculty_reviews_faculty_id_fkey FOREIGN KEY (faculty_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: faculty_reviews faculty_reviews_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faculty_reviews
    ADD CONSTRAINT faculty_reviews_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.faculty_review_sessions(id) ON DELETE CASCADE;


--
-- Name: faculty_reviews faculty_reviews_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faculty_reviews
    ADD CONSTRAINT faculty_reviews_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notes notes_chapter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.chapters(id) ON DELETE CASCADE;


--
-- Name: notification_batches notification_batches_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_batches
    ADD CONSTRAINT notification_batches_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.batches(id) ON DELETE CASCADE;


--
-- Name: notification_batches notification_batches_notification_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_batches
    ADD CONSTRAINT notification_batches_notification_id_fkey FOREIGN KEY (notification_id) REFERENCES public.notifications(id) ON DELETE CASCADE;


--
-- Name: notification_deliveries notification_deliveries_notification_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_deliveries
    ADD CONSTRAINT notification_deliveries_notification_id_fkey FOREIGN KEY (notification_id) REFERENCES public.notifications(id) ON DELETE CASCADE;


--
-- Name: notification_deliveries notification_deliveries_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_deliveries
    ADD CONSTRAINT notification_deliveries_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: prospect_queries prospect_queries_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prospect_queries
    ADD CONSTRAINT prospect_queries_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.landing_courses(id) ON DELETE SET NULL;


--
-- Name: question_bank_batch_links question_bank_batch_links_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.question_bank_batch_links
    ADD CONSTRAINT question_bank_batch_links_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.batches(id) ON DELETE CASCADE;


--
-- Name: question_bank_batch_links question_bank_batch_links_question_bank_file_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.question_bank_batch_links
    ADD CONSTRAINT question_bank_batch_links_question_bank_file_id_fkey FOREIGN KEY (question_bank_file_id) REFERENCES public.question_bank_files(id) ON DELETE CASCADE;


--
-- Name: question_bank_files question_bank_files_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.question_bank_files
    ADD CONSTRAINT question_bank_files_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: questions questions_dpp_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_dpp_id_fkey FOREIGN KEY (dpp_id) REFERENCES public.dpps(id) ON DELETE CASCADE;


--
-- Name: questions questions_test_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_test_id_fkey FOREIGN KEY (test_id) REFERENCES public.tests(id) ON DELETE CASCADE;


--
-- Name: student_ratings ratings_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_ratings
    ADD CONSTRAINT ratings_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(user_id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: student_ratings student_ratings_batch_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_ratings
    ADD CONSTRAINT student_ratings_batch_subject_id_fkey FOREIGN KEY (batch_subject_id) REFERENCES public.batch_subjects(id);


--
-- Name: students students_assigned_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_assigned_batch_id_fkey FOREIGN KEY (assigned_batch_id) REFERENCES public.batches(id) ON DELETE SET NULL;


--
-- Name: students students_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: test_attempts test_attempts_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_attempts
    ADD CONSTRAINT test_attempts_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(user_id) ON DELETE CASCADE;


--
-- Name: test_attempts test_attempts_test_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_attempts
    ADD CONSTRAINT test_attempts_test_id_fkey FOREIGN KEY (test_id) REFERENCES public.tests(id) ON DELETE CASCADE;


--
-- Name: test_target_batches test_target_batches_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_target_batches
    ADD CONSTRAINT test_target_batches_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.batches(id) ON DELETE CASCADE;


--
-- Name: test_target_batches test_target_batches_test_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_target_batches
    ADD CONSTRAINT test_target_batches_test_id_fkey FOREIGN KEY (test_id) REFERENCES public.tests(id) ON DELETE CASCADE;


--
-- Name: tests tests_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tests
    ADD CONSTRAINT tests_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
