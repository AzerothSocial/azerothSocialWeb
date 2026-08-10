-- Create user_public_mounts table for storing mounts configured to be public on profile
CREATE TABLE IF NOT EXISTS public.user_public_mounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    mount_id INT NOT NULL,
    mount_name TEXT NOT NULL,
    mount_image TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_user_public_mount UNIQUE(profile_id, mount_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_public_mounts ENABLE ROW LEVEL SECURITY;

-- Allow public read access to public mounts
CREATE POLICY "Montarias públicas visíveis a todos" 
    ON public.user_public_mounts FOR SELECT 
    USING (true);

-- Allow authenticated users to manage their own public mounts
CREATE POLICY "Usuário gerencia suas próprias montarias públicas" 
    ON public.user_public_mounts FOR ALL 
    USING (auth.uid() = profile_id);
