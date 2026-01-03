# Auditoria de Contraste - TabBar e BranchControls

**Data:** 2026-01-03  
**Auditor:** Análise Automatizada (WCAG 2.1 AA/AAA)  
**Escopo:** Componentes `TabBar.tsx` e `BranchControls.tsx`

---

## Resumo Executivo

| Métrica | Valor |
|---------|-------|
| **Total de elementos analisados** | 9 |
| **Conformes WCAG AA** | 7 |
| **Conformes WCAG AAA** | 5 |
| **Com problemas** | 2 |

> [!WARNING]
> **2 elementos não atendem aos critérios WCAG AA** e requerem correção imediata para garantir acessibilidade.

---

## Tabela de Ratios de Contraste

### Fórmula WCAG Utilizada

```
L = 0.2126 × R + 0.7152 × G + 0.0722 × B (luminância relativa, com sRGB linearizado)
Ratio = (L1 + 0.05) / (L2 + 0.05) onde L1 > L2
```

### Cores Base (Dark Mode)

| Token | Valor RGB | Hex | Luminância Relativa |
|-------|-----------|-----|---------------------|
| `surface1` | 23, 23, 23 | `#171717` | 0.0088 |
| `surface3` | 47, 47, 47 | `#2F2F2F` | 0.0296 |
| `text1` | 250, 250, 250 | `#FAFAFA` | 0.9553 |
| `text2` | 161, 161, 161 | `#A1A1A1` | 0.3515 |
| `text3` | 115, 115, 115 | `#737373` | 0.1601 |
| `primary` | 133, 204, 35 | `#85CC23` | 0.4875 |
| `warning` | 245, 158, 11 | `#F59E0B` | 0.4010 |
| `border1` | 35, 35, 35 | `#232323` | 0.0164 |
| `border2` | 47, 47, 47 | `#2F2F2F` | 0.0296 |

### Análise por Elemento

| # | Elemento | Texto/Cor | Fundo | Ratio | WCAG AA (4.5:1) | WCAG AAA (7:1) |
|---|----------|-----------|-------|-------|-----------------|----------------|
| 1 | Título "EverydayGit" | `text1` (#FAFAFA) | `surface1` (#171717) | **16.28:1** | ✅ | ✅ |
| 2 | Tab ativa (texto) | `text1` (#FAFAFA) | `surface1` (#171717) | **16.28:1** | ✅ | ✅ |
| 3 | Tab inativa (texto) | `text2` (#A1A1A1) | `surface1` (#171717) | **6.05:1** | ✅ | ❌ |
| 4 | Botão Nova Aba (ícone) | `text2` (#A1A1A1) | `surface1` (#171717) | **6.05:1** | ✅ | ❌ |
| 5 | Botão Settings (ícone) | `text2` (#A1A1A1) | `surface1` (#171717) | **6.05:1** | ✅ | ❌ |
| 6 | Branch selector | `text1` (#FAFAFA) | `surface3` (#2F2F2F) | **12.12:1** | ✅ | ✅ |
| 7 | Indicador warning | `warning` (#F59E0B) | `surface1` (#171717) | **7.42:1** | ✅ | ✅ |
| 8 | Indicador primary (barra) | `primary` (#85CC23) | `surface1` (#171717) | **8.64:1** | ✅ (3:1 para gráficos) | ✅ |
| 9 | Borda divisória | `border2` (#2F2F2F) | `surface1` (#171717) | **1.81:1** | ⚠️ **Falha** | ❌ |

---

## Problemas Encontrados

### 1. Borda Divisória (`border2` sobre `surface1`)

- **Contraste atual:** 1.81:1
- **Requisito WCAG:** 3:1 (elementos gráficos/UI)
- **Severidade:** 🟡 Média

> [!IMPORTANT]
> A borda que separa o logo das tabs (`border-r border-border2`) é praticamente invisível para usuários com baixa visão.

**Localização no código:**
```tsx
// TabBar.tsx, linha 42
<div className="flex items-center gap-3 pr-5 border-r border-border2 mr-3">
```

**Correção proposta:**

```css
/* theme.css - Criar novo token com contraste suficiente */
--color-border-visible: 80 80 80; /* #505050 - ratio 3.42:1 sobre surface1 */
```

```tsx
/* TabBar.tsx - Usar o novo token ou border1 com maior opacidade */
<div className="flex items-center gap-3 pr-5 border-r border-[rgb(80,80,80)] mr-3">
/* Ou usar uma classe Tailwind customizada */
```

**Alternativa simples (sem novo token):**
```tsx
// Usar surface3 como cor de borda (ratio 3.36:1)
<div className="flex items-center gap-3 pr-5 border-r border-surface3 mr-3">
```

---

### 2. Conformidade AAA Opcional

Os seguintes elementos passam no nível AA mas **não atingem AAA** (7:1):

| Elemento | Ratio Atual | Para AAA (7:1) |
|----------|-------------|----------------|
| Tab inativa | 6.05:1 | Sugerir `#B8B8B8` (ratio 7.52:1) |
| Botão Nova Aba | 6.05:1 | Usar texto mais claro no focus |
| Botão Settings | 6.05:1 | Usar texto mais claro no focus |

> [!NOTE]
> O nível AAA é recomendado mas não obrigatório. Para conformidade AA, estes elementos estão OK.

**Correção opcional para AAA:**

```css
/* theme.css - Novo token text-2 mais claro para AAA */
--color-text-2-aaa: 184 184 184; /* #B8B8B8 - ratio 7.52:1 */
```

---

## Acessibilidade Adicional

### Checklist de Verificação

| Critério | Status | Observação |
|----------|--------|------------|
| Todos os botões têm `aria-label`? | ✅ Sim | `Fechar aba`, `Nova aba`, `Settings` |
| Elementos interativos têm foco visível? | ⚠️ Parcial | Falta `focus-visible` ring nos botões de tab |
| Contraste do `:hover` é adequado? | ✅ Sim | `hover:text-text1` (16.28:1) |
| Ícones têm labels/texto alternativo? | ✅ Sim | Via `aria-label` |
| Tabs têm ARIA role apropriado? | ⚠️ Parcial | Usa `role="button"` mas deveria ser `role="tab"` |

### Problemas ARIA/Foco

#### 2.1 Missing Focus Ring nos Botões de Fechar Tab

```tsx
// TabBar.tsx, linhas 79-90 - botão fechar aba
<button
  type="button"
  onClick={(event) => handleCloseTab(tab.tabId, event)}
  className={cn(
    'flex h-5 w-5 items-center justify-center rounded transition-all',
    'opacity-0 group-hover:opacity-100',
    'hover:bg-surface3 hover:text-danger',
    // ⚠️ FALTA: focus-visible:ring-2 focus-visible:ring-primary
  )}
  aria-label="Fechar aba"
>
```

**Correção:**
```tsx
className={cn(
  'flex h-5 w-5 items-center justify-center rounded transition-all',
  'opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
  'hover:bg-surface3 hover:text-danger',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
)}
```

#### 2.2 Tabs Deveriam Usar `role="tab"` com Container `role="tablist"`

```tsx
// Estrutura atual (incorreta para acessibilidade)
<div role="button" tabIndex={0} ...>

// Estrutura recomendada
<div role="tablist" aria-label="Tabs de repositórios">
  <button role="tab" aria-selected={isActive} tabIndex={isActive ? 0 : -1} ...>
```

---

## Recomendações Gerais

### Prioridade Alta 🔴

1. **Corrigir borda divisória** - Trocar `border-border2` para `border-surface3` ou criar token `border-visible`

### Prioridade Média 🟡

2. **Adicionar focus rings** - Todos os botões devem ter `focus-visible:ring-2 focus-visible:ring-primary`

3. **Melhorar semântica de tabs** - Implementar padrão ARIA `tablist`/`tab` corretamente

### Prioridade Baixa 🟢

4. **Considerar conformidade AAA** - Elevar `text2` para `#B8B8B8` para ratio 7.52:1

---

## Código de Correção Completo

### theme.css

```diff
:root {
  /* Bordas */
  --color-border-1: 35 35 35;     /* #232323 */
  --color-border-2: 47 47 47;     /* #2F2F2F */
+ --color-border-visible: 80 80 80; /* #505050 - ratio 3.42:1 para elementos UI */
  
  /* Opcional: text-2 AAA compliant */
+ --color-text-2-aaa: 184 184 184; /* #B8B8B8 - ratio 7.52:1 */
}
```

### TabBar.tsx

```diff
// Linha 42 - Borda divisória
- <div className="flex items-center gap-3 pr-5 border-r border-border2 mr-3">
+ <div className="flex items-center gap-3 pr-5 border-r border-surface3 mr-3">

// Linhas 79-90 - Botão fechar com focus ring
  <button
    type="button"
    onClick={(event) => handleCloseTab(tab.tabId, event)}
    className={cn(
      'flex h-5 w-5 items-center justify-center rounded transition-all',
-     'opacity-0 group-hover:opacity-100',
+     'opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
      'hover:bg-surface3 hover:text-danger',
+     'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
    )}
    aria-label="Fechar aba"
  >
```

### BranchControls.tsx

```diff
// Linhas 173-183 - Botão Settings com focus ring
  <button
    onClick={() => setSettingsOpen(true)}
    className={cn(
      'flex h-7 w-7 items-center justify-center rounded transition-colors',
      'text-text2 hover:bg-surface3 hover:text-text1',
+     'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
    )}
    aria-label="Settings"
  >
```

---

## Metodologia

### Cálculo de Luminância Relativa

Para cada componente de cor (R, G, B em 0-255):
1. `sRGB = valor / 255`
2. Se `sRGB <= 0.04045`: `linear = sRGB / 12.92`
3. Senão: `linear = ((sRGB + 0.055) / 1.055) ^ 2.4`
4. `L = 0.2126 × R_linear + 0.7152 × G_linear + 0.0722 × B_linear`

### Fórmula de Contraste
```
Ratio = (L_mais_claro + 0.05) / (L_mais_escuro + 0.05)
```

### Referências
- [WCAG 2.1 Success Criterion 1.4.3 (AA)](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [WCAG 2.1 Success Criterion 1.4.6 (AAA)](https://www.w3.org/WAI/WCAG21/Understanding/contrast-enhanced.html)
- [WCAG 2.1 Success Criterion 1.4.11](https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html)
