-- Add active_title and achievement_points to characters table
ALTER TABLE public.characters
ADD COLUMN IF NOT EXISTS active_title VARCHAR(255),
ADD COLUMN IF NOT EXISTS achievement_points INT DEFAULT 0 NOT NULL;
