-- Add originals_signed and checklist_overrides columns to applications
alter table applications add column if not exists originals_signed boolean default false;
alter table applications add column if not exists checklist_overrides text;
