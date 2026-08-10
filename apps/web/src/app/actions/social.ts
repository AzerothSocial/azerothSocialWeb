'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function followUserAction(targetProfileId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.id === targetProfileId) {
    return { success: false, error: 'Ação inválida.' }
  }

  const { error } = await supabase.from('follows').insert({
    follower_profile_id: user.id,
    following_profile_id: targetProfileId,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/feed')
  return { success: true }
}

export async function unfollowUserAction(targetProfileId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false }

  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_profile_id', user.id)
    .eq('following_profile_id', targetProfileId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/feed')
  return { success: true }
}

export async function sendFriendRequestAction(targetProfileId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.id === targetProfileId) {
    return { success: false, error: 'Ação inválida.' }
  }

  const { error } = await supabase.from('friendships').insert({
    requester_profile_id: user.id,
    addressee_profile_id: targetProfileId,
    status: 'pending',
  })

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Já existe uma solicitação de amizade pendente ou aceita.' }
    }
    return { success: false, error: error.message }
  }

  revalidatePath('/feed')
  return { success: true }
}

export async function respondFriendRequestAction(friendshipId: string, status: 'accepted' | 'rejected') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false }

  const { error } = await supabase
    .from('friendships')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', friendshipId)
    .eq('addressee_profile_id', user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/feed')
  return { success: true }
}

export async function blockUserAction(targetProfileId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.id === targetProfileId) {
    return { success: false, error: 'Ação não permitida.' }
  }

  // 1. Inserir bloqueio
  const { error } = await supabase.from('blocks').insert({
    blocker_profile_id: user.id,
    blocked_profile_id: targetProfileId,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  // 2. Remover relacionamentos de amizade e follow existentes
  await supabase
    .from('follows')
    .delete()
    .or(`and(follower_profile_id.eq.${user.id},following_profile_id.eq.${targetProfileId}),and(follower_profile_id.eq.${targetProfileId},following_profile_id.eq.${user.id})`)

  await supabase
    .from('friendships')
    .delete()
    .or(`and(requester_profile_id.eq.${user.id},addressee_profile_id.eq.${targetProfileId}),and(requester_profile_id.eq.${targetProfileId},addressee_profile_id.eq.${user.id})`)

  revalidatePath('/feed')
  return { success: true }
}
