'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const TransitionContext = createContext({
  isPending: false,
});

export function TransitionProvider({ children }: { children: ReactNode }) {
  const [isPending, setIsPending] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Reseta o estado de loading quando a rota muda (conclusão da navegação)
  useEffect(() => {
    setIsPending(false);
  }, [pathname, searchParams]);

  // Intercepta todos os cliques em links localmente para aplicar o efeito
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Ignora se abriu em nova aba (Ctrl+Click, etc)
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
      
      const target = (e.target as HTMLElement).closest('a');
      
      if (target && target.href) {
        const url = new URL(target.href);
        const currentUrl = new URL(window.location.href);
        
        // Verifica se é uma rota interna e se não é apenas uma âncora na mesma página
        if (
          url.origin === window.location.origin && 
          url.pathname !== currentUrl.pathname &&
          !target.hasAttribute('download') &&
          target.target !== '_blank'
        ) {
          setIsPending(true);
        }
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <TransitionContext.Provider value={{ isPending }}>
      {/* Container global com animação de CSS */}
      <div 
        className="transition-wrapper"
        style={{ 
          transition: 'opacity 0.35s ease-in-out, filter 0.35s ease-in-out',
          opacity: isPending ? 0.4 : 1,
          filter: isPending ? 'blur(2px)' : 'blur(0px)',
          pointerEvents: isPending ? 'none' : 'auto',
          minHeight: '100vh',
          backgroundColor: '#0F1218'
        }}
      >
        {/* Barra de Loading no Topo */}
        {isPending && (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '3px',
              backgroundColor: '#1E293B',
              zIndex: 9999,
              overflow: 'hidden'
            }}
          >
            <div 
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#C89B3C',
                animation: 'loading-bar 1.5s infinite ease-in-out',
                transformOrigin: 'left'
              }}
            />
            <style>{`
              @keyframes loading-bar {
                0% { transform: scaleX(0); }
                50% { transform: scaleX(0.5); }
                100% { transform: scaleX(1); transform-origin: right; }
              }
            `}</style>
          </div>
        )}
        
        {children}
      </div>
    </TransitionContext.Provider>
  );
}
