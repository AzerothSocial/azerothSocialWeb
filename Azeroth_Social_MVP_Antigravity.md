# Azeroth Social — MVP
## Documento de produto e instruções de desenvolvimento para Antigravity

**Versão:** 0.1  
**Status:** Documento inicial de implementação  
**Objetivo:** iniciar o desenvolvimento do MVP do Azeroth Social com custo operacional zero durante a fase de validação.

---

# 1. Visão do projeto

## 1.1 O que é o Azeroth Social?

Azeroth Social é uma plataforma social para jogadores de World of Warcraft.

O produto terá duas portas de entrada:

1. **Website** — experiência social completa fora do jogo.
2. **WoW Addon** — experiência integrada ao jogo.

O conceito central é:

> **Azeroth Social é o lugar onde a comunidade de World of Warcraft continua existindo mesmo quando o jogador fecha o jogo.**

O projeto não deve ser tratado inicialmente como "apenas um addon". O addon é um cliente da plataforma social.

---

# 2. Princípios do produto

## 2.1 Conta pertence ao jogador

A identidade social representa o jogador, não um personagem específico.

Exemplo:

```text
Gabriel
│
├── Arthas
│   └── Mage · Level 80
│
├── Jaina
│   └── Priest · Level 80
│
└── Thrall
    └── Hunter · Level 72
```

Um usuário adiciona/segue **Gabriel**.

Os personagens são identidades pertencentes ao perfil.

O jogador pode escolher quais personagens ficam visíveis.

## 2.2 Personagem é uma identidade do jogador

Um personagem possui seus próprios dados:

- nome
- reino
- região
- classe
- raça
- nível
- guilda
- atividades
- achievements
- outras informações permitidas pela API do WoW

Atividades devem indicar quem é o autor e, quando aplicável, através de qual personagem a atividade aconteceu.

Exemplo:

```text
Gabriel
via Arthas · Mage

🏆 Just obtained Glory of the Raider!
```

## 2.3 Privacidade

O usuário deve controlar a visibilidade dos personagens.

No MVP:

- público
- somente amigos
- privado

A implementação deve ser feita no backend/database com RLS, e não apenas escondendo elementos no frontend.

## 2.4 Gratuito para jogadores

O MVP não terá:

- assinatura
- paywall
- recursos premium
- publicidade dentro do addon

A monetização futura poderá existir na plataforma web, especialmente através de conteúdo patrocinado para creators, guildas e comunidades, mas **não faz parte do MVP**.

---

# 3. Objetivo do MVP

O MVP precisa provar três hipóteses:

### Hipótese 1 — Identidade

Jogadores querem possuir um perfil social separado do personagem, mas relacionado aos seus personagens de WoW.

### Hipótese 2 — Social

Jogadores querem acompanhar amigos, personagens e atividades de outros jogadores.

### Hipótese 3 — Feed

Um feed social baseado em atividades de WoW é interessante o suficiente para gerar retorno ao produto.

---

# 4. Escopo do MVP

## Obrigatório

### Website

- Landing page
- Cadastro
- Login
- Logout
- Perfil do jogador
- Username único
- Avatar
- Bio
- Lista de personagens
- Cadastro/gerenciamento de personagens
- Personagem principal
- Privacidade dos personagens
- Feed
- Criar post
- Editar/excluir próprio post
- Curtir
- Comentar
- Seguir usuário
- Deixar de seguir
- Solicitação de amizade
- Aceitar/recusar amizade
- Lista de amigos
- Busca básica por usuários
- Página pública de perfil
- Notificações básicas
- Configurações de conta
- Bloqueio de usuário
- Report de conteúdo

### Addon

O MVP do addon deve:

- possuir estrutura funcional de addon;
- abrir uma interface do Azeroth Social;
- identificar o personagem atual usando APIs disponíveis;
- coletar dados básicos permitidos pela API;
- armazenar estado local;
- preparar uma camada de integração para futura sincronização;
- possuir telas de perfil/feed compatíveis com a arquitetura do produto;
- documentar claramente quais dados são e não são acessíveis.

### Backend

- Supabase Auth
- PostgreSQL
- Row Level Security
- Storage
- Realtime somente onde realmente necessário
- migrations versionadas
- seed/demo data
- políticas de segurança

---

# 5. Fora do MVP

Não implementar agora:

- aplicativo mobile
- chat privado em tempo real
- marketplace
- sistema de anúncios
- campanhas patrocinadas
- pagamentos
- sistema de creators completo
- algoritmo de recomendação baseado em ML
- Discord integration
- Twitch integration
- YouTube integration
- guild management avançado
- ranking global
- sistema de eventos avançado
- marketplace de itens
- venda de gold
- recursos que ofereçam vantagem competitiva dentro do WoW

Esses itens devem aparecer apenas como backlog futuro.

---

# 6. Stack técnica

Priorizar tecnologias que permitam desenvolvimento sem custo durante o MVP.

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- componentes acessíveis e responsivos

## Backend / infraestrutura

- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Storage
- Supabase Realtime apenas quando necessário

## Código

- GitHub
- Git
- documentação em Markdown

## Deploy inicial

- Vercel para o website
- Supabase para backend/database/storage
- Cloudflare para DNS quando um domínio próprio for utilizado

Não criar microserviços no MVP.

---

# 7. Arquitetura

```text
                         AZEROTH SOCIAL
                               │
                 ┌─────────────┴─────────────┐
                 │                           │
                 ▼                           ▼
             WEBSITE                    WOW ADDON
             Next.js                    Lua/XML
                 │                           │
                 │                    WoW Game APIs
                 │                           │
                 └─────────────┬─────────────┘
                               │
                          Supabase
                    ┌──────────┼──────────┐
                    │          │          │
                    ▼          ▼          ▼
               PostgreSQL    Auth      Storage
                    │
                    ▼
                 RLS/API
```

---

# 8. Regra arquitetural importante sobre o addon

Não assumir que o addon pode realizar requisições HTTP arbitrárias para o backend.

Antes de implementar sincronização online, o Antigravity deve realizar um **Technical Spike de integração WoW**.

Objetivos do spike:

1. descobrir quais APIs podem ser usadas;
2. descobrir quais dados podem ser obtidos;
3. testar comunicação entre addons;
4. testar eventos relevantes;
5. testar limitações/throttling;
6. documentar o que pode ser sincronizado;
7. definir um protocolo de sincronização compatível;
8. identificar qualquer conflito com as políticas atuais da Blizzard.

O código do addon deve ser projetado de forma que a camada de comunicação possa ser substituída sem reescrever a UI.

Estrutura desejada:

```text
addon/
├── Core/
├── UI/
├── WoW/
├── Data/
└── Communication/
```

A camada `Communication` não deve contaminar a lógica de negócio da UI.

---

# 9. Modelo de dados

## 9.1 profiles

Representa a identidade social.

```text
profiles
- id
- username
- display_name
- avatar_url
- bio
- main_character_id
- created_at
- updated_at
```

O `id` deve corresponder ao usuário autenticado.

`username` deve ser único.

---

## 9.2 characters

```text
characters
- id
- profile_id
- region
- realm
- name
- class_name
- race_name
- level
- guild_name
- visibility
- is_verified
- last_synced_at
- created_at
- updated_at
```

Índice lógico:

```text
(profile_id, region, realm, name)
```

O sistema deve evitar duplicar o mesmo personagem para o mesmo perfil.

---

# 10. Social graph

## friendships

```text
friendships
- id
- requester_profile_id
- addressee_profile_id
- status
- created_at
- updated_at
```

Status:

```text
pending
accepted
rejected
blocked
```

Não permitir amizade de um usuário consigo mesmo.

---

## follows

```text
follows
- follower_profile_id
- following_profile_id
- created_at
```

Chave única:

```text
(follower_profile_id, following_profile_id)
```

---

## blocks

```text
blocks
- blocker_profile_id
- blocked_profile_id
- created_at
```

Bloqueios devem impedir interações sociais relevantes.

---

# 11. Posts

```text
posts
- id
- author_profile_id
- character_id nullable
- content
- visibility
- created_at
- updated_at
- deleted_at
```

Visibility:

```text
public
friends
private
```

Se `character_id` estiver presente, ele deve pertencer ao `author_profile_id`.

---

# 12. Likes

```text
post_likes
- post_id
- profile_id
- created_at
```

Chave única:

```text
(post_id, profile_id)
```

Um usuário só pode curtir um post uma vez.

---

# 13. Comments

```text
comments
- id
- post_id
- author_profile_id
- content
- created_at
- updated_at
- deleted_at
```

O MVP pode ter comentários de um único nível.

Não implementar threads aninhadas inicialmente.

---

# 14. Notifications

```text
notifications
- id
- recipient_profile_id
- actor_profile_id nullable
- type
- post_id nullable
- comment_id nullable
- friendship_id nullable
- read_at
- created_at
```

Tipos iniciais:

```text
follow
friend_request
friend_accepted
post_like
post_comment
```

---

# 15. Reports

```text
reports
- id
- reporter_profile_id
- reported_profile_id nullable
- post_id nullable
- comment_id nullable
- reason
- description
- status
- created_at
- resolved_at
```

Status:

```text
pending
reviewing
resolved
dismissed
```

---

# 16. Feed

O MVP não precisa de algoritmo complexo.

A primeira versão deve usar um ranking simples.

Prioridade:

1. posts de pessoas que o usuário segue;
2. posts de amigos;
3. posts públicos recentes;
4. atividades relevantes do próprio usuário.

Ordenação inicial:

```text
recency DESC
```

Posteriormente criar um `Feed Service` independente.

Não implementar machine learning no MVP.

---

# 17. Perfil

O perfil deve conter:

```text
Avatar
Display name
@username
Bio

⭐ Main Character

Characters

Followers
Following
Friends

Posts
Activity
```

Exemplo:

```text
Gabriel
@gabriel

"MMO player & game developer"

⭐ Arthas
Mage · Level 80

Characters
- Arthas
- Jaina
- Thrall

428 Followers
182 Following
```

---

# 18. Página de personagem

Uma página de personagem deve ser distinta da página do jogador.

```text
Arthas
Mage
Level 80
Stormwind

Owner:
Gabriel

Guild:
Knights of Azeroth
```

A página deve respeitar a configuração de privacidade.

---

# 19. UI/UX

A interface deve transmitir:

- fantasia
- comunidade
- WoW
- modernidade
- profissionalismo

Evitar transformar a interface em uma cópia literal de Facebook/Instagram.

A inspiração deve ser:

> rede social moderna + identidade visual inspirada em Azeroth.

## Layout desktop

```text
┌─────────────────────────────────────────────┐
│ AZEROTH SOCIAL             Search    Profile│
├──────────────┬───────────────────┬──────────┤
│ Home         │                   │           │
│ Discover     │       FEED        │ Friends   │
│ Characters   │                   │           │
│ Guilds       │                   │           │
│ Settings     │                   │           │
└──────────────┴───────────────────┴──────────┘
```

Responsividade é obrigatória.

---

# 20. Website — páginas

Criar:

```text
/
 /login
 /register
 /feed
 /discover
 /profile/[username]
 /characters/[id]
 /settings
 /friends
 /notifications
```

A landing page deve explicar:

> A social platform for World of Warcraft players.

CTA:

> Create your profile

Não prometer funcionalidades que ainda não existem.

---

# 21. Autenticação

MVP:

- email/password
- recuperação de senha
- sessão persistente
- logout

OAuth pode ser adicionado posteriormente.

Toda página privada deve verificar autenticação no servidor quando apropriado.

Não armazenar senha manualmente.

Usar Supabase Auth.

---

# 22. Segurança

Obrigatório:

- RLS em todas as tabelas expostas;
- validação de dados;
- sanitização de conteúdo;
- limites de tamanho para posts/comentários;
- rate limiting quando necessário;
- nenhuma chave secreta no frontend;
- service role key somente no servidor;
- políticas de Storage;
- proteção contra acesso de dados de outros usuários;
- logs de ações administrativas.

Nunca confiar no cliente para informar:

```text author_profile_id
profile_id
ownership
permissions
```

O backend deve derivar essas informações da sessão autenticada.

---

# 23. Storage

Criar buckets separados quando apropriado:

```text
avatars
post-media
profile-media
```

Não armazenar arquivos binários no PostgreSQL.

Validar:

- MIME type;
- tamanho;
- extensão;
- usuário proprietário.

---

# 24. Addon — MVP técnico

Criar:

```text
AzerothSocial/
├── AzerothSocial.toc
├── README.md
│
├── Core/
│   ├── Init.lua
│   ├── Events.lua
│   └── Utils.lua
│
├── Data/
│   ├── CharacterData.lua
│   └── LocalStore.lua
│
├── WoW/
│   ├── Character.lua
│   ├── Achievement.lua
│   └── Guild.lua
│
├── UI/
│   ├── MainFrame.lua
│   ├── Profile.lua
│   ├── Feed.lua
│   └── Character.lua
│
└── Communication/
    └── Transport.lua
```

O addon deve abrir através de comando slash, por exemplo:

```text
/azeroth
```

ou através de uma opção de UI.

---

# 25. Addon — primeira experiência

Ao abrir:

```text
AZEROTH SOCIAL

Welcome, Gabriel

Current Character
Arthas
Mage · Level 80

[Open Profile]
[Open Feed]
[Character Info]
```

Se a integração online ainda não estiver disponível:

```text
Offline / Integration unavailable

Your local character information was detected.
Online synchronization will be available after the integration layer is enabled.
```

Não simular sincronização real.

---

# 26. Technical Spike do addon

Antes de conectar o addon ao produto:

Criar uma pasta/documentação:

```text
docs/wow-integration.md
```

Registrar:

```text
API testada
Resultado
Dados disponíveis
Eventos disponíveis
Limitações
Throttling
Dados impossíveis
Riscos
Conclusão
```

O resultado desse documento deve determinar a implementação da sincronização.

---

# 27. Seed/demo

Criar dados de demonstração somente em ambiente de desenvolvimento.

Exemplo:

```text
Gabriel
├── Arthas
├── Jaina
└── Thrall

Lucas
├── Illidan
└── Kael
```

Posts:

```text
🏆 Achievement
👕 Transmog
⚔ Mythic+
💬 Text post
```

Isso permitirá testar o feed sem depender do WoW.

---

# 28. Testes

Obrigatório criar testes para:

### Database

- RLS
- ownership
- privacy
- friendships
- follows

### Backend

- auth
- create post
- delete post
- like
- comment
- follow
- friend request
- notification

### Frontend

Testar fluxos críticos:

```text
Register
→ Create Profile
→ Add Character
→ Follow User
→ Create Post
→ Like
→ Comment
```

### Addon

Testar:

- carregamento
- eventos
- detecção de personagem
- persistência local
- abertura/fechamento da UI
- tratamento de APIs ausentes

---

# 29. Git e organização

Repository:

```text
azeroth-social/
```

Estrutura:

```text
azeroth-social/
├── apps/
│   └── web/
│
├── addon/
│
├── supabase/
│   ├── migrations/
│   └── seed/
│
├── docs/
│
├── README.md
└── .gitignore
```

Usar migrations versionadas.

Nunca editar produção manualmente.

---

# 30. Desenvolvimento por etapas

## Etapa 0 — Bootstrap

Antigravity deve:

1. criar a estrutura do monorepo;
2. configurar Next.js;
3. configurar TypeScript;
4. configurar Tailwind;
5. configurar Supabase;
6. configurar `.env.example`;
7. configurar lint/format;
8. criar README;
9. criar migrations;
10. criar pipeline básico de build.

---

## Etapa 1 — Auth

Implementar:

- register
- login
- logout
- recovery
- protected routes

Acceptance criteria:

> Um novo usuário consegue criar uma conta, entrar, sair e recuperar acesso.

---

## Etapa 2 — Profile

Implementar:

- username único;
- display name;
- avatar;
- bio;
- edição de perfil;
- perfil público.

Acceptance criteria:

> Um usuário consegue criar e visualizar seu perfil.

---

## Etapa 3 — Characters

Implementar:

- adicionar personagem;
- editar personagem;
- remover personagem;
- escolher main character;
- definir visibilidade;
- listar personagens.

Acceptance criteria:

> Um usuário consegue possuir múltiplos personagens no mesmo perfil.

---

## Etapa 4 — Social Graph

Implementar:

- follow;
- unfollow;
- friend request;
- accept;
- reject;
- block.

Acceptance criteria:

> Dois usuários conseguem estabelecer relações sociais.

---

## Etapa 5 — Posts

Implementar:

- criar;
- editar;
- excluir;
- visualizar;
- visibility;
- personagem associado.

Acceptance criteria:

> Um jogador consegue publicar usando seu perfil e opcionalmente associar o post a um personagem.

---

## Etapa 6 — Engagement

Implementar:

- like;
- unlike;
- comments;
- notifications.

Acceptance criteria:

> Usuários conseguem interagir com posts e recebem notificações.

---

## Etapa 7 — Feed

Implementar feed cronológico.

Acceptance criteria:

> Usuário vê conteúdo de amigos/seguidos e posts públicos recentes.

---

## Etapa 8 — Addon Spike

Implementar somente a prova técnica.

Acceptance criteria:

> O addon carrega no WoW, identifica o personagem atual e documenta quais dados podem ser coletados.

Não avançar para sincronização online sem concluir este spike.

---

## Etapa 9 — Addon MVP

Depois do spike:

- UI;
- profile view;
- character view;
- feed, se a arquitetura de comunicação permitir;
- sincronização somente dentro das capacidades comprovadas.

---

# 31. Definition of Done

Uma funcionalidade só está concluída quando:

- código implementado;
- TypeScript/Lua sem erros relevantes;
- migrations criadas;
- RLS revisado;
- estados de loading tratados;
- estados de erro tratados;
- mobile/responsive considerado;
- testes críticos adicionados;
- documentação atualizada;
- nenhuma credencial secreta commitada;
- feature funcionando em ambiente local.

---

# 32. Critérios de sucesso do MVP

O MVP será considerado tecnicamente pronto quando um usuário conseguir:

```text
Criar conta
     ↓
Criar perfil
     ↓
Adicionar múltiplos personagens
     ↓
Escolher personagem principal
     ↓
Encontrar outro usuário
     ↓
Seguir ou adicionar como amigo
     ↓
Publicar um post
     ↓
Associar o post a um personagem
     ↓
Outro usuário curtir
     ↓
Outro usuário comentar
     ↓
Receber notificação
```

E o addon deverá pelo menos:

```text
Instalar
   ↓
Carregar no WoW
   ↓
Detectar personagem
   ↓
Exibir informações básicas
   ↓
Abrir interface Azeroth Social
```

---

# 33. O que NÃO fazer

O Antigravity não deve:

- criar microserviços prematuramente;
- implementar IA;
- criar app mobile;
- criar sistema de anúncios;
- implementar pagamentos;
- implementar chat complexo;
- criar marketplace;
- adicionar features fora do MVP sem necessidade;
- assumir que APIs do WoW permitem algo sem testar;
- colocar secrets no cliente;
- desabilitar RLS para "facilitar o desenvolvimento";
- simular integrações como se fossem reais;
- criar dados fictícios em produção;
- acoplar UI do addon à camada de transporte;
- bloquear funcionalidades atrás de pagamento.

---

# 34. Prioridade

Use esta ordem:

```text
P0 — Obrigatório
│
├── Auth
├── Profile
├── Characters
├── Privacy
├── Social graph
├── Posts
├── Likes
├── Comments
├── Notifications
└── Feed
│
P1 — MVP técnico
│
└── WoW integration spike
│
P2 — Após validação
│
├── Addon social completo
├── Guilds
├── Creators
├── Events
├── Search avançado
└── Media avançada
│
P3 — Futuro
│
├── Mobile
├── Monetização
├── Sponsored content
├── Discord
├── Twitch
└── Analytics avançado
```

---

# 35. Instrução principal para o Antigravity

> Você está implementando o MVP do Azeroth Social, uma plataforma social para jogadores de World of Warcraft.
>
> O objetivo desta fase é criar uma base funcional, segura, simples e barata que permita validar a ideia com usuários reais.
>
> Priorize qualidade estrutural sobre quantidade de funcionalidades.
>
> O produto deve tratar o jogador como a identidade social principal e permitir que cada jogador possua múltiplos personagens.
>
> O website é a plataforma social principal. O WoW Addon é um cliente integrado ao jogo.
>
> Não assuma que o addon pode realizar comunicação HTTP arbitrária. Antes de desenvolver sincronização online, execute o Technical Spike de integração com as APIs do WoW e documente suas limitações.
>
> Use Next.js + TypeScript no frontend e Supabase/PostgreSQL/Auth/Storage como backend inicial.
>
> Não crie microserviços no MVP.
>
> Implemente segurança desde o início, especialmente Row Level Security e ownership dos dados.
>
> Não implemente funcionalidades de monetização no MVP.
>
> Não implemente anúncios dentro do addon.
>
> Não implemente recursos fora do escopo sem necessidade.
>
> Toda funcionalidade deve ter código organizado, tratamento de erro e documentação suficiente para outro desenvolvedor continuar o projeto.
>
> Comece pela Etapa 0 — Bootstrap, depois siga sequencialmente pelas etapas definidas neste documento.
>
> A cada etapa:
>
> 1. implemente;
> 2. teste;
> 3. valide;
> 4. documente;
> 5. atualize o README/status;
> 6. somente então avance.
>
> Se encontrar uma limitação técnica da API do WoW, não faça workaround especulativo. Documente a limitação e proponha uma arquitetura compatível antes de continuar.

---

# 36. Primeiro objetivo de desenvolvimento

Ao iniciar o projeto, o primeiro milestone deve ser:

## "Azeroth Social — Foundation"

Entregar:

```text
✓ Repository
✓ Next.js
✓ TypeScript
✓ Tailwind
✓ Supabase
✓ PostgreSQL
✓ Auth
✓ Profile
✓ Database migrations
✓ RLS
✓ Seed
✓ Basic UI
✓ README
✓ Environment configuration
✓ Development setup
```

Depois disso:

## "Azeroth Social — Social Core"

```text
Profile
Characters
Friends
Following
Posts
Likes
Comments
Notifications
Feed
```

E somente depois:

## "Azeroth Social — WoW Integration"

```text
Addon
   ↓
WoW API research
   ↓
Technical Spike
   ↓
Character detection
   ↓
Supported data
   ↓
Compatible synchronization
```

---

# 37. Visão final

O MVP não precisa ser o produto completo.

Ele precisa responder uma pergunta:

> **"Jogadores de World of Warcraft querem um lugar social próprio onde seu perfil, seus personagens e suas atividades continuem existindo dentro e fora do jogo?"**

Se a resposta for sim, o Azeroth Social poderá evoluir para:

```text
                    AZEROTH SOCIAL
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
       WoW              Web              Mobile
      Addon              │                 │
        │                │                 │
        └────────────────┼─────────────────┘
                         │
                       Social
                         │
             ┌───────────┼───────────┐
             │           │           │
          Players      Guilds     Creators
             │           │           │
             └───────────┼───────────┘
                         │
                    Community
                         │
                    Ecosystem
```

**Primeiro: comunidade. Depois: escala. Depois: monetização.**
