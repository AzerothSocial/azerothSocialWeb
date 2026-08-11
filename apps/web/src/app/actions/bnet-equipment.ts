'use server'

export interface EquippedItem {
  id: number
  slot: string
  name: string
  quality: string // COMMON, UNCOMMON, RARE, EPIC, LEGENDARY, ARTIFACT
  level: number
  media_url?: string
}

export async function fetchCharacterEquipmentAction(region: string, realm: string, name: string) {
  try {
    const clientId = process.env.BNET_CLIENT_ID
    const clientSecret = process.env.BNET_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      return { success: false, error: 'Credenciais da Battle.net não configuradas no servidor.' }
    }

    // Formata os parâmetros para a API
    const realmSlug = realm
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, "")
      .replace(/['\s]+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
    const charName = name.toLowerCase()

    // 1. Obter Application Token
    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    const tokenRes = await fetch('https://oauth.battle.net/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials',
      next: { revalidate: 3600 } // Cache o token por 1 hora
    })

    if (!tokenRes.ok) {
      return { success: false, error: 'Falha ao autenticar com a Blizzard API.' }
    }

    const { access_token } = await tokenRes.json()

    // 2. Buscar Equipamento do Personagem
    // Usamos namespace=profile-us e locale=en_US (ou pt_BR se preferir)
    const equipRes = await fetch(
      `https://${region.toLowerCase() === 'eu' ? 'eu' : 'us'}.api.blizzard.com/profile/wow/character/${realmSlug}/${charName}/equipment?namespace=profile-${region.toLowerCase()}&locale=pt_BR`,
      {
        headers: { 'Authorization': `Bearer ${access_token}` },
        next: { revalidate: 900 } // Cache dos equipamentos por 15 minutos (900 seg)
      }
    )

    if (!equipRes.ok) {
      return { success: false, error: 'Personagem não encontrado ou API indisponível.' }
    }

    const equipData = await equipRes.json()

    if (!equipData.equipped_items) {
      return { success: true, items: [] }
    }

    // 3. Estruturar os itens e buscar ícones
    const items: EquippedItem[] = await Promise.all(equipData.equipped_items.map(async (item: any) => {
      let mediaUrl = undefined
      
      // Busca o ícone se o link media estiver disponível (alguns itens não tem)
      if (item.media && item.media.key && item.media.key.href) {
        try {
          const mediaItemRes = await fetch(item.media.key.href, {
            headers: { 'Authorization': `Bearer ${access_token}` },
            next: { revalidate: 86400 } // Cache estático de ícones (1 dia)
          })
          if (mediaItemRes.ok) {
            const mediaItemData = await mediaItemRes.json()
            const iconAsset = mediaItemData.assets?.find((a: any) => a.key === 'icon')
            if (iconAsset) {
              mediaUrl = iconAsset.value
            }
          }
        } catch (e) {
          console.error('Erro ao buscar ícone do item', item.item.id)
        }
      }

      return {
        id: item.item.id,
        slot: item.slot.type,
        name: item.name,
        quality: item.quality.type,
        level: item.level?.value || 0,
        media_url: mediaUrl
      }
    }))

    return { success: true, items }
  } catch (error: any) {
    console.error('Erro em fetchCharacterEquipmentAction:', error)
    return { success: false, error: error.message || 'Erro desconhecido ao inspecionar o personagem.' }
  }
}
