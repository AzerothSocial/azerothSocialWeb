'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface MountItem {
  id: number
  name: string
  quality?: { id: number; name: string }
  render?: { url: string }
  collected?: boolean
}

export async function fetchMainCharacterMountsAction(region: string, realm: string, characterName: string) {
  if (!region || !realm || !characterName) {
    return { success: false, error: 'Dados do personagem principal incompletos.' }
  }

  const normalizeSlug = (str: string) => 
    str.toLowerCase()
       .trim()
       .normalize('NFD')
       .replace(/[\u0300-\u036f]/g, '')
       .replace(/['\s]+/g, '-')
       .replace(/[^a-z0-9-]/g, '')

  const reg = region.toLowerCase()
  const rlm = normalizeSlug(realm)
  const name = normalizeSlug(characterName)

  const url = `https://worldofwarcraft.blizzard.com/en-us/character/${reg}/${rlm}/${name}/collections/mounts.json`

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) {
      return { success: false, error: `Não foi possível obter as montarias da Battle.net (Status HTTP ${res.status}).` }
    }

    const data = await res.json()
    const allMounts: MountItem[] = data.mounts || []
    const collectedMounts = allMounts.filter((m: MountItem) => m.collected !== false)

    return { 
      success: true, 
      totalCollected: data.mountsCollected || collectedMounts.length, 
      mounts: collectedMounts 
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro ao conectar à API da Blizzard.' }
  }
}

export async function getUserPublicMountsAction(targetProfileId?: string) {
  const supabase = await createClient()

  let profileId = targetProfileId
  if (!profileId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Sessão inválida.', mounts: [] }
    profileId = user.id
  }

  try {
    const { data, error } = await supabase
      .from('user_public_mounts')
      .select('*')
      .eq('profile_id', profileId)

    if (error) {
      return { success: false, error: error.message, mounts: [] }
    }

    return { success: true, mounts: data || [] }
  } catch (err: any) {
    return { success: false, error: err.message, mounts: [] }
  }
}

export async function togglePublicMountAction(mount: { mountId: number; mountName: string; mountImage?: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Sessão expirada. Faça login novamente.' }
  }

  try {
    // 1. Verificar se a montaria já é pública para este usuário
    const { data: existing } = await supabase
      .from('user_public_mounts')
      .select('id')
      .eq('profile_id', user.id)
      .eq('mount_id', mount.mountId)
      .maybeSingle()

    if (existing) {
      // 2. Se já for pública, remover
      const { error: deleteError } = await supabase
        .from('user_public_mounts')
        .delete()
        .eq('id', existing.id)

      if (deleteError) {
        return { success: false, error: deleteError.message }
      }

      revalidatePath('/settings')
      revalidatePath('/feed')
      return { success: true, isPublic: false }
    } else {
      // 3. Se não for pública, inserir
      const { error: insertError } = await supabase
        .from('user_public_mounts')
        .insert({
          profile_id: user.id,
          mount_id: mount.mountId,
          mount_name: mount.mountName,
          mount_image: mount.mountImage || null,
        })

      if (insertError) {
        return { success: false, error: insertError.message }
      }

      revalidatePath('/settings')
      revalidatePath('/feed')
      return { success: true, isPublic: true }
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro ao atualizar visibilidade da montaria.' }
  }
}
