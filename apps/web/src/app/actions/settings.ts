'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function uploadAvatarAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Sessão expirada. Faça login novamente.' }
  }

  const file = formData.get('avatarFile') as File | null

  if (!file) {
    return { success: false, error: 'Nenhum arquivo de imagem enviado.' }
  }

  // Validação de Tamanho Rígida de 5MB (5 * 1024 * 1024 bytes)
  const MAX_SIZE_BYTES = 5 * 1024 * 1024
  if (file.size > MAX_SIZE_BYTES) {
    return { success: false, error: 'A imagem é muito grande. O limite máximo permitido é 5MB.' }
  }

  // Validação de Tipo de Arquivo (MIME Type)
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
  if (!allowedTypes.includes(file.type)) {
    return { success: false, error: 'Formato de imagem não suportado. Use JPG, PNG ou WEBP.' }
  }

  const fileExt = file.name.split('.').pop()
  const filePath = `${user.id}/${Date.now()}.${fileExt}`

  // 1. Tentar auto-criar o bucket 'avatars' caso ainda não exista no projeto Supabase
  try {
    await supabase.storage.createBucket('avatars', {
      public: true,
      fileSizeLimit: '5MB',
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    })
  } catch {
    // Bucket já existente ou sem permissão de criação via SDK (trado abaixo)
  }

  // 2. Enviar arquivo para o Supabase Storage Bucket 'avatars'
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      upsert: true,
      contentType: file.type,
    })

  if (uploadError) {
    // Se o bucket não existir na nuvem do Supabase, converter a imagem para DataURL (Base64) como fallback infalível
    if (uploadError.message.includes('Bucket not found') || uploadError.message.includes('not_found')) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const base64Image = `data:${file.type};base64,${buffer.toString('base64')}`

      const { error: base64Error } = await supabase
        .from('profiles')
        .update({
          avatar_url: base64Image,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (!base64Error) {
        revalidatePath('/settings')
        revalidatePath('/feed')
        return { success: true, publicUrl: base64Image }
      }
    }

    return { success: false, error: `Erro no upload: ${uploadError.message}. Execute a SQL migration para criar o bucket 'avatars' no Supabase.` }
  }

  // 3. Obter a URL pública do avatar
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath)

  // 4. Atualizar o avatar_url no perfil do usuário
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      avatar_url: publicUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (profileError) {
    return { success: false, error: profileError.message }
  }

  revalidatePath('/settings')
  revalidatePath('/feed')
  return { success: true, publicUrl }
}

export async function updateProfileSettingsAction(data: { displayName: string; bio: string; avatarUrl?: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Sessão inválida.' }

  const updateData: any = {
    display_name: data.displayName.trim(),
    bio: data.bio.trim(),
    updated_at: new Date().toISOString(),
  }

  if (data.avatarUrl) {
    updateData.avatar_url = data.avatarUrl.trim()
  }

  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/settings')
  revalidatePath('/feed')
  return { success: true }
}

export async function deleteCharacterAction(characterId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Sessão inválida.' }

  const { error } = await supabase
    .from('characters')
    .delete()
    .eq('id', characterId)
    .eq('profile_id', user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/settings')
  revalidatePath('/feed')
  return { success: true }
}
