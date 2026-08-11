'use server'

import { createClient } from '@/lib/supabase/server'

// Mapeamento básico para o POC
const SUPPORTED_SPECS = [
  { id: 64, class_name: 'Mage', spec_name: 'Frost' },
  { id: 253, class_name: 'Hunter', spec_name: 'Beast Mastery' },
  { id: 268, class_name: 'Monk', spec_name: 'Brewmaster' }
]

export async function syncTopPvPBuildsAction() {
  try {
    const supabase = await createClient()

    const clientId = process.env.BNET_CLIENT_ID
    const clientSecret = process.env.BNET_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      return { success: false, error: 'Credenciais BNET ausentes.' }
    }

    // 1. Obter Token
    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    const tokenRes = await fetch('https://oauth.battle.net/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials',
      cache: 'no-store'
    })

    if (!tokenRes.ok) return { success: false, error: 'Falha auth Blizzard' }
    const { access_token } = await tokenRes.json()

    // 2. Descobrir a temporada atual de PvP
    const seasonIndexRes = await fetch('https://us.api.blizzard.com/data/wow/pvp-season/index?namespace=dynamic-us&locale=en_US', {
      headers: { 'Authorization': `Bearer ${access_token}` }
    })
    const seasonIndex = await seasonIndexRes.json()
    const currentSeasonId = seasonIndex.current_season.id

    let totalSynced = 0

    // 3. Iterar pelos Specs Suportados (POC)
    for (const spec of SUPPORTED_SPECS) {
      // Leaderboard Solo Shuffle
      const bracketName = `shuffle-${spec.class_name.toLowerCase()}-${spec.spec_name.toLowerCase().replace(/\s+/g, '')}`
      const leaderboardRes = await fetch(`https://us.api.blizzard.com/data/wow/pvp-season/${currentSeasonId}/pvp-leaderboard/${bracketName}?namespace=dynamic-us&locale=en_US`, {
        headers: { 'Authorization': `Bearer ${access_token}` }
      })

      if (!leaderboardRes.ok) {
        console.error(`Erro ao buscar leaderboard para ${spec.spec_name}`)
        continue
      }

      const leaderboardData = await leaderboardRes.json()
      const entries = leaderboardData.entries || []
      
      // Pegar o Top 5 apenas para o MVP não demorar demais
      const top5 = entries.slice(0, 5)

      for (let i = 0; i < top5.length; i++) {
        const entry = top5[i]
        const charName = entry.character.name.toLowerCase()
        const charRealm = entry.character.realm.slug
        const rank = i + 1

        // 4. Buscar Talentos na API de Specializations
        const specRes = await fetch(`https://us.api.blizzard.com/profile/wow/character/${charRealm}/${charName}/specializations?namespace=profile-us&locale=en_US`, {
          headers: { 'Authorization': `Bearer ${access_token}` }
        })

        if (!specRes.ok) {
          console.warn(`Não foi possível buscar talentos para ${charName}-${charRealm}`)
          continue
        }

        const specData = await specRes.json()
        
        // Achar o loadout ativo
        const activeSpec = specData.specializations?.find((s: any) => s.specialization.id === spec.id)
        if (!activeSpec) continue

        const activeLoadout = activeSpec.loadouts?.find((l: any) => l.is_active)
        if (!activeLoadout) continue

        const talents = activeLoadout.selected_class_talents.concat(activeLoadout.selected_spec_talents)
        
        // Array de Spell IDs dos talentos para exibir com Wowhead
        const talentIds = talents
          .map((t: any) => t.tooltip?.spell_tooltip?.spell?.id || t.spell_tooltip?.spell?.id || t.tooltip?.talent?.id || t.talent?.id)
          .filter(Boolean)

        // 5. Salvar no Supabase
        const { error } = await supabase.from('top_builds').upsert({
          mode: 'solo-shuffle',
          class_name: spec.class_name,
          spec_name: spec.spec_name,
          rank: rank,
          character_name: entry.character.name, // Nome Original
          realm: entry.character.realm.slug,
          region: 'US',
          rating: entry.rating,
          talents_json: talentIds
        }, { onConflict: 'mode,class_name,spec_name,rank' })

        if (!error) totalSynced++
      }
    }

    return { success: true, synced: totalSynced }
  } catch (error: any) {
    console.error('Error syncing builds:', error)
    return { success: false, error: error.message }
  }
}
