-- Run this SQL in your Supabase Dashboard > SQL Editor

-- 1. Profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  nickname text,
  avatar_url text,
  created_at timestamptz default now(),
  streak_days int default 0,
  last_check_in date,
  total_mastered int default 0,
  is_public boolean default true
);

alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, nickname, avatar_url)
  values (new.id, coalesce(new.raw_user_meta_data->>'nickname', split_part(new.email, '@', 1)), null);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Word progress table
create table if not exists public.word_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles on delete cascade not null,
  word_id text not null,
  mastered boolean default false,
  wrong_count int default 0,
  correct_count int default 0,
  last_practiced timestamptz,
  next_review timestamptz,
  unique(user_id, word_id)
);

alter table public.word_progress enable row level security;
create policy "Users can view own progress" on public.word_progress for select using (auth.uid() = user_id);
create policy "Users can insert own progress" on public.word_progress for insert with check (auth.uid() = user_id);
create policy "Users can update own progress" on public.word_progress for update using (auth.uid() = user_id);

-- 3. Daily stats table
create table if not exists public.daily_stats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles on delete cascade not null,
  date date not null,
  new_words int default 0,
  reviewed_words int default 0,
  correct_count int default 0,
  total_count int default 0,
  unique(user_id, date)
);

alter table public.daily_stats enable row level security;
create policy "Users can view own stats" on public.daily_stats for select using (auth.uid() = user_id);
create policy "Users can insert own stats" on public.daily_stats for insert with check (auth.uid() = user_id);
create policy "Users can update own stats" on public.daily_stats for update using (auth.uid() = user_id);

-- 4. Friendships table
create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles on delete cascade not null,
  friend_id uuid references public.profiles on delete cascade not null,
  status text default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz default now(),
  unique(user_id, friend_id)
);

alter table public.friendships enable row level security;
create policy "Users can view own friendships" on public.friendships for select using (auth.uid() = user_id or auth.uid() = friend_id);
create policy "Users can insert friendships" on public.friendships for insert with check (auth.uid() = user_id);
create policy "Users can update friendships they received" on public.friendships for update using (auth.uid() = friend_id);
create policy "Users can delete own friendships" on public.friendships for delete using (auth.uid() = user_id or auth.uid() = friend_id);

-- 5. Check-ins table
create table if not exists public.check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles on delete cascade not null,
  date date not null,
  words_learned int default 0,
  accuracy int default 0,
  message text,
  created_at timestamptz default now(),
  unique(user_id, date)
);

alter table public.check_ins enable row level security;
create policy "Check-ins viewable by everyone" on public.check_ins for select using (true);
create policy "Users can insert own check-ins" on public.check_ins for insert with check (auth.uid() = user_id);

-- 6. Storage bucket for avatars
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Avatar images are publicly accessible" on storage.objects for select using (bucket_id = 'avatars');
create policy "Users can upload own avatar" on storage.objects for insert with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users can update own avatar" on storage.objects for update using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- 7. Leaderboard view
create or replace view public.leaderboard as
select
  p.id,
  p.nickname,
  p.avatar_url,
  p.total_mastered,
  p.streak_days,
  coalesce(ws.week_total, 0) as week_total
from public.profiles p
left join (
  select user_id, sum(total_count) as week_total
  from public.daily_stats
  where date >= current_date - interval '7 days'
  group by user_id
) ws on ws.user_id = p.id
where p.is_public = true;
