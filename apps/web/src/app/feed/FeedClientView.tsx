'use client'

import { useState } from 'react'
import { addCharacterAction, setMainCharacterAction } from '@/app/actions/character'
import { createPostAction, toggleLikeAction, deletePostAction, addCommentAction, deleteCommentAction } from '@/app/actions/post'
import { 
  followUserAction, 
  unfollowUserAction, 
  sendFriendRequestAction, 
  respondFriendRequestAction 
} from '@/app/actions/social'
import Link from 'next/link'
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
  visibility: 'public' | 'friends' | 'private'
}

interface Comment {
  id: string
  content: string
  created_at: string
  profiles?: {
    display_name: string
    username: string
  }
}

interface Post {
  id: string
  content: string
  created_at: string
  author_profile_id: string
  profiles?: {
    display_name: string
    username: string
    avatar_url: string | null
  }
  characters?: {
    name: string
    class_name: string
    faction?: string | null
  }
  post_likes?: { profile_id: string }[]
  comments?: Comment[]
}

interface FeedClientViewProps {
  profile: any
  characters: Character[]
  posts: Post[]
  currentUserId: string
  pendingRequests: any[]
  suggestedPlayers: any[]
  followingIds: string[]
  activeFilter: string
}

export default function FeedClientView({
  profile,
  characters,
  posts,
  currentUserId,
  pendingRequests,
  suggestedPlayers,
  followingIds,
  activeFilter,
}: FeedClientViewProps) {
  const [postContent, setPostContent] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>('')
  const [showAddCharModal, setShowAddCharModal] = useState(false)
  const [isPosting, setIsPosting] = useState(false)

  // Função helper para extrair ID do YouTube e retornar URL do Embed estritamente
  const getYouTubeEmbedUrl = (mediaUrl: string | null | undefined, contentText: string) => {
    // Se a mediaUrl for uma foto (ex: unsplash / avatar), ignorar para não inflar no corpo do post
    const targetUrl = (mediaUrl && (mediaUrl.includes('youtube.com') || mediaUrl.includes('youtu.be'))) 
      ? mediaUrl 
      : (contentText && (contentText.includes('youtube.com') || contentText.includes('youtu.be'))) 
        ? contentText 
        : null

    if (!targetUrl) return null
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i
    const match = targetUrl.match(regExp)
    return (match && match[1]) ? `https://www.youtube.com/embed/${match[1]}` : null
  }

  // Estado para comentário aberto em cada post
  const [openCommentPostId, setOpenCommentPostId] = useState<string | null>(null)
  const [commentText, setCommentText] = useState('')
  const [isCommenting, setIsCommenting] = useState(false)

  // Form State para adicionar personagem
  const [newChar, setNewChar] = useState({
    name: '',
    realm: '',
    region: 'US',
    className: 'Mago',
    raceName: 'Humano',
    level: 80,
    guildName: '',
    visibility: 'public' as 'public' | 'friends' | 'private',
  })
  const [charError, setCharError] = useState<string | null>(null)
  const [charLoading, setCharLoading] = useState(false)

  const handleCreatePost = async () => {
    if (!postContent.trim() && !youtubeUrl.trim()) return
    setIsPosting(true)
    await createPostAction(postContent, selectedCharacterId || undefined, youtubeUrl.trim() || undefined)
    setPostContent('')
    setYoutubeUrl('')
    setIsPosting(false)
  }

  const handleAddComment = async (postId: string) => {
    if (!commentText.trim()) return
    setIsCommenting(true)
    await addCommentAction(postId, commentText)
    setCommentText('')
    setIsCommenting(false)
  }

  const handleAddCharacter = async (e: React.FormEvent) => {
    e.preventDefault()
    setCharError(null)
    setCharLoading(true)

    const res = await addCharacterAction(newChar)
    setCharLoading(false)

    if (res.success) {
      setShowAddCharModal(false)
      setNewChar({
        name: '',
        realm: '',
        region: 'US',
        className: 'Mago',
        raceName: 'Humano',
        level: 80,
        guildName: '',
        visibility: 'public',
      })
    } else {
      setCharError(res.error || 'Erro ao adicionar personagem.')
    }
  }

  const handleSetMain = async (charId: string) => {
    await setMainCharacterAction(charId)
  }

  return (
    <div className="space-y-6">
      
      {/* Solicitações de Amizade Pendentes */}
      {pendingRequests.length > 0 && (
        <div className="bg-[#141923] border border-[#C89B3C] rounded-xl p-4 space-y-3">
          <h4 className="font-cinzel text-xs font-bold text-[#F5D166] uppercase tracking-wider flex items-center gap-2">
            <i className="fa-solid fa-scroll text-[#F5D166]"></i> Solicitações de Amizade Pendentes ({pendingRequests.length})
          </h4>
          <div className="space-y-2">
            {pendingRequests.map((req) => (
              <div key={req.id} className="flex justify-between items-center bg-[#0B0E14] p-3 rounded border border-[#263045]">
                <div className="flex items-center gap-3">
                  <img src={req.requester?.avatar_url || "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80"} alt="Avatar" className="avatar-sm" />
                  <div>
                    <span className="font-bold text-sm block">{req.requester?.display_name}</span>
                    <span className="text-xs text-slate-400">@{req.requester?.username}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => respondFriendRequestAction(req.id, 'accepted')}
                    className="btn-primary-sm bg-emerald-600 text-white text-xs px-3 py-1 rounded"
                  >
                    Aceitar
                  </button>
                  <button 
                    onClick={() => respondFriendRequestAction(req.id, 'rejected')}
                    className="btn-secondary-sm bg-red-950 text-red-300 text-xs px-3 py-1 rounded"
                  >
                    Recusar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Caixa de Criação de Post */}
      <div className="create-post-card">
        <div className="creator-header">
          <img 
            src={profile?.avatar_url || "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80"} 
            alt="Avatar" 
            className="avatar-sm" 
          />
          <select 
            className="char-selector-input"
            value={selectedCharacterId}
            onChange={(e) => setSelectedCharacterId(e.target.value)}
          >
            <option value="">Publicar como {profile?.display_name} (Conta)</option>
            {[...characters].sort((a, b) => {
              const isAMain = a.id === profile?.main_character_id
              const isBMain = b.id === profile?.main_character_id
              if (isAMain) return -1
              if (isBMain) return 1
              if (b.level !== a.level) return b.level - a.level
              return a.name.localeCompare(b.name)
            }).map((char) => (
              <option key={char.id} value={char.id}>
                Publicar via {char.name} ({char.class_name} Lvl {char.level})
              </option>
            ))}
          </select>
        </div>

        <textarea 
          className="post-input" 
          placeholder="O que você conquistou em Azeroth hoje? Compartilhe um Transmog, RIO, Raids ou Vídeo..."
          value={postContent}
          onChange={(e) => setPostContent(e.target.value)}
        ></textarea>

        {/* Input de URL do YouTube com Classe Padrão post-input */}
        <div className="relative mb-3">
          <input 
            type="text" 
            placeholder="▶ Cole a URL do vídeo do YouTube aqui (https://www.youtube.com/watch?v=...)..." 
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            className="post-input text-xs"
            style={{ minHeight: '44px', marginBottom: 0, paddingRight: youtubeUrl ? '36px' : '12px' }}
          />
          {youtubeUrl && (
            <button 
              type="button" 
              onClick={() => setYoutubeUrl('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              title="Limpar link"
            >
              ✕
            </button>
          )}
        </div>

        <div className="creator-actions">
          <div className="attach-btns">
            <button className="attach-btn" title="Adicionar Transmog"><i className="fa-solid fa-shirt"></i> Transmog</button>
            <button className="attach-btn" title="Adicionar Conquista"><i className="fa-solid fa-trophy text-[#C89B3C]"></i> Conquista</button>
            <button className="attach-btn" title="Adicionar Run M+"><i className="fa-solid fa-dungeon"></i> M+ Key</button>
          </div>
          <button 
            className="btn-primary"
            onClick={handleCreatePost}
            disabled={isPosting}
          >
            {isPosting ? 'Publicando...' : 'Publicar'}
          </button>
        </div>
      </div>



      {/* Sugestões de Jogadores para Seguir */}
      {suggestedPlayers.length > 0 && (
        <div className="bg-[#141923] border border-[#263045] rounded-xl p-4">
          <h4 className="font-cinzel text-xs font-bold text-[#C89B3C] uppercase tracking-wider mb-3 flex items-center gap-2">
            <i className="fa-solid fa-[#C89B3C] fa-compass"></i> Sugestões de Jogadores de Azeroth
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {suggestedPlayers.map((player) => {
              const isFollowing = followingIds.includes(player.id)
              return (
                <div key={player.id} className="flex justify-between items-center bg-[#0B0E14] p-3 rounded border border-[#263045]">
                  <div className="flex items-center gap-2">
                    <img src={player.avatar_url || "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80"} alt="Avatar" className="avatar-sm" />
                    <div>
                      <span className="font-bold text-xs block">{player.display_name}</span>
                      <span className="text-[10px] text-slate-400">@{player.username}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {isFollowing ? (
                      <button 
                        onClick={() => unfollowUserAction(player.id)}
                        className="text-[10px] bg-slate-800 text-slate-300 px-2 py-1 rounded"
                      >
                        Seguindo
                      </button>
                    ) : (
                      <button 
                        onClick={() => followUserAction(player.id)}
                        className="text-[10px] bg-[#C89B3C] text-black font-bold px-2 py-1 rounded"
                      >
                        + Seguir
                      </button>
                    )}
                    <button 
                      onClick={() => sendFriendRequestAction(player.id)}
                      className="text-[10px] border border-[#C89B3C] text-[#C89B3C] px-2 py-1 rounded"
                      title="Enviar Pedido de Amizade"
                    >
                      + Amigo
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}



      {/* Stream do Feed com Comentários e Exclusão */}
      <div className="posts-stream space-y-4">
        {posts.map((post) => {
          const isLiked = post.post_likes?.some((like) => like.profile_id === currentUserId)
          const likesCount = post.post_likes?.length || 0
          const isAuthor = post.author_profile_id === currentUserId
          const commentsList = post.comments || []
          const isCommentOpen = openCommentPostId === post.id

          const isGuildRecruitment = (post as any).post_type === 'guild_recruitment'
          const isLivePromotion = (post as any).post_type === 'live_promo'

          return (
            <article key={post.id} className={`post-card ${isGuildRecruitment ? 'border-[#C89B3C] shadow-[0_0_15px_rgba(200,155,60,0.15)] relative overflow-hidden' : isLivePromotion ? 'border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.15)] relative overflow-hidden' : ''}`}>
              {isGuildRecruitment && (
                <div className="absolute top-0 right-0 bg-[#C89B3C] text-black text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-md uppercase tracking-wider flex items-center gap-1.5 z-10">
                  <i className="fa-solid fa-shield-halved"></i> Vaga de Guilda
                </div>
              )}
              {isLivePromotion && (
                <div className="absolute top-0 right-0 bg-purple-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-md uppercase tracking-wider flex items-center gap-1.5 z-10">
                  <i className="fa-solid fa-video animate-pulse"></i> Stream On
                </div>
              )}
              <div className="post-header">
                <div className="author-info">
                  <Link href={post.profiles?.username ? `/@${post.profiles.username}` : '#'} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <img 
                      src={post.profiles?.avatar_url || "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80"} 
                      alt="Avatar" 
                      className="avatar-md" 
                      style={{ cursor: 'pointer' }}
                    />
                  </Link>
                  <div>
                    <div className="author-title">
                      <Link href={post.profiles?.username ? `/@${post.profiles.username}` : '#'} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <span className="author-name" style={{ cursor: 'pointer' }}>{post.profiles?.display_name || 'Jogador'}</span>
                      </Link>
                      {post.characters && (
                        <span className="via-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          via 
                          {post.characters.faction && (
                            <img 
                              src={post.characters.faction === 'alliance' ? 'https://assets-bwa.worldofwarcraft.blizzard.com/dab2428aa2f51e140c9a.png' : 'https://assets-bwa.worldofwarcraft.blizzard.com/3edbc547ab318bd385b2.png'} 
                              alt={post.characters.faction === 'alliance' ? 'Aliança' : 'Horda'} 
                              style={{ width: '14px', height: '14px', objectFit: 'contain', display: 'inline-block', verticalAlign: 'middle' }} 
                            />
                          )}
                          <strong style={{ color: getClassColor(post.characters.class_name) }}>{post.characters.name} ({post.characters.class_name})</strong>
                        </span>
                      )}
                    </div>
                    <span className="post-time">{new Date(post.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                {isAuthor && (
                  <button 
                    type="button"
                    onClick={() => deletePostAction(post.id)}
                    style={{ background: 'transparent', backgroundColor: 'transparent', border: 'none', outline: 'none', padding: '4px', cursor: 'pointer', color: '#94A3B8', boxShadow: 'none' }}
                    className="hover:text-red-400 transition-colors"
                    title="Excluir Post"
                  >
                    <i className="fa-solid fa-trash-can" style={{ background: 'transparent', backgroundColor: 'transparent', fontSize: '13px' }}></i>
                  </button>
                )}
              </div>
              
              <div className="post-body">
                <p>{post.content}</p>

                {/* Renderizador do Iframe de Embed do YouTube (Apenas quando houver URL de vídeo válida) */}
                {(() => {
                  const embedUrl = getYouTubeEmbedUrl((post as any).media_url, post.content)
                  if (!embedUrl) return null
                  return (
                    <div className="mt-4 w-full rounded-lg overflow-hidden border border-[#C89B3C]/30 bg-black shadow-lg" style={{ position: 'relative', width: '100%', paddingTop: '56.25%' }}>
                      <iframe 
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                        src={embedUrl}
                        title="YouTube video player"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      ></iframe>
                    </div>
                  )
                })()}
              </div>

              <div className="post-footer">
                <button 
                  className={`post-action-btn ${isLiked ? 'liked' : ''}`}
                  onClick={() => toggleLikeAction(post.id)}
                >
                  <span className="action-icon">
                    <i className={isLiked ? "fa-solid fa-heart text-red-500" : "fa-regular fa-heart"}></i>
                  </span> 
                  <span className="like-count">{likesCount}</span>
                </button>
                
                <button 
                  className="post-action-btn"
                  onClick={() => setOpenCommentPostId(isCommentOpen ? null : post.id)}
                >
                  <span className="action-icon"><i className="fa-regular fa-[#F0F4F8] fa-message"></i></span> {commentsList.length} Comentários
                </button>
              </div>

              {/* Seção de Comentários Estilo YouTube Oficial */}
              {isCommentOpen && (
                <div className="mt-4 pt-4 border-t border-[#263045] space-y-6">
                  
                  {/* Formulário de Novo Comentário (Avatar à esquerda + Caixa + Botão em Linha Única à direita) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                    <img 
                      src={profile?.avatar_url || "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80"} 
                      alt="Meu Avatar" 
                      style={{ width: '40px', height: '40px', minWidth: '40px', minHeight: '40px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                      <input 
                        type="text"
                        placeholder="Escreva um comentário em Azeroth..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddComment(post.id)
                        }}
                        className="post-input text-xs"
                        style={{ flex: 1, minHeight: '42px', height: '42px', marginBottom: 0, padding: '0 14px' }}
                      />
                      <button 
                        onClick={() => handleAddComment(post.id)}
                        disabled={isCommenting || !commentText.trim()}
                        className="btn-primary text-xs shrink-0 cursor-pointer disabled:opacity-50"
                        style={{ height: '42px', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        {isCommenting ? '...' : 'Comentar'}
                      </button>
                    </div>
                  </div>

                  {/* 2. Lista de Comentários idênticos à Imagem de Referência 1 */}
                  {commentsList.length > 0 && (
                    <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid #263045', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {commentsList.map((c) => {
                        const isCommentAuthor = (c as any).author_profile_id === currentUserId

                        return (
                          <div key={c.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                            {/* Avatar do Autor do Comentário */}
                            <img 
                              src={(c.profiles as any)?.avatar_url || "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80"} 
                              alt="Avatar" 
                              style={{ width: '36px', height: '36px', minWidth: '36px', minHeight: '36px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, marginTop: '2px' }}
                            />
                            
                            {/* Conteúdo do Comentário */}
                            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                              {/* Linha de Username + Tempo + Botão Excluir Comentário Próprio */}
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', flex: 1 }}>
                                  <span style={{ fontWeight: 700, color: '#F0F4F8' }}>
                                    @{(c.profiles as any)?.username || (c.profiles as any)?.display_name?.toLowerCase().replace(/\s+/g, '') || 'jogador'}
                                  </span>
                                  <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>
                                    há {new Date(c.created_at).toLocaleDateString('pt-BR')}
                                  </span>
                                </div>

                                {isCommentAuthor && (
                                  <button 
                                    type="button"
                                    onClick={() => deleteCommentAction(c.id)}
                                    style={{ background: 'transparent', backgroundColor: 'transparent', border: 'none', outline: 'none', padding: '2px 4px', cursor: 'pointer', color: '#64748B', boxShadow: 'none' }}
                                    className="hover:text-red-400 transition-colors"
                                    title="Excluir meu comentário"
                                  >
                                    <i className="fa-solid fa-trash-can" style={{ background: 'transparent', backgroundColor: 'transparent', fontSize: '11px' }}></i>
                                  </button>
                                )}
                              </div>
                              
                              {/* Texto do Comentário */}
                              <p style={{ fontSize: '0.85rem', color: '#E2E8F0', margin: 0, wordBreak: 'break-word', fontWeight: 400 }}>
                                {c.content}
                              </p>

                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                </div>
              )}
            </article>
          )
        })}
      </div>

      {/* Modal para Adicionar Personagem */}
      {showAddCharModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#141923] border border-[#C89B3C] rounded-xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-cinzel text-lg font-bold text-[#F5D166] flex items-center gap-2">
              <i className="fa-solid fa-shield-halved text-[#F5D166]"></i> Adicionar Personagem de WoW
            </h3>

            {charError && (
              <div className="p-2 bg-red-950 border border-red-500 text-red-300 text-xs rounded">
                {charError}
              </div>
            )}

            <form onSubmit={handleAddCharacter} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Nome do Personagem</label>
                <input 
                  type="text" 
                  required
                  value={newChar.name}
                  onChange={(e) => setNewChar({ ...newChar, name: e.target.value })}
                  placeholder="Ex: Arthas"
                  className="w-full bg-[#0B0E14] border border-[#263045] rounded p-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1">Reino (Realm)</label>
                  <input 
                    type="text" 
                    required
                    value={newChar.realm}
                    onChange={(e) => setNewChar({ ...newChar, realm: e.target.value })}
                    placeholder="Ex: Stormrage"
                    className="w-full bg-[#0B0E14] border border-[#263045] rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Região</label>
                  <select 
                    value={newChar.region}
                    onChange={(e) => setNewChar({ ...newChar, region: e.target.value })}
                    className="w-full bg-[#0B0E14] border border-[#263045] rounded p-2 text-white"
                  >
                    <option value="US">US (América)</option>
                    <option value="BR">BR (Brasil)</option>
                    <option value="EU">EU (Europa)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1">Classe</label>
                  <select 
                    value={newChar.className}
                    onChange={(e) => setNewChar({ ...newChar, className: e.target.value })}
                    className="w-full bg-[#0B0E14] border border-[#263045] rounded p-2 text-white"
                  >
                    <option value="Mago">Mago</option>
                    <option value="Guerreiro">Guerreiro</option>
                    <option value="Ladino">Ladino</option>
                    <option value="Sacerdote">Sacerdote</option>
                    <option value="Caçador">Caçador</option>
                    <option value="Paladino">Paladino</option>
                    <option value="Bruxo">Bruxo</option>
                    <option value="Cavaleiro da Morte">Cavaleiro da Morte</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Nível</label>
                  <input 
                    type="number" 
                    min={1} 
                    max={80}
                    value={newChar.level}
                    onChange={(e) => setNewChar({ ...newChar, level: parseInt(e.target.value) || 80 })}
                    className="w-full bg-[#0B0E14] border border-[#263045] rounded p-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Guilda (Opcional)</label>
                <input 
                  type="text" 
                  value={newChar.guildName}
                  onChange={(e) => setNewChar({ ...newChar, guildName: e.target.value })}
                  placeholder="Ex: Knights of Azeroth"
                  className="w-full bg-[#0B0E14] border border-[#263045] rounded p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Visibilidade do Personagem</label>
                <select 
                  value={newChar.visibility}
                  onChange={(e) => setNewChar({ ...newChar, visibility: e.target.value as any })}
                  className="w-full bg-[#0B0E14] border border-[#263045] rounded p-2 text-white"
                >
                  <option value="public"><i className="fa-solid fa-globe"></i> Público (Todos podem ver no perfil)</option>
                  <option value="friends"><i className="fa-solid fa-user-group"></i> Somente Amigos</option>
                  <option value="private"><i className="fa-solid fa-lock"></i> Privado (Apenas Você)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowAddCharModal(false)}
                  className="px-3 py-1.5 bg-[#263045] text-slate-300 rounded"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={charLoading}
                  className="px-4 py-1.5 bg-[#C89B3C] text-black font-bold rounded"
                >
                  {charLoading ? 'Salvando...' : 'Salvar Personagem'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
