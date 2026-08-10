'use client'

import { useState, useEffect } from 'react'
import {
  createGuildRecruitmentAction,
  applyToGuildAction,
  getRecruitmentApplicationsAction,
  updateApplicationStatusAction
} from '@/app/actions/guilds'
import { getClassColor } from '@/lib/wow-colors'

interface Character {
  id: string
  name: string
  class_name: string
  level: number
  realm: string
  faction?: string
}

interface GuildRecruitment {
  id: string
  guild_name: string
  faction: string
  realm: string
  region: string
  min_level: number
  roles_needed: string[]
  description: string
  contact_info: string
  created_at: string
  posts?: {
    id: string
    content: string
    created_at: string
    author_profile_id: string
    profiles?: {
      display_name: string
      username: string
      avatar_url: string
    }
  }
}

const REALMS_BY_REGION: Record<string, string[]> = {
  BR: ['Azralon', 'Nemesis', 'Goldrinn', 'Gallywix', 'Tol Barad'],
  US: [
    'Stormrage',
    'Area 52',
    'Illidan',
    'Mal\'Ganis',
    'Tichondrius',
    'Zul\'jin',
    'Sargeras',
    'Dalaran',
    'Proudmoore',
    'Thrall',
    'Emerald Dream',
    'Bleeding Hollow'
  ],
  EU: [
    'Silvermoon',
    'Draenor',
    'Tarren Mill',
    'Kazzak',
    'Twisting Nether',
    'Ravencrest',
    'Outland',
    'Argent Dawn',
    'Ragnaros',
    'Hyjal'
  ]
}

interface GuildsClientViewProps {
  profile: any
  characters: Character[]
  recruitments: GuildRecruitment[]
  currentUserId: string
  friendsList: any[]
}

export default function GuildsClientView({
  profile,
  characters,
  recruitments,
  currentUserId,
  friendsList,
}: GuildsClientViewProps) {
  const [mounted, setMounted] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedRecruitingId, setSelectedRecruitingId] = useState<string | null>(null)

  // Estado para gerenciamento de candidaturas pelo recrutador
  const [managingRecruitmentId, setManagingRecruitmentId] = useState<string | null>(null)
  const [manageRecruitmentInfo, setManageRecruitmentInfo] = useState<any>(null)
  const [manageApplications, setManageApplications] = useState<any[]>([])
  const [loadingManage, setLoadingManage] = useState(false)
  const [manageError, setManageError] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Função para abrir modal de gerenciamento de candidaturas
  const handleOpenManageModal = async (recruitmentId: string) => {
    setManagingRecruitmentId(recruitmentId)
    setLoadingManage(true)
    setManageError(null)

    const res = await getRecruitmentApplicationsAction(recruitmentId)
    setLoadingManage(false)

    if (res.success) {
      setManageRecruitmentInfo(res.recruitment)
      setManageApplications(res.applications || [])
    } else {
      setManageError(res.error || 'Erro ao carregar candidaturas.')
    }
  }

  // Atualizar status de candidatura (Aprovar / Recusar)
  const handleUpdateStatus = async (applicationId: string, status: 'approved' | 'rejected') => {
    if (!managingRecruitmentId) return
    const res = await updateApplicationStatusAction({
      applicationId,
      recruitmentId: managingRecruitmentId,
      status,
    })

    if (res.success) {
      setManageApplications((prev) =>
        prev.map((app) => (app.id === applicationId ? { ...app, status } : app))
      )
    } else {
      alert(res.error || 'Erro ao atualizar candidatura.')
    }
  }

  // Verificar se há parâmetro query ?manage= na URL para abrir direto do sino
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const manageId = params.get('manage')
      if (manageId) {
        handleOpenManageModal(manageId)
      }
    }
  }, [])

  // Estado para aplicação/candidatura
  const [selectedCharId, setSelectedCharId] = useState<string>('')
  const [applyMessage, setApplyMessage] = useState('')
  const [isApplying, setIsApplying] = useState(false)
  const [applySuccess, setApplySuccess] = useState(false)

  // Estado para criação de anúncio de guilda
  const [newGuild, setNewGuild] = useState({
    guildName: '',
    faction: 'alliance',
    realm: 'Azralon',
    region: 'BR',
    minLevel: 80,
    rolesNeeded: [] as string[],
    description: '',
    contactInfo: '',
  })
  const [isCreating, setIsCreating] = useState(false)

  const handleToggleRole = (role: string) => {
    if (newGuild.rolesNeeded.includes(role)) {
      setNewGuild({ ...newGuild, rolesNeeded: newGuild.rolesNeeded.filter(r => r !== role) })
    } else {
      setNewGuild({ ...newGuild, rolesNeeded: [...newGuild.rolesNeeded, role] })
    }
  }

  const handleCreateRecruitment = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    await createGuildRecruitmentAction(newGuild)
    setIsCreating(false)
    setShowCreateModal(false)
    setNewGuild({
      guildName: '',
      faction: 'alliance',
      realm: 'Azralon',
      region: 'BR',
      minLevel: 80,
      rolesNeeded: [],
      description: '',
      contactInfo: '',
    })
  }

  const handleApply = async (recruitmentId: string) => {
    if (!selectedCharId) return alert('Selecione qual personagem deseja usar para se candidatar!')
    setIsApplying(true)
    const res = await applyToGuildAction({
      recruitmentId,
      characterId: selectedCharId,
      message: applyMessage,
    })
    setIsApplying(false)
    if (res.success) {
      setApplySuccess(true)
      setTimeout(() => {
        setApplySuccess(false)
        setSelectedRecruitingId(null)
        setApplyMessage('')
      }, 2000)
    } else {
      alert(res.error || 'Erro ao submeter aplicação.')
    }
  }

  return (
    <>
      {/* Área Central: Somente os Anúncios de Guildas já realizados */}
      <main className="content-main space-y-5">
        {/* Cabeçalho do Feed de Anúncios */}
        <div className="guild-feed-header-card">
          <div>
            <h2 className="font-cinzel text-xl font-bold text-[#F5D166] flex items-center gap-2.5 tracking-wide">
              <i className="fa-solid fa-shield-halved text-[#F5D166]"></i> Anúncios de Recrutamento
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Guildas ativas recrutando jogadores para Core Raids, Mythic+ e formações PvP
            </p>
          </div>
          <span className="announcements-count-badge">
            {recruitments.length} {recruitments.length === 1 ? 'Anúncio' : 'Anúncios'}
          </span>
        </div>

        {/* Lista de Anúncios de Guildas */}
        <div className="grid grid-cols-1 gap-5">
          {recruitments.length === 0 ? (
            <div className="text-center py-16 bg-[#141923] rounded-2xl border border-[#263045] space-y-2">
              <i className="fa-solid fa-chess-rook text-3xl text-slate-600 mb-1 block"></i>
              <p className="text-slate-300 font-semibold">Nenhum anúncio de recrutamento publicado ainda.</p>
              <p className="text-xs text-slate-400">Seja o primeiro Guild Master a publicar as vagas da sua guilda!</p>
            </div>
          ) : (
            recruitments.map((rec) => (
              <div key={rec.id} className="guild-card">
                {/* Linha Superior: Facção, Nome da Guilda & Vagas Necessárias */}
                <div className="guild-card-header flex-col sm:flex-row items-start sm:items-center">
                  <div className="flex items-center gap-4">
                    <div className="guild-faction-badge">
                      <img
                        src={rec.faction === 'alliance' ? 'https://assets-bwa.worldofwarcraft.blizzard.com/dab2428aa2f51e140c9a.png' : 'https://assets-bwa.worldofwarcraft.blizzard.com/3edbc547ab318bd385b2.png'}
                        alt={rec.faction}
                      />
                    </div>
                    <div>
                      <h3 className="font-cinzel text-xl font-extrabold text-[#F0F4F8] tracking-wide">
                        &lt;{rec.guild_name}&gt;
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 font-medium">
                        <span className="text-slate-300 font-semibold">{rec.realm} ({rec.region})</span>
                        <span>•</span>
                        <span>Lvl Mínimo: <strong className="text-slate-200">{rec.min_level}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Vagas Necessárias Badges */}
                  <div className="flex flex-wrap gap-2">
                    {rec.roles_needed.map((role) => (
                      <span key={role} className="role-tag">
                        <i className={`fa-solid ${role.includes('Tank') ? 'fa-shield text-blue-400' :
                          role.includes('Healer') ? 'fa-notes-medical text-emerald-400' :
                            role.includes('Melee') ? 'fa-hand-fist text-red-400' : 'fa-wand-magic-sparkles text-purple-400'
                          }`}></i>
                        {role}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Descrição do Anúncio */}
                <div className="guild-card-body">
                  {rec.description}
                </div>

                {/* Linha Inferior: Autor e Botão de Candidatura */}
                <div className="guild-card-footer flex-col sm:flex-row">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <i className="fa-solid fa-user-crown text-[#C89B3C]"></i>
                    <span>Anunciado por: <strong className="text-slate-200">@{rec.posts?.profiles?.username || 'Líder'}</strong></span>
                  </div>

                  {/* Somente o Recrutador / Criador do Anúncio pode Gerenciar */}
                  {rec.posts?.author_profile_id === currentUserId ? (
                    <button
                      onClick={() => handleOpenManageModal(rec.id)}
                      className="bg-[#1C2333] hover:bg-[#263045] text-[#F5D166] border border-[#C89B3C]/50 font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] w-full sm:w-auto"
                    >
                      <i className="fa-solid fa-users-gear text-[#C89B3C]"></i>
                      Verificar Candidaturas
                    </button>
                  ) : (
                    <button
                      onClick={() => setSelectedRecruitingId(rec.id)}
                      className="btn-apply-recruitment w-full sm:w-auto"
                    >
                      <i className="fa-solid fa-bolt text-black"></i>
                      Candidatar-se
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Sidebar Direita: Card de Anunciar Guilda (No lugar do Addon) + Lista de Amigos */}
      <aside className="sidebar-right space-y-5">
        {/* Card "Anunciar sua Guilda" adaptado com o mesmo estilo do Addon Card */}
        <div className="addon-status-card border-[#C89B3C]/50 bg-gradient-to-br from-[#1C1810] via-[#141923] to-[#0B0E14] shadow-[0_0_20px_rgba(200,155,60,0.15)] relative overflow-hidden">
          <div className="status-header">
            <span className="w-9 h-9 rounded-lg bg-[#C89B3C]/20 border border-[#C89B3C] flex items-center justify-center text-[#F5D166] text-base shrink-0">
              <i className="fa-solid fa-chess-rook"></i>
            </span>
            <div>
              <h4 className="font-cinzel font-bold text-[#F5D166] text-sm leading-tight">Anunciar sua Guilda</h4>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Painel do Guild Master</span>
            </div>
          </div>

          <p className="status-desc text-xs text-slate-300 mt-2 mb-3.5 leading-relaxed">
            É líder ou oficial de guilda em Azeroth? Recrute novos jogadores para suas Cores de Raid, Mythic+ e formações PvP!
          </p>

          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full bg-[#C89B3C] hover:bg-[#D8AB4C] text-black font-bold text-xs py-2.5 px-4 rounded-lg transition flex items-center justify-center gap-2 shadow-lg cursor-pointer"
          >
            <i className="fa-solid fa-plus-circle"></i> Anunciar sua Guilda
          </button>
        </div>

        {/* Widget Lista de Amigos */}
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

      {/* Container Isolado de Modais para evitar erros de hidratação/DOM */}
      <div id="guild-modals-container">
        {/* Modal de Candidatura / Aplicar para a Guilda */}
        {mounted && selectedRecruitingId && (
        <div className="wow-modal-overlay">
          <div className="wow-modal-content space-y-5" style={{ maxWidth: '560px' }}>
            {/* Cabeçalho do Modal */}
            <div className="flex justify-between items-center border-b border-[#263045] pb-4 relative z-10">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#C89B3C]/30 to-[#0B0E14] border border-[#C89B3C] flex items-center justify-center text-[#F5D166] text-lg shadow-lg shrink-0">
                  <i className="fa-solid fa-scroll"></i>
                </div>
                <div>
                  <h3 className="font-cinzel text-lg font-bold text-[#F5D166] tracking-wide">
                    Aplicação para a Guilda
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">Envie sua candidatura diretamente ao Guild Master</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRecruitingId(null)}
                className="w-9 h-9 rounded-xl bg-[#0B0E14] border border-[#263045] text-slate-400 hover:text-white transition flex items-center justify-center cursor-pointer hover:border-slate-500 shrink-0"
              >
                ✕
              </button>
            </div>

            {applySuccess ? (
              <div className="p-5 bg-emerald-950/80 border border-emerald-500 text-emerald-300 rounded-xl text-center flex items-center justify-center gap-2.5 text-sm font-semibold shadow-lg">
                <i className="fa-solid fa-star text-emerald-400 text-lg"></i> Candidatura enviada com sucesso ao Guild Master!
              </div>
            ) : (
              <div className="space-y-4 text-xs relative z-10">
                {/* Seleção de Personagem */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-2">
                    Qual personagem você deseja joinar na guilda?
                  </label>
                  {characters.length === 0 ? (
                    <p className="text-xs text-red-400 bg-red-950/40 p-3 rounded-xl border border-red-800/50">
                      Você ainda não cadastrou nenhum personagem. Adicione nas configurações do seu perfil!
                    </p>
                  ) : (
                    <select
                      value={selectedCharId}
                      onChange={(e) => setSelectedCharId(e.target.value)}
                      className="post-input text-xs rounded-xl px-3.5 py-2.5 cursor-pointer"
                      style={{ minHeight: '44px', marginBottom: 0 }}
                    >
                      <option value="">Selecione um personagem...</option>
                      {characters.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} - {c.class_name} (Lvl {c.level}) · {c.realm}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Mensagem de Apresentação */}
                <div className="apply-form-group">
                  <label className="block text-slate-300 font-semibold">
                    Mensagem de Apresentação / Experiência (Opcional)
                  </label>
                  <textarea
                    value={applyMessage}
                    onChange={(e) => setApplyMessage(e.target.value)}
                    placeholder="Ex: Tenho experiência de Raid Mythic 8/8, posso rodar nos dias de quarta e quinta..."
                    className="post-input text-xs rounded-xl p-3.5"
                    style={{ minHeight: '100px', marginBottom: 0 }}
                  ></textarea>
                </div>

                {/* Botões do Rodapé */}
                <div className="flex justify-end items-center gap-3.5 pt-4 mt-2">
                  <button
                    type="button"
                    onClick={() => handleApply(selectedRecruitingId)}
                    disabled={isApplying || !selectedCharId}
                    className="btn-primary text-xs shrink-0 cursor-pointer disabled:opacity-50 px-7 py-2.5 flex items-center justify-center gap-2 font-bold shadow-lg transition-all hover:scale-[1.02]"
                  >
                    <i className="fa-solid fa-paper-plane"></i>
                    {isApplying ? 'Enviando...' : 'Enviar Aplicação'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Form de Anúncio de Guilda Expansível / Modal de Alto Padrão Visual */}
      {mounted && showCreateModal && (
        <div className="wow-modal-overlay">
          <div className="wow-modal-content space-y-6">
            {/* Brilhos Radiais de Fundo */}
            <div className="absolute -top-20 -right-20 w-56 h-56 bg-[#C89B3C]/15 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

            {/* Cabeçalho Épico */}
            <div className="flex justify-between items-center border-b border-[#263045] pb-4.5 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#C89B3C]/30 to-[#0B0E14] border border-[#C89B3C] flex items-center justify-center text-[#F5D166] text-xl shadow-lg shrink-0">
                  <i className="fa-solid fa-chess-rook"></i>
                </div>
                <div>
                  <h3 className="font-cinzel text-xl font-bold text-[#F5D166] tracking-wide">
                    Anunciar Recrutamento de Guilda
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">Publique suas vagas para Core Raids, Mythic+ e PvP</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-9 h-9 rounded-xl bg-[#0B0E14] border border-[#263045] text-slate-400 hover:text-white transition flex items-center justify-center cursor-pointer hover:border-slate-500 shrink-0"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRecruitment} className="space-y-4 text-xs relative z-10">
              {/* Seletor Visual Interativo de Facção (Aliança vs Horda) */}
              <div>
                <label className="block text-slate-200 font-bold mb-2 uppercase text-[11px] tracking-wider">
                  1. Escolha a Facção da Guilda
                </label>
                <div className="grid grid-cols-2 gap-3.5">
                  <button
                    type="button"
                    onClick={() => setNewGuild({ ...newGuild, faction: 'alliance' })}
                    className={`p-3 rounded-xl border flex items-center gap-3 transition cursor-pointer ${newGuild.faction === 'alliance'
                      ? 'bg-gradient-to-r from-blue-950/80 to-[#0B0E14] border-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                      : 'bg-[#0B0E14] border-[#263045] text-slate-400 hover:border-slate-600'
                      }`}
                  >
                    <img src="https://assets-bwa.worldofwarcraft.blizzard.com/dab2428aa2f51e140c9a.png" alt="Aliança" className="w-7 h-7 object-contain shrink-0" />
                    <div className="text-left">
                      <span className="font-bold block text-blue-400 text-sm">ALIANÇA</span>
                      <span className="text-[10px] text-slate-400">Pela Aliança!</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewGuild({ ...newGuild, faction: 'horde' })}
                    className={`p-3 rounded-xl border flex items-center gap-3 transition cursor-pointer ${newGuild.faction === 'horde'
                      ? 'bg-gradient-to-r from-red-950/80 to-[#0B0E14] border-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                      : 'bg-[#0B0E14] border-[#263045] text-slate-400 hover:border-slate-600'
                      }`}
                  >
                    <img src="https://assets-bwa.worldofwarcraft.blizzard.com/3edbc547ab318bd385b2.png" alt="Horda" className="w-7 h-7 object-contain shrink-0" />
                    <div className="text-left">
                      <span className="font-bold block text-red-400 text-sm">HORDA</span>
                      <span className="text-[10px] text-slate-400">Pela Horda!</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Região + Reino (Realm Dropdown) + Nome da Guilda */}
              <div className="space-y-1.5 pt-1">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1.5">Região</label>
                    <select
                      value={newGuild.region}
                      onChange={(e) => {
                        const selectedRegion = e.target.value
                        const availableRealms = REALMS_BY_REGION[selectedRegion] || []
                        setNewGuild({
                          ...newGuild,
                          region: selectedRegion,
                          realm: availableRealms[0] || ''
                        })
                      }}
                      className="post-input text-xs rounded-xl px-3 py-2 cursor-pointer"
                      style={{ minHeight: '40px', marginBottom: 0 }}
                    >
                      <option value="BR">Brasil (BR)</option>
                      <option value="US">América (US)</option>
                      <option value="EU">Europa (EU)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1.5">Reino (Realm)</label>
                    <select
                      value={newGuild.realm}
                      onChange={(e) => setNewGuild({ ...newGuild, realm: e.target.value })}
                      className="post-input text-xs rounded-xl px-3 py-2 cursor-pointer"
                      style={{ minHeight: '40px', marginBottom: 0 }}
                    >
                      {(REALMS_BY_REGION[newGuild.region] || []).map((realmName) => (
                        <option key={realmName} value={realmName}>
                          {realmName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1.5">Nome da Guilda</label>
                    <input
                      type="text"
                      required
                      value={newGuild.guildName}
                      onChange={(e) => setNewGuild({ ...newGuild, guildName: e.target.value })}
                      placeholder="Ex: Silver Hand"
                      className="post-input text-xs rounded-xl px-3.5 py-2"
                      style={{ minHeight: '40px', marginBottom: 0 }}
                    />
                  </div>
                </div>
              </div>

              {/* Roles Necessárias com Chips Interativos */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-slate-200 font-bold mb-1.5 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                  <i className="fa-solid fa-users text-[#C89B3C]"></i> Vagas Abertas na Guilda
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                  {[
                    { role: 'Tank', icon: 'fa-shield', color: 'text-blue-400' },
                    { role: 'Healer', icon: 'fa-notes-medical', color: 'text-emerald-400' },
                    { role: 'Melee DPS', icon: 'fa-hand-fist', color: 'text-red-400' },
                    { role: 'Ranged DPS', icon: 'fa-wand-magic-sparkles', color: 'text-purple-400' }
                  ].map(({ role, icon, color }) => {
                    const selected = newGuild.rolesNeeded.includes(role)
                    return (
                      <button
                        type="button"
                        key={role}
                        onClick={() => handleToggleRole(role)}
                        className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 transition cursor-pointer font-bold text-xs ${selected
                          ? 'bg-[#C89B3C]/20 border-[#C89B3C] text-[#F5D166] shadow-[0_0_15px_rgba(200,155,60,0.25)]'
                          : 'bg-[#0B0E14] border-[#263045] text-slate-400 hover:border-slate-600'
                          }`}
                      >
                        <i className={`fa-solid ${icon} ${color}`}></i>
                        <span>{role}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Descrição com Limite e Contador */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between items-center">
                  <label className="block text-slate-300 font-semibold">Descrição, Regras & Horários de Raid</label>
                  <span className={`text-[10px] font-mono ${newGuild.description.length >= 300 ? 'text-amber-400 font-bold' : 'text-slate-400'}`}>
                    {newGuild.description.length}/300 caracteres
                  </span>
                </div>
                <textarea
                  required
                  maxLength={300}
                  value={newGuild.description}
                  onChange={(e) => setNewGuild({ ...newGuild, description: e.target.value })}
                  placeholder="Informe os dias de raid, progresso (Heroic/Mythic), loot e requisitos de RIO..."
                  className="post-input text-xs rounded-xl p-3"
                  style={{ minHeight: '75px', marginBottom: 0 }}
                ></textarea>
              </div>

              {/* Contato / Discord */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-slate-300 font-semibold mb-1.5 flex items-center gap-1.5">
                  <i className="fa-brands fa-discord text-[#5865F2]"></i> Tag do Discord ou Link de Convite
                </label>
                <input
                  type="text"
                  required
                  value={newGuild.contactInfo}
                  onChange={(e) => setNewGuild({ ...newGuild, contactInfo: e.target.value })}
                  placeholder="Ex: discord.gg/suaguilda ou Usuario#1234"
                  className="post-input text-xs rounded-xl px-3.5 py-2"
                  style={{ minHeight: '40px', marginBottom: 0 }}
                />
              </div>

              {/* Rodapé com Ações */}
              <div className="flex justify-end items-center gap-3.5 pt-3.5 mt-2 border-t border-[#263045]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="bg-[#0B0E14] border border-[#263045] hover:border-slate-500 text-slate-300 hover:text-white font-bold text-xs px-7 py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02]"
                >
                  <i className="fa-solid fa-xmark text-slate-400"></i>
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="btn-primary text-xs shrink-0 cursor-pointer disabled:opacity-50 px-7 py-2.5 flex items-center justify-center gap-2 font-bold shadow-lg transition-all hover:scale-[1.02]"
                >
                  <i className="fa-solid fa-paper-plane"></i>
                  {isCreating ? 'Publicando...' : 'Publicar Anúncio de Recrutamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Gerenciamento de Candidaturas para o Recrutador */}
      {mounted && managingRecruitmentId && (
        <div className="wow-modal-overlay">
          <div className="wow-modal-content space-y-5" style={{ maxWidth: '760px' }}>
            {/* Cabeçalho do Modal */}
            <div className="flex justify-between items-center border-b border-[#263045] pb-4 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#C89B3C]/30 to-[#0B0E14] border border-[#C89B3C] flex items-center justify-center text-[#F5D166] text-xl shadow-lg shrink-0">
                  <i className="fa-solid fa-users-gear"></i>
                </div>
                <div>
                  <h3 className="font-cinzel text-xl font-bold text-[#F5D166] tracking-wide">
                    Gerenciar Candidaturas — &lt;{manageRecruitmentInfo?.guild_name || 'Guilda'}&gt;
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {manageRecruitmentInfo?.realm} ({manageRecruitmentInfo?.region}) · Avalie os jogadores aptos para entrar na guilda
                  </p>
                </div>
              </div>
              <button
                onClick={() => setManagingRecruitmentId(null)}
                className="w-9 h-9 rounded-xl bg-[#0B0E14] border border-[#263045] text-slate-400 hover:text-white transition flex items-center justify-center cursor-pointer hover:border-slate-500 shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Conteúdo das Candidaturas */}
            <div className="space-y-4 text-xs relative z-10">
              {loadingManage ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <i className="fa-solid fa-spinner fa-spin text-2xl text-[#C89B3C]"></i>
                  <p className="font-semibold text-slate-300">Carregando candidatos da guilda...</p>
                </div>
              ) : manageError ? (
                <div className="p-4 bg-red-950/80 border border-red-500 text-red-300 rounded-xl text-center font-semibold">
                  <i className="fa-solid fa-triangle-exclamation text-red-400 mr-2"></i>
                  {manageError}
                </div>
              ) : manageApplications.length === 0 ? (
                <div className="py-12 text-center text-slate-400 bg-[#0B0E14] rounded-2xl border border-[#263045] space-y-2">
                  <i className="fa-solid fa-user-slash text-3xl text-slate-600 mb-1 block"></i>
                  <p className="font-semibold text-slate-300 text-sm">Nenhum jogador se candidatou para esta vaga ainda.</p>
                  <p className="text-xs text-slate-400">Assim que um jogador enviar uma candidatura, ela aparecerá nesta tela para avaliação.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-5 max-h-[60vh] overflow-y-auto pr-2 pb-2">
                  {manageApplications.map((app) => {
                    const char = app.character
                    const applicant = app.applicant
                    const classColor = char ? getClassColor(char.class_name) : '#F5D166'

                    return (
                      <div key={app.id} className="bg-[#141923] border border-[#263045] rounded-2xl p-5 flex flex-col gap-4 shadow-lg relative overflow-hidden transition-all hover:border-[#38435C] flex-shrink-0">
                        {/* Linha Superior: Personagem (Nick + Realm) & Status */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div className="flex items-center gap-3.5">
                            <img
                              src={applicant?.avatar_url || "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80"}
                              alt="Avatar"
                              className="w-12 h-12 rounded-xl border border-[#263045] object-cover shrink-0 shadow-sm"
                            />
                            <div>
                              <h4 className="font-bold text-sm tracking-wide flex flex-wrap items-center gap-2">
                                <span style={{ color: classColor }}>
                                  {char ? `${char.name} - ${char.realm}` : applicant?.display_name || 'Jogador'}
                                </span>
                                {char && (
                                  <span className="text-[10px] bg-[#0B0E14] border border-[#263045] px-2 py-0.5 rounded-md text-slate-300 font-medium tracking-wide">
                                    Lvl {char.level} {char.class_name}
                                  </span>
                                )}
                              </h4>
                              <p className="text-[11px] text-slate-400 mt-1">
                                Tag: <strong className="text-slate-200">@{applicant?.username || 'usuario'}</strong>
                              </p>
                            </div>
                          </div>

                          {/* Badge de Status */}
                          <div className="shrink-0">
                            <span className={`inline-flex items-center justify-center whitespace-nowrap gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg border uppercase tracking-wider shadow-sm ${
                              app.status === 'approved'
                                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-400'
                                : app.status === 'rejected'
                                ? 'bg-red-950/40 border-red-500/50 text-red-400'
                                : 'bg-amber-950/40 border-amber-500/50 text-amber-400'
                            }`}>
                              {app.status === 'approved' ? (
                                <><i className="fa-solid fa-check"></i> Aprovado</>
                              ) : app.status === 'rejected' ? (
                                <><i className="fa-solid fa-xmark"></i> Recusado</>
                              ) : (
                                <><i className="fa-solid fa-hourglass-half"></i> Pendente</>
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Mensagem / Descrição do Candidato */}
                        {app.message && (
                          <div className="bg-[#0B0E14] p-4 rounded-xl border border-[#263045] text-xs text-slate-300 leading-relaxed shadow-inner">
                            <span className="text-[#C89B3C] font-semibold text-[10px] uppercase tracking-wider block mb-2">
                              <i className="fa-solid fa-comment-dots mr-1"></i> Apresentação / Experiência:
                            </span>
                            <span className="italic block mt-1">"{app.message}"</span>
                          </div>
                        )}

                        {/* Ações do Recrutador */}
                        {app.status === 'pending' && (
                          <div className="flex justify-end items-center gap-3 pt-4 border-t border-[#263045]/60 mt-2">
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(app.id, 'rejected')}
                              disabled={app.status === 'rejected'}
                              className="px-6 py-2.5 bg-[#0B0E14] hover:bg-red-950/50 border border-[#263045] hover:border-red-800/80 text-slate-400 hover:text-red-400 disabled:opacity-30 disabled:hover:bg-[#0B0E14] disabled:hover:border-[#263045] disabled:hover:text-slate-400 rounded-xl text-[11px] uppercase tracking-wider font-bold transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
                            >
                              <i className="fa-solid fa-xmark text-[13px]"></i> Recusar
                            </button>

                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(app.id, 'approved')}
                              disabled={app.status === 'approved'}
                              className="px-6 py-2.5 bg-[#1C2333] hover:bg-emerald-950/60 border border-[#C89B3C]/40 hover:border-emerald-600/80 text-[#F5D166] hover:text-emerald-400 disabled:opacity-30 disabled:hover:bg-[#1C2333] disabled:hover:border-[#C89B3C]/40 disabled:hover:text-[#F5D166] rounded-xl text-[11px] uppercase tracking-wider font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md whitespace-nowrap shrink-0"
                            >
                              <i className="fa-solid fa-check text-[13px]"></i> Aprovar Candidato
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  )
}
