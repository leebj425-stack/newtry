create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  student_id text not null,
  grade text not null,
  subject text not null,
  draft_text text not null,
  created_at timestamptz not null default now()
);

create index if not exists generations_student_created_idx
  on public.generations (student_id, created_at desc);

alter table public.generations enable row level security;

-- This prototype has no sign-in screen, so the publishable key can save and list drafts.
-- Replace with an auth-scoped policy before opening the app to multiple users.
drop policy if exists "prototype users can manage generations" on public.generations;
create policy "prototype users can manage generations"
  on public.generations for all to anon, authenticated using (true) with check (true);
