'use client'

import { useState } from 'react'
import Link from 'next/link'
import { followUserAction, unfollowUserAction } from '@/app/actions/social'
import { getClassColor } from '@/lib/wow-colors'

interface Character {
  id: string
  name: string
  realm: string
  region: string
  class_name: string
  race_name: string
  level: number
  guild_name: string | null
  faction?: string
  visibility: 'public' | 'friends' | 'private'
}

interface PublicMount {
  id: string
  mount_id: number
  mount_name: string
  mount_image?: string
}

interface PublicProfileClientViewProps {
  targetProfile: any
  characters: Character[]
  publicMounts: PublicMount[]
  userPosts: any[]
  isOwnProfile: boolean
  isFollowingInitial: boolean
  currentUserId: string | null
}

export default function PublicProfileClientView({
  targetProfile,
  characters,
  publicMounts,
  userPosts,
  isOwnProfile,
  isFollowingInitial,
  currentUserId
}: PublicProfileClientViewProps) {
  const [activeTab, setActiveTab] = useState<'characters' | 'mounts' | 'posts'>('characters')
  const [isFollowing, setIsFollowing] = useState(isFollowingInitial)
  const [followLoading, setFollowLoading] = useState(false)

  // Character sorting (Main character first)
  const mainCharacter = characters.find(c => c.id === targetProfile.main_character_id) || characters[0]

  const handleToggleFollow = async () => {
    if (!currentUserId) {
      alert('Faça login para seguir outros jogadores!')
      return
    }

    setFollowLoading(true)
    if (isFollowing) {
      setIsFollowing(false)
      const res = await unfollowUserAction(targetProfile.id)
      if (!res.success) setIsFollowing(true)
    } else {
      setIsFollowing(true)
      const res = await followUserAction(targetProfile.id)
      if (!res.success) setIsFollowing(false)
    }
    setFollowLoading(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Banner / Card de Identidade do Jogador */}
      <div style={{ backgroundColor: '#141923', border: '1px solid #C89B3C', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
        <div style={{ height: '120px', background: 'linear-gradient(135deg, #1E1B4B 0%, #311B92 50%, #4A148C 100%)' }}></div>
        
        <div style={{ padding: '0 24px 24px', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '-45px', flexWrap: 'wrap', gap: '16px' }}>
            
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px' }}>
              <img 
                src={targetProfile.avatar_url || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80'} 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80'
                }}
                alt="Avatar" 
                style={{ width: '90px', height: '90px', borderRadius: '50%', border: '3px solid #C89B3C', objectFit: 'cover', backgroundColor: '#0B0E14' }} 
              />

              <div style={{ marginBottom: '4px' }}>
                <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: '1.5rem', fontWeight: 900, color: '#F5D166', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {targetProfile.display_name} <span style={{ color: '#C89B3C', fontSize: '1.1rem' }} title="Jogador Verificado">✓</span>
                </h1>
                <p style={{ color: '#94A3B8', fontSize: '0.88rem' }}>@{targetProfile.username}</p>
              </div>
            </div>

            {/* Ações do Perfil */}
            <div>
              {isOwnProfile ? (
                <Link
                  href="/settings"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: '#C89B3C',
                    color: '#000',
                    fontWeight: 700,
                    padding: '8px 16px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontSize: '0.85rem'
                  }}
                >
                  <i className="fa-solid fa-gear"></i> Editar Perfil
                </Link>
              ) : (
                <button
                  onClick={handleToggleFollow}
                  disabled={followLoading}
                  style={{
                    backgroundColor: isFollowing ? 'rgba(239, 68, 68, 0.15)' : '#3B82F6',
                    color: isFollowing ? '#FCA5A5' : '#FFF',
                    border: isFollowing ? '1px solid #EF4444' : 'none',
                    fontWeight: 700,
                    padding: '8px 18px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <i className={isFollowing ? "fa-solid fa-user-minus" : "fa-solid fa-user-plus"}></i>
                  {isFollowing ? 'Deixar de Seguir' : 'Seguir Jogador'}
                </button>
              )}
            </div>

          </div>

          <p style={{ color: '#94A3B8', fontSize: '0.9rem', marginTop: '16px', fontStyle: targetProfile.bio ? 'normal' : 'italic' }}>
            {targetProfile.bio || '"Nenhuma biografia informada."'}
          </p>

          {/* Destaque do Personagem Principal */}
          {mainCharacter && (
            <div style={{ marginTop: '20px', backgroundColor: '#0B0E14', border: '1px solid #C89B3C', borderRadius: '12px', padding: '14px 18px' }}>
              <span style={{ fontSize: '0.65rem', color: '#C89B3C', fontWeight: 800, letterSpacing: '0.5px' }}>
                ★ PERSONAGEM PRINCIPAL
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                <img 
                  src={mainCharacter.faction === 'alliance' ? 'https://assets-bwa.worldofwarcraft.blizzard.com/dab2428aa2f51e140c9a.png' : 'https://assets-bwa.worldofwarcraft.blizzard.com/3edbc547ab318bd385b2.png'} 
                  alt={mainCharacter.faction === 'alliance' ? 'Aliança' : 'Horda'} 
                  style={{ width: '32px', height: '32px', objectFit: 'contain' }} 
                />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: getClassColor(mainCharacter.class_name), fontWeight: 800, fontSize: '1.05rem' }}>
                      {mainCharacter.name}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#CBD5E1' }}>Nível {mainCharacter.level}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                    {mainCharacter.class_name} · {mainCharacter.realm} ({mainCharacter.region}) 
                    {mainCharacter.guild_name && <span style={{ color: '#F5D166', marginLeft: '6px' }}>&lt;{mainCharacter.guild_name}&gt;</span>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Abas do Perfil */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '20px', borderBottom: '1px solid #263045', paddingBottom: '2px' }}>
            <button 
              onClick={() => setActiveTab('characters')}
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: '0.85rem',
                fontWeight: 700,
                padding: '8px 16px',
                borderRadius: '8px 8px 0 0',
                border: 'none',
                borderBottom: activeTab === 'characters' ? '2px solid #C89B3C' : '2px solid transparent',
                color: activeTab === 'characters' ? '#F5D166' : '#94A3B8',
                backgroundColor: activeTab === 'characters' ? 'rgba(200, 155, 60, 0.1)' : 'transparent',
                cursor: 'pointer'
              }}
            >
              <i className="fa-regular fa-chess-knight" style={{ marginRight: '6px' }}></i> Personagens ({characters.length})
            </button>

            <button 
              onClick={() => setActiveTab('mounts')}
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: '0.85rem',
                fontWeight: 700,
                padding: '8px 16px',
                borderRadius: '8px 8px 0 0',
                border: 'none',
                borderBottom: activeTab === 'mounts' ? '2px solid #C89B3C' : '2px solid transparent',
                color: activeTab === 'mounts' ? '#F5D166' : '#94A3B8',
                backgroundColor: activeTab === 'mounts' ? 'rgba(200, 155, 60, 0.1)' : 'transparent',
                cursor: 'pointer'
              }}
            >
              <i className="fa-solid fa-horse" style={{ marginRight: '6px' }}></i> Montarias ({publicMounts.length})
            </button>

            <button 
              onClick={() => setActiveTab('posts')}
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: '0.85rem',
                fontWeight: 700,
                padding: '8px 16px',
                borderRadius: '8px 8px 0 0',
                border: 'none',
                borderBottom: activeTab === 'posts' ? '2px solid #C89B3C' : '2px solid transparent',
                color: activeTab === 'posts' ? '#F5D166' : '#94A3B8',
                backgroundColor: activeTab === 'posts' ? 'rgba(200, 155, 60, 0.1)' : 'transparent',
                cursor: 'pointer'
              }}
            >
              <i className="fa-solid fa-scroll" style={{ marginRight: '6px' }}></i> Publicações ({userPosts.length})
            </button>
          </div>

        </div>
      </div>

      {/* ABA 1: PERSONAGENS */}
      {activeTab === 'characters' && (
        <div style={{ backgroundColor: '#141923', border: '1px solid #263045', borderRadius: '16px', padding: '24px' }}>
          <h2 style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: '1.1rem', color: '#F5D166', marginBottom: '16px' }}>
            Personagens de {targetProfile.display_name} ({characters.length})
          </h2>

          {characters.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', border: '1px dashed #263045', borderRadius: '12px', color: '#94A3B8', fontSize: '0.9rem' }}>
              Nenhum personagem público cadastrado neste perfil ainda.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
              {characters.map((char) => {
                const isMain = char.id === targetProfile.main_character_id

                return (
                  <div 
                    key={char.id} 
                    style={{ 
                      backgroundColor: '#0B0E14', 
                      border: isMain ? '1px solid #C89B3C' : '1px solid #263045', 
                      borderRadius: '12px', 
                      padding: '16px', 
                      position: 'relative',
                      boxShadow: isMain ? '0 0 15px rgba(200, 155, 60, 0.2)' : 'none'
                    }}
                  >
                    {isMain && (
                      <span style={{ position: 'absolute', top: '-10px', right: '12px', backgroundColor: '#C89B3C', color: '#000', fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px', borderRadius: '4px' }}>
                        ★ PRINCIPAL
                      </span>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ color: getClassColor(char.class_name), fontWeight: 700, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <img 
                          src={char.faction === 'alliance' ? 'https://assets-bwa.worldofwarcraft.blizzard.com/dab2428aa2f51e140c9a.png' : 'https://assets-bwa.worldofwarcraft.blizzard.com/3edbc547ab318bd385b2.png'} 
                          alt={char.faction === 'alliance' ? 'Aliança' : 'Horda'} 
                          style={{ width: '18px', height: '18px', objectFit: 'contain' }} 
                        />
                        {char.name}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: '#CBD5E1' }}>Lvl {char.level}</span>
                    </div>

                    <p style={{ fontSize: '0.8rem', color: '#94A3B8', marginBottom: '4px' }}>
                      {char.class_name} · {char.realm} ({char.region})
                    </p>
                    <p style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                      Guilda: <strong style={{ color: '#F5D166' }}>{char.guild_name ? `<${char.guild_name}>` : 'Nenhuma'}</strong>
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ABA 2: MONTARIAS PÚBLICAS */}
      {activeTab === 'mounts' && (
        <div style={{ backgroundColor: '#141923', border: '1px solid #263045', borderRadius: '16px', padding: '24px' }}>
          <h2 style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: '1.1rem', color: '#F5D166', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-horse"></i> Montarias de Destaque ({publicMounts.length})
          </h2>

          {publicMounts.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', border: '1px dashed #263045', borderRadius: '12px', color: '#94A3B8', fontSize: '0.9rem' }}>
              Este jogador ainda não destacou montarias públicas no seu perfil.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
              {publicMounts.map((m) => (
                <div 
                  key={m.id}
                  style={{
                    backgroundColor: '#0B0E14',
                    border: '1px solid #C89B3C',
                    borderRadius: '12px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 0 12px rgba(200, 155, 60, 0.15)'
                  }}
                >
                  <div style={{ width: '100%', height: '120px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#141923', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {m.mount_image ? (
                      <img 
                        src={m.mount_image} 
                        alt={m.mount_name} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <i className="fa-solid fa-horse" style={{ fontSize: '2rem', color: '#94A3B8' }}></i>
                    )}
                  </div>

                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F5D166', lineHeight: '1.2', textAlign: 'center' }}>
                    {m.mount_name}
                  </h4>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ABA 3: PUBLICAÇÕES */}
      {activeTab === 'posts' && (
        <div style={{ backgroundColor: '#141923', border: '1px solid #263045', borderRadius: '16px', padding: '24px' }}>
          <h2 style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: '1.1rem', color: '#F5D166', marginBottom: '16px' }}>
            Publicações no Feed ({userPosts.length})
          </h2>

          {userPosts.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', border: '1px dashed #263045', borderRadius: '12px', color: '#94A3B8', fontSize: '0.9rem' }}>
              Nenhuma publicação feita até o momento.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {userPosts.map((post) => (
                <div key={post.id} style={{ backgroundColor: '#0B0E14', border: '1px solid #263045', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <img 
                      src={post.profiles?.avatar_url || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80'} 
                      alt="Avatar" 
                      style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} 
                    />
                    <div>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#F0F4F8' }}>{post.profiles?.display_name}</span>
                      <span style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block' }}>
                        {new Date(post.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.9rem', color: '#CBD5E1', lineHeight: 1.5, marginBottom: '12px', whiteSpace: 'pre-wrap' }}>
                    {post.content}
                  </p>

                  {post.image_url && (
                    <img 
                      src={post.image_url} 
                      alt="Post content" 
                      style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', borderRadius: '8px', marginBottom: '12px' }} 
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  )
}
