-- SC SMART POLL AI - Supabase Database Schema
-- Developed By SC TECH © 2026

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Users Table (for Authentication references if needed)
-- Note: Supabase manages Auth via auth.users internally, but we can have a profile/users table.
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('Staff', 'Student')),
    student_roll_number TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Students Table
CREATE TABLE IF NOT EXISTS public.students (
    roll_number TEXT PRIMARY KEY,
    register_number TEXT UNIQUE NOT NULL,
    student_name TEXT NOT NULL,
    department TEXT NOT NULL,
    year TEXT NOT NULL,
    section TEXT NOT NULL,
    phone_number TEXT,
    email TEXT,
    student_status TEXT NOT NULL DEFAULT 'Active' CHECK (student_status IN ('Active', 'Inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create Polls Table
CREATE TABLE IF NOT EXISTS public.polls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    question TEXT NOT NULL,
    options TEXT[] NOT NULL,
    deadline TEXT NOT NULL,
    target_department TEXT NOT NULL DEFAULT 'All',
    target_year TEXT NOT NULL DEFAULT 'All',
    target_section TEXT NOT NULL DEFAULT 'All',
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Closed')),
    type TEXT NOT NULL DEFAULT 'Single' CHECK (type IN ('Single', 'Multiple')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create Poll Responses Table
CREATE TABLE IF NOT EXISTS public.poll_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE,
    student_roll_number TEXT REFERENCES public.students(roll_number) ON DELETE CASCADE,
    selected_options TEXT[] NOT NULL,
    responded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (poll_id, student_roll_number)
);

-- 6. Create Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE,
    recipient_email TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Sent',
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed Initial Admin User
-- In Supabase, the user would sign up or you can insert standard logins
INSERT INTO public.users (username, role, student_roll_number)
VALUES ('staff', 'Staff', NULL)
ON CONFLICT (username) DO NOTHING;

-- Seed Sample Students for Demonstration
INSERT INTO public.students (roll_number, register_number, student_name, department, year, section, phone_number, email, student_status)
VALUES 
('22AD01', '717822AD001', 'Arjun Kumar', 'AI&DS', 'III', 'A', '+919876543210', 'arjun@sctech.edu', 'Active'),
('22AD02', '717822AD002', 'Kavin Raj', 'AI&DS', 'III', 'A', '+919876543211', 'kavin@sctech.edu', 'Active'),
('22AD03', '717822AD003', 'Hari Prasath', 'AI&DS', 'III', 'A', '+919876543212', 'hari@sctech.edu', 'Active'),
('22AD04', '717822AD004', 'Surya Prakash', 'AI&DS', 'III', 'A', '+919876543213', 'surya@sctech.edu', 'Active'),
('22AD05', '717822AD005', 'Naveen Chandran', 'AI&DS', 'III', 'A', '+919876543214', 'naveen@sctech.edu', 'Active'),
('22AD06', '717822AD006', 'Sruthi Rao', 'AI&DS', 'III', 'A', '+919876543215', 'sruthi@sctech.edu', 'Active'),
('22AD07', '717822AD007', 'Aakash Vignesh', 'AI&DS', 'III', 'A', '+919876543216', 'aakash@sctech.edu', 'Active'),
('22AD08', '717822AD008', 'Divya Mohan', 'AI&DS', 'III', 'A', '+919876543217', 'divya@sctech.edu', 'Active')
ON CONFLICT (roll_number) DO NOTHING;
