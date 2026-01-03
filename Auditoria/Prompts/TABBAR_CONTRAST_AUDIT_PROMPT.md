# Auditoria de Acessibilidade - Contraste da Barra Superior (TabBar)

## Contexto

Você é um especialista em acessibilidade web (WCAG 2.1 AA/AAA). Sua tarefa é analisar o contraste de cores dos componentes da barra superior (TabBar) de um aplicativo desktop Tauri/React.

## Arquivos para Análise

### 1. Design Tokens (theme.css)

```css
:root {
  /* Cores de fundo */
  --color-bg: 10 10 10;           /* #0A0A0A - Fundo principal */
  --color-surface-1: 23 23 23;    /* #171717 - Sidebar/TabBar */
  --color-surface-2: 39 39 42;    /* #27272A */
  --color-surface-3: 47 47 47;    /* #2F2F2F */

  /* Cores de texto */
  --color-text-1: 250 250 250;    /* #FAFAFA - Texto principal */
  --color-text-2: 161 161 161;    /* #A1A1A1 - Texto secundário */
  --color-text-3: 115 115 115;    /* #737373 - Texto terciário */

  /* Bordas */
  --color-border-1: 35 35 35;     /* #232323 */
  --color-border-2: 47 47 47;     /* #2F2F2F */

  /* Cores de destaque */
  --color-primary: 133 204 35;    /* #85CC23 - Verde lima */
  --color-warning: 245 158 11;    /* #F59E0B - Amarelo */
  --color-danger: 239 68 68;      /* #EF4444 - Vermelho */
}
```

### 2. Componente TabBar (TabBar.tsx)

```tsx
<header className="flex h-14 items-center border-b border-border1 bg-surface1/95 backdrop-blur px-4">
  {/* Logo + Título */}
  <div className="flex items-center gap-3 pr-5 border-r border-border2 mr-3">
    <img src={logoMark} alt="" className="h-8 w-8" />
    <span className="text-lg font-semibold text-text1">EverydayGit</span>
  </div>

  {/* Container de Tabs */}
  <div className="flex flex-1 items-center gap-1 overflow-x-auto scrollbar-none">
    {/* Tab Ativa */}
    <div className="bg-surface1 text-text1">
      <span className="font-medium">{tab.title}</span>
      <button className="hover:bg-surface3 hover:text-danger" aria-label="Fechar aba">
        <X size={14} />
      </button>
    </div>

    {/* Tab Inativa */}
    <div className="text-text2 hover:bg-surface3/50 hover:text-text1">
      <span className="font-medium">{tab.title}</span>
    </div>

    {/* Indicador de mudanças não salvas */}
    <div className="h-2 w-2 rounded-full bg-warning" />

    {/* Indicador de tab ativa (barra inferior) */}
    <div className="h-0.5 rounded-full bg-primary" />

    {/* Botão Nova Aba */}
    <button className="text-text2 hover:bg-surface3 hover:text-text1" aria-label="Nova aba">
      <Plus size={16} />
    </button>
  </div>
</header>
```

### 3. Componente BranchControls (BranchControls.tsx)

```tsx
<div className="flex items-center gap-2">
  {/* Seletor de Branch */}
  <SelectMenu
    buttonClassName="rounded border border-border1 bg-surface3/80 px-2 py-1 text-xs text-text1 ring-1 ring-black/10"
    renderTriggerValue={(option) => (
      <span className="truncate text-text1">{option?.label}</span>
    )}
  />

  {/* Badge "behind" */}
  <Badge variant="warning">↓ {status.behind}</Badge>

  {/* Botão Settings */}
  <button className="text-text2 hover:bg-surface3 hover:text-text1" aria-label="Settings">
    <Settings size={16} />
  </button>
</div>
```

---

## Tarefas de Análise

### 1. Calcular Ratios de Contraste

Para cada combinação de cor de texto/fundo, calcule o ratio de contraste usando a fórmula WCAG:

| Elemento | Cor do Texto | Cor de Fundo | Ratio | WCAG AA (4.5:1) | WCAG AAA (7:1) |
|----------|--------------|--------------|-------|-----------------|----------------|
| Título "EverydayGit" | text1 (#FAFAFA) | surface1 (#171717) | ? | ✓/✗ | ✓/✗ |
| Tab ativa | text1 (#FAFAFA) | surface1 (#171717) | ? | ✓/✗ | ✓/✗ |
| Tab inativa | text2 (#A1A1A1) | surface1 (#171717) | ? | ✓/✗ | ✓/✗ |
| Botão + (ícone) | text2 (#A1A1A1) | surface1 (#171717) | ? | ✓/✗ | ✓/✗ |
| Botão Settings | text2 (#A1A1A1) | surface1 (#171717) | ? | ✓/✗ | ✓/✗ |
| Branch selector | text1 (#FAFAFA) | surface3 (#2F2F2F) | ? | ✓/✗ | ✓/✗ |
| Indicador warning | warning (#F59E0B) | surface1 (#171717) | ? | ✓/✗ | ✓/✗ |
| Indicador primary | primary (#85CC23) | surface1 (#171717) | ? | ✓/✗ | ✓/✗ |
| Borda divisória | border2 (#2F2F2F) | surface1 (#171717) | ? | 3:1 (elementos gráficos) | - |

### 2. Identificar Problemas

Liste todos os elementos que **NÃO** atendem aos critérios WCAG 2.1:
- **Texto normal**: mínimo 4.5:1 (AA) ou 7:1 (AAA)
- **Texto grande** (≥18pt ou ≥14pt bold): mínimo 3:1 (AA) ou 4.5:1 (AAA)
- **Elementos gráficos/UI**: mínimo 3:1

### 3. Propor Correções

Para cada problema identificado, sugira:

1. **Nova cor de texto** que atenda WCAG AA (preferencialmente AAA)
2. **Código CSS/Tailwind** com a correção
3. **Impacto visual** - se a mudança afeta a estética do design

### 4. Verificar Acessibilidade Adicional

- [ ] Todos os botões têm `aria-label`?
- [ ] Os elementos interativos têm estados de foco visíveis?
- [ ] O contraste do estado `:hover` é adequado?
- [ ] Os ícones sozinhos têm texto alternativo ou labels?

---

## Formato de Saída Esperado

```markdown
## Resultados da Análise de Contraste

### Resumo
- Total de elementos analisados: X
- Conformes WCAG AA: X
- Conformes WCAG AAA: X
- Com problemas: X

### Problemas Encontrados

#### 1. [Nome do Elemento]
- **Contraste atual**: X:1
- **Requisito WCAG**: X:1 (AA/AAA)
- **Severidade**: Alta/Média/Baixa

**Correção proposta:**
```css
/* De */
.elemento { color: rgb(var(--color-text-2)); }

/* Para */
.elemento { color: rgb(var(--color-text-1)); }
/* Ou criar novo token */
--color-text-muted: 180 180 180; /* #B4B4B4 - ratio 8.5:1 */
```

### Recomendações Gerais
1. ...
2. ...
```

---

## Notas Importantes

- O app usa tema **dark mode** exclusivamente
- O fundo da TabBar tem **backdrop-blur** e opacidade de 95%
- Considere que usuários podem ter redução de visão ou daltonismo
- Priorize correções que mantenham a estética escura/minimalista do app
