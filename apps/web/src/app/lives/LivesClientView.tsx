'use client'

import { useState } from 'react'
import Link from 'next/link'
import { promoteLiveAction } from '@/app/actions/lives'

interface LivePromotion {
  id: string
  title: string
  stream_url: string
  platform: string
  region: string
  created_at: string
  profiles?: {
    display_name: string
    username: string
    avatar_url: string
  }
}

interface LivesClientViewProps {
  profile: any
  lives: LivePromotion[]
  activeRegion: string
  friendsList: any[]
}

export default function LivesClientView({
  profile,
  lives,
  activeRegion,
  friendsList,
}: LivesClientViewProps) {
  const [showPromoteModal, setShowPromoteModal] = useState(false)
  const [newLive, setNewLive] = useState({
    title: '',
    streamUrl: '',
    platform: 'twitch',
    region: 'BR',
    description: '',
  })
  const [isPromoting, setIsPromoting] = useState(false)

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsPromoting(true)
    await promoteLiveAction(newLive)
    setIsPromoting(false)
    setShowPromoteModal(false)
    setNewLive({
      title: '',
      streamUrl: '',
      platform: 'twitch',
      region: 'BR',
      description: '',
    })
  }

  // Extrair Embed da Twitch ou YouTube
  const getStreamEmbedUrl = (url: string, platform: string) => {
    if (platform === 'twitch') {
      const channel = url.split('/').pop()?.split('?')[0]
      if (channel) {
        // Use window.location.hostname in client to support both localhost and Netlify
        const parent = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
        return `https://player.twitch.tv/?channel=${channel}&parent=${parent}`
      }
    }
    if (platform === 'youtube') {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
      const match = url.match(regExp)
      if (match && match[2].length === 11) return `https://www.youtube.com/embed/${match[2]}`
    }
    return null
  }

  return (
    <>
      <main className="content-main space-y-6">
        {/* Banner Principal de Lives */}
        <div className="flex justify-between items-center bg-[#141923] border border-red-900/60 rounded-xl p-6 shadow-xl">
          <div>
            <h1 className="font-cinzel text-2xl font-bold text-red-400 flex items-center gap-2">
              <i className="fa-solid fa-video text-red-500"></i> Lives Promovidas de World of Warcraft
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              Assista aos melhores streamers de Azeroth ao vivo ou promova sua própria live para a região desejada!
            </p>
          </div>
        </div>

        {/* Filtros Regionais */}
        <div className="flex gap-2">
          <Link href="/lives" className={`px-4 py-2 text-xs font-bold rounded-lg border flex items-center gap-1.5 ${activeRegion === 'all' ? 'bg-[#C89B3C] text-black border-[#C89B3C]' : 'bg-[#141923] text-slate-300 border-[#263045]'}`}>
            <i className="fa-solid fa-earth-americas"></i> Todas as Regiões
          </Link>
          <Link href="/lives?region=BR" className={`px-4 py-2 text-xs font-bold rounded-lg border ${activeRegion === 'BR' ? 'bg-[#C89B3C] text-black border-[#C89B3C]' : 'bg-[#141923] text-slate-300 border-[#263045]'}`}>
            Brasil (BR)
          </Link>
          <Link href="/lives?region=US" className={`px-4 py-2 text-xs font-bold rounded-lg border ${activeRegion === 'US' ? 'bg-[#C89B3C] text-black border-[#C89B3C]' : 'bg-[#141923] text-slate-300 border-[#263045]'}`}>
            América (US)
          </Link>
          <Link href="/lives?region=EU" className={`px-4 py-2 text-xs font-bold rounded-lg border ${activeRegion === 'EU' ? 'bg-[#C89B3C] text-black border-[#C89B3C]' : 'bg-[#141923] text-slate-300 border-[#263045]'}`}>
            Europa (EU)
          </Link>
        </div>

        {/* Grid de Transmissões / Lives */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {lives.length === 0 ? (
            <div className="col-span-2 text-center py-12 bg-[#141923] rounded-xl border border-[#263045]">
              <p className="text-slate-400">Nenhuma live promovida nesta região no momento.</p>
            </div>
          ) : (
            lives.map((live) => {
              const embedUrl = getStreamEmbedUrl(live.stream_url, live.platform)

              return (
                <div key={live.id} className="bg-[#141923] border border-red-950/80 rounded-xl overflow-hidden space-y-3 hover:border-red-600/50 transition">
                  {/* Embed / Iframe da Stream */}
                  {embedUrl ? (
                    <div className="relative w-full overflow-hidden bg-black" style={{ paddingTop: '56.25%' }}>
                      <iframe 
                        className="absolute top-0 left-0 w-full h-full"
                        src={embedUrl}
                        title={live.title}
                        allowFullScreen
                      ></iframe>
                    </div>
                  ) : (
                    <div className="bg-[#0B0E14] h-48 flex items-center justify-center text-slate-500 text-xs">
                      Link de transmissão: {live.stream_url}
                    </div>
                  )}

                  <div className="p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold uppercase bg-red-950 text-red-400 px-2 py-0.5 rounded border border-red-700/50 flex items-center gap-1.5 w-fit">
                          <i className="fa-solid fa-circle text-[8px] text-red-500 animate-pulse"></i> LIVE • Região {live.region}
                        </span>
                        <h3 className="font-bold text-base text-white mt-1">
                          {live.title}
                        </h3>
                      </div>
                      <a 
                        href={live.stream_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs bg-[#263045] hover:bg-[#323f5b] text-white px-3 py-1.5 rounded flex items-center gap-1"
                      >
                        Abrir Canal <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                      </a>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-[#263045]">
                      <img 
                        src={live.profiles?.avatar_url || "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80"} 
                        alt="Streamer" 
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="text-xs text-slate-300">
                        <strong>{live.profiles?.display_name}</strong> (@{live.profiles?.username})
                      </span>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </main>

      {/* Sidebar Direita: Promover Live + Amigos */}
      <aside className="sidebar-right">
        {/* Card Promover Live */}
        <div className="addon-status-card border-red-900/60 shadow-[0_0_15px_rgba(239,68,68,0.15)] relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-red-600/20 rounded-full blur-xl pointer-events-none"></div>
          
          <div className="status-header">
            <span className="status-icon bg-red-950/50 text-red-500 border-red-900"><i className="fa-solid fa-tower-broadcast"></i></span>
            <h4 className="text-red-400">Promover Transmissão</h4>
          </div>
          <p className="status-desc text-slate-300">Aumente sua audiência promovendo seu canal para jogadores de Azeroth.</p>
          
          <button 
            onClick={() => setShowPromoteModal(true)}
            className="w-full mt-4 bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-2.5 rounded-lg transition flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-rocket"></i> Promover Minha Live
          </button>
        </div>

        {/* Lista de Amigos */}
        <div className="widget-box">
          <div className="widget-header">
            <h4><i className="fa-solid fa-user-group"></i> Lista de Amigos ({friendsList.length})</h4>
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

      {/* Modal para Promover Live (Design Ultra Atraente & Gamer) */}
      {showPromoteModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-[#141923] border-2 border-red-600/80 rounded-2xl p-6 w-full max-w-xl space-y-5 shadow-[0_0_50px_rgba(239,68,68,0.2)] relative overflow-hidden">
            {/* Brilho Vermelho de Fundo */}
            <div className="absolute -top-20 -right-20 w-56 h-56 bg-red-600/15 rounded-full blur-3xl pointer-events-none"></div>

            {/* Header do Modal */}
            <div className="flex justify-between items-center border-b border-[#263045] pb-4 relative z-10">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600/30 to-[#0B0E14] border border-red-600 flex items-center justify-center text-red-500 text-xl shadow-lg">
                  <i className="fa-solid fa-tower-broadcast"></i>
                </div>
                <div>
                  <h3 className="font-cinzel text-xl font-bold text-red-400 tracking-wide">
                    Promover Sua Transmissão Ao Vivo
                  </h3>
                  <p className="text-xs text-slate-300">Ganhe visibilidade instantânea entre os jogadores da sua região</p>
                </div>
              </div>
              <button 
                onClick={() => setShowPromoteModal(false)}
                className="w-9 h-9 rounded-xl bg-[#0B0E14] border border-[#263045] text-slate-400 hover:text-white transition flex items-center justify-center cursor-pointer hover:border-slate-500"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePromote} className="space-y-4 text-xs relative z-10">
              {/* Seletor Visual de Plataforma (Twitch / YouTube / Kick) */}
              <div>
                <label className="block text-slate-200 font-bold mb-2 uppercase text-[11px] tracking-wider">
                  1. Selecione a Plataforma de Transmissão
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'twitch', label: 'Twitch TV', icon: 'fa-twitch', brandColor: 'border-purple-500 text-purple-400 bg-purple-950/20' },
                    { id: 'youtube', label: 'YouTube', icon: 'fa-youtube', brandColor: 'border-red-500 text-red-400 bg-red-950/20' },
                    { id: 'kick', label: 'Kick', icon: 'fa-bolt', brandColor: 'border-emerald-500 text-emerald-400 bg-emerald-950/20' }
                  ].map(({ id, label, icon, brandColor }) => {
                    const selected = newLive.platform === id
                    return (
                      <button
                        type="button"
                        key={id}
                        onClick={() => setNewLive({ ...newLive, platform: id })}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition cursor-pointer font-bold text-xs ${
                          selected
                            ? `${brandColor} shadow-lg shadow-black/50`
                            : 'bg-[#0B0E14] border-[#263045] text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        <i className={`fa-brands ${icon} text-lg`}></i>
                        <span>{label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Título da Live */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5 flex items-center gap-1.5">
                  <i className="fa-solid fa-heading text-red-400"></i> Título Chamativo da Live
                </label>
                <input 
                  type="text" 
                  required
                  value={newLive.title}
                  onChange={(e) => setNewLive({ ...newLive, title: e.target.value })}
                  placeholder="Ex: Push M+ +25 & Raid Mythic / Horda BR"
                  className="post-input text-xs"
                  style={{ minHeight: '44px', marginBottom: 0 }}
                />
              </div>

              {/* URL da Stream + Região */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-slate-300 font-bold mb-1.5 flex items-center gap-1.5">
                    <i className="fa-solid fa-link text-red-400"></i> Link da Transmissão
                  </label>
                  <input 
                    type="url" 
                    required
                    value={newLive.streamUrl}
                    onChange={(e) => setNewLive({ ...newLive, streamUrl: e.target.value })}
                    placeholder="https://www.twitch.tv/seu_canal"
                    className="post-input text-xs"
                    style={{ minHeight: '44px', marginBottom: 0 }}
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Região Alvo</label>
                  <select 
                    value={newLive.region}
                    onChange={(e) => setNewLive({ ...newLive, region: e.target.value })}
                    className="post-input text-xs"
                    style={{ minHeight: '44px', marginBottom: 0 }}
                  >
                    <option value="BR">Brasil (BR)</option>
                    <option value="US">América (US)</option>
                    <option value="EU">Europa (EU)</option>
                  </select>
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">Descrição da Gameplay / Conteúdo</label>
                <textarea 
                  value={newLive.description}
                  onChange={(e) => setNewLive({ ...newLive, description: e.target.value })}
                  placeholder="Venha acompanhar gameplay de Mage Frost e interagir no chat!"
                  className="post-input text-xs"
                  style={{ minHeight: '75px', marginBottom: 0 }}
                ></textarea>
              </div>

              {/* Rodapé com Ações */}
              <div className="flex justify-end items-center gap-3 pt-3 border-t border-[#263045]">
                <button 
                  type="button" 
                  onClick={() => setShowPromoteModal(false)}
                  className="px-5 py-2.5 bg-[#0B0E14] border border-[#263045] text-slate-300 hover:text-white rounded-xl transition text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isPromoting}
                  className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-8 py-2.5 rounded-xl transition cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-red-950/50"
                >
                  <i className="fa-solid fa-rocket"></i>
                  {isPromoting ? 'Publicando...' : 'Publicar Promoção de Live'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
