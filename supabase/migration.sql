-- =========================================================================
-- RUN THIS ENTIRE SCRIPT IN YOUR SUPABASE SQL EDITOR
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 0. HAPUS TABEL JIKA SUDAH ADA (Untuk menghindari error 'relation already exists')
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.memories CASCADE;
DROP TABLE IF EXISTS public.sticky_notes CASCADE;
DROP TABLE IF EXISTS public.activity_logs CASCADE;
DROP TABLE IF EXISTS public.missions CASCADE;

-- 1. TABEL PROFIL USER (Menyimpan status & mood pasangan)
CREATE TABLE public.profiles (
  id text NOT NULL, -- 'user_a' atau 'user_b'
  name text NOT NULL,
  avatar_url text,
  status text DEFAULT 'Online'::text,
  mood text DEFAULT 'happy'::text,
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  auth_id uuid,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_auth_id_fkey FOREIGN KEY (auth_id) REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT profiles_auth_id_unique UNIQUE (auth_id)
);

-- Masukkan data awal profil (Han-byul & Min-seok)
INSERT INTO public.profiles (id, name, avatar_url, status, mood, updated_at, auth_id)
VALUES 
  ('user_a', 'Han-byul', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80', 'Active', 'happy', now(), NULL),
  ('user_b', 'Min-seok', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80', 'Away', 'cozy', now(), NULL)
ON CONFLICT (id) DO NOTHING;


-- 2. TABEL MEMORIES (Menyimpan hasil jepretan photostrip photobox)
CREATE TABLE public.memories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  image_url text NOT NULL, -- URL gambar dari Supabase Storage
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT memories_pkey PRIMARY KEY (id)
);


-- 3. TABEL STICKY NOTES (Papan catatan cinta bersama)
CREATE TABLE public.sticky_notes (
  id text NOT NULL, -- format 'note-timestamp'
  text text NOT NULL,
  sender_id text NOT NULL, -- 'user_a' atau 'user_b'
  color text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT sticky_notes_pkey PRIMARY KEY (id)
);


-- 4. TABEL BUBBLE ACTIVITIES (Log aktivitas terbaru)
CREATE TABLE public.activity_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text NOT NULL, -- 'user_a' atau 'user_b'
  text text NOT NULL,
  timestamp timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT activity_logs_pkey PRIMARY KEY (id)
);


-- 5. TABEL DAILY MISSIONS (Untuk sinkronisasi misi harian)
CREATE TABLE public.missions (
  id text NOT NULL, -- 'mission-1', 'mission-2', dll.
  text text NOT NULL,
  xp_reward integer NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  type text NOT NULL DEFAULT 'daily'::text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT missions_pkey PRIMARY KEY (id)
);

-- Masukkan data awal misi harian
INSERT INTO public.missions (id, text, xp_reward, completed, type)
VALUES 
  ('mission-1', 'Water the digital plant together', 15, false, 'daily'),
  ('mission-2', 'Share your current mood status', 10, false, 'daily'),
  ('mission-3', 'Listen to the same Spotify track', 20, false, 'daily'),
  ('mission-4', 'Take a virtual LDR photobox strip', 25, false, 'daily')
ON CONFLICT (id) DO NOTHING;


-- =========================================================================
-- 6. SETUP REALTIME UNTUK TABEL-TABEL
-- =========================================================================
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE 
  public.profiles, 
  public.sticky_notes, 
  public.memories, 
  public.activity_logs, 
  public.missions;


-- =========================================================================
-- 7. KEAMANAN ROW LEVEL SECURITY (RLS) & POLICIES
-- =========================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sticky_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Allow select for all users" ON public.profiles;
CREATE POLICY "Allow select for all users" ON public.profiles
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow insert/upsert for authenticated users" ON public.profiles;
CREATE POLICY "Allow insert/upsert for authenticated users" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update for authenticated users" ON public.profiles;
CREATE POLICY "Allow update for authenticated users" ON public.profiles
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Memories Policies
DROP POLICY IF EXISTS "Allow select for authenticated users" ON public.memories;
CREATE POLICY "Allow select for authenticated users" ON public.memories
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.memories;
CREATE POLICY "Allow insert for authenticated users" ON public.memories
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow delete for authenticated users" ON public.memories;
CREATE POLICY "Allow delete for authenticated users" ON public.memories
  FOR DELETE TO authenticated USING (true);

-- Sticky Notes Policies
DROP POLICY IF EXISTS "Allow select for authenticated users" ON public.sticky_notes;
CREATE POLICY "Allow select for authenticated users" ON public.sticky_notes
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.sticky_notes;
CREATE POLICY "Allow insert for authenticated users" ON public.sticky_notes
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update for authenticated users" ON public.sticky_notes;
CREATE POLICY "Allow update for authenticated users" ON public.sticky_notes
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow delete for authenticated users" ON public.sticky_notes;
CREATE POLICY "Allow delete for authenticated users" ON public.sticky_notes
  FOR DELETE TO authenticated USING (true);

-- Activity Logs Policies
DROP POLICY IF EXISTS "Allow select for authenticated users" ON public.activity_logs;
CREATE POLICY "Allow select for authenticated users" ON public.activity_logs
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.activity_logs;
CREATE POLICY "Allow insert for authenticated users" ON public.activity_logs
  FOR INSERT TO authenticated WITH CHECK (true);

-- Missions Policies
DROP POLICY IF EXISTS "Allow select for authenticated users" ON public.missions;
CREATE POLICY "Allow select for authenticated users" ON public.missions
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow update for authenticated users" ON public.missions;
CREATE POLICY "Allow update for authenticated users" ON public.missions
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


-- =========================================================================
-- 8. STORAGE BUCKET & POLICIES UNTUK FOTO ('keepsakes')
-- =========================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('keepsakes', 'keepsakes', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Allow public access to keepsakes bucket" ON storage.objects;
CREATE POLICY "Allow public access to keepsakes bucket" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'keepsakes');

DROP POLICY IF EXISTS "Allow authenticated uploads to keepsakes bucket" ON storage.objects;
CREATE POLICY "Allow authenticated uploads to keepsakes bucket" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'keepsakes');

DROP POLICY IF EXISTS "Allow authenticated updates to keepsakes bucket" ON storage.objects;
CREATE POLICY "Allow authenticated updates to keepsakes bucket" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'keepsakes') WITH CHECK (bucket_id = 'keepsakes');

DROP POLICY IF EXISTS "Allow authenticated deletions from keepsakes bucket" ON storage.objects;
CREATE POLICY "Allow authenticated deletions from keepsakes bucket" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'keepsakes');
