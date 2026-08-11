-- Migration para adicionar Renderização 3D de Personagens e Top Transmogs
ALTER TABLE public.characters
ADD COLUMN IF NOT EXISTS render_url TEXT,
ADD COLUMN IF NOT EXISTS is_favorite_transmog BOOLEAN DEFAULT false NOT NULL;

-- Criar índice para buscar rapidamente os favoritos de um perfil
CREATE INDEX IF NOT EXISTS idx_characters_favorite_transmog 
ON public.characters(profile_id)
WHERE is_favorite_transmog = true;
