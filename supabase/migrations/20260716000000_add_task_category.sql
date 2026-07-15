-- Adds a real category to tasks so the dashboard's Operations Checklist can
-- group by Documentation/Commercial/Marine/Crew/Authorities instead of
-- guessing from title text. Nullable and additive: existing rows (and any
-- creation path that doesn't set it) simply have no category and are shown
-- under "Uncategorized" client-side rather than a guessed bucket.
alter table public.tasks add column category text;
