'use client'

import { useState } from 'react'
import { loginAction } from '@/app/actions/auth'
import Link from 'next/link'

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await loginAction(formData)
      if (res && !res.success) {
        setError(res.error)
      }
    } catch {
      // Redirecionamento bem sucedido
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ 
      position: 'relative', 
      minHeight: '100vh', 
      backgroundColor: '#0B0E14', 
      color: '#F0F4F8', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '20px', 
      fontFamily: "'Inter', sans-serif",
      overflow: 'hidden'
    }}>
      {/* Imagem de Fundo Imersiva com efeito de Vinheta Esmaecida */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'url(/images/Background_Against_the_Void_Key_Art.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 0.45,
        filter: 'contrast(110%) brightness(85%)',
        zIndex: 0,
      }} />

      {/* Máscara de Vinheta Suave (Gradiente Radial para Esmaecer as Bordas) */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle at center, rgba(11, 14, 20, 0.2) 0%, rgba(11, 14, 20, 0.75) 60%, rgba(11, 14, 20, 0.98) 100%)',
        boxShadow: 'inset 0 0 120px 80px #0B0E14',
        zIndex: 1,
      }} />

      {/* Cartão de Login da Taverna (Sobreposto) */}
      <div style={{ 
        position: 'relative',
        zIndex: 2,
        width: '100%', 
        maxWidth: '440px', 
        backgroundColor: 'rgba(20, 25, 35, 0.92)', 
        backdropFilter: 'blur(12px)',
        border: '1px solid #C89B3C', 
        borderRadius: '16px', 
        padding: '32px', 
        boxShadow: '0 0 35px rgba(0, 0, 0, 0.8), 0 0 25px rgba(200, 155, 60, 0.3)' 
      }}>
        
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '2.2rem', marginBottom: '8px' }}>🛡️</div>
          <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: '1.5rem', fontWeight: 900, color: '#F5D166', letterSpacing: '1px', textTransform: 'uppercase' }}>
            Reivindicar Acesso
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '0.85rem', marginTop: '4px' }}>
            Azeroth Social — Autenticação de Campeão
          </p>
        </div>

        {error && (
          <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: 'rgba(153, 27, 27, 0.6)', border: '1px solid #EF4444', color: '#FCA5A5', fontSize: '0.85rem', borderRadius: '8px', textAlign: 'center' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#C89B3C', marginBottom: '6px', fontFamily: "'Cinzel', serif" }}>
              E-mail Registrado
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="seu@guerra.com"
              style={{ width: '100%', backgroundColor: 'rgba(11, 14, 20, 0.85)', border: '1px solid #263045', borderRadius: '8px', padding: '10px 14px', fontSize: '0.9rem', color: '#FFF', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#C89B3C', marginBottom: '6px', fontFamily: "'Cinzel', serif" }}>
              Palavra-Passe
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              style={{ width: '100%', backgroundColor: 'rgba(11, 14, 20, 0.85)', border: '1px solid #263045', borderRadius: '8px', padding: '10px 14px', fontSize: '0.9rem', color: '#FFF', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="wow-btn-gold"
            style={{ width: '100%', padding: '12px', marginTop: '12px', fontSize: '0.9rem' }}
          >
            {loading ? 'Validando Selo...' : 'Abrir os Portões'}
          </button>
        </form>

        <div style={{ height: '1px', background: 'linear-gradient(90deg, rgba(200, 155, 60, 0) 0%, #C89B3C 50%, rgba(200, 155, 60, 0) 100%)', margin: '24px 0' }}></div>

        <div style={{ textAlign: 'center', fontSize: '0.85rem', color: '#94A3B8' }}>
          Novo em Azeroth Social?{' '}
          <Link href="/register" style={{ color: '#F5D166', textDecoration: 'none', fontWeight: 700, fontFamily: "'Cinzel', serif" }}>
            Juntar-se à Taverna
          </Link>
        </div>
      </div>
    </main>
  )
}
