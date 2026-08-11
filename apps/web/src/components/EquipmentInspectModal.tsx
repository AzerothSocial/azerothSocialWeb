'use client'

import { useState, useEffect } from 'react'
import { fetchCharacterEquipmentAction, EquippedItem } from '@/app/actions/bnet-equipment'

interface EquipmentInspectModalProps {
  isOpen: boolean
  onClose: () => void
  region: string
  realm: string
  charName: string
  renderUrl?: string
}

export default function EquipmentInspectModal({ isOpen, onClose, region, realm, charName, renderUrl }: EquipmentInspectModalProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<EquippedItem[]>([])

  useEffect(() => {
    if (isOpen) {
      // Sobe a tela para o topo suavemente e trava o scroll de fundo
      window.scrollTo({ top: 0, behavior: 'smooth' })
      document.body.style.overflow = 'hidden'
      document.body.classList.add('inspect-modal-open')

      setLoading(true)
      setError(null)
      fetchCharacterEquipmentAction(region, realm, charName).then(res => {
        if (res.success && res.items) {
          setItems(res.items)
        } else {
          setError(res.error || 'Erro ao carregar equipamentos.')
        }
        setLoading(false)
      })
    }

    return () => {
      document.body.style.overflow = 'auto'
      document.body.classList.remove('inspect-modal-open')
    }
  }, [isOpen, region, realm, charName])

  if (!isOpen) return null

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'POOR': return '#9d9d9d'
      case 'COMMON': return '#ffffff'
      case 'UNCOMMON': return '#1eff00'
      case 'RARE': return '#0070dd'
      case 'EPIC': return '#a335ee'
      case 'LEGENDARY': return '#ff8000'
      case 'ARTIFACT': return '#e6cc80'
      case 'HEIRLOOM': return '#00ccff'
      default: return '#ffffff'
    }
  }

  const leftSlotTypes = ['HEAD', 'NECK', 'SHOULDER', 'BACK', 'CHEST', 'SHIRT', 'TABARD', 'WRIST']
  const rightSlotTypes = ['HANDS', 'WAIST', 'LEGS', 'FEET', 'FINGER_1', 'FINGER_2', 'TRINKET_1', 'TRINKET_2']
  const bottomSlotTypes = ['MAIN_HAND', 'OFF_HAND']

  const getItem = (slot: string) => items.find(i => i.slot === slot)

  const renderSlot = (slotName: string, align: 'left' | 'right' | 'bottom') => {
    const item = getItem(slotName)
    const isRight = align === 'right'
    const isBottom = align === 'bottom'

    if (!item) {
      return (
        <div key={slotName} style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: 0.2, width: isBottom ? 'auto' : '280px', flexDirection: isRight ? 'row-reverse' : 'row' }}>
          <div style={{ width: '44px', height: '44px', border: '1px solid #333', borderRadius: '4px', backgroundColor: '#000' }}></div>
          {!isBottom && <div style={{ width: '100px', height: '10px', backgroundColor: '#333', borderRadius: '4px' }}></div>}
        </div>
      )
    }

    const color = getQualityColor(item.quality)

    return (
      <div key={item.id} style={{ 
        display: 'flex', 
        width: isBottom ? 'auto' : '280px', 
        justifyContent: isBottom ? 'center' : (isRight ? 'flex-end' : 'flex-start') 
      }}>
        <a 
          href={`https://www.wowhead.com/pt/item=${item.id}?ilvl=${item.level}`}
          target="_blank"
          rel="noopener noreferrer"
          data-wowhead={`item=${item.id}&ilvl=${item.level}`}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            flexDirection: isRight ? 'row-reverse' : 'row',
            textDecoration: 'none'
          }}
        >
          <div style={{
            width: '44px',
            height: '44px',
            border: `2px solid ${color}`,
            borderRadius: '4px',
            backgroundImage: `url(${item.media_url || '/images/default-item.png'})`,
            backgroundSize: 'cover',
            boxShadow: `0 0 10px ${color}40`,
            flexShrink: 0
          }}></div>
          <div style={{ textAlign: isRight ? 'right' : 'left' }}>
            <div style={{ color: color, fontWeight: 700, fontSize: '0.9rem', textShadow: '1px 1px 2px #000' }}>
              {item.name}
            </div>
            <div style={{ color: '#E2E8F0', fontSize: '0.75rem', textShadow: '1px 1px 2px #000' }}>
              {item.level}
            </div>
          </div>
        </a>
      </div>
    )
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.85)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      paddingTop: '40px',
      paddingBottom: '40px',
      zIndex: 9999,
      backdropFilter: 'blur(4px)',
      overflowY: 'auto'
    }}>
      <div style={{
        backgroundColor: '#000',
        border: '1px solid #C89B3C',
        borderRadius: '12px',
        width: '95%',
        maxWidth: '1100px',
        maxHeight: '95vh',
        overflowY: 'auto',
        position: 'relative',
        boxShadow: '0 20px 50px rgba(0,0,0,0.9)'
      }}>

        {/* Header */}
        <div style={{
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(to bottom, #141923, #000)',
          borderBottom: '1px solid #263045',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <div>
            <h2 style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: '1.2rem', color: '#F5D166', margin: 0 }}>
              {charName}
            </h2>
            <p style={{ color: '#94A3B8', fontSize: '0.8rem', margin: '2px 0 0 0' }}>{realm} ({region})</p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              fontSize: '1.2rem',
              cursor: 'pointer',
              padding: '8px'
            }}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '0', position: 'relative', minHeight: '650px', backgroundImage: 'radial-gradient(circle at center, #1A1F2C 0%, #000 100%)' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '650px' }}>
              <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '2.5rem', color: '#C89B3C', marginBottom: '16px' }}></i>
              <p style={{ color: '#94A3B8' }}>Inspecionando armory da Blizzard...</p>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '100px 0' }}>
              <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: '2.5rem', color: '#EF4444', marginBottom: '16px' }}></i>
              <p style={{ color: '#FCA5A5' }}>{error}</p>
            </div>
          ) : (
            <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '650px', padding: '32px' }}>

              {/* Character Background & Render */}
              {renderUrl && (
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  zIndex: 0,
                  overflow: 'hidden'
                }}>
                  <img
                    src={renderUrl}
                    alt={charName}
                    style={{
                      height: '100%',
                      objectFit: 'contain',
                      transform: 'scale(1.2) translateY(-5%)',
                      filter: 'drop-shadow(0 10px 25px rgba(0,0,0,0.9))'
                    }}
                  />
                </div>
              )}

              {/* Equipment Overlay */}
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', minHeight: '580px' }}>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  {/* Left Column */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {leftSlotTypes.map(slot => renderSlot(slot, 'left'))}
                  </div>

                  {/* Right Column */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {rightSlotTypes.map(slot => renderSlot(slot, 'right'))}
                  </div>
                </div>

                {/* Bottom Row */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '80px', marginTop: 'auto', paddingTop: '20px' }}>
                  {bottomSlotTypes.map(slot => renderSlot(slot, 'bottom'))}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  )
}
