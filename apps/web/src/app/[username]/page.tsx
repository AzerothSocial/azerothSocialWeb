import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import UserHeader from '@/components/UserHeader'
import PublicProfileClientView from './PublicProfileClientView'

interface PublicProfilePageProps {
  params: Promise<{
    username: string
  }>
}

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  const resolvedParams = await params
  const rawUsername = resolvedParams.username || ''
  const cleanUsername = decodeURIComponent(rawUsername).replace(/^@/, '').trim()

  if (!cleanUsername) {
    notFound()
  }

  const supabase = await createClient()

  // 1. Obter usuário logado atual (se houver)
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  // 2. Obter perfil do usuário pesquisado pelo username
  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('*')
    .ilike('username', cleanUsername)
    .maybeSingle()

  if (!targetProfile) {
    return (
      <div className="dark-theme bg-[#0B0E14] text-[#F0F4F8] min-h-screen font-sans">
        <main style={{ maxWidth: '800px', margin: '60px auto', padding: '0 24px', textAlign: 'center' }}>
          <div style={{ backgroundColor: '#141923', border: '1px solid #263045', borderRadius: '16px', padding: '40px' }}>
            <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: '1.8rem', color: '#EF4444', marginBottom: '12px' }}>
              ⚔️ Perfil não Encontrado
            </h1>
            <p style={{ color: '#94A3B8', marginBottom: '24px' }}>
              O aventureiro <strong>@{cleanUsername}</strong> não foi localizado na Taverna de Azeroth.
            </p>
            <a 
              href="/feed" 
              style={{
                display: 'inline-block',
                backgroundColor: '#C89B3C',
                color: '#000',
                fontWeight: 700,
                padding: '10px 20px',
                borderRadius: '8px',
                textDecoration: 'none'
              }}
            >
              Voltar ao Feed Principal
            </a>
          </div>
        </main>
      </div>
    )
  }

  // 3. Obter perfil logado para a nav
  let currentUserProfile = null
  if (currentUser) {
    const { data: p } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .single()
    currentUserProfile = p
  }

  // 4. Obter personagens públicos do perfil pesquisado
  const { data: characters } = await supabase
    .from('characters')
    .select('*')
    .eq('profile_id', targetProfile.id)
    .neq('visibility', 'private')
    .order('level', { ascending: false })

  // 5. Obter montarias públicas do perfil pesquisado
  const { data: publicMounts } = await supabase
    .from('user_public_mounts')
    .select('*')
    .eq('profile_id', targetProfile.id)
    .order('created_at', { ascending: false })

  // 6. Obter postagens públicas do usuário
  const { data: userPosts } = await supabase
    .from('posts')
    .select(`
      *,
      profiles:author_profile_id (display_name, username, avatar_url),
      characters:character_id (name, class_name, level, realm, region, faction),
      likes:post_likes (count),
      comments (
        id, 
        content, 
        created_at, 
        profiles:author_profile_id (display_name, username)
      )
    `)
    .eq('author_profile_id', targetProfile.id)
    .order('created_at', { ascending: false })

  // 7. Obter status de relacionamento (seguidores e amigos) se logado
  let isFollowing = false
  if (currentUser && currentUser.id !== targetProfile.id) {
    const { data: follow } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_profile_id', currentUser.id)
      .eq('following_profile_id', targetProfile.id)
      .maybeSingle()

    isFollowing = !!follow
  }

  const isOwnProfile = currentUser?.id === targetProfile.id

  return (
    <div className="dark-theme bg-[#0B0E14] text-[#F0F4F8] min-h-screen font-sans">
      <UserHeader profile={currentUserProfile || targetProfile} />

      <main style={{ maxWidth: '1000px', margin: '24px auto', padding: '0 24px' }}>
        <PublicProfileClientView
          targetProfile={targetProfile}
          characters={characters || []}
          publicMounts={publicMounts || []}
          userPosts={userPosts || []}
          isOwnProfile={isOwnProfile}
          isFollowingInitial={isFollowing}
          currentUserId={currentUser?.id || null}
        />
      </main>
    </div>
  )
}
