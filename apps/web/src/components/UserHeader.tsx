'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { logoutAction } from '@/app/actions/auth'
import NotificationBell from '@/components/NotificationBell'
import { autoSyncCharactersAction } from '@/app/actions/auto-sync'

interface UserHeaderProps {
  profile: any
}

const DEFAULT_AVATAR = "/images/avatar.png"

export default function UserHeader({ profile }: UserHeaderProps) {
  const pathname = usePathname()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [imgSrc, setImgSrc] = useState<string>(profile?.avatar_url || DEFAULT_AVATAR)

  useEffect(() => {
    // Sincronização automática em background sem bloquear a UI
    autoSyncCharactersAction().catch(e => console.error('Erro no auto-sync:', e))
  }, [])

  return (
    <header className="top-nav">
      <div className="nav-left">
        <Link href="/feed" className="logo" style={{ textDecoration: 'none', color: 'inherit' }}>
          <span className="logo-text">AZEROTH<span className="gold-text">SOCIAL</span></span>
        </Link>
      </div>
      
      <div className="nav-center desktop-only">
        <Link href="/feed" className={`nav-tab ${pathname === '/feed' ? 'active' : ''}`} title="Feed Principal">
          <span className="tab-icon"><i className="fa-solid fa-newspaper"></i></span>
          <span className="tab-label" style={{ fontSize: '0.8rem', fontWeight: 600, marginLeft: '6px' }}>Feed</span>
        </Link>
        <Link href="/guilds" className={`nav-tab ${pathname === '/guilds' ? 'active' : ''}`} title="Guildas & Recrutamento">
          <span className="tab-icon"><i className="fa-solid fa-shield-halved"></i></span>
          <span className="tab-label" style={{ fontSize: '0.8rem', fontWeight: 600, marginLeft: '6px' }}>Guildas</span>
        </Link>
        <Link href="/lives" className={`nav-tab ${pathname === '/lives' ? 'active' : ''}`} title="Lives & Transmissões">
          <span className="tab-icon"><i className="fa-solid fa-circle-play" style={{ color: '#EF4444' }}></i></span>
          <span className="tab-label" style={{ fontSize: '0.8rem', fontWeight: 600, marginLeft: '6px' }}>Lives</span>
        </Link>
      </div>

      <div className="nav-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link href="/addon-preview" className="btn-addon-preview">
          <span className="pulse-dot"></span>
          <span className="addon-icon"><i className="fa-solid fa-gamepad"></i></span>
          <span className="addon-text">Ver Addon In-Game</span>
        </Link>

        {/* Ícone de Notificações / Sino com Dropdown */}
        <NotificationBell userId={profile?.id} />

        {/* Dropdown do Avatar do Usuário */}
        <div className="relative" style={{ position: 'relative' }}>
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="user-quick-profile focus:outline-none"
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
          >
            <img 
              src={imgSrc} 
              onError={() => setImgSrc(DEFAULT_AVATAR)}
              alt="Avatar" 
              className="avatar-sm" 
            />
          </button>

          {/* Menu Dropdown Estilizado WoW */}
          {dropdownOpen && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '48px',
              width: '200px',
              backgroundColor: '#141923',
              border: '1px solid #C89B3C',
              borderRadius: '10px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.8), 0 0 15px rgba(200, 155, 60, 0.2)',
              zIndex: 1000,
              padding: '6px 0',
              overflow: 'hidden'
            }}>
              <div style={{ padding: '8px 16px', borderBottom: '1px solid #263045' }}>
                <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#F5D166' }}>
                  {profile?.display_name}
                </span>
                <span style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8' }}>
                  @{profile?.username}
                </span>
              </div>

              <Link 
                prefetch={false}
                href={profile?.username ? `/@${profile.username}` : '/settings'}
                onClick={() => setDropdownOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 16px',
                  color: '#F0F4F8',
                  textDecoration: 'none',
                  fontSize: '0.85rem',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1C2333'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <i className="fa-solid fa-user" style={{ width: '16px', textAlign: 'center' }}></i> Perfil
              </Link>

              <Link 
                href="/settings"
                onClick={() => setDropdownOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 16px',
                  color: '#F0F4F8',
                  textDecoration: 'none',
                  fontSize: '0.85rem',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1C2333'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <i className="fa-solid fa-gear" style={{ width: '16px', textAlign: 'center' }}></i> Configurações
              </Link>

              <div style={{ height: '1px', backgroundColor: '#263045', margin: '4px 0' }}></div>

              <form action={logoutAction}>
                <button 
                  type="submit"
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 16px',
                    color: '#EF4444',
                    background: 'none',
                    border: 'none',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1C2333'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <i className="fa-solid fa-right-from-bracket" style={{ width: '16px', textAlign: 'center' }}></i> Logout
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
