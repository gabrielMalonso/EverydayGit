# Plano: Tooltip de Detalhes do Commit

## Objetivo

Implementar um tooltip/popover que aparece ao passar o mouse sobre um commit no HistoryPanel, mostrando detalhes completos do commit (similar à feature do VS Code).

## Estrutura de Dados Atual

```typescript
// src/types/index.ts
interface CommitInfo {
  hash: string;      // Hash completo (40 chars)
  message: string;   // Mensagem do commit
  author: string;    // Nome do autor
  date: string;      // Data ISO string
}
```

## Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/ui/Tooltip.tsx` | **Criar** | Componente tooltip genérico |
| `src/ui/index.ts` | Modificar | Exportar Tooltip |
| `src/components/CommitTooltipContent.tsx` | **Criar** | Conteúdo específico para commits |
| `src/components/HistoryPanel.tsx` | Modificar | Integrar tooltip nos commits |

## Design do Tooltip

### Layout Visual

```
┌─────────────────────────────────────────┐
│ feat: adiciona suporte ao Gemini API    │  ← Mensagem (bold)
│                                         │
│ 📅 19 dez 2025, 11:53                   │  ← Data formatada
│ 👤 gabrielMalonso                       │  ← Autor
│ 🔗 1afa65b0c9a8d3e...                   │  ← Hash completo (mono)
│                                         │
│ [Copiar Hash]                           │  ← Botão
└─────────────────────────────────────────┘
```

### Comportamento

- Aparece no `onMouseEnter` após delay (300ms)
- Desaparece no `onMouseLeave`
- Fecha com tecla `Escape`
- Posicionamento relativo ao elemento pai
- Fade-in/out suave

## Implementação

### 1. Tooltip.tsx (Componente Base)

```typescript
interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}
```

**Características:**
- useState para controle de visibilidade
- useRef para timeout do delay
- Posicionamento com CSS absolute
- Classes do design system:
  - `bg-surface3/95 backdrop-blur-xl`
  - `border border-border1`
  - `rounded-card shadow-popover`
  - `p-3 z-50`
- Animação: opacity transition

### 2. CommitTooltipContent.tsx

```typescript
interface CommitTooltipContentProps {
  commit: CommitInfo;
}
```

**Características:**
- Recebe CommitInfo como prop
- Formata data de forma completa
- Mostra hash com botão de copiar
- Layout organizado com ícones

### 3. Integração no HistoryPanel

```tsx
<Tooltip content={<CommitTooltipContent commit={commit} />}>
  <ListItem key={commit.hash}>
    {/* conteúdo existente */}
  </ListItem>
</Tooltip>
```

## Design System Utilizado

```css
/* Cores */
--color-surface-3: 48 50 64       /* background */
--color-text-1: 228 228 231       /* texto principal */
--color-text-3: 140 140 153       /* texto secundário */
--color-border-1: 54 55 66        /* borda */

/* Sombras */
--shadow-popover: 0 12px 24px -12px rgb(var(--color-overlay) / 0.5)

/* Radius */
--radius-card: 1rem
```

## Estimativa

- **Tooltip.tsx**: ~60 linhas
- **CommitTooltipContent.tsx**: ~40 linhas
- **HistoryPanel.tsx**: ~10 linhas modificadas
- **Total**: ~110 linhas de código

## Ordem de Execução

1. **Criar** `src/ui/Tooltip.tsx`
2. **Atualizar** `src/ui/index.ts`
3. **Criar** `src/components/CommitTooltipContent.tsx`
4. **Modificar** `src/components/HistoryPanel.tsx`

## Status

- [x] Tooltip.tsx
- [x] Exportar em index.ts
- [x] CommitTooltipContent.tsx
- [x] Integração no HistoryPanel
- [ ] Testes manuais
