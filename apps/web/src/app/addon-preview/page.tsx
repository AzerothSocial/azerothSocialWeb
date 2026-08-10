import Link from 'next/link'

export default function AddonPreviewPage() {
  return (
    <div style={{ margin: 0, background: '#000', overflow: 'hidden', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ width: '100vw', height: '100vh', background: "url('https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1920&auto=format&fit=crop&q=80') center/cover no-repeat", position: 'relative' }}>
        <div style={{ width: '100%', height: '100%', background: 'rgba(0, 0, 0, 0.4)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          
          <div style={{ position: 'absolute', top: '20px', left: '24px', right: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Link href="/feed" style={{ background: 'rgba(15, 23, 42, 0.85)', border: '1px solid #C89B3C', color: '#F5D166', textDecoration: 'none', padding: '8px 18px', borderRadius: '20px', fontWeight: 700, fontSize: '0.9rem' }}>
              ⬅ Voltar para o Azeroth Social
            </Link>
            <div style={{ background: 'rgba(0, 0, 0, 0.6)', padding: '6px 14px', borderRadius: '12px', fontSize: '0.8rem', color: '#94A3B8' }}>
              📍 Dornogal · Ilha de Dorn <span style={{ marginLeft: '12px', color: '#10B981' }}>60 FPS · 32 ms</span>
            </div>
          </div>

          {/* Janela do Addon WoW (Lua Replica) */}
          <div style={{ width: '780px', height: '540px', backgroundColor: '#0C0F17', border: '2px solid #C89B3C', borderRadius: '8px', boxShadow: '0 0 40px rgba(0, 0, 0, 0.9)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ background: 'linear-gradient(180deg, #26334A 0%, #161E2E 100%)', borderBottom: '2px solid #4A3B18', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>⚔️</span>
                <span style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, color: '#F5D166', fontSize: '1rem' }}>
                  Azeroth Social <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>v0.1-MVP</span>
                </span>
              </div>
              <Link href="/feed" style={{ color: '#F5D166', textDecoration: 'none', fontWeight: 700 }}>✕</Link>
            </div>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden', padding: '20px' }}>
              <div style={{ width: '170px', backgroundColor: '#121722', borderRight: '1px solid #4A3B18', padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ background: 'rgba(200, 155, 60, 0.2)', border: '1px solid #C89B3C', color: '#F5D166', padding: '10px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 700 }}>
                  📜 Feed In-Game
                </div>
                <div style={{ color: '#94A3B8', padding: '10px', fontSize: '0.85rem' }}>
                  👤 Perfil Social
                </div>
                <div style={{ color: '#94A3B8', padding: '10px', fontSize: '0.85rem' }}>
                  🏰 Guilda & Raids
                </div>
              </div>

              <div style={{ flex: 1, padding: '16px', backgroundColor: '#0E121B', color: '#DCD0C0' }}>
                <h3 style={{ color: '#F5D166', marginBottom: '10px' }}>📜 Feed Social do Jogo</h3>
                <p style={{ fontSize: '0.85rem', color: '#10B981', marginBottom: '16px' }}>🟢 Online com AzerothSocial.com</p>

                <div style={{ backgroundColor: '#151B27', border: '1px solid #232D42', borderRadius: '6px', padding: '12px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                    <span style={{ color: '#3FC7EB', fontWeight: 700 }}>Arthas-Stormrage</span>
                    <span style={{ color: '#64748B' }}>Há 5 min</span>
                  </div>
                  <p style={{ fontSize: '0.88rem', marginBottom: '10px' }}>Montando chave M+ Mists +10 para completar semanal. Preciso de Healer e 1 DPS!</p>
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: '#121722', borderTop: '1px solid #4A3B18', padding: '8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#64748B' }}>
              <span>Digitar <code>/azeroth</code> para abrir no WoW</span>
              <Link href="/feed" style={{ color: '#F5D166', textDecoration: 'none' }}>🌐 Voltar para o Site ↗</Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
