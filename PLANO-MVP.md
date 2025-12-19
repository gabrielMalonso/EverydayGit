# Plano de Ação: Conclusão do MVP GitFlow-AI

## Resumo Executivo

**Estado Atual**: Backend completo e funcional. Frontend com todos os painéis implementados, mas faltando visualização de diff, campos de configuração e testes.

**Prioridades**:
1. **UX Completa**: Diff viewer + campos de settings completos
2. **Gaps Documentados**: Restauração de último repo, branding do app
3. **Testes Críticos**: ~10-15 testes para comandos Git + IA
4. **IA Melhorada**: Context awareness (opcional)

---

## FASE 1: Completar UX (Prioridade Máxima)

### 1.1 Implementar Diff Viewer

**Objetivo**: Exibir diff de arquivo selecionado no ChangesPanel

**Ações**:

1. **Instalar dependências**:
   ```bash
   npm install react-diff-view diff
   npm install -D @types/diff
   ```

2. **Criar componente DiffViewer** (`src/components/DiffViewer.tsx`):
   - Importar `react-diff-view` e `diff` parser
   - Subscrever a `selectedFile` e `selectedDiff` do gitStore
   - Parsear diff com `parseDiff()` e renderizar com syntax highlighting
   - Estados: loading, error, empty (quando nenhum arquivo selecionado)
   - Estilização dark mode com Tailwind

3. **Atualizar layout do App.tsx** (linha 21-23):
   - Substituir `<ChangesPanel />` por layout vertical split:
     ```tsx
     <div className="flex-1 min-w-0 flex flex-col gap-4">
       <div className="flex-1 min-h-0">
         <ChangesPanel />
       </div>
       <div className="h-96 min-h-0">
         <DiffViewer />
       </div>
     </div>
     ```

**Arquivos afetados**:
- **NOVO**: `src/components/DiffViewer.tsx`
- **MODIFICAR**: `src/App.tsx` (linhas 21-23)

**Nota**: ChangesPanel.tsx já chama `setSelectedFile()` nas linhas 129 e 163, então a integração é automática.

---

### 1.2 Completar Settings UI

**Objetivo**: Adicionar campos faltantes (base_url, max_length, theme) e warning de segurança

**SettingsModal.tsx - Modificações**:

1. **Adicionar state variables** (após linha 16):
   ```tsx
   const [baseUrl, setBaseUrl] = useState('');
   const [maxLength, setMaxLength] = useState(72);
   const [theme, setTheme] = useState('dark');
   ```

2. **Atualizar useEffect de load** (linhas 22-30) para incluir:
   ```tsx
   setBaseUrl(config.ai.base_url || '');
   setMaxLength(config.commit_preferences.max_length);
   setTheme(config.theme);
   ```

3. **Atualizar handleSave** (linhas 32-56) para salvar novos campos:
   ```tsx
   ai: {
     ...config.ai,
     base_url: baseUrl || null,
   },
   commit_preferences: {
     ...config.commit_preferences,
     max_length: maxLength,
   },
   theme,
   ```

4. **Adicionar campo Base URL** (após linha 111, apenas para Ollama):
   ```tsx
   {provider === 'ollama' && (
     <Input
       label="Base URL (Opcional)"
       value={baseUrl}
       onChange={(e) => setBaseUrl(e.target.value)}
       placeholder="http://localhost:11434"
     />
   )}
   ```

5. **Adicionar warning de segurança** (após linha 98, para Claude/OpenAI):
   ```tsx
   <div className="mt-2 p-2 bg-yellow-900/20 border border-yellow-700/50 rounded">
     <p className="text-xs text-yellow-400">
       ⚠️ Aviso: Chaves de API são armazenadas em texto simples no arquivo de config.
       Mantenha seu arquivo de config seguro e não o compartilhe.
     </p>
   </div>
   ```

6. **Adicionar campo Max Length** (após linha 149):
   ```tsx
   <Input
     label="Tamanho Máximo da Mensagem"
     type="number"
     value={maxLength}
     onChange={(e) => setMaxLength(Number(e.target.value))}
     placeholder="72"
   />
   ```

7. **Adicionar toggle de Theme** (após max length):
   ```tsx
   <div>
     <label className="text-sm text-text-secondary font-medium mb-2 block">
       Tema
     </label>
     <select
       value={theme}
       onChange={(e) => setTheme(e.target.value)}
       className="w-full bg-bg-elevated text-text-primary border border-border rounded px-3 py-2"
     >
       <option value="dark">Dark</option>
       <option value="light">Light (Em breve)</option>
     </select>
     <p className="text-xs text-text-secondary mt-1">
       Nota: Modo claro ainda não implementado
     </p>
   </div>
   ```

**Arquivo afetado**:
- **MODIFICAR**: `src/components/SettingsModal.tsx`

---

## FASE 2: Fechar Gaps Documentados

### 2.1 Restaurar Último Repositório no Startup

**Objetivo**: Reabrir automaticamente o último repositório usado

**App.tsx - Adicionar useEffect** (após linha 9):

```tsx
import { useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useRepoStore } from './stores/repoStore';
import { useConfig } from './hooks/useConfig';

function App() {
  const { setRepoPath } = useRepoStore();
  const { loadConfig } = useConfig();

  useEffect(() => {
    const restoreLastRepo = async () => {
      try {
        const config = await loadConfig();
        if (config?.last_repo_path) {
          try {
            await invoke('set_repository', { path: config.last_repo_path });
            setRepoPath(config.last_repo_path);
          } catch (error) {
            console.warn('Último repositório não acessível:', error);
          }
        }
      } catch (error) {
        console.error('Falha ao restaurar último repositório:', error);
      }
    };

    restoreLastRepo();
  }, []);

  return (
    // ... existing JSX
  );
}
```

**Arquivo afetado**:
- **MODIFICAR**: `src/App.tsx`

---

### 2.2 Corrigir Identidade do App

**Objetivo**: Substituir "--name" pelo nome real do app

**package.json** (linha 2):
```json
"name": "gitflow-ai",
```

**tauri.conf.json**:
- Linha 3: `"productName": "GitFlow AI"`
- Linha 5: `"identifier": "com.gitflow.ai"`
- Linha 15: `"title": "GitFlow AI"`
- Linhas 12-13: Aumentar tamanho padrão:
  ```json
  "width": 1200,
  "height": 800
  ```

**Arquivos afetados**:
- **MODIFICAR**: `package.json`
- **MODIFICAR**: `src-tauri/tauri.conf.json`

---

## FASE 3: Testes Críticos

### 3.1 Setup de Infraestrutura de Testes

**Instalar dependências**:
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @tauri-apps/api-mocking
```

**Criar vitest.config.ts**:
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.ts',
  },
});
```

**Criar setup de testes** (`src/tests/setup.ts`):
```typescript
import '@testing-library/jest-dom';
import { mockIPC } from '@tauri-apps/api-mocking';

beforeAll(() => {
  mockIPC((cmd, args) => {
    console.log('Mocked command:', cmd, args);
    return Promise.resolve(null);
  });
});
```

**Adicionar scripts ao package.json**:
```json
"scripts": {
  "test": "vitest",
  "test:ui": "vitest --ui",
  "test:coverage": "vitest --coverage"
}
```

**Arquivos**:
- **NOVO**: `vitest.config.ts`
- **NOVO**: `src/tests/setup.ts`
- **MODIFICAR**: `package.json`

---

### 3.2 Testes Frontend Críticos (10 testes)

**Criar arquivos de teste**:

1. **`src/tests/hooks/useGit.test.ts`** (3 testes):
   - ✓ Stage file successfully
   - ✓ Unstage file successfully
   - ✓ Commit with message

2. **`src/tests/hooks/useAi.test.ts`** (2 testes):
   - ✓ Generate commit message
   - ✓ Handle generation error

3. **`src/tests/components/ChangesPanel.test.tsx`** (3 testes):
   - ✓ Render staged files
   - ✓ Call stageFile on button click
   - ✓ Disable commit when no message

4. **`src/tests/components/SettingsModal.test.tsx`** (2 testes):
   - ✓ Save configuration
   - ✓ Display API key warning

**Estrutura de teste exemplo**:
```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useGit } from '../../hooks/useGit';
import { mockIPC } from '@tauri-apps/api-mocking';

test('should stage a file successfully', async () => {
  mockIPC((cmd) => {
    if (cmd === 'stage_file_cmd') return Promise.resolve();
    if (cmd === 'get_git_status') return Promise.resolve({ files: [] });
  });

  const { result } = renderHook(() => useGit());
  await expect(result.current.stageFile('test.txt')).resolves.toBeUndefined();
});
```

---

### 3.3 Testes Backend Críticos (5 testes)

**Adicionar módulos de teste Rust**:

1. **`src-tauri/src/git/mod.rs`**:
   ```rust
   #[cfg(test)]
   mod tests {
       use super::*;

       #[test]
       fn test_parse_git_status() {
           // Test status parsing
       }

       #[test]
       fn test_stage_file() {
           // Test staging
       }
   }
   ```

2. **`src-tauri/src/ai/mod.rs`**:
   ```rust
   #[test]
   fn test_build_commit_prompt() {
       let prefs = CommitPreferences {
           language: "English".to_string(),
           style: "conventional".to_string(),
           max_length: 72,
       };
       let prompt = build_commit_prompt("test diff", &prefs);
       assert!(prompt.contains("English"));
   }
   ```

3. **`src-tauri/src/config/mod.rs`**:
   ```rust
   #[test]
   fn test_config_save_load() {
       // Test config persistence
   }
   ```

**Executar testes**:
```bash
cd src-tauri
cargo test
```

---

## FASE 4: Melhorias de IA (Opcional)

### 4.1 Context Awareness para IA

**Objetivo**: Fornecer contexto do repositório para a IA gerar mensagens melhores

**Criar módulo de contexto** (`src-tauri/src/ai/context.rs`):
```rust
pub struct RepoContext {
    pub current_branch: String,
    pub recent_commits: Vec<String>,
    pub staged_file_count: usize,
}

pub fn build_repo_context(repo_path: &PathBuf) -> Result<RepoContext> {
    // Gather context from git commands
}
```

**Atualizar `build_commit_prompt()`** (`src-tauri/src/ai/mod.rs`):
- Adicionar contexto de commits recentes no prompt
- Incluir informação de branch e número de arquivos staged
- Formato:
  ```
  Contexto do repositório:
  - Branch atual: feature/xyz
  - Arquivos staged: 3
  - Commits recentes para referência de padrão:
    • commit message 1
    • commit message 2

  [prompt original...]
  ```

**Arquivos**:
- **NOVO**: `src-tauri/src/ai/context.rs`
- **MODIFICAR**: `src-tauri/src/ai/mod.rs`

---

## Arquivos Críticos - Sumário

### Arquivos Novos (4):
1. `src/components/DiffViewer.tsx` - Visualização de diff
2. `vitest.config.ts` - Config de testes
3. `src/tests/setup.ts` - Setup de mocks
4. `src-tauri/src/ai/context.rs` - Contexto de repo para IA (opcional)

### Arquivos Modificados (6):
1. `src/App.tsx` - Layout + restauração de repo
2. `src/components/SettingsModal.tsx` - Campos completos + warning
3. `package.json` - Nome do app + scripts de teste
4. `src-tauri/tauri.conf.json` - Identidade do app
5. `src-tauri/src/ai/mod.rs` - Context awareness (opcional)
6. Arquivos de teste (múltiplos)

---

## Ordem de Implementação Recomendada

1. **Dia 1-2**: Diff Viewer (Fase 1.1)
2. **Dia 2-3**: Settings completas (Fase 1.2)
3. **Dia 3**: Último repo + branding (Fase 2.1-2.2)
4. **Dia 4-5**: Infraestrutura de testes + testes frontend (Fase 3.1-3.2)
5. **Dia 6**: Testes backend (Fase 3.3)
6. **Dia 7-8**: Context awareness IA (Fase 4.1, se houver tempo)

---

## Checklist de Validação Final

Antes de considerar o MVP completo, validar:

- [ ] Diff viewer exibe diffs corretamente ao selecionar arquivo
- [ ] Settings salvam todos os campos (base_url, max_length, theme)
- [ ] Warning de segurança aparece para Claude/OpenAI
- [ ] Último repositório restaura automaticamente no startup
- [ ] App se chama "GitFlow AI" na barra de título
- [ ] Todos os 10 testes frontend passam (`npm run test`)
- [ ] Todos os 5 testes backend passam (`cargo test`)
- [ ] Stage/unstage/commit funcionam corretamente
- [ ] IA gera mensagens de commit em todos os provedores
- [ ] Push/pull funcionam sem erros

---

## Riscos e Mitigações

**Risco 1**: Falha no parse de diff
- **Mitigação**: Error handling robusto, fallback para texto raw

**Risco 2**: Último repo quebra startup
- **Mitigação**: Silent failure com try/catch, não bloqueia app

**Risco 3**: Testes com mock complexo
- **Mitigação**: Começar com testes simples, expandir incrementalmente

**Risco 4**: Theme toggle não funcional
- **Mitigação**: Adicionar nota "Em breve", implementar em post-MVP
