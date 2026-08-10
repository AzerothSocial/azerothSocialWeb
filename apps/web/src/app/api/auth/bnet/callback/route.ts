import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/settings?error=bnet_access_denied`)
  }

  const clientId = process.env.BNET_CLIENT_ID
  const clientSecret = process.env.BNET_CLIENT_SECRET
  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auth/bnet/callback`

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${origin}/settings?error=missing_bnet_credentials`)
  }

  try {
    // 1. Trocar o 'code' por um Access Token oficial da Battle.net via OAuth 2.0
    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    const tokenRes = await fetch('https://oauth.battle.net/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    })

    if (!tokenRes.ok) {
      return NextResponse.redirect(`${origin}/settings?error=token_exchange_failed`)
    }

    const tokenData = await tokenRes.json()
    const accessToken = tokenData.access_token

    // 2. Consultar a WoW Profile API da Blizzard com o token de acesso do jogador
    const profileRes = await fetch('https://us.api.blizzard.com/profile/user/wow?namespace=profile-us&locale=en_US', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(`${origin}/login`)
    }

    if (profileRes.ok) {
      const profileData = await profileRes.json()
      const wowAccounts = profileData.wow_accounts || []
      const importedChars: any[] = []

      for (const account of wowAccounts) {
        for (const char of account.characters || []) {
          importedChars.push({
            profile_id: user.id,
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

    return NextResponse.redirect(`${origin}/settings?bnet_success=true`)
  } catch (e) {
    console.error('Erro na sincronização Battle.net:', e)
    return NextResponse.redirect(`${origin}/settings?error=bnet_sync_exception`)
  }
}
