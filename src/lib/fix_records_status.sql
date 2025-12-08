-- Set default value for status column
alter table public.records alter column status set default 'Available';

notify pgrst, 'reload schema';
