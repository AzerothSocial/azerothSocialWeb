-- Migration: Guilds and Lives Schema
-- 1. Extensão de post_type e colunas em posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS post_type VARCHAR(50) DEFAULT 'general';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS region VARCHAR(20);

-- 2. Tabela de Recrutamento de Guildas
CREATE TABLE IF NOT EXISTS guild_recruitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  guild_name VARCHAR(100) NOT NULL,
  faction VARCHAR(20) NOT NULL, -- 'alliance', 'horde', 'neutral'
  realm VARCHAR(100) NOT NULL,
  region VARCHAR(20) NOT NULL, -- 'BR', 'US', 'EU'
  min_level INT DEFAULT 80,
  roles_needed TEXT[] DEFAULT '{}', -- ARRAY['tank', 'healer', 'dps']
  description TEXT,
  contact_info TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Candidaturas/Aplicações para Guildas
CREATE TABLE IF NOT EXISTS guild_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruitment_id UUID REFERENCES guild_recruitments(id) ON DELETE CASCADE,
  applicant_profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela de Promoções de Lives
CREATE TABLE IF NOT EXISTS live_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  streamer_profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  stream_url TEXT NOT NULL,
  platform VARCHAR(50) DEFAULT 'twitch', -- 'twitch', 'youtube', 'kick'
  region VARCHAR(20) NOT NULL, -- 'BR', 'US', 'EU'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS nas novas tabelas
ALTER TABLE guild_recruitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE guild_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_promotions ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS simples (Leitura pública e gravação autenticada)
CREATE POLICY "Leitura pública de recrutamentos" ON guild_recruitments FOR SELECT USING (true);
CREATE POLICY "Inserção autenticada de recrutamentos" ON guild_recruitments FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Leitura de candidaturas próprias ou do anunciante" ON guild_applications FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Candidatura autenticada" ON guild_applications FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Leitura pública de lives" ON live_promotions FOR SELECT USING (true);
CREATE POLICY "Inserção autenticada de lives" ON live_promotions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
