'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createGuildRecruitmentAction(data: {
  guildName: string
  faction: string
  realm: string
  region: string
  minLevel: number
  rolesNeeded: string[]
  description: string
  contactInfo: string
  characterId?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado.' }

  // 1. Criar post associado
  const postContent = `🛡️ [RECRUTAMENTO DE GUILDA] <${data.guildName}> (${data.realm} - ${data.region})\n\n${data.description}\n\nContato: ${data.contactInfo}`
  
  const { data: post, error: postErr } = await supabase
    .from('posts')
    .insert({
      author_profile_id: user.id,
      character_id: data.characterId || null,
      content: postContent,
      post_type: 'guild_recruitment',
      region: data.region,
    })
    .select()
    .single()

  if (postErr || !post) {
    return { success: false, error: postErr?.message || 'Erro ao criar publicação da guilda.' }
  }

  // 2. Criar registro de recrutamento
  const { error: recruitErr } = await supabase
    .from('guild_recruitments')
    .insert({
      post_id: post.id,
      guild_name: data.guildName,
      faction: data.faction,
      realm: data.realm,
      region: data.region,
      min_level: data.minLevel,
      roles_needed: data.rolesNeeded,
      description: data.description,
      contact_info: data.contactInfo,
    })

  if (recruitErr) {
    return { success: false, error: recruitErr.message }
  }

  revalidatePath('/guilds')
  return { success: true }
}

export async function applyToGuildAction(data: {
  recruitmentId: string
  characterId: string
  message: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado.' }

  const { error } = await supabase
    .from('guild_applications')
    .insert({
      recruitment_id: data.recruitmentId,
      applicant_profile_id: user.id,
      character_id: data.characterId,
      message: data.message,
    })

  if (error) return { success: false, error: error.message }

  // Disparar Notificação para o Líder/Autor da publicação
  try {
    const { data: rec } = await supabase
      .from('guild_recruitments')
      .select('guild_name, post_id, posts:post_id(author_profile_id)')
      .eq('id', data.recruitmentId)
      .single()

    const targetUserId = (rec?.posts as any)?.author_profile_id || user.id

    if (targetUserId) {
      const { data: char } = await supabase
        .from('characters')
        .select('name, class_name, level, realm')
        .eq('id', data.characterId)
        .single()

      const { data: applicantProfile } = await supabase
        .from('profiles')
        .select('display_name, username')
        .eq('id', user.id)
        .single()

      const charInfo = char ? `${char.name} (${char.class_name} Lvl ${char.level})` : applicantProfile?.display_name || 'Um jogador'
      const notifContent = `@${applicantProfile?.username || 'Alguém'} se candidatou com ${charInfo} para sua guilda <${rec?.guild_name || 'Guilda'}>.`

      const { error: insertErr } = await supabase
        .from('notifications')
        .insert({
          user_id: targetUserId,
          actor_id: user.id,
          type: 'guild_application',
          title: '🛡️ Nova Candidatura de Guilda!',
          content: notifContent,
          reference_id: data.recruitmentId,
          is_read: false,
        })

      if (insertErr) {
        console.warn('Supabase notification insert result:', insertErr.message)
      }
    }
  } catch (notifErr) {
    console.warn('Erro ao disparar notificação:', notifErr)
  }

  revalidatePath('/guilds')
  return { success: true }
}

export async function getRecruitmentApplicationsAction(recruitmentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado.', applications: [] }

  // 1. Verificar se o usuário logado É O AUTOR do recrutamento (Strict Security Check)
  const { data: rec } = await supabase
    .from('guild_recruitments')
    .select('*, posts:post_id(author_profile_id)')
    .eq('id', recruitmentId)
    .single()

  if (!rec) return { success: false, error: 'Anúncio de guilda não encontrado.', applications: [] }

  const authorId = (rec.posts as any)?.author_profile_id
  if (authorId !== user.id) {
    return {
      success: false,
      error: 'Acesso negado. Apenas o recrutador / autor desta publicação pode gerenciar as candidaturas.',
      applications: [],
    }
  }

  // 2. Buscar candidaturas recebidas para esta guilda
  const { data: apps, error } = await supabase
    .from('guild_applications')
    .select(`
      id,
      status,
      message,
      created_at,
      applicant:profiles!applicant_profile_id(id, display_name, username, avatar_url),
      character:characters!character_id(id, name, class_name, level, realm, faction, race_name)
    `)
    .eq('recruitment_id', recruitmentId)
    .order('created_at', { ascending: false })

  if (error) return { success: false, error: error.message, applications: [] }

  return {
    success: true,
    recruitment: rec,
    applications: apps || [],
  }
}

export async function updateApplicationStatusAction(data: {
  applicationId: string
  recruitmentId: string
  status: 'approved' | 'rejected'
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado.' }

  // 1. Verificar se o usuário logado É O AUTOR do recrutamento (Strict Security Check)
  const { data: rec } = await supabase
    .from('guild_recruitments')
    .select('guild_name, posts:post_id(author_profile_id)')
    .eq('id', data.recruitmentId)
    .single()

  const authorId = (rec?.posts as any)?.author_profile_id
  if (authorId !== user.id) {
    return { success: false, error: 'Acesso negado. Você não tem permissão para alterar este candidato.' }
  }

  // 2. Atualizar o status na tabela 'guild_applications'
  const { data: app, error } = await supabase
    .from('guild_applications')
    .update({ status: data.status })
    .eq('id', data.applicationId)
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  // 3. Notificar o candidato sobre a decisão
  if (app?.applicant_profile_id) {
    const isApproved = data.status === 'approved'
    const notifTitle = isApproved ? '🎉 Candidatura Aprovada!' : '❌ Candidatura Recusada'
    const notifContent = isApproved
      ? `Sua candidatura para a guilda <${rec?.guild_name}> foi APROVADA! O recrutador entrará em contato.`
      : `Sua candidatura para a guilda <${rec?.guild_name}> foi recusada.`

    try {
      await supabase.from('notifications').insert({
        user_id: app.applicant_profile_id,
        actor_id: user.id,
        type: 'application_result',
        title: notifTitle,
        content: notifContent,
        reference_id: data.recruitmentId,
        is_read: false,
      })
    } catch {
      // Ignorar se a tabela notifications não existir
    }
  }

  revalidatePath('/guilds')
  return { success: true }
}
