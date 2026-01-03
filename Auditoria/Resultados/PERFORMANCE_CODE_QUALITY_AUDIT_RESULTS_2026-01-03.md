# Performance & Code Quality Audit - EverydayGit

**Data:** 2026-01-03
**Branch alvo:** gabrielMalonso/perf-audit-2
**Escopo:** Frontend React (hooks, stores, pages e UI) conforme prompt `Auditoria/Prompts/PERFORMANCE_CODE_QUALITY_AUDIT_PROMPT.md`.

---

## Resumo Executivo
- Foram encontrados **pontos críticos de re-renderização** relacionados a uso não seletivo do Zustand e **processamento pesado de diff** no thread principal.
- Há **logs de debug em hot paths** e em renderizações, causando degradação de performance e ruído em produção.
- Existem **oportunidades de memoização** e redução de trabalho em componentes que lidam com listas grandes e diffs/conflitos.

---

## Problemas Encontrados

### (Muito Crítico)
**Nenhum problema classificado como “Muito crítico” foi encontrado neste ciclo.**

---

### (Crítico)

### src/hooks/useTabGit.ts + src/hooks/useTabAi.ts + src/hooks/useTabMerge.ts + src/hooks/useTabRepo.ts + src/hooks/useTabNavigation.ts + src/components/TabBar.tsx + src/App.tsx + src/components/TopBar.tsx + src/pages/InitRepoPage/index.tsx

**Severidade:** 🔴 **Crítico**

**Sintoma:** Re-renders excessivos em praticamente toda a UI quando qualquer parte do estado de tabs muda (polling, updates de status, diffs, commits, etc.). Componentes que deveriam reagir apenas a mudanças específicas re-renderizam mesmo com alterações irrelevantes.

**Causa:** Uso de `useTabStore()` **sem selector**, o que assina o componente/hook para **todas** as mudanças do store. Isso anula os selectors granulares já existentes em `tabStore.ts`.

**Solução Proposta:**
- Substituir `useTabStore()` por selectors específicos, exemplo:
  - `const updateTabGit = useTabStore((s) => s.updateTabGit)`
  - `const tab = useTabStore((s) => s.tabs[tabId])` (ou melhor: selectors granulares por campo)
- Para funções de ação que não precisam re-renderizar, usar `useTabStore.getState()` em callbacks internos.

**Código Antes/Depois (exemplo):**
```tsx
// ❌ Antes
const { updateTabGit } = useTabStore();

// ✅ Depois
const updateTabGit = useTabStore((s) => s.updateTabGit);
```

---

### src/pages/CommitsPage/components/DiffViewer.tsx

**Severidade:** 🔴 **Crítico**

**Sintoma:** Travamentos e jank ao renderizar diffs grandes; UI pode congelar durante parsing de diffs ou renderização de DOM extenso. Animações de troca de abas podem “engasgar”.

**Causa:**
- Carregamento **do diff completo staged + unstaged** a cada mudança de `diffKey`.
- `parseDiff` e construção de itens executados no thread principal.
- Renderização direta de todos os hunks sem virtualização.

**Solução Proposta:**
- Evitar carregar/parsing de todo diff quando possível (ex.: carregar diff apenas do arquivo selecionado).
- Introduzir `requestIdleCallback`/`startTransition` para parsing pesado, ou mover parsing para Web Worker.
- Adotar virtualização (ex.: react-virtual) para listas de arquivos/hunks.

**Código Antes/Depois (exemplo conceitual):**
```tsx
// ✅ Ideia: carregar diff por arquivo selecionado
useEffect(() => {
  if (!selectedFile) return;
  void getFileDiff(selectedFile, stagedPreferred);
}, [selectedFile]);
```

---

### (Médio)

### src/components/TabBar.tsx + src/App.tsx + src/ui/ContextMenu.tsx + src/hooks/useTabGit.ts + src/pages/CommitsPage/components/*

**Severidade:** 🟡 **Médio**

**Sintoma:** Degradação de performance e poluição de logs em produção. Renderizações geram spam de logs (incluindo tempos e cliques), afetando profiling e fluidez.

**Causa:** `console.log` em render/hot paths e ações frequentes (TabBar, TabContent, ContextMenu, modais e hooks de ações Git).

**Solução Proposta:**
- Remover logs ou **gating** com `if (import.meta.env.DEV)`.
- Usar logger com nível configurável para não impactar produção.

**Código Antes/Depois (exemplo):**
```tsx
// ✅ Melhor
if (import.meta.env.DEV) console.log('...');
```

---

### src/pages/CommitsPage/components/ChangesListPanel.tsx

**Severidade:** 🟡 **Médio**

**Sintoma:** Intervalo de polling é recriado frequentemente, causando trabalho extra e possível concorrência de IPC caso `refreshStatus` demore mais que 5s.

**Causa:** `refreshStatus` muda de referência (depende de `git?.status` no hook), disparando o `useEffect` e recriando o `setInterval` a cada atualização de status.

**Solução Proposta:**
- Estabilizar `refreshStatus` removendo `git?.status` das dependências.
- Usar ref pattern no polling (como no TabBar) para evitar recriações.
- Considerar `setTimeout` após conclusão de `refreshStatus` para evitar overlaps.

---

### src/hooks/useTabGit.ts

**Severidade:** 🟡 **Médio**

**Sintoma:** A função `refreshStatus` muda a cada alteração de `git?.status`, causando efeitos dependentes a reinicializar (ex.: polling).

**Causa:** Dependência de `git?.status` dentro do `useCallback`.

**Solução Proposta:**
- Ler `git?.status` via `useTabStore.getState()` dentro do callback, removendo-o das deps.
- Alternativamente, usar ref para armazenar `git?.status`.

---

### src/pages/BranchesPage/hooks/useBranchSearch.ts

**Severidade:** 🟡 **Médio**

**Sintoma:** Recomputação de filtros e opções em toda renderização, causando re-renders desnecessários em `BranchesListPanel`.

**Causa:** Hook retorna arrays/objetos novos a cada render sem memoização.

**Solução Proposta:**
- Envolver cálculos com `useMemo` e retornar referências estáveis.

---

### src/pages/CommitsPage/components/HistoryPanel.tsx

**Severidade:** 🟡 **Médio**

**Sintoma:** Rendering de listas grandes (commits) sem virtualização e com tooltip por item. Para históricos extensos, pode gerar DOM muito pesado.

**Causa:** Sem virtualização e sem memoização de formatação de datas/strings.

**Solução Proposta:**
- Virtualizar lista (ex.: `react-virtual`).
- Memoizar formatação de datas/subject ou limitar itens visíveis.

---

### src/pages/ConflictResolverPage/components/ConflictViewer.tsx + src/pages/ConflictResolverPage/components/ResolutionPreview.tsx

**Severidade:** 🟡 **Médio**

**Sintoma:** Cálculos pesados (arrays de linhas, previews completos) a cada render, causando stutter ao navegar entre hunks ou alternar modo de edição.

**Causa:** Construção de arrays e renderização de linhas sem `useMemo`.

**Solução Proposta:**
- `useMemo` para `previewLines`, `lineNumbers`, `resolvedLines` e `renderPreviewLines`.
- Separar subcomponentes memoizados para evitar renderizações completas.

---

### (Leve)

### src/hooks/useTabAi.ts + src/hooks/useTabMerge.ts

**Severidade:** 🟢 **Leve**

**Sintoma:** Retorno de objetos não memoizados pode causar re-renderizações em consumidores quando usado como prop/dependência.

**Causa:** Retorno literal `{ ... }` sem `useMemo`.

**Solução Proposta:**
- Envolver retorno com `useMemo` (padrão já adotado em outros hooks).

---

### src/components/AppSidebar.tsx

**Severidade:** 🟢 **Leve**

**Sintoma:** Possíveis warnings de ResizeObserver e layout thrash em resize/zoom.

**Causa:** Callback do `ResizeObserver` recriado via `updateIndicator` em cada render.

**Solução Proposta:**
- Aplicar padrão de `useRef` + `useLayoutEffect` (mesmo usado no TabBar).

---

### src/components/ChangesPanel.tsx (não utilizado)

**Severidade:** 🟢 **Leve**

**Sintoma:** Componente tem polling e dependências incompletas em `useEffect`. Se reativado, pode gerar stale closures e trabalho extra.

**Causa:** `refreshStatus` não está nas deps; componente aparentemente não está em uso.

**Solução Proposta:**
- Remover componente se obsoleto, ou ajustar deps e memoização caso volte a ser usado.

---

## Correções Aplicadas
- **Nenhuma correção aplicada neste ciclo** (auditoria apenas).

---

## Métricas Antes/Depois
- **Não medidas.** Nenhuma execução de profiler/benchmarks foi realizada durante esta auditoria.

---

## Itens Adiados / Próximos Passos
1. Refatorar hooks e componentes para usar selectors granulares do Zustand.
2. Implementar virtualização para listas grandes (commits/diffs/conflitos).
3. Remover ou condicionar logs em produção.
4. Avaliar mover parsing de diff para Web Worker ou `requestIdleCallback`.
5. Revisar polling para evitar overlap e reduzir IPC quando o app estiver em background.

