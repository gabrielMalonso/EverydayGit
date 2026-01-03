# Auditoria de Performance e Qualidade de Código - EverydayGit

## Contexto da Aplicação

Você é um especialista em React, TypeScript e otimização de performance. Sua tarefa é realizar uma auditoria completa de performance e qualidade de código de um aplicativo desktop construído com **Tauri + React + TypeScript + Zustand**.

### Stack Tecnológica
- **Frontend**: React 18, TypeScript, Vite
- **Backend**: Rust (Tauri)
- **State Management**: Zustand com persistência
- **Animações**: Framer Motion
- **Styling**: Tailwind CSS

### Arquitetura da Aplicação
O app é um cliente Git desktop com suporte a múltiplas abas. Cada aba pode ter um repositório diferente aberto. O fluxo de dados é:

```
User Action → Zustand Store → React Components → Tauri IPC → Rust Backend → Git Operations
```

---

## Problema Identificado

Durante a implementação de uma animação de indicador de aba ativa (similar ao comportamento de navegação do iOS/macOS), foi identificado um problema severo de **stutter/travadas** na animação.

### Investigação Realizada

Logs de debug foram adicionados para rastrear o fluxo de execução durante a troca de abas. Os resultados revelaram problemas críticos:

### Logs de Debug (Troca de Aba - ~300ms de duração)

```
[TabBar] Tab clicked: "056b98ec..." at 3988.00
[TabContent] Render - tabId: "056b98ec..." at 3995.00
[TabContent] Render - tabId: "056b98ec..." at 3996.00
[TabBar] updateIndicator called, activeTabId: "056b98ec..."
[TabBar] Setting indicator: {x: 8, width: 124}
[TabContent] useEffect[repoState] triggered at 4012.00
[TabContent] Scheduling refreshAll via RAF
[TabContent] RAF callback - calling refreshAll at 4015.00
[TabBar] updateIndicator called, activeTabId: "056b98ec..."
[TabContent] Render - tabId: "056b98ec..." at 4022.00
[TabContent] Render - tabId: "056b98ec..." at 4022.00
[TabBar] updateIndicator called, activeTabId: "056b98ec..."
[TabContent] Render - tabId: "056b98ec..." at 4036.00
[TabContent] Render - tabId: "056b98ec..." at 4036.00
... (continua por ~20 ciclos até 4437.00)
```

### Métricas Observadas (por troca de aba)

| Métrica | Valor Observado | Valor Esperado |
|---------|-----------------|----------------|
| Renders de `TabContent` | ~40 (20 ciclos x 2) | 2-4 |
| Chamadas de `updateIndicator` | ~20 | 1 (inicial) |
| Chamadas de `refreshAll` | 2-3 | 1 |
| Tempo total de re-renders | ~450ms | <100ms |

### Hipóteses dos Problemas

1. **React StrictMode** causando renders duplicados (esperado em dev, mas não deveria afetar tanto)
2. **ResizeObserver** em loop com animação Framer Motion (feedback loop)
3. **useEffect** com dependências instáveis (novas referências a cada render)
4. **Zustand store** causando cascata de re-renders em componentes não relacionados
5. **Falta de memoização** em componentes e callbacks

---

## Arquivos Relevantes para Análise

### 1. Componente Principal - App.tsx

```tsx
// Localização: /src/App.tsx
// Contém: TabProvider, Layout, AnimatePresence, TabContent
// Suspeito: useEffect com dependências instáveis, key dinâmica causando remontagens
```

### 2. TabBar com Animação - TabBar.tsx

```tsx
// Localização: /src/components/TabBar.tsx
// Contém: motion.div para indicador animado, ResizeObserver, updateIndicator callback
// Suspeito: ResizeObserver em loop, updateIndicator recriado a cada render
```

### 3. Store de Tabs - tabStore.ts

```tsx
// Localização: /src/stores/tabStore.ts
// Contém: Zustand store com tabs, activeTabId, múltiplos selectors
// Suspeito: Selectors sem memoização, atualizações parciais causando re-renders globais
```

### 4. Hooks Customizados

```tsx
// useTabGit.ts - Hook que faz chamadas ao backend Rust
// useTabRepo.ts - Hook que lê estado do repositório da aba ativa
// useTabNavigation.ts - Hook de navegação entre páginas
// Suspeito: Retornando novas referências de objetos/funções a cada render
```

---

## Tarefas de Análise

### 1. Análise de Re-renders

Para cada componente principal, identifique:
- [ ] Quantas vezes renderiza por interação do usuário
- [ ] Quais props/state mudam entre renders
- [ ] Se há memoização adequada (React.memo, useMemo, useCallback)
- [ ] Se há seletores Zustand otimizados

### 2. Análise de useEffect

Para cada useEffect no fluxo crítico:
- [ ] Liste as dependências
- [ ] Identifique dependências instáveis (objetos/funções criadas inline)
- [ ] Verifique se há cleanup adequado
- [ ] Avalie se o efeito deveria usar `useDeferredValue` ou `useTransition`

### 3. Análise de Animações

- [ ] Verifique se `motion.div` está causando layouts/repaints desnecessários
- [ ] Avalie se `ResizeObserver` está em loop
- [ ] Verifique se `getBoundingClientRect()` está sendo chamado excessivamente
- [ ] Proponha uso de `will-change` ou animação via transform/opacity

### 4. Análise de State Management

- [ ] Verifique granularidade dos selectors Zustand
- [ ] Identifique estado "global" que deveria ser "local"
- [ ] Avalie uso de `useShallow` em lugares apropriados
- [ ] Verifique se há subscriptions desnecessárias

### 5. Análise de Qualidade Geral

- [ ] Complexidade ciclomática dos componentes
- [ ] Componentes muito grandes que deveriam ser divididos
- [ ] Props drilling vs Context vs Zustand
- [ ] Tratamento de erros e edge cases
- [ ] Consistência de padrões (naming, estrutura, imports)
- [ ] TypeScript types adequados (vs `any`)

---

## Formato de Saída Esperado

```markdown
# Relatório de Auditoria - Performance e Qualidade

## Resumo Executivo
- **Severidade Geral**: Alta/Média/Baixa
- **Problemas Críticos**: X
- **Problemas de Performance**: X
- **Problemas de Qualidade**: X
- **Estimativa de Esforço**: X horas/dias

## Problemas Encontrados

### 🔴 Crítico: [Nome do Problema]
- **Arquivo**: `path/to/file.tsx`
- **Linha(s)**: X-Y
- **Descrição**: ...
- **Impacto**: ...
- **Correção Proposta**:
```tsx
// Código antes
// Código depois
```

### 🟡 Performance: [Nome do Problema]
...

### 🟢 Qualidade: [Nome do Problema]
...

## Plano de Ação Priorizado

### Fase 1: Correções Críticas (Urgente)
1. [ ] Correção X - Arquivo Y
2. [ ] Correção Z - Arquivo W

### Fase 2: Otimizações de Performance
1. [ ] Memoização de componentes A, B, C
2. [ ] Refatoração de hooks X, Y

### Fase 3: Melhorias de Qualidade
1. [ ] Dividir componente grande X
2. [ ] Adicionar types específicos

## Métricas de Sucesso
- Renders por troca de aba: de ~40 para <5
- Tempo de animação: de ~450ms com stutter para 300ms fluido
- Chamadas ao backend: de 2-3 para 1 por ação
```

---

## Notas Importantes

1. **Ambiente de Desenvolvimento**: Os logs foram capturados em `bun run tauri dev` (modo desenvolvimento)
2. **React StrictMode**: Pode estar ativo e causando renders duplos artificiais
3. **Hot Reload**: Vite HMR pode interferir em algumas métricas
4. **Prioridade**: Foco em problemas que afetam UX diretamente (animações travadas, lentidão)

---

## Dicas para o Auditor

- Use `React DevTools Profiler` para confirmar hipóteses
- Use `why-did-you-render` para identificar renders desnecessários
- Verifique o `Performance` tab do DevTools para long tasks
- Considere que o app roda em um contexto Tauri (WebView) e não browser comum
