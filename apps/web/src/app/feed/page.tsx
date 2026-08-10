import { createClient } from '@/lib/supabase/server'
import FeedClientView from './FeedClientView'
import UserHeader from '@/components/UserHeader'
import { getClassColor } from '@/lib/wow-colors'

export default async function FeedPage({
  searchParams,
}: {
  searchParams?: Promise<{ filter?: string }>
}) {
  const resolvedParams = await searchParams
  const activeFilter = resolvedParams?.filter || 'all'

  const supabase = await createClient()

  // 1. Obter usuário logado
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  // 2. Obter perfil do usuário
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // 3. Obter personagens do usuário
  const { data: characters } = await supabase
    .from('characters')
    .select('*')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false })

  // 4. Obter contadores de seguidores e seguindo
  const { count: followersCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_profile_id', user.id)

  const { count: followingCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_profile_id', user.id)

  // 5. Obter lista de amigos (aceitos)
  const { data: friendships } = await supabase
    .from('friendships')
    .select(`
      id,
      requester_profile_id,
      addressee_profile_id,
      requester:requester_profile_id (id, display_name, username, avatar_url),
      addressee:addressee_profile_id (id, display_name, username, avatar_url)
    `)
    .eq('status', 'accepted')
    .or(`requester_profile_id.eq.${user.id},addressee_profile_id.eq.${user.id}`)

  const friendsList = friendships?.map(f => {
    return f.requester_profile_id === user.id ? f.addressee : f.requester
  }) || []

  // 6. Obter solicitações pendentes
  const { data: pendingRequests } = await supabase
    .from('friendships')
    .select(`
      id,
      requester:requester_profile_id (id, display_name, username, avatar_url)
    `)
    .eq('addressee_profile_id', user.id)
    .eq('status', 'pending')

  // 7. Obter sugestões de jogadores
  const { data: suggestedPlayers } = await supabase
    .from('profiles')
    .select('id, display_name, username, avatar_url')
    .neq('id', user.id)
    .limit(5)

  // 8. Obter a lista de IDs seguidos
  const { data: userFollows } = await supabase
    .from('follows')
    .select('following_profile_id')
    .eq('follower_profile_id', user.id)

  const followingIds = userFollows?.map(f => f.following_profile_id) || []

  // 9. Filtragem do Feed (Exclusivamente pessoas seguidas + próprio usuário)
  const allowedAuthors = [user.id, ...followingIds]
  const { data: posts } = await supabase
    .from('posts')
    .select(`
      *,
      profiles:author_profile_id (display_name, username, avatar_url),
      characters:character_id (name, class_name, faction),
      post_likes (profile_id),
      comments (id, content, created_at, profiles:author_profile_id(display_name, username, avatar_url))
    `)
    .is('deleted_at', null)
    .in('author_profile_id', allowedAuthors)
    .order('created_at', { ascending: false })

  const mainCharacter = characters?.find(c => c.id === profile?.main_character_id) || characters?.[0]

  return (
    <div className="dark-theme bg-[#0B0E14] text-[#F0F4F8] min-h-screen font-sans">
      
      {/* Header Superior Reutilizável com Dropdown de Avatar */}
      <UserHeader profile={profile} />

      {/* Container Principal do Layout */}
      <div className="app-layout">
        
        {/* Sidebar Esquerda: Card de Identidade do Jogador */}
        <aside className="sidebar-left">
          <div className="user-card-widget">
            <div className="banner-bg"></div>
            <div className="widget-body">
              <img 
                src={profile?.avatar_url || "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80"} 
                alt="Avatar" 
                className="avatar-lg" 
              />
              <h3 className="profile-name">
                {profile?.display_name} <span className="verified-badge" title="Jogador Verificado">✓</span>
              </h3>
              <p className="profile-handle">@{profile?.username}</p>
              <p className="profile-bio">
                {profile?.bio || '"Guild Master & Mythic+ Enthusiast em Azeroth."'}
              </p>

              {/* Destaque do Personagem Principal */}
              {mainCharacter ? (
                <div className="main-char-box">
                  <span className="main-tag">⭐ PERSONAGEM PRINCIPAL</span>
                  <div className="char-info" style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
                    <img 
                      src={mainCharacter.faction === 'alliance' ? 'https://assets-bwa.worldofwarcraft.blizzard.com/dab2428aa2f51e140c9a.png' : 'https://assets-bwa.worldofwarcraft.blizzard.com/3edbc547ab318bd385b2.png'} 
                      alt={mainCharacter.faction === 'alliance' ? 'Aliança' : 'Horda'} 
                      style={{ width: '28px', height: '28px', objectFit: 'contain', flexShrink: 0 }} 
                    />
                    <div className="char-details" style={{ flex: 1, minWidth: 0 }}>
                      <div className="char-name-lvl" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <span className="char-name" style={{ color: getClassColor(mainCharacter.class_name), fontWeight: 700, fontSize: '0.95rem' }}>
                          {mainCharacter.name}
                        </span>
                        <span className="char-lvl" style={{ fontSize: '0.8rem', color: '#CBD5E1', fontWeight: 700 }}>
                          {mainCharacter.level}
                        </span>
                      </div>
                      <div className="char-sub">{mainCharacter.class_name} · {mainCharacter.realm} ({mainCharacter.region})</div>
                      <div className="char-guild">{mainCharacter.guild_name ? `<${mainCharacter.guild_name}>` : 'Sem guilda'}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="main-char-box">
                  <span className="main-tag">⚠️ NENHUM PERSONAGEM</span>
                  <p className="char-sub mt-1 text-xs">Vincule seus personagens nas Configurações!</p>
                </div>
              )}

              <div className="stats-row">
                <div className="stat-item">
                  <span className="stat-val">{characters?.length || 0}</span>
                  <span className="stat-lbl">Personagens</span>
                </div>
                <div className="stat-item">
                  <span className="stat-val">{followersCount || 0}</span>
                  <span className="stat-lbl">Seguidores</span>
                </div>
                <div className="stat-item">
                  <span className="stat-val">{followingCount || 0}</span>
                  <span className="stat-lbl">Seguindo</span>
                </div>
              </div>
            </div>
          </div>

          <nav className="side-menu">
            <a href="/feed" className={`menu-item ${activeFilter === 'all' ? 'active' : ''}`}>
              <span className="icon">📰</span> Meu Feed
            </a>
            <a href="/feed?filter=following" className={`menu-item ${activeFilter === 'following' ? 'active' : ''}`}>
              <span className="icon">👥</span> Feed de Amigos
            </a>
            <a href="/settings" className="menu-item">
              <span className="icon">⚙️</span> Gerenciar Personagens ({characters?.length || 0})
            </a>
          </nav>
        </aside>

        {/* Área Central Interativa (Feed) */}
        <main className="content-main">
          <FeedClientView 
            profile={profile} 
            characters={characters || []} 
            posts={posts || []} 
            currentUserId={user.id} 
            pendingRequests={pendingRequests || []}
            suggestedPlayers={suggestedPlayers || []}
            followingIds={followingIds}
            activeFilter={activeFilter}
          />
        </main>

        {/* Sidebar Direita: Status Addon e Amigos Conectados */}
        <aside className="sidebar-right">
          <div className="addon-status-card">
            <div className="status-header">
              <span className="status-icon">🎮</span>
              <h4>Azeroth Social Addon</h4>
            </div>
            <p className="status-desc">Instalado & Sincronizado no WoW</p>
            <div className="status-sync">
              <span className="online-indicator"></span> Sincronizado
            </div>
            <a href="/addon-preview" className="btn-addon-shortcut">
              Abrir Simulação do Addon ↗
            </a>
          </div>

          {/* Lista de Amigos Reais do Grafo Social */}
          <div className="widget-box">
            <div className="widget-header">
              <h4>👥 Lista de Amigos ({friendsList.length})</h4>
            </div>
            {friendsList.length === 0 ? (
              <p className="text-xs text-slate-400">Nenhum amigo adicionado ainda.</p>
            ) : (
              <ul className="friends-list">
                {friendsList.map((friend: any) => (
                  <li key={friend.id} className="friend-item">
                    <div className="avatar-wrapper">
                      <img src={friend.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"} alt="Friend" />
                      <span className="status-dot online"></span>
                    </div>
                    <div className="friend-details">
                      <span className="friend-name">{friend.display_name}</span>
                      <span className="friend-playing">@{friend.username}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

      </div>
    </div>
  )
}
