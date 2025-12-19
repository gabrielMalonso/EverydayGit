# GitFlow AI - Documentação para Claude

## Visão Geral do Projeto

GitFlow AI é uma aplicação desktop leve para gerenciamento visual de Git com assistência de IA integrada. O app foi construído com foco em performance, minimalismo funcional e produtividade, oferecendo uma alternativa rápida às ferramentas Git pesadas de IDEs.

### Objetivo Principal
Fornecer uma ferramenta Git visual dedicada, leve e rápida, com IA integrada para gerar mensagens de commit e auxiliar em tarefas repetitivas.

### Proposta de Valor
- **Leveza:** Experiência desktop rápida e minimalista construída com Tauri
- **Produtividade:** IA integrada para gerar mensagens de commit e explicar mudanças
- **Clareza:** Interface visual única com painéis para branches, mudanças, histórico e IA

### Público-alvo
- Desenvolvedores que preferem uma ferramenta Git dedicada
- Times que desejam padronizar mensagens de commit com ajuda de IA
- Usuários que querem workflows guiados sem overhead de IDEs completas

## Stack Tecnológica

### Frontend
- **React 19** com TypeScript
- **Vite** como build tool
- **Tailwind CSS 4** com sistema de design baseado em tokens CSS
- **Zustand** para gerenciamento de estado
- **react-diff-view** para visualização de diffs

### Backend
- **Tauri 2.x** como framework desktop (Rust)
- **Git CLI** nativo para operações Git
- **Providers de IA:** Claude / OpenAI / Ollama

### Plugins Tauri
- `@tauri-apps/plugin-dialog` - Diálogos nativos de sistema
- `@tauri-apps/plugin-fs` - Sistema de arquivos
- `@tauri-apps/plugin-opener` - Abrir URLs/arquivos externos

## Arquitetura

### Camadas da Aplicação

```
┌─────────────────────────────────────────────┐
│         React UI (TypeScript)                │
│  - Components (BranchesPanel, ChangesPanel)  │
│  - Hooks (useGit, useAi, useConfig)          │
│  - Stores (Zustand)                          │
└──────────────┬──────────────────────────────┘
               │ Tauri IPC
┌──────────────▼──────────────────────────────┐
│         Rust Backend (Tauri)                 │
│  - Commands (IPC handlers)                   │
│  - Git Module (CLI wrapper)                  │
│  - AI Module (providers)                     │
│  - Config Module (persistência)              │
└──────────────┬──────────────────────────────┘
               │
     ┌─────────┴─────────┐
     ▼                   ▼
┌─────────┐        ┌──────────┐
│ Git CLI │        │ AI APIs  │
└─────────┘        └──────────┘
```

### Fluxo de Dados

1. **UI → Backend:** React invoca comandos Tauri via `invoke()`
2. **Backend → Git:** Rust executa comandos Git CLI e processa saída
3. **Backend → AI:** Rust envia prompts para providers de IA
4. **Backend → UI:** Resultados retornam via promises assíncronas
5. **Estado:** Zustand stores gerenciam estado local do frontend

## Estrutura do Projeto

```
GitFlow-AI/
├── src/                          # Frontend React
│   ├── components/               # Componentes da aplicação
│   │   ├── TopBar.tsx           # Barra superior com repo selector
│   │   ├── BranchesPanel.tsx    # Lista de branches locais/remotas
│   │   ├── ChangesPanel.tsx     # Arquivos staged/unstaged
│   │   ├── DiffViewer.tsx       # Visualização de diffs
│   │   ├── AiPanel.tsx          # Geração de commits e chat
│   │   ├── HistoryPanel.tsx     # Log de commits
│   │   └── SettingsModal.tsx    # Configurações da aplicação
│   ├── ui/                      # Sistema de componentes reutilizáveis
│   │   ├── Button.tsx           # Botões com variantes
│   │   ├── Input.tsx            # Inputs de texto
│   │   ├── Modal.tsx            # Modais
│   │   ├── SideSheet.tsx        # Painéis laterais
│   │   ├── Toast.tsx            # Notificações
│   │   ├── ToggleSwitch.tsx     # Switches
│   │   ├── SelectMenu.tsx       # Menus dropdown
│   │   └── ...
│   ├── stores/                  # Estado global (Zustand)
│   │   ├── repoStore.ts         # Repositório atual
│   │   ├── gitStore.ts          # Status, branches, commits, diffs
│   │   ├── aiStore.ts           # Sugestões de commit, chat
│   │   └── settingsStore.ts     # Configurações da UI
│   ├── hooks/                   # Custom hooks
│   │   ├── useGit.ts            # Operações Git (status, commit, push, pull)
│   │   ├── useAi.ts             # Geração de mensagens e chat
│   │   └── useConfig.ts         # Carregar/salvar configurações
│   ├── demo/                    # Modo demonstração
│   │   ├── demoMode.ts          # Detecção de modo demo
│   │   ├── fixtures.ts          # Dados simulados
│   │   └── initDemoState.ts     # Estado inicial demo
│   ├── types/                   # Definições TypeScript
│   │   └── index.ts             # Tipos compartilhados
│   ├── App.tsx                  # Componente raiz
│   └── main.tsx                 # Entry point
│
├── src-tauri/                   # Backend Rust
│   ├── src/
│   │   ├── commands/            # Handlers IPC
│   │   │   └── mod.rs           # Todos os comandos Tauri
│   │   ├── git/                 # Módulo Git
│   │   │   └── mod.rs           # Wrapper do Git CLI
│   │   ├── ai/                  # Módulo AI
│   │   │   └── mod.rs           # Integração com providers
│   │   ├── config/              # Módulo Config
│   │   │   └── mod.rs           # Persistência de configurações
│   │   ├── lib.rs               # Setup e registro de comandos
│   │   └── main.rs              # Entry point
│   ├── Cargo.toml               # Dependências Rust
│   └── tauri.conf.json          # Configuração Tauri
│
├── docs/                        # Documentação do projeto
│   ├── 00-overview.md           # Visão geral e objetivos
│   ├── 01-architecture.md       # Arquitetura detalhada
│   ├── 02-setup-environment.md  # Setup do ambiente
│   ├── 03-tauri-backend.md      # Backend Rust/Tauri
│   ├── 04-react-frontend.md     # Frontend React
│   ├── 05-git-integration.md    # Integração Git
│   ├── 06-ai-integration.md     # Integração AI
│   ├── 07-ui-components.md      # Componentes UI
│   ├── 08-state-management.md   # Gerenciamento de estado
│   ├── 09-local-storage.md      # Persistência local
│   ├── 10-testing.md            # Testes
│   ├── 11-build-distribution.md # Build e distribuição
│   └── 12-future-features.md    # Funcionalidades futuras
│
├── package.json                 # Dependências Node
├── tailwind.config.js           # Config Tailwind + Design System
├── tsconfig.json                # Config TypeScript
└── vite.config.ts               # Config Vite
```

## Principais Funcionalidades

### 1. Gerenciamento de Repositório
- Abrir repositório Git via dialog nativo
- Salvar último repositório aberto (restaurado ao iniciar)
- Validação de repositório Git válido
- Detecção automática de modo Tauri vs modo demo

### 2. Operações Git Core
Implementadas em `src/hooks/useGit.ts` e `src-tauri/src/git/mod.rs`:

- **Status:** `refreshStatus()` → `get_git_status`
- **Branches:** `refreshBranches()` → `get_branches_cmd`
- **Commits:** `refreshCommits()` → `get_commit_log`
- **Stage/Unstage:** `stageFile()`, `unstageFile()` → `stage_file_cmd`, `unstage_file_cmd`
- **Commit:** `commit()` → `commit_cmd`
- **Push/Pull:** `push()`, `pull()` → `push_cmd`, `pull_cmd`
- **Checkout:** `checkoutBranch()` → `checkout_branch_cmd`
- **Diff:** `getFileDiff()`, `getAllDiff()` → `get_file_diff`, `get_all_diff_cmd`

### 3. Assistência de IA
Implementada em `src/hooks/useAi.ts` e `src-tauri/src/ai/mod.rs`:

- **Geração de mensagem de commit:** Analisa diff staged e gera mensagem convencional
- **Chat contextual:** Conversa com IA sobre mudanças e estratégias
- **Providers suportados:** Claude, OpenAI, Ollama (local)
- **Configuração flexível:** API key, modelo, temperatura

### 4. Interface Visual

#### Layout Principal (src/App.tsx)
```
┌─────────────────────────────────────────────────────┐
│                     TopBar                           │
├─────────────┬───────────────────────┬───────────────┤
│  Branches   │   Changes + Diff      │      AI       │
│   Panel     │      Viewer           │     Panel     │
│             │                       │               │
│             │                       │               │
└─────────────┴───────────────────────┴───────────────┘
│                  History Panel                       │
└─────────────────────────────────────────────────────┘
```

- **Coluna Esquerda (w-72):** BranchesPanel - lista branches locais e remotas
- **Coluna Central (flex-1):** ChangesPanel (h-320px) + DiffViewer (flex-1)
- **Coluna Direita (w-96):** AiPanel - geração de commits e chat
- **Linha Inferior (h-52):** HistoryPanel - histórico de commits

### 5. Sistema de Design

O projeto usa um **design system baseado em tokens CSS** definidos no `tailwind.config.js`:

#### Paleta de Cores
- **Texto:** `text1`, `text2`, `text3` (hierarquia de contraste)
- **Superfícies:** `surface1`, `surface2`, `surface3` (elevação)
- **Bordas:** `border1`, `border2`, `border3`
- **Ações:** `primary`, `highlight`, `accent`, `danger`, `warning`
- **Status:** `successFg/Bg`, `dangerFg/Bg`, `warningFg/Bg`, `infoFg/Bg`

#### Raios de Borda Semânticos
- `card`, `card-inner`, `modal`, `sheet`, `button`, `input`, `badge`, `avatar`

#### Sombras
- `subtle`, `card`, `modal`, `sheet`, `popover`, `focus`, `elevated`

#### Componentes UI Reutilizáveis (src/ui/)
Todos os componentes seguem o design system e aceitam variantes via props:
- Button com variantes: `primary`, `ghost`, `danger`, `outline`
- Input com validação e estados de erro
- Modal, SideSheet, Toast para feedback
- SelectMenu, ToggleSwitch para controles

### 6. Modo Demo

O app suporta **modo demonstração** que funciona sem Tauri/Git instalado:

- **Detecção:** `isDemoMode()` verifica se `window.__TAURI__` existe
- **Fixtures:** Dados simulados em `src/demo/fixtures.ts`
- **Simulação:** `useGit` e `useAi` hooks simulam operações Git/AI
- **Uso:** Permite testar UI/UX no browser sem backend

#### Como funciona
```typescript
// src/hooks/useGit.ts
const refreshStatus = async () => {
  if (isDemoMode()) {
    setStatus(demoStatus);
    return;
  }

  const status = await invoke<RepoStatus>('get_git_status');
  setStatus(status);
};
```

### 7. Gerenciamento de Estado (Zustand)

#### repoStore (src/stores/repoStore.ts)
- `repoPath`: Caminho do repositório atual
- `setRepoPath()`: Define repositório

#### gitStore (src/stores/gitStore.ts)
- `status`: Status Git (staged/unstaged files, ahead/behind)
- `branches`: Lista de branches locais e remotas
- `commits`: Histórico de commits
- `selectedFile`, `selectedDiff`: Arquivo e diff selecionados

#### aiStore (src/stores/aiStore.ts)
- `commitSuggestion`: Última mensagem sugerida
- `chatMessages`: Histórico de chat
- `isGenerating`: Flag de loading

#### settingsStore (src/stores/settingsStore.ts)
- `showSettings`: Modal de configurações aberto
- `setShowSettings()`: Toggle modal

### 8. Configuração e Persistência

Configurações são persistidas localmente via `src-tauri/src/config/mod.rs`:

```typescript
// src/hooks/useConfig.ts
interface Config {
  last_repo_path?: string;
  theme?: string;
  ai?: {
    provider?: string;
    api_key?: string;
    model?: string;
  };
}

// Carregar configuração
const config = await loadConfig();

// Salvar configuração
await saveConfig(config);
```

## Comandos Tauri (IPC)

Todos os comandos registrados em `src-tauri/src/lib.rs`:

### Repositório
- `set_repository(path: string)`: Define repositório atual
- `get_current_repo_path()`: Retorna caminho do repo

### Git
- `get_git_status()`: Status do repositório (staged/unstaged)
- `get_branches_cmd()`: Lista branches locais e remotas
- `get_commit_log(limit: number)`: Histórico de commits
- `get_file_diff(filePath: string, staged: boolean)`: Diff de arquivo
- `get_all_diff_cmd(staged: boolean)`: Diff completo staged ou unstaged
- `stage_file_cmd(filePath: string)`: Stage arquivo
- `unstage_file_cmd(filePath: string)`: Unstage arquivo
- `commit_cmd(message: string)`: Criar commit
- `push_cmd()`: Push para remoto
- `pull_cmd()`: Pull do remoto
- `checkout_branch_cmd(branchName: string)`: Checkout branch

### IA
- `generate_commit_msg(diff: string)`: Gera mensagem de commit
- `ai_chat(messages: ChatMessage[])`: Chat com IA

### Configuração
- `load_config_cmd()`: Carrega configuração salva
- `save_config_cmd(config: Config)`: Salva configuração
- `update_ai_config_cmd(config: AiConfig)`: Atualiza config de IA

## Tipos TypeScript Principais

```typescript
// src/types/index.ts

interface FileStatus {
  path: string;
  status: string;
  staged: boolean;
}

interface RepoStatus {
  current_branch: string;
  files: FileStatus[];
  ahead: number;
  behind: number;
}

interface Branch {
  name: string;
  current: boolean;
  remote: boolean;
}

interface CommitInfo {
  hash: string;
  message: string;
  author: string;
  date: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
```

## Princípios de Design

1. **Minimalismo funcional:** Todo elemento tem propósito claro
2. **Performance primeiro:** App abre rápido, UI responsiva
3. **Keyboard-friendly:** Ações acessíveis por atalhos (futuro)
4. **IA como assistente:** Sugere, humano decide

## Escopo Atual vs Futuro

### Implementado (MVP)
- Core Git: status, stage/unstage, commit, push/pull, branches, checkout, diff, histórico
- IA: configurar provider, gerar mensagem de commit, chat contextual
- Configurações: tema dark, persistência de último repo
- UI: design system completo com tokens CSS
- Demo mode: funcionamento no browser sem backend

### Fora de Escopo (Por Enquanto)
- Suporte multiplataforma além de macOS
- Plugins/extensibilidade
- Fluxos avançados (rebase interativo, bisect, stash UI)
- Atalhos de teclado
- Múltiplas janelas

## Comandos Úteis

```bash
# Desenvolvimento
npm run dev              # Inicia dev server (frontend + backend)

# Build
npm run build            # Build produção (compila TS e Vite)
npm run tauri build      # Build completo do app Tauri

# Preview
npm run preview          # Preview do build de produção
```

## Fluxos de Trabalho Típicos

### Fluxo: Fazer um Commit

1. **Usuário abre repositório**
   - TopBar → Botão "Open Repository"
   - Dialog nativo abre
   - Backend valida e define repositório
   - Frontend carrega status, branches, commits

2. **Usuário visualiza mudanças**
   - ChangesPanel mostra arquivos unstaged
   - Usuário clica em arquivo
   - DiffViewer mostra diff do arquivo

3. **Usuário stage arquivos**
   - Clica no botão "+" ao lado do arquivo
   - `stageFile()` → `stage_file_cmd`
   - `refreshStatus()` atualiza UI

4. **IA gera mensagem de commit**
   - AiPanel → Botão "Generate Commit Message"
   - `getAllDiff(true)` busca diff staged
   - `generateCommitMessage(diff)` → `generate_commit_msg`
   - Mensagem aparece no textarea

5. **Usuário comita**
   - Edita mensagem se necessário
   - Clica "Commit"
   - `commit(message)` → `commit_cmd`
   - UI atualiza: arquivos staged somem, novo commit no histórico

### Fluxo: Trocar de Branch

1. **Usuário visualiza branches**
   - BranchesPanel mostra lista de branches
   - Branch atual destacada

2. **Usuário seleciona branch**
   - Clica em branch diferente
   - `checkoutBranch(branchName)` → `checkout_branch_cmd`
   - Backend executa `git checkout`
   - Frontend atualiza status, branches, commits

### Fluxo: Push/Pull

1. **Usuário verifica ahead/behind**
   - TopBar mostra badges (↑2 ↓1)

2. **Usuário clica Push ou Pull**
   - Botão no TopBar
   - `push()` ou `pull()` → `push_cmd` ou `pull_cmd`
   - Backend executa comando Git
   - UI atualiza status e histórico

## Características Técnicas Importantes

### 1. Detecção de Ambiente Tauri
```typescript
const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;
```
Usado para evitar chamadas Tauri em ambiente browser (demo mode).

### 2. Gerenciamento de Estado Seguro
Zustand stores são simples e não requerem providers:
```typescript
const { repoPath } = useRepoStore();
const { refreshStatus } = useGit();
```

### 3. Tipagem Forte
Todos os comandos IPC têm tipos TypeScript correspondentes, garantindo type-safety entre frontend e backend.

### 4. Separação de Concerns
- **Components:** Apenas renderização e eventos
- **Hooks:** Lógica de negócio e comunicação IPC
- **Stores:** Estado global compartilhado
- **UI Components:** Sistema de design reutilizável

### 5. Sistema de Design CSS Variables
Tokens CSS permitem temas dinâmicos sem recompilar Tailwind:
```css
--color-text-1: 255 255 255;
--color-surface-1: 18 18 18;
```

## Dicas para Desenvolvimento

### Ao Adicionar Nova Funcionalidade

1. **Backend (Rust):**
   - Adicionar função em `src-tauri/src/git/mod.rs` ou `src-tauri/src/ai/mod.rs`
   - Criar comando IPC em `src-tauri/src/commands/mod.rs`
   - Registrar em `src-tauri/src/lib.rs`

2. **Frontend (React):**
   - Adicionar tipo em `src/types/index.ts`
   - Criar função no hook apropriado (`useGit`, `useAi`, `useConfig`)
   - Atualizar store se necessário
   - Usar no componente

3. **UI:**
   - Reutilizar componentes de `src/ui/`
   - Seguir design tokens do Tailwind config
   - Garantir modo demo funcione (adicionar fixture se necessário)

### Debugging

- **Backend Rust:** Logs aparecem no console do Tauri dev tools
- **Frontend:** DevTools do navegador (quando rodando em dev)
- **Demo Mode:** Testar UI sem backend executando no browser

### Performance

- **Evitar re-renders:** Zustand usa shallow comparison
- **Lazy loading:** Componentes grandes podem ser code-split
- **Diff otimizado:** react-diff-view usa virtual scrolling

## Referências Rápidas

- **Docs completas:** Pasta `docs/` contém runbooks detalhados de cada módulo
- **Tauri Docs:** https://tauri.app/v2/
- **React 19:** https://react.dev/
- **Zustand:** https://zustand-demo.pmnd.rs/
- **Tailwind CSS:** https://tailwindcss.com/

## Glossário

- **Staged/Unstaged:** Arquivos prontos (ou não) para commit
- **Ahead/Behind:** Commits à frente/atrás do remoto
- **Provider de IA:** Serviço que responde a prompts (Claude, OpenAI, Ollama)
- **IPC:** Inter-Process Communication (comunicação Tauri frontend/backend)
- **Demo Mode:** Modo de demonstração que funciona sem backend
- **Design Tokens:** Variáveis CSS que definem o design system

---

**Última Atualização:** 2025-12-19
**Versão:** 0.1.0
**Status:** MVP em desenvolvimento ativo
