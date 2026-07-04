-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.profiles (
  id text NOT NULL,
  name text NOT NULL,
  avatar_url text,
  status text DEFAULT 'Online'::text,
  mood text DEFAULT 'happy'::text,
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  auth_id uuid,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_auth_id_fkey FOREIGN KEY (auth_id) REFERENCES auth.users(id)
);
CREATE TABLE public.memories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  image_url text NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT memories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.sticky_notes (
  id text NOT NULL,
  text text NOT NULL,
  sender_id text NOT NULL,
  color text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT sticky_notes_pkey PRIMARY KEY (id)
);
CREATE TABLE public.activity_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  text text NOT NULL,
  timestamp timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT activity_logs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.missions (
  id text NOT NULL,
  text text NOT NULL,
  xp_reward integer NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  type text NOT NULL DEFAULT 'daily'::text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT missions_pkey PRIMARY KEY (id)
);