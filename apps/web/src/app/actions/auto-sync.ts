'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function autoSyncCharactersAction() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Usuário não autenticado.' }
  }

  // 1. Encontrar personagens que precisam de atualização (mais de 6 horas)
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
  
  const { data: characters } = await supabase
    .from('characters')
    .select('*')
    .eq('profile_id', user.id)
    .lt('updated_at', sixHoursAgo)

  if (!characters || characters.length === 0) {
    return { success: true, message: 'Nenhum personagem precisa ser atualizado agora.' }
  }

  // 2. Obter Token de App (Client Credentials) da Blizzard
  const clientId = process.env.BNET_CLIENT_ID
  const clientSecret = process.env.BNET_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return { success: false, error: 'Credenciais da Battle.net não configuradas.' }
  }

  let accessToken = ''
  try {
    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    const tokenRes = await fetch('https://oauth.battle.net/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ grant_type: 'client_credentials' }),
      next: { revalidate: 3000 } // Tentar usar cache para o token se possível (embora dura 24h)
    })

    if (!tokenRes.ok) {
      console.error('Falha ao obter token client_credentials', await tokenRes.text())
      return { success: false, error: 'Falha na autenticação servidor-a-servidor com a Blizzard.' }
    }

    const tokenData = await tokenRes.json()
    accessToken = tokenData.access_token
  } catch (error) {
    console.error('Erro na requisição do token Blizzard:', error)
    return { success: false, error: 'Erro de rede ao conectar com a Blizzard.' }
  }

  // 3. Atualizar cada personagem com chamadas paralelas
  const updatePromises = characters.map(async (char) => {
    try {
      // Formatar slug do realm (ex: "Azralon" -> "azralon", "Area 52" -> "area-52")
      const realmSlug = char.realm
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, "") // remove acentos
        .replace(/['\s]+/g, "-")
        .replace(/[^a-z0-9-]/g, "")

      const charName = char.name.toLowerCase()

      const res = await fetch(`https://us.api.blizzard.com/profile/wow/character/${realmSlug}/${charName}?namespace=profile-us&locale=en_US`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
        // Sem cache, queremos os dados frescos
        cache: 'no-store'
      })

      let renderUrl = char.render_url;

      if (res.ok) {
        const charData = await res.json()
        
        // Busca a renderização 3D do personagem
        const mediaRes = await fetch(`https://us.api.blizzard.com/profile/wow/character/${realmSlug}/${charName}/character-media?namespace=profile-us&locale=en_US`, {
          headers: { 'Authorization': `Bearer ${accessToken}` },
          cache: 'no-store'
        })
        
        if (mediaRes.ok) {
          const mediaData = await mediaRes.json()
          const mainRawAsset = mediaData.assets?.find((a: any) => a.key === 'main-raw')
          if (mainRawAsset) {
            renderUrl = mainRawAsset.value
          }
        }
        
        return {
          id: char.id, // Primary key (uuid) para update seguro
          profile_id: user.id,
          region: char.region,
          realm: char.realm,
          name: char.name,
          class_name: char.class_name,
          race_name: char.race_name,
          faction: char.faction,
          visibility: char.visibility,
          // Campos que queremos atualizar:
          level: charData.level || char.level,
          ilevel: charData.equipped_item_level || char.ilevel || 0,
          guild_name: charData.guild?.name || null,
          render_url: renderUrl,
          updated_at: new Date().toISOString()
        }
      } else {
        // Se der 404 (char apagado, transferido ou renomeado), atualizamos apenas o updated_at para não ficar tentando em loop
        if (res.status === 404) {
          return {
            ...char,
            updated_at: new Date().toISOString()
          }
        }
      }
    } catch (e) {
      console.error(`Erro ao sincronizar alt automaticamente: ${char.name}`, e)
    }
    return null
  })

  const results = await Promise.all(updatePromises)
  const validUpdates = results.filter(r => r !== null)

  // 4. Salvar atualizações no banco
  if (validUpdates.length > 0) {
    const { error } = await supabase.from('characters').upsert(validUpdates, {
      onConflict: 'id' // Atualiza pela chave primária (ID do uuid no banco)
    })
    
    if (error) {
      console.error('Erro no Supabase ao atualizar personagens em massa:', error)
      return { success: false, error: 'Erro ao salvar atualizações no banco de dados.' }
    }
  }

  return { success: true, updatedCount: validUpdates.length }
}
