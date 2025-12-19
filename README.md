# GitFlow AI

Uma ferramenta desktop leve e moderna para gerenciamento visual de Git com assistência de IA integrada.

---

## Sobre o Projeto

GitFlow AI é um aplicativo desktop para macOS que oferece uma interface visual minimalista para operações Git do dia-a-dia, com o diferencial de integrar assistentes de IA para automatizar tarefas como geração de mensagens de commit.

### Problema que Resolve

IDEs como Android Studio oferecem excelentes ferramentas visuais para Git, mas consomem muitos recursos. Ferramentas standalone existentes carecem de integração com IA. GitFlow AI preenche esse gap: uma ferramenta leve, focada, e inteligente.

### Público-Alvo

Desenvolvedores que desejam uma ferramenta Git visual sem o overhead de uma IDE completa, com assistência de IA para agilizar o workflow.

---

## Stack Tecnológica

| Camada | Tecnologia | Justificativa |
|--------|------------|---------------|
| Framework Desktop | Tauri 2.x | Leve (~15MB), nativo, seguro |
| Backend | Rust | Performance, segurança de memória |
| Frontend | React 18 + TypeScript | Ecossistema rico, tipagem forte |
| Styling | Tailwind CSS | Utility-first, tema dark nativo |
| State Management | Zustand | Simples, performático, sem boilerplate |
| Git | CLI nativo | Compatibilidade total, sem dependências |
| IA | Claude / OpenAI / Ollama | Flexibilidade de providers |

---

## Filosofia de Design

### Princípios

1. **Minimalismo funcional** — Cada elemento tem propósito. Sem decoração desnecessária.
2. **Performance primeiro** — App deve abrir instantaneamente e nunca travar.
3. **Keyboard-friendly** — Todas ações acessíveis por atalhos.
4. **IA como assistente** — IA sugere, humano decide.

### Diretrizes Visuais

- **Tema:** Dark mode como padrão (light mode futuro)
- **Tipografia:** Font system nativa (SF Pro no macOS)
- **Ícones:** SVGs apenas onde essencial, preferir texto e indicadores simples
- **Cores:** Paleta restrita, alto contraste para legibilidade
- **Espaçamento:** Generoso, permitir "respiração" visual

### Paleta de Cores

```
Background principal:    #0f0f14
Background secundário:   #1a1a24
Background elevado:      #242430
Texto principal:         #e4e4e7
Texto secundário:        #71717a
Accent primário:         #6366f1 (indigo)
Success:                 #22c55e
Warning:                 #f59e0b
Danger:                  #ef4444
Border:                  #27272a
```

---

## Arquitetura de Alto Nível

```
┌─────────────────────────────────────────────────────────┐
│                   GitFlow AI (Tauri)                    │
│  ┌───────────────────────────────────────────────────┐  │
│  │              Frontend (React + TS)                │  │
│  │  • UI Components                                  │  │
│  │  • State Management (Zustand)                     │  │
│  │  • IPC Hooks                                      │  │
│  └─────────────────────┬─────────────────────────────┘  │
│                        │ Tauri IPC                      │
│  ┌─────────────────────▼─────────────────────────────┐  │
│  │               Backend (Rust)                      │  │
│  │  • Git Command Executor                           │  │
│  │  • AI Provider Manager                            │  │
│  │  • Config Manager                                 │  │
│  └───────────┬─────────────────────┬─────────────────┘  │
└──────────────┼─────────────────────┼────────────────────┘
               │                     │
                              ▼                     ▼
                                       ┌──────────┐      ┌─────────────────┐
                                                │ Git CLI  │      │ AI APIs         │
                                                         │ (local)  │      │ Claude/OpenAI/  │
                                                                  └──────────┘      │ Ollama          │
                                                                                             └─────────────────┘
                                                                                             ```

                                                                                             ---

                                                                                             ## Estrutura do Projeto

                                                                                             ```
                                                                                             gitflow-ai/
                                                                                             ├── README.md                    # Este arquivo
                                                                                             ├── docs/                        # Runbooks de desenvolvimento
                                                                                             │   ├── 00-overview.md
                                                                                             │   ├── 01-architecture.md
                                                                                             │   ├── 02-setup-environment.md
                                                                                             │   ├── 03-tauri-backend.md
                                                                                             │   ├── 04-react-frontend.md
                                                                                             │   ├── 05-git-integration.md
                                                                                             │   ├── 06-ai-integration.md
                                                                                             │   ├── 07-ui-components.md
                                                                                             │   ├── 08-state-management.md
                                                                                             │   ├── 09-local-storage.md
                                                                                             │   ├── 10-testing.md
                                                                                             │   ├── 11-build-distribution.md
                                                                                             │   └── 12-future-features.md
                                                                                             ├── src-tauri/                   # Backend Rust
                                                                                             │   ├── src/
                                                                                             │   │   ├── main.rs
                                                                                             │   │   ├── commands/            # Comandos IPC
                                                                                             │   │   ├── git/                 # Módulo Git
                                                                                             │   │   ├── ai/                  # Módulo IA
                                                                                             │   │   └── config/              # Configurações
                                                                                             │   ├── Cargo.toml
                                                                                             │   └── tauri.conf.json
                                                                                             ├── src/                         # Frontend React
                                                                                             │   ├── components/              # Componentes UI
                                                                                             │   ├── hooks/                   # Hooks customizados
                                                                                             │   ├── stores/                  # Zustand stores
                                                                                             │   ├── lib/                     # Utilitários
                                                                                             │   ├── types/                   # TypeScript types
                                                                                             │   ├── App.tsx
                                                                                             │   └── main.tsx
                                                                                             ├── package.json
                                                                                             └── tailwind.config.js
                                                                                             ```

                                                                                             ---

                                                                                             ## Funcionalidades do MVP

                                                                                             ### Core Git
                                                                                             - [ ] Abrir/selecionar repositório
                                                                                             - [ ] Visualizar branches (local e remote)
                                                                                             - [ ] Visualizar arquivos modificados (staged/unstaged)
                                                                                             - [ ] Stage/unstage arquivos
                                                                                             - [ ] Visualizar diff de arquivos
                                                                                             - [ ] Commit com mensagem
                                                                                             - [ ] Push/Pull
                                                                                             - [ ] Checkout de branches
                                                                                             - [ ] Visualizar histórico de commits

                                                                                             ### Integração IA
                                                                                             - [ ] Configurar provider (Claude/OpenAI/Ollama)
                                                                                             - [ ] Gerar mensagem de commit baseada no diff
                                                                                             - [ ] Chat contextual sobre o repositório

                                                                                             ### Configurações
                                                                                             - [ ] Tema (dark)
                                                                                             - [ ] API keys dos providers
                                                                                             - [ ] Preferências de commit (conventional commits, idioma)

                                                                                             ---

                                                                                             ## Documentação (Runbooks)

                                                                                             A pasta `/docs` contém runbooks detalhados para cada aspecto do desenvolvimento. Os runbooks seguem um padrão consistente para facilitar a navegação e implementação.

                                                                                             ### Índice dos Runbooks

                                                                                             | # | Documento | Descrição | Status |
                                                                                             |---|-----------|-----------|--------|
                                                                                             | 00 | [Overview](docs/00-overview.md) | Visão completa do produto e decisões | 🔲 |
                                                                                             | 01 | [Architecture](docs/01-architecture.md) | Arquitetura técnica detalhada | 🔲 |
                                                                                             | 02 | [Setup Environment](docs/02-setup-environment.md) | Configuração do ambiente de dev | 🔲 |
                                                                                             | 03 | [Tauri Backend](docs/03-tauri-backend.md) | Implementação do backend Rust | 🔲 |
                                                                                             | 04 | [React Frontend](docs/04-react-frontend.md) | Implementação do frontend | 🔲 |
                                                                                             | 05 | [Git Integration](docs/05-git-integration.md) | Integração com Git CLI | 🔲 |
                                                                                             | 06 | [AI Integration](docs/06-ai-integration.md) | Integração com providers de IA | 🔲 |
                                                                                             | 07 | [UI Components](docs/07-ui-components.md) | Design system e componentes | 🔲 |
                                                                                             | 08 | [State Management](docs/08-state-management.md) | Gerenciamento de estado | 🔲 |
                                                                                             | 09 | [Local Storage](docs/09-local-storage.md) | Persistência de configurações | 🔲 |
                                                                                             | 10 | [Testing](docs/10-testing.md) | Estratégia de testes | 🔲 |
                                                                                             | 11 | [Build & Distribution](docs/11-build-distribution.md) | Build e distribuição | 🔲 |
                                                                                             | 12 | [Future Features](docs/12-future-features.md) | Roadmap pós-MVP | 🔲 |

                                                                                             **Legenda:** 🔲 Não iniciado | 🟡 Em progresso | ✅ Completo

                                                                                             ### Padrão dos Runbooks

                                                                                             Cada runbook deve seguir esta estrutura:

                                                                                             ```markdown
                                                                                             # [Número] - [Título]

                                                                                             > **TL;DR:** Resumo em 2-3 linhas do que o runbook cobre.

                                                                                             ## Sumário
                                                                                             - Links para seções principais

                                                                                             ## Objetivo
                                                                                             O que este runbook ensina/documenta.

                                                                                             ## Pré-requisitos
                                                                                             O que precisa estar pronto antes.

                                                                                             ## Conceitos
                                                                                             Explicação teórica quando necessário.

                                                                                             ## Implementação
                                                                                             Passo-a-passo com código.

                                                                                             ## Troubleshooting
                                                                                             Problemas comuns e soluções.

                                                                                             ## Referências
                                                                                             Links úteis e documentação externa.
                                                                                             ```

                                                                                             ### Diretrizes para Escrita dos Runbooks

                                                                                             1. **Seja prático** — Código funcional > teoria extensa
                                                                                             2. **Explique o "porquê"** — Não apenas o "como"
                                                                                             3. **Inclua exemplos** — Código real, não pseudocódigo
                                                                                             4. **Mantenha atualizado** — Runbook desatualizado é pior que nenhum
                                                                                             5. **Link entre runbooks** — Referencie outros docs quando relevante
                                                                                             6. **Troubleshooting real** — Documente erros que você encontrou

                                                                                             ---

                                                                                             ## Quick Start (após runbooks completos)

                                                                                             ```bash
                                                                                             # Clone o repositório
                                                                                             git clone https://github.com/seu-usuario/gitflow-ai.git
                                                                                             cd gitflow-ai

                                                                                             # Instale dependências
                                                                                             npm install

                                                                                             # Rode em desenvolvimento
                                                                                             npm run tauri dev

                                                                                             # Build para produção
                                                                                             npm run tauri build
                                                                                             ```

                                                                                             ---

                                                                                             ## Contribuição

                                                                                             Este é um projeto pessoal em desenvolvimento. Os runbooks na pasta `/docs` documentam todo o processo de criação.

                                                                                             ---

                                                                                             ## Licença

                                                                                             MIT

                                                                                             ---

                                                                                             ## Contato

                                                                                             Gabriel — Desenvolvedor do Personal Evolution e GitFlow AI
                                                                                             