-- Migration: Adicionar Região aos Perfis (Profiles)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS region VARCHAR(5) DEFAULT 'US';
