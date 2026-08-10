'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function promoteLiveAction(data: {
  title: string
  streamUrl: string
  platform: string
  region: string
  description: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado.' }

  // 1. Criar post de anúncio
  const postContent = `🔴 [LIVE PROMOVIDA] ${data.title}\n\nAcompanhe ao vivo em: ${data.streamUrl}\n${data.description}`
  
  const { data: post, error: postErr } = await supabase
    .from('posts')
    .insert({
      author_profile_id: user.id,
      content: postContent,
      post_type: 'live_promo',
      media_url: data.streamUrl,
      region: data.region,
    })
    .select()
    .single()

  if (postErr || !post) {
    return { success: false, error: postErr?.message || 'Erro ao publicar promoção de live.' }
  }

  // 2. Criar registro de promoção de live
  const { error: liveErr } = await supabase
    .from('live_promotions')
    .insert({
      post_id: post.id,
      streamer_profile_id: user.id,
      title: data.title,
      stream_url: data.streamUrl,
      platform: data.platform,
      region: data.region,
    })

  if (liveErr) return { success: false, error: liveErr.message }

  revalidatePath('/lives')
  return { success: true }
}
