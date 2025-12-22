# Plano: Sidebar shadcn + Página de Branches/Merge

## Objetivo
Adicionar navegação lateral (sidebar) usando shadcn/ui e criar página dedicada para gerenciamento de branches e merges com assistência de IA.

---

## Status Atual

- [x] Dependências instaladas (`clsx`, `tailwind-merge`, `class-variance-authority`, `@radix-ui/react-slot`)
- [x] Utilitário `cn()` criado em `src/lib/utils.ts`
- [x] Config `components.json` criado
- [ ] Alias `@/*` no tsconfig.json
- [ ] Componente Sidebar
- [ ] AppSidebar
- [ ] Layout wrapper
- [ ] Navigation store
- [ ] CommitsPage
- [ ] BranchesPage
- [ ] Backend Git (merge/compare)

---

## Layout Proposto

### Atual
```
┌─────────────────────────────────────────────┐
│                  TopBar                      │
├─────────────┬───────────────┬───────────────┤
│ ChangesPanel│  CommitPanel  │  DiffViewer   │
│ HistoryPanel│               │               │
└─────────────┴───────────────┴───────────────┘
```

### Novo (com Sidebar)
```
┌──────┬──────────────────────────────────────┐
│      │              TopBar                   │
│  S   ├──────────────────────────────────────┤
│  I   │                                       │
│  D   │         Page Content                  │
│  E   │    (Commits | Branches | ...)         │
│  B   │                                       │
│  A   │                                       │
│  R   │                                       │
└──────┴──────────────────────────────────────┘
```

---

## Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/lib/utils.ts` | ✅ Criado | Utilitário `cn()` para shadcn |
| `components.json` | ✅ Criado | Config shadcn |
| `tsconfig.json` | Modificar | Adicionar alias `@/*` |
| `vite.config.ts` | Modificar | Adicionar alias `@/*` |
| `src/ui/Sidebar.tsx` | Criar | Componente sidebar base |
| `src/components/AppSidebar.tsx` | Criar | Sidebar customizada do app |
| `src/components/Layout.tsx` | Criar | Layout wrapper com sidebar |
| `src/pages/CommitsPage.tsx` | Criar | Página atual refatorada |
| `src/pages/BranchesPage.tsx` | Criar | Nova página de branches |
| `src/App.tsx` | Modificar | Usar novo Layout + roteamento |
| `src/stores/navigationStore.ts` | Criar | Estado de navegação |
| `src-tauri/src/git/mod.rs` | Modificar | Adicionar comandos de merge |
| `src-tauri/src/commands/mod.rs` | Modificar | Handlers IPC |

---

## Etapas de Implementação

### Fase 1: Configuração Base ✅ (parcial)

```bash
# Já executado:
npm install clsx tailwind-merge class-variance-authority @radix-ui/react-slot
```

**Próximo passo - Adicionar alias ao tsconfig.json:**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**E ao vite.config.ts:**
```typescript
import path from "path"

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // ... resto da config
})
```

---

### Fase 2: Componente Sidebar

Criar `src/ui/Sidebar.tsx` com:
- `Sidebar` - Container principal (w-64, bg-surface1, border-r)
- `SidebarHeader` - Logo/título
- `SidebarContent` - Área de navegação (flex-1)
- `SidebarFooter` - Área inferior
- `SidebarItem` - Item de navegação (hover, active states)
- `SidebarGroup` - Grupo de itens com título

---

### Fase 3: AppSidebar + Layout

**AppSidebar** (`src/components/AppSidebar.tsx`):
```
┌─────────────────────┐
│  🔀 GitFlow AI      │  <- Logo/Header
├─────────────────────┤
│                     │
│  📝 Commits         │  <- Página default
│  🌿 Branches        │  <- Nova página
│  📜 History         │  <- Futuro
│                     │
├─────────────────────┤
│  ⚙️ Settings        │  <- Abre modal
│  📂 ~/project       │  <- Repo info
└─────────────────────┘
```

**Layout** (`src/components/Layout.tsx`):
```tsx
export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex h-screen bg-surface1">
    <AppSidebar />
    <main className="flex-1 flex flex-col min-w-0">
      <TopBar />
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </main>
  </div>
);
```

---

### Fase 4: Navigation Store

**Arquivo**: `src/stores/navigationStore.ts`

```typescript
import { create } from 'zustand';

type Page = 'commits' | 'branches' | 'history';

interface NavigationState {
  currentPage: Page;
  setPage: (page: Page) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  currentPage: 'commits',
  setPage: (page) => set({ currentPage: page }),
}));
```

---

### Fase 5: CommitsPage

**Arquivo**: `src/pages/CommitsPage.tsx`

Mover o conteúdo atual do `App.tsx` para esta página:
- ChangesListPanel
- CommitPanel
- DiffViewer
- HistoryPanel

Layout interno mantém o grid atual de 3 colunas.

---

### Fase 6: BranchesPage (Básico)

**Arquivo**: `src/pages/BranchesPage.tsx`

```
┌─────────────────┬─────────────────────────────┐
│  Branch List    │    Branch Details           │
│  ─────────────  │    ─────────────────        │
│  • main ✓       │    Branch: feature/x        │
│  • develop      │    Commits: 142             │
│  • feature/x    │    Ahead: 3 | Behind: 1     │
│                 │    Last commit: 2h ago      │
│                 │                             │
│  [+ New Branch] │    [Checkout] [Merge] [Del] │
└─────────────────┴─────────────────────────────┘
```

**Funcionalidades:**
- Lista de branches (locais + remotas)
- Criar nova branch (input + botão)
- Deletar branch (com confirmação)
- Checkout (trocar de branch)
- Ver detalhes (commits, ahead/behind)

---

### Fase 7: Backend Git - Comandos Novos

**Arquivo**: `src-tauri/src/git/mod.rs`

```rust
// Criar branch
pub fn create_branch(repo_path: &Path, name: &str, from: Option<&str>) -> Result<()> {
    let mut cmd = Command::new("git");
    cmd.current_dir(repo_path).arg("checkout").arg("-b").arg(name);
    if let Some(base) = from {
        cmd.arg(base);
    }
    // ...
}

// Deletar branch
pub fn delete_branch(repo_path: &Path, name: &str, force: bool) -> Result<()> {
    let flag = if force { "-D" } else { "-d" };
    Command::new("git")
        .current_dir(repo_path)
        .args(["branch", flag, name])
        // ...
}

// Merge preview (dry-run)
pub fn merge_preview(repo_path: &Path, source: &str) -> Result<MergePreview> {
    // git merge --no-commit --no-ff source
    // git diff --stat
    // git merge --abort
}

// Executar merge
pub fn merge_branch(repo_path: &Path, source: &str, message: Option<&str>) -> Result<MergeResult>

// Comparar branches
pub fn compare_branches(repo_path: &Path, base: &str, compare: &str) -> Result<BranchComparison> {
    // git rev-list --left-right --count base...compare
    // git log base..compare --oneline
}
```

**Tipos:**
```rust
#[derive(Serialize)]
pub struct MergePreview {
    pub can_fast_forward: bool,
    pub conflicts: Vec<String>,
    pub files_changed: usize,
    pub insertions: usize,
    pub deletions: usize,
}

#[derive(Serialize)]
pub struct BranchComparison {
    pub ahead: usize,
    pub behind: usize,
    pub commits: Vec<CommitInfo>,
}
```

---

### Fase 8: Merge Wizard + IA

**BranchesPage - Merge Modal:**
1. Selecionar branch de origem
2. Mostrar preview (arquivos alterados, conflitos potenciais)
3. IA sugere estratégia (fast-forward vs merge commit)
4. Confirmar e executar

**Funções de IA** (`src-tauri/src/ai/mod.rs`):
```rust
pub async fn suggest_merge_strategy(
    config: &AiConfig,
    preview: &MergePreview,
    source_branch: &str,
    target_branch: &str,
) -> Result<String>
```

---

## Componentes Lucide Icons a Usar

```tsx
import {
  GitCommit,    // Commits page
  GitBranch,    // Branches page
  Clock,        // History page
  Settings,     // Settings
  FolderGit2,   // Repo info
  Plus,         // New branch
  Trash2,       // Delete
  GitMerge,     // Merge
  ArrowLeftRight, // Compare
  Check,        // Current branch
} from 'lucide-react';
```

---

## Cores e Estilos (Design System Existente)

```css
/* Sidebar */
bg-surface1        /* Fundo da sidebar */
border-border1     /* Borda direita */
text-text1         /* Texto principal */
text-text2         /* Texto secundário */

/* Item ativo */
bg-primary/15      /* Background do item ativo */
text-primary       /* Texto do item ativo */
border-l-2 border-primary  /* Indicador lateral */

/* Hover */
bg-surface2        /* Hover background */
```

---

## Ordem de Execução Recomendada

1. ✅ Instalar dependências
2. ✅ Criar `cn()` utility
3. ✅ Criar `components.json`
4. ⬜ Adicionar alias `@/*` ao tsconfig + vite
5. ⬜ Criar componente `Sidebar` base
6. ⬜ Criar `AppSidebar` customizado
7. ⬜ Criar `Layout` wrapper
8. ⬜ Criar `navigationStore`
9. ⬜ Criar `CommitsPage` (extrair de App.tsx)
10. ⬜ Atualizar `App.tsx` para usar Layout + navegação
11. ⬜ Criar `BranchesPage` básico (lista + checkout)
12. ⬜ Backend: comandos create/delete branch
13. ⬜ Backend: comandos merge/compare
14. ⬜ BranchesPage: merge wizard
15. ⬜ IA: sugestão de merge strategy

---

## Para Continuar

Quando quiser continuar a implementação, diga:

> "Continue a implementação da sidebar a partir do passo 4"

Ou especifique qual fase quer implementar primeiro.
