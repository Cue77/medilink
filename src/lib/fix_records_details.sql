-- Make details column nullable to prevent upload errors
alter table public.records alter column details drop not null;

-- Also ensure other potential columns are nullable or have defaults
alter table public.records alter column diagnosis drop not null;
alter table public.records alter column doctor set default 'Unknown';

notify pgrst, 'reload schema';
