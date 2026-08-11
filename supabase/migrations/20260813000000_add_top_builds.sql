-- Create top_builds table to cache leaderboard talents
CREATE TABLE IF NOT EXISTS public.top_builds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mode VARCHAR(50) NOT NULL, -- e.g., 'solo-shuffle', 'mythic-plus'
    class_name VARCHAR(50) NOT NULL,
    spec_name VARCHAR(50) NOT NULL,
    rank INT NOT NULL,
    character_name VARCHAR(50) NOT NULL,
    realm VARCHAR(50) NOT NULL,
    region VARCHAR(10) DEFAULT 'US' NOT NULL,
    rating INT, -- Rating, M+ score, or DPS parse
    talents_json JSONB, -- The saved talents array
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(mode, class_name, spec_name, rank)
);

ALTER TABLE public.top_builds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Top Builds publicamente visiveis"
    ON public.top_builds FOR SELECT
    USING (true);

-- We allow authenticated service role (e.g., cron jobs running with admin key) or explicit upserts
-- In a real production scenario, we restrict this strictly. For MVP, we'll allow all authenticated users if needed, 
-- but since this is populated by our own server actions, RLS can bypass if we use supabase-admin, or we can allow insert/update:
CREATE POLICY "Permitir upsert do servidor"
    ON public.top_builds FOR ALL
    USING (true)
    WITH CHECK (true);
