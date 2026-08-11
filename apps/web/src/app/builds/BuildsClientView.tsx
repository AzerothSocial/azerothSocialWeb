'use client'

import React, { useState } from 'react'
import { syncTopPvPBuildsAction } from '../actions/sync-builds'

export default function BuildsClientView({ initialBuilds }: { initialBuilds: any[] }) {
  const [builds, setBuilds] = useState(initialBuilds)
  const [syncing, setSyncing] = useState(false)

  const handleSync = async () => {
    setSyncing(true)
    const res = await syncTopPvPBuildsAction()
    if (res.success) {
      alert(`Sincronizado com sucesso! ${res.synced} builds atualizadas. Recarregue a página.`)
    } else {
      alert(`Erro: ${res.error}`)
    }
    setSyncing(false)
  }

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold font-cinzel text-[#F5D166]">Top Builds (POC)</h1>
        <button 
          onClick={handleSync}
          disabled={syncing}
          className="bg-[#C89B3C] text-[#0F1218] px-6 py-3 rounded font-bold hover:bg-[#F5D166] transition disabled:opacity-50"
        >
          {syncing ? 'Sincronizando...' : 'Rodar Sincronização (Admin)'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {builds.map(build => (
          <div key={build.id} className="bg-[#1E293B] p-6 rounded-lg border border-[#334155] shadow-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-xl text-[#D8E2EC]">{build.character_name} - {build.realm}</span>
              <span className="text-[#F5D166] font-bold text-lg">Rank #{build.rank}</span>
            </div>
            <div className="text-sm text-gray-400 mb-6 font-cinzel tracking-wider">
              {build.spec_name} {build.class_name} <span className="mx-2">|</span> {build.mode.toUpperCase()} <span className="mx-2">|</span> Rating: {build.rating}
            </div>
            
            <div className="flex flex-wrap gap-2">
              {build.talents_json?.map((spellId: number, idx: number) => (
                <a 
                  key={`${spellId}-${idx}`} 
                  href={`https://www.wowhead.com/pt/spell=${spellId}`} 
                  data-wowhead={`spell=${spellId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded border border-[#334155] overflow-hidden hover:border-[#C89B3C] transition-colors"
                >
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {builds.length === 0 && (
        <div className="text-gray-400 text-center py-20 bg-[#1E293B] rounded border border-[#334155] mt-8">
          Nenhuma build encontrada no banco de dados. 
          <br/><br/>
          Clique no botão de sincronização acima para baixar as melhores builds do servidor da Blizzard.
        </div>
      )}
    </div>
  )
}
