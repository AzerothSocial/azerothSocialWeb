'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const CharacterSchema = z.object({
  name: z.string().min(2, 'Nome do personagem é obrigatório').max(50),
  realm: z.string().min(2, 'Reino/Servidor é obrigatório'),
  region: z.string().default('US'),
  className: z.string().min(2, 'Classe é obrigatória'),
  raceName: z.string().min(2, 'Raça é obrigatória'),
  level: z.number().min(1).max(80).default(80),
  guildName: z.string().optional(),
  faction: z.string().default('horde'),
  visibility: z.enum(['public', 'friends', 'private']).default('public'),
})

export async function addCharacterAction(formData: {
  name: string
  realm: string
  region?: string
  className: string
  raceName: string
  level?: number
  guildName?: string
  faction?: string
  visibility?: 'public' | 'friends' | 'private'
}) {
  const validation = CharacterSchema.safeParse(formData)
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0]?.message || 'Dados de personagem inválidos.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Sessão não encontrada.' }
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

  // 2. Inserir o personagem incluindo a facção
  const { error } = await supabase.from('characters').insert({
    profile_id: user.id,
    name: validation.data.name,
    realm: validation.data.realm,
    region: validation.data.region || 'US',
    class_name: validation.data.className,
    race_name: validation.data.raceName,
    level: validation.data.level || 80,
    guild_name: validation.data.guildName || null,
    faction: validation.data.faction || 'horde',
    visibility: validation.data.visibility || 'public',
  })

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Este personagem já está cadastrado na sua conta.' }
    }
    return { success: false, error: error.message }
  }

  revalidatePath('/feed')
  revalidatePath('/settings')
  return { success: true }
}

export async function setMainCharacterAction(characterId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Sessão inválida.' }

  const { data: character } = await supabase
    .from('characters')
    .select('id')
    .eq('id', characterId)
    .eq('profile_id', user.id)
    .single()

  if (!character) {
    return { success: false, error: 'Personagem não encontrado.' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ main_character_id: characterId })
    .eq('id', user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/feed')
  revalidatePath('/settings')
  return { success: true }
}

export async function updateCharacterVisibilityAction(characterId: string, visibility: 'public' | 'friends' | 'private') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Sessão inválida.' }

  const { error } = await supabase
    .from('characters')
    .update({ visibility })
    .eq('id', characterId)
    .eq('profile_id', user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/feed')
  revalidatePath('/settings')
  return { success: true }
}

