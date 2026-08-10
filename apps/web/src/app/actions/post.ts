'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { CreatePostSchema, CreateCommentSchema } from '@/lib/validations/post'

export async function createPostAction(content: string, characterId?: string, mediaUrl?: string) {
  // 1. Sanitização e Validação Zod no Servidor
  const validation = CreatePostSchema.safeParse({ content, characterId })
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0]?.message || 'Publicação inválida.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Usuário não autenticado.' }
  }

  // 2. Se informou um personagem, verificar se realmente pertence ao usuário autenticado (Prevenção de Falsificação)
  if (validation.data.characterId) {
    const { data: charOwnership } = await supabase
      .from('characters')
      .select('id')
      .eq('id', validation.data.characterId)
      .eq('profile_id', user.id)
      .maybeSingle()

    if (!charOwnership) {
      return { success: false, error: 'Você não tem permissão para publicar em nome deste personagem.' }
    }
  }

  // 3. Inserir no banco via Supabase RLS
  const { error } = await supabase.from('posts').insert({
    author_profile_id: user.id,
    character_id: validation.data.characterId || null,
    content: validation.data.content,
    media_url: mediaUrl || null,
    post_type: mediaUrl ? 'youtube' : 'general',
    visibility: validation.data.visibility,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/feed')
  return { success: true }
}

export async function deletePostAction(postId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Sessão inválida.' }

  const { error } = await supabase
    .from('posts')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', postId)
    .eq('author_profile_id', user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/feed')
  return { success: true }
}

export async function toggleLikeAction(postId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false }

  const { data: existingLike } = await supabase
    .from('post_likes')
    .select('*')
    .eq('post_id', postId)
    .eq('profile_id', user.id)
    .maybeSingle()

  if (existingLike) {
    await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('profile_id', user.id)
  } else {
    await supabase.from('post_likes').insert({
      post_id: postId,
      profile_id: user.id,
    })
  }

  revalidatePath('/feed')
  return { success: true }
}

export async function addCommentAction(postId: string, content: string) {
  const validation = CreateCommentSchema.safeParse({ postId, content })
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0]?.message || 'Comentário inválido.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Sessão expirada.' }

  const { error } = await supabase.from('comments').insert({
    post_id: validation.data.postId,
    author_profile_id: user.id,
    content: validation.data.content,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/feed')
  return { success: true }
}

export async function deleteCommentAction(commentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Sessão expirada.' }

  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)
    .eq('author_profile_id', user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/feed')
  return { success: true }
}
