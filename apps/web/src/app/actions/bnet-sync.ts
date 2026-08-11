'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Mapeador de tradução de classes do inglês para o português
const CLASS_TRANSLATIONS: Record<string, string> = {
  'Paladin': 'Paladino',
  'Mage': 'Mago',
  'Warrior': 'Guerreiro',
  'Rogue': 'Ladino',
  'Priest': 'Sacerdote',
  'Hunter': 'Caçador',
  'Warlock': 'Bruxo',
  'Death Knight': 'Cavaleiro da Morte',
  'Druid': 'Druida',
  'Shaman': 'Xamã',
  'Monk': 'Monge',
  'Demon Hunter': 'Caçador de Demônios',
  'Evoker': 'Convocador',
}

interface BnetCharacterInput {
  name: string
  level: number
  realm: { name: string; slug: string }
  region: string
  class: { name: string; slug: string }
  race?: { name: string; slug: string }
  faction?: { slug: string; name: string }
  guild?: { name: string }
}

export async function syncBattleNetCharactersAction(characters: BnetCharacterInput[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Sessão não autenticada.' }
  }

  if (!characters || !Array.isArray(characters) || characters.length === 0) {
    return { success: false, error: 'Nenhum personagem recebido do payload da Battle.net.' }
  }

  // 1. Garantir que a linha correspondente em `public.profiles` existe
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (!existingProfile) {
    const rawDisplayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'Campeão'
    const rawUsername = user.user_metadata?.username || `user_${user.id.slice(0, 8)}`

    await supabase.from('profiles').insert({
      id: user.id,
      display_name: rawDisplayName,
      username: rawUsername,
    })
  }

  let importedCount = 0

  // 2. Importar / Atualizar cada personagem retornado da conta Battle.net
  for (const char of characters) {
    const classNameTranslated = CLASS_TRANSLATIONS[char.class.name] || char.class.name || 'Paladino'
    const raceName = char.race?.name || 'Humano'
    const regionUpper = (char.region || 'us').toUpperCase()
    const realmName = char.realm?.name || 'Azralon'
    const factionSlug = char.faction?.slug?.toLowerCase() || 'horde'
    const guildName = char.guild?.name || null

    const { error } = await supabase.from('characters').upsert({
      profile_id: user.id,
      name: char.name,
      realm: realmName,
      region: regionUpper,
      class_name: classNameTranslated,
      race_name: raceName,
      level: char.level || 80,
      ilevel: 0,
      guild_name: guildName,
      faction: factionSlug,
      visibility: 'public',
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'profile_id,region,realm,name'
    })

    if (!error) {
      importedCount++
    }
  }

  revalidatePath('/feed')
  revalidatePath('/settings')

  return { 
    success: true, 
    importedCount, 
    message: `${importedCount} personagem(ns) sincronizados com sucesso a partir da sua conta Battle.net!` 
  }
}
