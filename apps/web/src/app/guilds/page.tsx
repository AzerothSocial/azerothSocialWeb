import { createClient } from '@/lib/supabase/server'
import GuildsClientView from './GuildsClientView'
import UserHeader from '@/components/UserHeader'
import { getClassColor } from '@/lib/wow-colors'

export default async function GuildsPage() {
  const supabase = await createClient()

  // 1. Usuário logado e perfil
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // 2. Personagens do usuário
  const { data: characters } = await supabase
    .from('characters')
    .select('*')
    .eq('profile_id', user.id)

  // 3. Buscar recrutamentos de guilda com detalhes do post e autor
  const { data: recruitments } = await supabase
    .from('guild_recruitments')
    .select(`
      *,
      posts:post_id (
        id,
        content,
        created_at,
        author_profile_id,
        profiles:author_profile_id (display_name, username, avatar_url)
      )
    `)
    .order('created_at', { ascending: false })

  // 4. Métricas Sociais (Seguidores & Seguindo)
  const { count: followersCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_profile_id', user.id)

  const { count: followingCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_profile_id', user.id)

  // 5. Lista de Amigos
  const { data: friendships } = await supabase
    .from('friendships')
    .select(`
      requester_profile_id,
      addressee_profile_id,
      profile1:requester_profile_id (id, display_name, username, avatar_url),
      profile2:addressee_profile_id (id, display_name, username, avatar_url)
    `)
    .or(`requester_profile_id.eq.${user.id},addressee_profile_id.eq.${user.id}`)

  const friendsList = friendships?.map(f => f.requester_profile_id === user.id ? f.profile2 : f.profile1).filter(Boolean) || []
  const mainCharacter = characters?.find(c => c.id === profile?.main_character_id) || characters?.[0]

  return (
    <div className="dark-theme bg-[#0B0E14] text-[#F0F4F8] min-h-screen font-sans">
      <UserHeader profile={profile} />
      
      {/* Container Principal de 3 Colunas Padrão da Taverna */}
      <div className="app-layout">
        
        {/* Sidebar Esquerda: Card de Identidade do Jogador */}
        <aside className="sidebar-left">
          <div className="user-card-widget">
            <div className="banner-bg"></div>
            <div className="widget-body">
              <img 
                src={profile?.avatar_url || "/images/avatar.png"} 
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
                          Lvl {mainCharacter.level}{mainCharacter.ilevel ? ` (${mainCharacter.ilevel})` : ''}
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
            <a href="/feed" className="menu-item">
              <span className="icon"><i className="fa-solid fa-newspaper"></i></span> Meu Feed
            </a>
            <a href="/guilds" className="menu-item active">
              <span className="icon"><i className="fa-solid fa-shield-halved"></i></span> Guildas de Azeroth
            </a>
            <a href="/settings" className="menu-item">
              <span className="icon"><i className="fa-solid fa-gear"></i></span> Configurações
            </a>
          </nav>
        </aside>

        {/* Área Central & Sidebar Direita controladas pelo Client View */}
        <GuildsClientView 
          profile={profile}
          characters={characters || []}
          recruitments={recruitments || []}
          currentUserId={user.id}
          friendsList={friendsList}
        />
      </div>
    </div>
  )
}
