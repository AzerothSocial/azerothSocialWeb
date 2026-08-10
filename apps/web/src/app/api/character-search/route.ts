import { NextResponse } from 'next/server'

// Mapeador de tradução de classes do inglês para o português
const CLASS_TRANSLATIONS: Record<string, string> = {
  'Paladin': 'Paladino',
  'Mage': 'Mago',
  'Warrior': 'Guerreiro',
  'Rogue': 'Ladino',
  'Priest': 'Sacerdote',
  'Hunter': 'Caçador',
  'Warlock': 'Bruxo',
  'Death Knight': 'Cavaleiro da Morte',
  'Druid': 'Druida',
  'Shaman': 'Xamã',
  'Monk': 'Monge',
  'Demon Hunter': 'Caçador de Demônios',
  'Evoker': 'Convocador',
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const term = searchParams.get('term')

  if (!term || term.trim().length < 2) {
    return NextResponse.json({ matches: [] })
  }

  try {
    const res = await fetch(`https://raider.io/api/search?type=character&term=${encodeURIComponent(term.trim())}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'AzerothSocial/1.0',
      },
      next: { revalidate: 300 }
    })

    if (!res.ok) {
      return NextResponse.json({ matches: [] })
    }

    const data = await res.json()
    
    const characters = (data.matches || [])
      .filter((item: any) => item.type === 'character')
      .map((item: any) => {
        const charData = item.data
        const rawClass = charData.class?.name || 'Paladin'
        const translatedClass = CLASS_TRANSLATIONS[rawClass] || rawClass

        return {
          name: charData.name,
          realm: charData.realm?.name || 'Azralon',
          realmSlug: charData.realm?.slug || 'azralon',
          region: charData.region?.slug?.toUpperCase() || 'US',
          regionShort: charData.region?.short_name || 'BR',
          className: translatedClass,
          faction: charData.faction || 'horde',
        }
      })

    return NextResponse.json({ matches: characters })
  } catch {
    return NextResponse.json({ matches: [] })
  }
}
