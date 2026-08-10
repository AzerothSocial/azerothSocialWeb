import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/settings'

  if (code) {
    const supabase = await createClient()
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && sessionData?.session) {
      const providerToken = sessionData.session.provider_token

      // Se o token OAuth da Battle.net for obtido, buscar os personagens automaticamente da API oficial da Blizzard
      if (providerToken) {
        try {
          const bnetRes = await fetch('https://us.api.blizzard.com/profile/user/wow?namespace=profile-us&locale=en_US', {
            headers: {
              'Authorization': `Bearer ${providerToken}`,
            },
          })

          if (bnetRes.ok) {
            const bnetData = await bnetRes.json()
            const wowAccounts = bnetData.wow_accounts || []
            const importedChars: any[] = []

            for (const account of wowAccounts) {
              for (const char of account.characters || []) {
                importedChars.push({
                  profile_id: sessionData.session.user.id,
                  name: char.name,
                  realm: char.realm?.name || 'Azralon',
                  region: 'US',
                  class_name: char.playable_class?.name || 'Paladino',
                  race_name: char.playable_race?.name || 'Humano',
                  level: char.level || 80,
                  faction: char.faction?.type?.toLowerCase() || 'horde',
                  visibility: 'public',
                  updated_at: new Date().toISOString(),
                })
              }
            }

            if (importedChars.length > 0) {
              await supabase.from('characters').upsert(importedChars, {
                onConflict: 'profile_id,region,realm,name'
              })
            }
          }
        } catch (e) {
          console.error('Erro na sincronização automática Battle.net API:', e)
        }
      }

      return NextResponse.redirect(`${origin}${next}?bnet_success=true`)
    }
  }

  return NextResponse.redirect(`${origin}/settings?error=oauth_failed`)
}
