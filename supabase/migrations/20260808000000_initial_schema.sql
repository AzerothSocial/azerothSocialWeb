-- Azeroth Social - Initial Migration (Schema & Security Policies)
-- Description: Core tables with strict Row Level Security (RLS) enabled.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES (Identidade do Jogador)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(30) UNIQUE NOT NULL,
    display_name VARCHAR(50) NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    main_character_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Ativar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Politicas RLS para Profiles
CREATE POLICY "Profiles publicamente visíveis" 
    ON public.profiles FOR SELECT 
    USING (true);

CREATE POLICY "Usuário pode criar/inserir seu próprio perfil" 
    ON public.profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Usuário pode atualizar seu próprio perfil" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);


-- 2. CHARACTERS (Personagens vinculados)
CREATE TABLE IF NOT EXISTS public.characters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    region VARCHAR(10) DEFAULT 'US' NOT NULL,
    realm VARCHAR(50) NOT NULL,
    name VARCHAR(50) NOT NULL,
    class_name VARCHAR(30) NOT NULL,
    race_name VARCHAR(30) NOT NULL,
    level INT DEFAULT 1 NOT NULL,
    guild_name VARCHAR(100),
    visibility VARCHAR(20) DEFAULT 'public' NOT NULL CHECK (visibility IN ('public', 'friends', 'private')),
    is_verified BOOLEAN DEFAULT false NOT NULL,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_character_per_profile UNIQUE (profile_id, region, realm, name)
);

ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

-- Politicas RLS para Characters
CREATE POLICY "Visualização de personagens baseada em privacidade" 
    ON public.characters FOR SELECT 
    USING (
        visibility = 'public' 
        OR (auth.uid() = profile_id)
    );

CREATE POLICY "Usuário pode gerenciar seus próprios personagens" 
    ON public.characters FOR ALL 
    USING (auth.uid() = profile_id);


-- 3. POSTS (Publicações)
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    character_id UUID REFERENCES public.characters(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    visibility VARCHAR(20) DEFAULT 'public' NOT NULL CHECK (visibility IN ('public', 'friends', 'private')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMPTZ
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Visualização de posts públicos" 
    ON public.posts FOR SELECT 
    USING (deleted_at IS NULL AND (visibility = 'public' OR auth.uid() = author_profile_id));

CREATE POLICY "Usuário pode criar seus próprios posts" 
    ON public.posts FOR INSERT 
    WITH CHECK (auth.uid() = author_profile_id);

CREATE POLICY "Usuário pode atualizar/deletar seus próprios posts" 
    ON public.posts FOR UPDATE 
    USING (auth.uid() = author_profile_id);


-- 4. POST LIKES
CREATE TABLE IF NOT EXISTS public.post_likes (
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    PRIMARY KEY (post_id, profile_id)
);

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Likes visíveis publicamente" 
    ON public.post_likes FOR SELECT 
    USING (true);

CREATE POLICY "Usuário pode curtir posts" 
    ON public.post_likes FOR INSERT 
    WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Usuário pode remover sua curtida" 
    ON public.post_likes FOR DELETE 
    USING (auth.uid() = profile_id);


-- 5. COMMENTS
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    author_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMPTZ
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comentários visíveis" 
    ON public.comments FOR SELECT 
    USING (deleted_at IS NULL);

CREATE POLICY "Usuário pode comentar" 
    ON public.comments FOR INSERT 
    WITH CHECK (auth.uid() = author_profile_id);

CREATE POLICY "Usuário pode editar/deletar seu comentário" 
    ON public.comments FOR UPDATE 
    USING (auth.uid() = author_profile_id);
