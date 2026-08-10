# Azeroth Social — Monorepo

Rede social para jogadores de World of Warcraft integrada ao jogo.

## Estrutura do Projeto

```text
azeroth-social/
├── apps/
│   └── web/              # Aplicação Next.js (Frontend e Server Actions)
├── addon/                # Addon WoW em Lua/XML
├── supabase/
│   ├── migrations/       # Migrações SQL e regras RLS
│   └── seed.sql          # Dados iniciais para ambiente de dev
├── docs/                 # Documentação técnica e Technical Spike
└── README.md
```

## Como rodar o projeto Web localmente

1. Navegue até o app web:
   ```bash
   cd apps/web
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Configure o arquivo `.env.local` baseado em `.env.example`:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=sua_url_aqui
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_aqui
   SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_aqui
   ```
4. Execute o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

## Segurança

- **Row Level Security (RLS)** ativado em todas as tabelas.
- Autenticação gerenciada exclusivamente via **Supabase Auth**.
- Validação de entrada de dados com **Zod**.
