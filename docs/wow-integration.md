## Azeroth Social — WoW Integration Technical Spike

**Status:** Em planejamento / Aguardando execuções de testes em Lua  
**Objetivo:** Identificar com precisão quais APIs da plataforma Blizzard podem e não podem ser consumidas diretamente pelo Addon ou via API pública da Battle.net.

---

## 1. APIs do Addon (Cliente WoW em Lua)

| API do WoW | Finalidade | Status de Teste | Observações / Limitações |
| :--- | :--- | :--- | :--- |
| `UnitName("player")` | Nome do personagem ativo | 🟡 A testar | Retorna o nome da sessão local |
| `GetRealmName()` | Reino do personagem | 🟡 A testar | Identifica o servidor ativo |
| `GetGuildInfo("player")` | Nome da guilda | 🟡 A testar | Retorna nome e posto na guilda |
| `GetStatistic(...)` | Estatísticas & Conquistas | 🟡 A testar | Permite ler conquistas obtidas |

---

## 2. Protocolo de Persistência Local (`SavedVariables`)

Como addons não realizam requisições HTTP dinâmicas por restrição da engine da Blizzard, o fluxo de sincronização utilizará a persistência em disco:

```text
  ┌─────────────────┐             ┌─────────────────────┐             ┌──────────────────┐
  │   WoW Addon     │ ──(Salva)─> │ AzerothSocialDB.lua │ ──(Leitura)─>│ App Desktop/Sync │ ──(API)─> Supabase DB
  │  (Durante jogo) │             │  (SavedVariables)   │             │   (Em segundo)   │
  └─────────────────┘             └─────────────────────┘             └──────────────────┘
```

---

## 3. Diretrizes de Conformidade com Termos de Uso (ToS Blizzard)

1. **Sem vantagens competitivas**: O addon não concede benefícios mecânicos ou automação de gameplay.
2. **Interface Passiva**: Sem anúncios de terceiros dentro da UI do addon no jogo.
