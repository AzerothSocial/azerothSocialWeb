'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getNotificationsAction() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, notifications: [], unreadCount: 0 }

  try {
    // 1. Tentar buscar da tabela 'notifications'
    let dbNotifs: any[] = []
    const { data: notificationsData } = await supabase
      .from('notifications')
      .select('*, actor:profiles!actor_id(id, username, display_name, avatar_url)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (notificationsData) {
      dbNotifs = notificationsData
    }

    // 2. Buscar candidaturas recebidas nas guildas criadas pelo usuário logado
    const { data: userRecruitments } = await supabase
      .from('guild_recruitments')
      .select('id, guild_name, post_id, posts:post_id(author_profile_id)')

    const userRecruitmentMap = new Map<string, string>()
    if (userRecruitments) {
      for (const r of userRecruitments) {
        const authorId = (r.posts as any)?.author_profile_id
        if (authorId === user.id) {
          userRecruitmentMap.set(r.id, r.guild_name)
        }
      }
    }

    let applicationNotifs: any[] = []
    if (userRecruitmentMap.size > 0) {
      const recruitmentIds = Array.from(userRecruitmentMap.keys())
      const { data: apps } = await supabase
        .from('guild_applications')
        .select(`
          id,
          created_at,
          message,
          recruitment_id,
          applicant:profiles!applicant_profile_id(id, username, display_name, avatar_url),
          character:characters!character_id(name, class_name, level, realm)
        `)
        .in('recruitment_id', recruitmentIds)
        .order('created_at', { ascending: false })

      if (apps && apps.length > 0) {
        applicationNotifs = apps.map((app: any) => {
          const guildName = userRecruitmentMap.get(app.recruitment_id) || 'sua guilda'
          const charStr = app.character ? `${app.character.name} (${app.character.class_name} Lvl ${app.character.level})` : 'um personagem'
          const msgStr = app.message ? ` — "${app.message}"` : ''
          return {
            id: `app_${app.id}`,
            user_id: user.id,
            actor_id: app.applicant?.id,
            actor: app.applicant,
            type: 'guild_application',
            title: '🛡️ Nova Candidatura de Guilda!',
            content: `@${app.applicant?.username || 'Alguém'} se candidatou com ${charStr} para <${guildName}>.${msgStr}`,
            created_at: app.created_at,
            is_read: false,
          }
        })
      }
    }

    // 3. Mesclar resultados e remover duplicatas por ator e data
    const combined = [...dbNotifs, ...applicationNotifs]
    const uniqueMap = new Map<string, any>()
    for (const item of combined) {
      const key = `${item.actor_id || ''}_${item.created_at}`
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, item)
      }
    }

    const finalNotifications = Array.from(uniqueMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    const unreadCount = finalNotifications.filter((n: any) => !n.is_read).length

    return {
      success: true,
      notifications: finalNotifications,
      unreadCount,
    }
  } catch (err) {
    console.warn('Erro ao carregar notificações:', err)
    return { success: false, notifications: [], unreadCount: 0 }
  }
}

export async function markNotificationsReadAction(notificationIds?: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false }

  try {
    let query = supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)

    if (notificationIds && notificationIds.length > 0) {
      query = query.in('id', notificationIds)
    } else {
      query = query.eq('is_read', false)
    }

    await query

    revalidatePath('/guilds')
    revalidatePath('/feed')
    return { success: true }
  } catch {
    return { success: false }
  }
}
