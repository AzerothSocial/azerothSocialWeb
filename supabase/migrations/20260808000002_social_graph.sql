-- Azeroth Social - Migration Etapa 4: Grafo Social (Amizades, Seguidores e Bloqueios)

-- 1. FRIENDSHIPS (Solicitações de Amizade entre Jogadores)
CREATE TABLE IF NOT EXISTS public.friendships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    addressee_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_friendship UNIQUE (requester_profile_id, addressee_profile_id),
    CONSTRAINT prevent_self_friendship CHECK (requester_profile_id <> addressee_profile_id)
);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Amizades visíveis para participantes"
    ON public.friendships FOR SELECT
    USING (auth.uid() = requester_profile_id OR auth.uid() = addressee_profile_id);

CREATE POLICY "Usuário pode enviar solicitação de amizade"
    ON public.friendships FOR INSERT
    WITH CHECK (auth.uid() = requester_profile_id);

CREATE POLICY "Usuários envolvidos podem atualizar solicitação"
    ON public.friendships FOR UPDATE
    USING (auth.uid() = requester_profile_id OR auth.uid() = addressee_profile_id);

CREATE POLICY "Usuários envolvidos podem remover amizade"
    ON public.friendships FOR DELETE
    USING (auth.uid() = requester_profile_id OR auth.uid() = addressee_profile_id);


-- 2. FOLLOWS (Sistema de Seguidores)
CREATE TABLE IF NOT EXISTS public.follows (
    follower_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    PRIMARY KEY (follower_profile_id, following_profile_id),
    CONSTRAINT prevent_self_follow CHECK (follower_profile_id <> following_profile_id)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Follows visíveis publicamente"
    ON public.follows FOR SELECT
    USING (true);

CREATE POLICY "Usuário pode seguir outros perfis"
    ON public.follows FOR INSERT
    WITH CHECK (auth.uid() = follower_profile_id);

CREATE POLICY "Usuário pode deixar de seguir"
    ON public.follows FOR DELETE
    USING (auth.uid() = follower_profile_id);


-- 3. BLOCKS (Bloqueios de Jogadores)
CREATE TABLE IF NOT EXISTS public.blocks (
    blocker_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    blocked_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    PRIMARY KEY (blocker_profile_id, blocked_profile_id),
    CONSTRAINT prevent_self_block CHECK (blocker_profile_id <> blocked_profile_id)
);

ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bloqueios visíveis apenas para o bloqueador"
    ON public.blocks FOR SELECT
    USING (auth.uid() = blocker_profile_id);

CREATE POLICY "Usuário pode bloquear outro jogador"
    ON public.blocks FOR INSERT
    WITH CHECK (auth.uid() = blocker_profile_id);

CREATE POLICY "Usuário pode desbloquear jogador"
    ON public.blocks FOR DELETE
    USING (auth.uid() = blocker_profile_id);
