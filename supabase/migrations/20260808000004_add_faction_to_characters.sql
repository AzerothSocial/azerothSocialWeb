-- Adicionar coluna faction na tabela de personagens caso ainda não exista
ALTER TABLE public.characters ADD COLUMN IF NOT EXISTS faction VARCHAR(20) DEFAULT 'neutral';
