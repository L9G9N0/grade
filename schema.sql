-- ==========================================================================
-- SEMESTER 5 — ACADEMIC OS — DATABASE SCHEMA (SUPABASE / POSTGRESQL)
-- ==========================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES TABLE
-- References auth.users (cascade delete when user is deleted)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  updated_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. SETTINGS TABLE
-- Tracks target GPA, target marks, and UI theme
create table public.settings (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  target_semester_gpa numeric,
  target_semester_marks numeric,
  theme text default 'light' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. COURSES TABLE
-- Tracks course metadata, syllabus progress, grade outputs, and notes
create table public.courses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  code text not null,
  name text not null,
  short_name text not null,
  credits integer not null,
  instructor text,
  target_grade text default '—' not null,
  current_grade text default '—' not null,
  target_marks numeric,
  syllabus_progress integer default 0 check (syllabus_progress >= 0 and syllabus_progress <= 100) not null,
  status text default 'Not Started' not null,
  risk text default 'Green' not null,
  weak_areas text,
  strong_areas text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Prevent duplicate course codes per user
  unique(user_id, code)
);

-- 4. ASSESSMENTS TABLE
-- Tracks deadlines, assessment attributes, and status
create table public.assessments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  course_id uuid references public.courses(id) on delete cascade not null,
  name text not null,
  type text not null, -- Assignment, Quiz, Tutorial, In-Class Exercise, Midsem, Endsem, Project, Other
  date date not null,
  max_marks numeric,
  weightage numeric default 0 not null check (weightage >= 0 and weightage <= 100),
  status text default 'Upcoming' not null, -- Upcoming, Completed, Pending, Not Applicable
  priority text default 'Medium' not null, -- High, Medium, Low
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. MARKS TABLE
-- Stores grades sheets, related 1-to-1 to assessments
create table public.marks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  assessment_id uuid references public.assessments(id) on delete cascade unique not null,
  marks_obtained numeric not null check (marks_obtained >= 0),
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================================================

alter table public.profiles enable row level security;
alter table public.settings enable row level security;
alter table public.courses enable row level security;
alter table public.assessments enable row level security;
alter table public.marks enable row level security;

-- Profiles Policies
create policy "Users can select their own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- Settings Policies
create policy "Users can select their own settings"
  on public.settings for select using (auth.uid() = user_id);

create policy "Users can insert their own settings"
  on public.settings for insert with check (auth.uid() = user_id);

create policy "Users can update their own settings"
  on public.settings for update using (auth.uid() = user_id);

-- Courses Policies
create policy "Users can select their own courses"
  on public.courses for select using (auth.uid() = user_id);

create policy "Users can insert their own courses"
  on public.courses for insert with check (auth.uid() = user_id);

create policy "Users can update their own courses"
  on public.courses for update using (auth.uid() = user_id);

create policy "Users can delete their own courses"
  on public.courses for delete using (auth.uid() = user_id);

-- Assessments Policies
create policy "Users can select their own assessments"
  on public.assessments for select using (auth.uid() = user_id);

create policy "Users can insert their own assessments"
  on public.assessments for insert with check (auth.uid() = user_id);

create policy "Users can update their own assessments"
  on public.assessments for update using (auth.uid() = user_id);

create policy "Users can delete their own assessments"
  on public.assessments for delete using (auth.uid() = user_id);

-- Marks Policies
create policy "Users can select their own marks"
  on public.marks for select using (auth.uid() = user_id);

create policy "Users can insert their own marks"
  on public.marks for insert with check (auth.uid() = user_id);

create policy "Users can update their own marks"
  on public.marks for update using (auth.uid() = user_id);

create policy "Users can delete their own marks"
  on public.marks for delete using (auth.uid() = user_id);

-- ==========================================================================
-- TRIGGERS & PROCEDURES FOR AUTOMATED REGISTRATION
-- ==========================================================================

-- Automatically create profile, settings, and populate 7 default courses upon user sign-up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- 1. Create public profile
  insert into public.profiles (id)
  values (new.id);
  
  -- 2. Create default settings
  insert into public.settings (user_id)
  values (new.id);
  
  -- 3. Populate 7 exact default courses for Semester 5
  insert into public.courses (user_id, code, name, short_name, credits, status, risk)
  values 
    (new.id, 'BIP398', 'Independent Project', 'BIP398', 4, 'Not Started', 'Green'),
    (new.id, 'COM301A', 'Technical Communication', 'COM301A', 2, 'Not Started', 'Green'),
    (new.id, 'CSE232', 'Computer Networks', 'CSE232', 4, 'Not Started', 'Green'),
    (new.id, 'CSE343', 'Machine Learning', 'CSE343', 4, 'Not Started', 'Green'),
    (new.id, 'CSE656', 'Information Integration and Applications', 'IIA', 4, 'Not Started', 'Green'),
    (new.id, 'CSE999A', 'Distance Course in CSE', 'CSE999A', 4, 'Not Started', 'Green'),
    (new.id, 'ESC205A', 'Environmental Sciences', 'ESC205A', 2, 'Not Started', 'Green');
    
  return new;
end;
$$ language plpgsql security definer;

-- Attach trigger to auth.users
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
