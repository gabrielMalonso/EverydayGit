# Performance & Code Quality Audit - EverydayGit

## Objetivo
Realizar uma auditoria completa de performance e qualidade de código no aplicativo EverydayGit, identificando e corrigindo problemas que causam re-renders excessivos, loops infinitos, animações travadas e código ineficiente.

---

## Contexto: Problemas Já Corrigidos

Durante a auditoria inicial, os seguintes problemas foram identificados e corrigidos. Use-os como referência para encontrar padrões similares em outras partes do código:

### 1. Loop Infinito de `useEffect`
**Arquivo**: `App.tsx` (TabContent)
**Sintoma**: Centenas de renders por segundo, app travando
**Causa**: `refreshAll` nas dependências do `useEffect`, mas `refreshAll` muda de referência a cada atualização de estado
**Solução**: Padrão de ref (`useRef` + `useLayoutEffect`) para estabilizar a referência

```tsx
// ❌ PROBLEMA
useEffect(() => {
  refreshAll();
}, [refreshAll]); // refreshAll muda → useEffect dispara → loop

// ✅ SOLUÇÃO
const refreshAllRef = useRef(refreshAll);
useLayoutEffect(() => { refreshAllRef.current = refreshAll; });
useEffect(() => {
  refreshAllRef.current();
}, [repoState]); // Apenas primitivo nas deps
```

### 2. ResizeObserver Loop
**Arquivo**: `TabBar.tsx`
**Sintoma**: Warning no console sobre ResizeObserver loop
**Causa**: Callback inline no `ResizeObserver` criando nova referência a cada render
**Solução**: Mesmo padrão de ref para estabilizar o callback

### 3. Selectors Zustand Retornando Objetos Instáveis
**Arquivo**: `tabStore.ts`, hooks diversos
**Sintoma**: Re-renders desnecessários em componentes consumidores
**Causa**: `getTab(tabId)` retorna novo objeto quando qualquer parte do tab muda
**Solução**: Selectors granulares que acessam apenas campos específicos

```tsx
// ❌ PROBLEMA
const tab = useTabStore((s) => s.tabs[tabId]); // Re-render em qualquer mudança

// ✅ SOLUÇÃO
const repoPath = useTabStore((s) => s.tabs[tabId]?.repoPath);
const repoState = useTabStore((s) => s.tabs[tabId]?.repoState);
```

### 4. Hooks Retornando Objetos Não-Memoizados
**Arquivos**: `useTabNavigation.ts`, `useTabRepo.ts`, `useTabGit.ts`
**Sintoma**: Componentes re-renderizam mesmo quando valores não mudaram
**Causa**: Hook retorna `{ a, b }` literal (nova referência a cada render)
**Solução**: Envolver retorno com `useMemo`

```tsx
// ❌ PROBLEMA
return { value, setValue };

// ✅ SOLUÇÃO
return useMemo(() => ({ value, setValue }), [value, setValue]);
```

### 5. Animação Travando por Trabalho Pesado
**Arquivo**: `App.tsx` (TabContent)
**Sintoma**: Stutter ao trocar de abas
**Causa**: `refreshAll` (chamadas backend) executando durante animação
**Solução**: Defer com `setTimeout(300ms)` + `startTransition`

---

## Checklist de Auditoria

### Fase 1: Análise de Hooks

Para cada hook customizado em `/src/hooks/`:

- [ ] O hook usa `useMemo` para retornar objetos/arrays?
- [ ] UseCallbacks têm todas as dependências corretas?
- [ ] Selectors Zustand acessam apenas campos necessários?
- [ ] Há funções nas dependências de `useEffect` que mudam referência?

### Fase 2: Análise de Componentes

Para cada página/componente principal:

- [ ] Componentes pesados estão envolvidos em `React.memo()`?
- [ ] Há `console.log` em produção? (remover ou condicionar)
- [ ] Listas grandes usam `key` estável e virtualização?
- [ ] Há polling (`setInterval`)? Qual frequência? É necessário?

### Fase 3: Análise de State Management

- [ ] Stores Zustand têm selectors granulares exportados?
- [ ] Há cascatas de updates (update A → update B → update C)?
- [ ] Computed values estão memoizados?

### Fase 4: Análise de Animações

- [ ] Animações usam `transform`/`opacity` (GPU) ao invés de `top`/`left`/`width` (CPU)?
- [ ] Há `will-change` onde apropriado?
- [ ] Trabalho pesado compete com animações?

---

## Arquivos Prioritários para Auditar

### Alta Prioridade
| Arquivo | Motivo |
|---------|--------|
| `src/pages/BranchesPage/index.tsx` | Usa `useTabGit`, pode ter padrões similares |
| `src/pages/ConflictResolverPage/index.tsx` | Lida com diffs pesados |
| `src/pages/CommitsPage/components/HistoryPanel.tsx` | Lista potencialmente grande |
| `src/pages/CommitsPage/components/DiffViewer.tsx` | Renderiza código, pode ser pesado |
| `src/components/AppSidebar.tsx` | Presente em todas as páginas |

### Média Prioridade
| Arquivo | Motivo |
|---------|--------|
| `src/hooks/useTabMerge.ts` | Verificar memoização |
| `src/hooks/useTabAi.ts` | Verificar memoização |
| `src/stores/toastStore.ts` | Verificar selectors |
| `src/components/BranchControls.tsx` | Dropdown pode re-renderizar demais |

### Verificação de Polling
| Arquivo | Intervalo Atual |
|---------|-----------------|
| `src/pages/CommitsPage/components/ChangesListPanel.tsx` | 5000ms |
| `src/components/ChangesPanel.tsx` | 5000ms |

---

## Formato de Saída

Para cada problema encontrado, documente:

```markdown
### [Arquivo]: [Componente/Hook]

**Severidade**: 🔴 Crítico / 🟡 Médio / 🟢 Baixo

**Sintoma**: [Descrição do problema observado]

**Causa**: [Por que isso acontece]

**Solução Proposta**: [Como corrigir]

**Código Antes/Depois**: [Diff se aplicável]
```

---

## Métricas de Sucesso

Após a auditoria, o app deve:

1. **Zero warnings** de React no console (StrictMode, keys, etc.)
2. **Renders estáveis** em idle (~4 por ciclo de polling, não mais)
3. **Animações fluidas** (60fps durante transições)
4. **Sem loops infinitos** detectáveis via console.log
5. **Todos hooks** retornando valores memoizados

---

## Comandos Úteis para Debug

```bash
# Verificar TypeScript
npx tsc --noEmit

# Adicionar logs temporários para contar renders
console.log('[ComponentName] Render at', performance.now().toFixed(2));

# Verificar bundle size (opcional)
npx vite-bundle-visualizer
```

---

## Resultado Esperado

Ao final da auditoria, criar arquivo:
`/Auditoria/Resultados/PERFORMANCE_CODE_QUALITY_AUDIT_RESULTS_[DATA].md`

Contendo:
1. Lista de problemas encontrados
2. Correções aplicadas
3. Métricas antes/depois
4. Itens adiados para futuro
