'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getNotificationsAction, markNotificationsReadAction } from '@/app/actions/notifications'

const DEFAULT_AVATAR = "/images/avatar.png"

function formatTimeAgo(dateString: string) {
  try {
    const now = new Date().getTime()
    const past = new Date(dateString).getTime()
    const diffInSeconds = Math.floor((now - past) / 1000)

    if (diffInSeconds < 60) return 'Agora mesmo'
    if (diffInSeconds < 3600) return `há ${Math.floor(diffInSeconds / 60)} min`
    if (diffInSeconds < 86400) return `há ${Math.floor(diffInSeconds / 3600)} h`
    return `há ${Math.floor(diffInSeconds / 86400)} d`
  } catch {
    return 'Recente'
  }
}

export default function NotificationBell({ userId }: { userId?: string }) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = async () => {
    if (!userId) return
    const res = await getNotificationsAction()
    if (res.success) {
      setNotifications(res.notifications)
      setUnreadCount(res.unreadCount)
    }
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 15000)
    return () => clearInterval(interval)
  }, [userId])

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMarkAllRead = async () => {
    await markNotificationsReadAction()
    setUnreadCount(0)
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  const handleItemClick = async (notif: any) => {
    setIsOpen(false)
    if (!notif.is_read) {
      await markNotificationsReadAction([notif.id])
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }

    if (notif.type === 'guild_application' && notif.reference_id) {
      router.push(`/guilds?manage=${notif.reference_id}`)
    }
  }

  const handleBellClick = () => {
    const nextState = !isOpen
    setIsOpen(nextState)
    if (nextState) {
      fetchNotifications()
    }
  }

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Botão de Sino de Notificação */}
      <button
        onClick={handleBellClick}
        className="relative w-9 h-9 rounded-xl bg-[#0B0E14] border border-[#263045] hover:border-[#C89B3C] text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer shadow-md"
        title="Notificações"
      >
        <i className="fa-solid fa-bell text-sm"></i>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#0B0E14] shadow-[0_0_8px_rgba(239,68,68,0.9)] animate-pulse"></span>
        )}
      </button>

      {/* Menu Dropdown de Notificações */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#141923] border border-[#C89B3C] rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.95),0_0_20px_rgba(200,155,60,0.25)] z-50 overflow-hidden text-xs"
          style={{ zIndex: 10000 }}
        >
          {/* Cabeçalho */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#263045] bg-[#0B0E14]/90">
            <span className="font-cinzel text-sm font-bold text-[#F5D166] flex items-center gap-2">
              <i className="fa-solid fa-bell text-[#C89B3C]"></i> Notificações
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] text-[#C89B3C] hover:text-[#F5D166] font-bold cursor-pointer transition hover:underline"
              >
                Marcar todas lidas
              </button>
            )}
          </div>

          {/* Conteúdo / Lista de Notificações */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[#263045]/50">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-slate-400 space-y-1.5 px-4">
                <i className="fa-solid fa-bell-slash text-2xl text-slate-600 block mb-1"></i>
                <p className="font-semibold text-slate-300">Nenhuma notificação por enquanto</p>
                <p className="text-[11px] text-slate-400">Você receberá avisos quando alguém se candidatar à sua guilda.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleItemClick(notif)}
                  className={`p-3.5 transition flex items-start gap-3 cursor-pointer ${
                    !notif.is_read
                      ? 'bg-blue-950/20 border-l-3 border-l-[#C89B3C]'
                      : 'hover:bg-[#1C2333]/60'
                  }`}
                >
                  <img
                    src={notif.actor?.avatar_url || DEFAULT_AVATAR}
                    alt="Avatar"
                    className="w-9 h-9 rounded-xl border border-[#263045] object-cover shrink-0 mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center gap-2">
                      <span className="font-bold text-[#F5D166] text-xs truncate">{notif.title}</span>
                      <span className="text-[10px] text-slate-400 shrink-0 font-medium">{formatTimeAgo(notif.created_at)}</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed break-words font-normal">
                      {notif.content}
                    </p>
                    {notif.type === 'guild_application' && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#C89B3C] font-bold mt-1.5 hover:underline">
                        <i className="fa-solid fa-users-gear text-[#C89B3C]"></i> Gerenciar Candidaturas
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
