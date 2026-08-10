import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import UserHeader from '@/components/UserHeader'
import SettingsClientView from './SettingsClientView'

export default async function SettingsPage() {
  const supabase = await createClient()

  // 1. Verificar autenticação
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // 2. Obter perfil do usuário
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // 3. Obter personagens vinculados à conta do usuário
  const { data: characters } = await supabase
    .from('characters')
    .select('*')
    .eq('profile_id', user.id)
    .order('level', { ascending: false })

  // 4. Obter montarias públicas do usuário
  const { data: publicMounts } = await supabase
    .from('user_public_mounts')
    .select('*')
    .eq('profile_id', user.id)

  return (
    <div className="dark-theme bg-[#0B0E14] text-[#F0F4F8] min-h-screen font-sans">
      <UserHeader profile={profile} />

      {/* Container Centralizado idêntico ao protótipo e ao feed (max-width: 1000px com margem automática) */}
      <main style={{ maxWidth: '1000px', margin: '24px auto', padding: '0 24px' }}>
        <SettingsClientView 
          profile={profile} 
          initialCharacters={characters || []} 
          initialPublicMounts={publicMounts || []} 
        />
      </main>
    </div>
  )
}
