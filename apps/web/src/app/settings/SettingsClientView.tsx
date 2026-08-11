'use client'

import { useState, useRef, useEffect } from 'react'
import { setMainCharacterAction, updateCharacterVisibilityAction } from '@/app/actions/character'
import { updateProfileSettingsAction, uploadAvatarAction } from '@/app/actions/settings'
import { syncBattleNetCharactersAction } from '@/app/actions/bnet-sync'
import { loginWithBattleNetAction } from '@/app/actions/bnet-oauth'
import { fetchMainCharacterMountsAction, togglePublicMountAction, MountItem } from '@/app/actions/mounts'
import { getClassColor } from '@/lib/wow-colors'

interface Character {
  id: string
  name: string
  realm: string
  region: string
  class_name: string
  race_name: string
  level: number
  ilevel?: number
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

interface SettingsClientViewProps {
  profile: any
  initialCharacters: Character[]
  initialPublicMounts?: PublicMount[]
}

export default function SettingsClientView({ profile, initialCharacters, initialPublicMounts = [] }: SettingsClientViewProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'characters' | 'mounts'>('characters')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Local state para personagens e personagem principal com atualização instantânea
  const [charactersList, setCharactersList] = useState<Character[]>(initialCharacters)
  const [mainCharId, setMainCharId] = useState<string | null>(profile?.main_character_id || null)

  // State para montarias públicas e dados da API Blizzard
  const [publicMountsList, setPublicMountsList] = useState<PublicMount[]>(initialPublicMounts)
  const [mountsData, setMountsData] = useState<MountItem[] | null>(null)
  const [totalMountsCount, setTotalMountsCount] = useState<number>(0)
  const [mountsLoading, setMountsLoading] = useState(false)
  const [mountsError, setMountsError] = useState<string | null>(null)
  const [mountSearchQuery, setMountSearchQuery] = useState('')

  useEffect(() => {
    setCharactersList(initialCharacters)
  }, [initialCharacters])

  useEffect(() => {
    setMainCharId(profile?.main_character_id || null)
  }, [profile?.main_character_id])

  useEffect(() => {
    setPublicMountsList(initialPublicMounts)
  }, [initialPublicMounts])

  const mainChar = charactersList.find(c => c.id === mainCharId) || charactersList[0]

  useEffect(() => {
    if (activeTab === 'mounts' && mainChar && !mountsData && !mountsLoading) {
      const loadMounts = async () => {
        setMountsLoading(true)
        setMountsError(null)
        const res = await fetchMainCharacterMountsAction(mainChar.region, mainChar.realm, mainChar.name)
        setMountsLoading(false)
        if (res.success && res.mounts) {
          setMountsData(res.mounts)
          setTotalMountsCount(res.totalCollected || res.mounts.length)
        } else {
          setMountsError(res.error || 'Não foi possível obter as montarias da Battle.net.')
        }
      }
      loadMounts()
    }
  }, [activeTab, mainChar, mountsData, mountsLoading])

  const handleTogglePublicMount = async (mount: MountItem) => {
    const isAlreadyPublic = publicMountsList.some(pm => pm.mount_id === mount.id)

    if (isAlreadyPublic) {
      setPublicMountsList(prev => prev.filter(pm => pm.mount_id !== mount.id))
    } else {
      setPublicMountsList(prev => [
        ...prev,
        {
          id: String(Date.now()),
          mount_id: mount.id,
          mount_name: mount.name,
          mount_image: mount.render?.url
        }
      ])
    }

    const res = await togglePublicMountAction({
      mountId: mount.id,
      mountName: mount.name,
      mountImage: mount.render?.url
    })

    if (!res.success) {
      if (isAlreadyPublic) {
        setPublicMountsList(prev => [
          ...prev,
          {
            id: String(Date.now()),
            mount_id: mount.id,
            mount_name: mount.name,
            mount_image: mount.render?.url
          }
        ])
      } else {
        setPublicMountsList(prev => prev.filter(pm => pm.mount_id !== mount.id))
      }
      alert(res.error || 'Erro ao atualizar visibilidade da montaria.')
    }
  }

  // Perfil State
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [bio, setBio] = useState(profile?.bio || '')
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '/images/avatar.png')
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  // Modais State
  const [showBnetModal, setShowBnetModal] = useState(false)
  const [bnetJsonInput, setBnetJsonInput] = useState('')
  const [bnetSyncLoading, setBnetSyncLoading] = useState(false)
  const [bnetError, setBnetError] = useState<string | null>(null)

  // Sincronização em Massa da Conta Battle.net
  const handleBnetSyncSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBnetError(null)

    if (!bnetJsonInput.trim()) {
      setBnetError('Por favor insira o JSON retornado pela Battle.net.')
      return
    }

    try {
      setBnetSyncLoading(true)
      const parsedData = JSON.parse(bnetJsonInput)
      const charactersListInput = parsedData.characters || (Array.isArray(parsedData) ? parsedData : [])

      if (!charactersListInput || charactersListInput.length === 0) {
        setBnetError('Nenhum personagem foi encontrado na estrutura do JSON fornecido.')
        setBnetSyncLoading(false)
        return
      }

      const res = await syncBattleNetCharactersAction(charactersListInput)
      setBnetSyncLoading(false)

      if (res.success) {
        setShowBnetModal(false)
        setBnetJsonInput('')
        alert(res.message)
      } else {
        setBnetError(res.error || 'Erro ao sincronizar personagens.')
      }
    } catch {
      setBnetSyncLoading(false)
      setBnetError('JSON inválido. Certifique-se de colar exatamente o conteúdo da API da Battle.net.')
    }
  }

  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setProfileMsg(null)

    const MAX_5MB = 5 * 1024 * 1024
    if (file.size > MAX_5MB) {
      setProfileMsg({ type: 'error', text: 'O arquivo selecionado é maior que 5MB. Por favor envie uma imagem menor.' })
      return
    }

    const localPreviewUrl = URL.createObjectURL(file)
    setAvatarUrl(localPreviewUrl)

    setUploadingAvatar(true)
    const formData = new FormData()
    formData.append('avatarFile', file)

    const res = await uploadAvatarAction(formData)
    setUploadingAvatar(false)

    if (res.success && res.publicUrl) {
      setAvatarUrl(res.publicUrl)
      setProfileMsg({ type: 'success', text: 'Avatar atualizado com sucesso!' })
    } else {
      setProfileMsg({ type: 'error', text: res.error || 'Erro ao realizar upload do avatar.' })
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileMsg(null)
    setProfileLoading(true)

    const res = await updateProfileSettingsAction({ displayName, bio, avatarUrl })
    setProfileLoading(false)

    if (res.success) {
      setProfileMsg({ type: 'success', text: 'Perfil atualizado com sucesso!' })
    } else {
      setProfileMsg({ type: 'error', text: res.error || 'Erro ao atualizar perfil.' })
    }
  }

  const handleSetMain = async (charId: string) => {
    setMainCharId(charId)
    await setMainCharacterAction(charId)
  }

  const handleToggleVisibility = async (charId: string, currentVisibility: 'public' | 'friends' | 'private') => {
    const newVisibility = currentVisibility === 'private' ? 'public' : 'private'
    setCharactersList(prev => prev.map(char => char.id === charId ? { ...char, visibility: newVisibility } : char))
    const res = await updateCharacterVisibilityAction(charId, newVisibility)
    if (!res.success) {
      setCharactersList(prev => prev.map(char => char.id === charId ? { ...char, visibility: currentVisibility } : char))
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Banner / Card de Identidade do Campeão */}
      <div style={{ backgroundColor: '#141923', border: '1px solid #C89B3C', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
        <div style={{ height: '100px', background: 'linear-gradient(135deg, #1E1B4B 0%, #311B92 50%, #4A148C 100%)' }}></div>
        
        <div style={{ padding: '0 24px 24px', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '-40px', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px' }}>
              <div style={{ position: 'relative', width: '80px', height: '80px' }}>
                <img 
                  src={avatarUrl || '/images/avatar.png'} 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/avatar.png'
                  }}
                  alt="Avatar" 
                  style={{ width: '80px', height: '80px', borderRadius: '50%', border: '3px solid #C89B3C', objectFit: 'cover', backgroundColor: '#0B0E14' }} 
                />
                {activeTab === 'profile' && (
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      backgroundColor: '#C89B3C',
                      color: '#000',
                      border: 'none',
                      borderRadius: '50%',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.6)',
                      opacity: uploadingAvatar ? 0.5 : 1
                    }}
                    title="Alterar Imagem de Avatar"
                  >
                    <i className={uploadingAvatar ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-camera"}></i>
                  </button>
                )}
              </div>

              <div style={{ marginBottom: '4px' }}>
                <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: '1.4rem', fontWeight: 900, color: '#F5D166', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {profile?.display_name} <span style={{ color: '#C89B3C', fontSize: '1rem' }} title="Jogador Verificado">✓</span>
                </h1>
                <p style={{ color: '#94A3B8', fontSize: '0.85rem' }}>@{profile?.username}</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              {charactersList.length > 0 || profile?.battletag ? (
                <button 
                  onClick={async () => {
                    const res = await loginWithBattleNetAction()
                    if (res?.error) {
                      alert(res.error)
                    }
                  }}
                  title="Conta Battle.net vinculada. Clique para re-sincronizar."
                  style={{
                    backgroundColor: '#064E3B',
                    color: '#A7F3D0',
                    border: '1px solid #10B981',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 0 12px rgba(16, 185, 129, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <img 
                    src="https://wow.zamimg.com/images/zul/icons/for-buttons/battlenet-logo.svg" 
                    alt="Battle.net Logo" 
                    style={{ width: '18px', height: '18px', display: 'block' }} 
                  />
                  Conta vinculada
                </button>
              ) : (
                <button 
                  onClick={async () => {
                    const res = await loginWithBattleNetAction()
                    if (res?.error) {
                      alert(res.error)
                    }
                  }}
                  style={{
                    backgroundColor: '#1E3A8A',
                    color: '#FFF',
                    border: '1px solid #3B82F6',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 0 12px rgba(59, 130, 246, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <img 
                    src="https://wow.zamimg.com/images/zul/icons/for-buttons/battlenet-logo.svg" 
                    alt="Battle.net Logo" 
                    style={{ width: '18px', height: '18px', display: 'block' }} 
                  />
                  Sincronizar Conta Battle.net
                </button>
              )}
            </div>
          </div>

          <p style={{ color: '#94A3B8', fontSize: '0.88rem', marginTop: '14px', fontStyle: profile?.bio ? 'normal' : 'italic' }}>
            {profile?.bio || '"Nenhuma biografia informada ainda. Clique em Configurações do Perfil para personalizar."'}
          </p>

          {/* Abas de Navegação */}
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
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <i className="fa-regular fa-chess-knight" style={{ marginRight: '6px' }}></i> Personagens ({charactersList.length})
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
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <i className="fa-solid fa-horse" style={{ marginRight: '6px' }}></i> Montarias ({publicMountsList.length})
            </button>
            <button 
              onClick={() => setActiveTab('profile')}
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: '0.85rem',
                fontWeight: 700,
                padding: '8px 16px',
                borderRadius: '8px 8px 0 0',
                border: 'none',
                borderBottom: activeTab === 'profile' ? '2px solid #C89B3C' : '2px solid transparent',
                color: activeTab === 'profile' ? '#F5D166' : '#94A3B8',
                backgroundColor: activeTab === 'profile' ? 'rgba(200, 155, 60, 0.1)' : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <i className="fa-solid fa-gear" style={{ marginRight: '6px' }}></i> Configurações do Perfil
            </button>
          </div>
        </div>
      </div>

      {/* ABA: PERSONAGENS VINCULADOS */}
      {activeTab === 'characters' && (() => {
        const sortedCharacters = [...charactersList].sort((a, b) => {
          const isAMain = a.id === mainCharId
          const isBMain = b.id === mainCharId
          if (isAMain) return -1
          if (isBMain) return 1
          if (b.level !== a.level) {
            return b.level - a.level
          }
          return a.name.localeCompare(b.name)
        })

        return (
          <div style={{ backgroundColor: '#141923', border: '1px solid #263045', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: '1.1rem', color: '#F5D166' }}>
                Personagens Vinculados à Conta ({sortedCharacters.length})
              </h2>
            </div>

            {sortedCharacters.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', border: '1px dashed #263045', borderRadius: '12px', color: '#94A3B8', fontSize: '0.9rem' }}>
                Nenhum personagem cadastrado ainda. Clique em "Sincronizar Conta Battle.net" para importar todos os seus personagens de uma só vez!
              </div>
            ) : (
              <div className="characters-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
                {sortedCharacters.map((char) => {
                  const isMain = char.id === mainCharId
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
                      <span style={{ fontSize: '0.78rem', color: '#CBD5E1' }}>Lvl {char.level} {char.ilevel ? `(ilvl ${char.ilevel})` : ''}</span>
                    </div>

                    <p style={{ fontSize: '0.8rem', color: '#94A3B8', marginBottom: '4px' }}>
                      {char.class_name} · {char.realm} ({char.region})
                    </p>
                    <p style={{ fontSize: '0.8rem', color: '#94A3B8', marginBottom: '14px' }}>
                      Guilda: <strong style={{ color: '#F5D166' }}>{char.guild_name ? `<${char.guild_name}>` : 'Nenhuma'}</strong>
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #263045', fontSize: '0.75rem' }}>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        {!isMain && (
                          <button 
                            onClick={() => handleSetMain(char.id)}
                            title="Tornar Principal"
                            style={{ 
                              background: 'none', 
                              border: 'none', 
                              color: '#C89B3C', 
                              cursor: 'pointer', 
                              fontSize: '0.95rem', 
                              padding: '2px 6px',
                              transition: 'color 0.2s ease'
                            }}
                          >
                            <i className="fa-solid fa-star"></i>
                          </button>
                        )}
                        <button 
                          key={`vis-btn-${char.id}-${char.visibility}`}
                          onClick={() => handleToggleVisibility(char.id, char.visibility)}
                          title={char.visibility === 'private' ? 'Tornar público' : 'Ocultar'}
                          style={{ 
                            background: 'none', 
                            border: 'none', 
                            color: char.visibility === 'private' ? '#64748B' : '#10B981', 
                            cursor: 'pointer', 
                            fontSize: '0.95rem',
                            padding: '2px 6px',
                            transition: 'color 0.2s ease'
                          }}
                        >
                          {char.visibility === 'private' ? (
                            <i key={`icon-slash-${char.id}`} className="fa-solid fa-eye-slash"></i>
                          ) : (
                            <i key={`icon-eye-${char.id}`} className="fa-solid fa-eye"></i>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )
    })()}

      {/* ABA: MONTARIAS */}
      {activeTab === 'mounts' && (
        <div style={{ backgroundColor: '#141923', border: '1px solid #263045', borderRadius: '16px', padding: '24px' }}>
          {!mainChar ? (
            <div style={{ padding: '32px', textAlign: 'center', border: '1px dashed #263045', borderRadius: '12px', color: '#94A3B8', fontSize: '0.9rem' }}>
              Nenhum personagem principal selecionado. Por favor, defina um personagem principal na aba <strong>Personagens</strong> para carregar suas montarias.
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: '1.1rem', color: '#F5D166', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fa-solid fa-horse"></i> Coleção de Montarias do Campeão ({totalMountsCount} Coletadas)
                  </h2>
                  <p style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '4px' }}>
                    Sincronizadas de <strong style={{ color: getClassColor(mainChar.class_name) }}>{mainChar.name}</strong> ({mainChar.realm} - {mainChar.region}). Selecione quais montarias deseja exibir publicamente no seu perfil!
                  </p>
                </div>

                <div style={{ position: 'relative', minWidth: '240px' }}>
                  <input 
                    type="text" 
                    value={mountSearchQuery}
                    onChange={(e) => setMountSearchQuery(e.target.value)}
                    placeholder="🔍 Buscar montaria por nome..." 
                    style={{ 
                      width: '100%', 
                      backgroundColor: '#0B0E14', 
                      border: '1px solid #263045', 
                      borderRadius: '8px', 
                      padding: '8px 12px', 
                      fontSize: '0.82rem', 
                      color: '#F0F4F8', 
                      outline: 'none' 
                    }}
                  />
                </div>
              </div>

              {mountsLoading && (
                <div style={{ padding: '40px', textAlign: 'center', color: '#F5D166', fontSize: '0.95rem' }}>
                  <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '8px' }}></i> Carregando montarias do personagem principal via Battle.net...
                </div>
              )}

              {mountsError && (
                <div style={{ padding: '20px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #EF4444', borderRadius: '12px', color: '#FCA5A5', fontSize: '0.88rem', textAlign: 'center' }}>
                  <p>{mountsError}</p>
                  <button 
                    onClick={() => { setMountsData(null); }}
                    style={{ marginTop: '10px', backgroundColor: '#EF4444', color: '#FFF', border: 'none', borderRadius: '6px', padding: '6px 14px', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Tentar Novamente
                  </button>
                </div>
              )}

              {!mountsLoading && !mountsError && mountsData && (() => {
                const filteredMounts = [...mountsData]
                  .filter(m => m.name.toLowerCase().includes(mountSearchQuery.toLowerCase()))
                  .sort((a, b) => {
                    return a.name.localeCompare(b.name)
                  })

                if (filteredMounts.length === 0) {
                  return (
                    <div style={{ padding: '32px', textAlign: 'center', border: '1px dashed #263045', borderRadius: '12px', color: '#94A3B8', fontSize: '0.88rem' }}>
                      Nenhuma montaria encontrada com o termo "{mountSearchQuery}".
                    </div>
                  )
                }

                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                    {filteredMounts.map((m) => {
                      const isPublic = publicMountsList.some(pm => pm.mount_id === m.id)

                      return (
                        <div 
                          key={m.id}
                          style={{
                            backgroundColor: '#0B0E14',
                            border: isPublic ? '1px solid #10B981' : '1px solid #263045',
                            borderRadius: '12px',
                            padding: '12px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            boxShadow: isPublic ? '0 0 12px rgba(16, 185, 129, 0.15)' : 'none',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div>
                            <div style={{ width: '100%', height: '120px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#141923', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {m.render?.url ? (
                                <img 
                                  src={m.render.url} 
                                  alt={m.name} 
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              ) : (
                                <i className="fa-solid fa-horse" style={{ fontSize: '2rem', color: '#94A3B8' }}></i>
                              )}
                            </div>

                            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: isPublic ? '#F5D166' : '#F0F4F8', marginBottom: '8px', lineHeight: '1.2' }}>
                              {m.name}
                            </h4>
                          </div>

                          <button
                            key={`mount-btn-${m.id}-${isPublic}`}
                            onClick={() => handleTogglePublicMount(m)}
                            style={{
                              backgroundColor: isPublic ? 'rgba(16, 185, 129, 0.15)' : '#141923',
                              border: isPublic ? '1px solid #10B981' : '1px solid #263045',
                              color: isPublic ? '#34D399' : '#94A3B8',
                              borderRadius: '6px',
                              padding: '8px 10px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              width: '100%',
                              marginTop: '10px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            {isPublic ? (
                              <>
                                <i className="fa-solid fa-check" style={{ color: '#10B981' }}></i> Exibido para o público
                              </>
                            ) : (
                              <>
                                <i className="fa-solid fa-globe"></i> Exibir para o público
                              </>
                            )}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </div>
          )}
        </div>
      )}

      {/* ABA: CONFIGURAÇÕES DO PERFIL */}
      {activeTab === 'profile' && (
        <div style={{ backgroundColor: '#141923', border: '1px solid #263045', borderRadius: '16px', padding: '24px' }}>
          <h2 style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: '1.1rem', color: '#F5D166', marginBottom: '16px' }}>
            Editar Informações do Perfil & Avatar
          </h2>

          {profileMsg && (
            <div style={{ 
              padding: '12px', 
              marginBottom: '16px', 
              fontSize: '0.85rem', 
              borderRadius: '8px', 
              border: profileMsg.type === 'success' ? '1px solid #10B981' : '1px solid #EF4444',
              backgroundColor: profileMsg.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: profileMsg.type === 'success' ? '#A7F3D0' : '#FCA5A5'
            }}>
              {profileMsg.text}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '540px' }}>
            
            {/* Input Escondido de Upload de Imagem */}
            <input 
              type="file" 
              ref={fileInputRef}
              accept="image/png, image/jpeg, image/jpg, image/webp"
              onChange={handleAvatarFileSelect}
              style={{ display: 'none' }}
            />

            {/* Seção de Upload de Imagem de Avatar */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#C89B3C', marginBottom: '8px', fontFamily: "'Cinzel', serif" }}>
                Foto de Avatar (Upload de Arquivo)
              </label>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <img 
                  src={avatarUrl} 
                  alt="Preview" 
                  style={{ width: '64px', height: '64px', borderRadius: '50%', border: '2px solid #C89B3C', objectFit: 'cover' }} 
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="wow-btn-gold"
                    style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                  >
                    {uploadingAvatar ? 'Enviando Imagem...' : '📁 Selecionar Arquivo de Imagem'}
                  </button>
                  <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                    Tamanho máximo permitido: <strong>5MB</strong> (Formatos: PNG, JPG, WEBP)
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#C89B3C', marginBottom: '6px', fontFamily: "'Cinzel', serif" }}>
                Nome de Apresentação
              </label>
              <input 
                type="text" 
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                style={{ width: '100%', backgroundColor: '#0B0E14', border: '1px solid #263045', borderRadius: '8px', padding: '10px 14px', fontSize: '0.9rem', color: '#FFF', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#C89B3C', marginBottom: '6px', fontFamily: "'Cinzel', serif" }}>
                Biografia / Slogan da Taverna
              </label>
              <textarea 
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Ex: Guild Master na guilda Knights of Azeroth. Focado em Chaves M+15..."
                style={{ width: '100%', backgroundColor: '#0B0E14', border: '1px solid #263045', borderRadius: '8px', padding: '10px 14px', fontSize: '0.9rem', color: '#FFF', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
              ></textarea>
            </div>

            <button 
              type="submit"
              disabled={profileLoading || uploadingAvatar}
              className="wow-btn-gold"
              style={{ padding: '10px 24px', fontSize: '0.85rem', width: 'fit-content' }}
            >
              {profileLoading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </form>
        </div>
      )}

      {/* Modal para Sincronizar Todos os Personagens da Conta Battle.net */}
      {showBnetModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#141923', border: '1px solid #3B82F6', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '520px', boxShadow: '0 0 35px rgba(59, 130, 246, 0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontFamily: "'Cinzel', serif", fontSize: '1.2rem', fontWeight: 700, color: '#60A5FA' }}>
                🌐 Importar Personagens via Battle.net
              </h3>
              <button 
                onClick={() => setShowBnetModal(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.8rem', color: '#CBD5E1', marginBottom: '14px', lineHeight: 1.5 }}>
              Cole abaixo o retorno JSON da API de autenticação da Battle.net (<code style={{ color: '#F5D166' }}>/authenticate</code> ou resposta oficial de personagens). Todos os seus heróis serão vinculados de uma só vez!
            </p>

            {bnetError && (
              <div style={{ padding: '10px', backgroundColor: 'rgba(153, 27, 27, 0.4)', border: '1px solid #EF4444', color: '#FCA5A5', fontSize: '0.8rem', borderRadius: '6px', marginBottom: '12px' }}>
                {bnetError}
              </div>
            )}

            <form onSubmit={handleBnetSyncSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <textarea 
                rows={8}
                value={bnetJsonInput}
                onChange={(e) => setBnetJsonInput(e.target.value)}
                placeholder='Cole o JSON aqui (Ex: { "battletag": "Gabrwell#2310", "characters": [...] })'
                style={{ width: '100%', backgroundColor: '#0B0E14', border: '1px solid #263045', borderRadius: '8px', padding: '12px', color: '#86EFAC', fontFamily: 'monospace', fontSize: '0.78rem', outline: 'none', resize: 'vertical' }}
              ></textarea>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowBnetModal(false)}
                  style={{ padding: '8px 16px', backgroundColor: '#263045', color: '#CBD5E1', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem' }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={bnetSyncLoading}
                  style={{ padding: '8px 20px', backgroundColor: '#3B82F6', color: '#FFF', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem', boxShadow: '0 0 15px rgba(59, 130, 246, 0.5)' }}
                >
                  {bnetSyncLoading ? 'Sincronizando Heróis...' : '⚡ Sincronizar Todos os Personagens'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
