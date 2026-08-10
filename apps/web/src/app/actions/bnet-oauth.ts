'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import crypto from 'crypto'

export async function loginWithBattleNetAction() {
  const headersList = await headers()
  const host = headersList.get('x-forwarded-host') || headersList.get('host')
  const protocol = headersList.get('x-forwarded-proto') || (host?.includes('localhost') ? 'http' : 'https')
  const origin = host ? `${protocol}://${host}` : null

  const clientId = process.env.BNET_CLIENT_ID
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.URL || origin || 'http://localhost:3000'
  const redirectUri = encodeURIComponent(`${baseUrl}/api/auth/bnet/callback`)
  
  if (!clientId || clientId === 'seu_client_id_aqui') {
    return { 
      success: false, 
      error: 'BNET_CLIENT_ID não configurado no .env.local.' 
    }
  }

  // A Battle.net exige obrigatoriamente o parâmetro 'state' anti-CSRF
  const state = crypto.randomBytes(16).toString('hex')

  // URL Oficial de Autorização OAuth 2.0 com o parâmetro 'state' obrigatório
  const bnetAuthUrl = `https://oauth.battle.net/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid%20wow.profile&state=${state}`

  redirect(bnetAuthUrl)
}
