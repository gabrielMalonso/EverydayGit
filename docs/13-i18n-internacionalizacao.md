# Internacionalização (i18n)

Este documento descreve a implementação de internacionalização (i18n) no EverydayGit, incluindo arquitetura, uso, convenções e melhores práticas.

## Visão Geral

### O que é i18n?

Internacionalização (abreviada como i18n - há 18 letras entre "i" e "n") é o processo de adaptar um software para diferentes idiomas e regiões sem alterações no código-fonte. No EverydayGit, isso permite que a interface do usuário seja exibida em múltiplos idiomas.

### Por que implementamos i18n?

- **Acessibilidade:** Permite que usuários de diferentes países usem o app em seu idioma nativo
- **Profissionalismo:** Demonstra atenção à experiência do usuário global
- **Escalabilidade:** Facilita a adição de novos idiomas no futuro
- **Separação de concerns:** Mantém strings de UI separadas da lógica de negócio

### Idiomas Suportados

| Idioma | Código | Status |
|--------|--------|--------|
| Português (Brasil) | `pt-BR` | Padrão ✓ |
| English | `en` | Fallback ✓ |
| Español | `es` | Completo ✓ |

**Idioma padrão:** `pt-BR` (Português do Brasil)
**Fallback:** `en` (Inglês) - usado quando uma tradução não existe

### Bibliotecas Utilizadas

```json
{
  "i18next": "^25.7.3",
  "react-i18next": "^16.5.1"
}
```

- **i18next:** Framework i18n JavaScript mais popular e maduro
- **react-i18next:** Integração oficial do i18next com React via hooks

## Arquitetura

### Estrutura de Pastas

```
src/i18n/
├── index.ts                      # Configuração principal do i18next
└── resources/                    # Arquivos de tradução
    ├── en/                       # Inglês
    │   ├── common.json
    │   ├── navigation.json
    │   ├── commits.json
    │   ├── branches.json
    │   ├── settings.json
    │   └── setup.json
    ├── pt-BR/                    # Português (Brasil)
    │   ├── common.json
    │   ├── navigation.json
    │   ├── commits.json
    │   ├── branches.json
    │   ├── settings.json
    │   └── setup.json
    └── es/                       # Espanhol
        ├── common.json
        ├── navigation.json
        ├── commits.json
        ├── branches.json
        ├── settings.json
        └── setup.json
```

### Namespaces e Organização

O projeto utiliza **6 namespaces** para organizar as traduções por domínio:

| Namespace | Descrição | Exemplos de Uso |
|-----------|-----------|-----------------|
| `common` | Strings compartilhadas em toda a aplicação | Ações (save, cancel), status (loading, error), toasts |
| `navigation` | Navegação e estrutura da UI | Sidebar, páginas, tabs, topbar |
| `commits` | Página de commits | Panel de commit, changes, diff viewer, histórico |
| `branches` | Página de branches | Lista de branches, merge, worktrees |
| `settings` | Modal de configurações | Preferências de IA, commit, aparência |
| `setup` | Fluxo de setup inicial | Autenticação, requisitos do sistema |

**Benefícios da organização por namespace:**
- Evita conflitos de chaves entre diferentes áreas
- Facilita manutenção (traduções relacionadas ficam juntas)
- Melhora performance (lazy loading por namespace se necessário)
- Organização clara e escalável

### Fluxo de Funcionamento

```
┌─────────────────────────────────────────────────────────────┐
│ 1. App Inicializa                                            │
│    - i18n carrega idioma do localStorage                     │
│    - Fallback para pt-BR se não encontrar                    │
└──────────────┬──────────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────────┐
│ 2. Config Backend é Carregada (useConfig)                    │
│    - settingsStore.setConfig() é chamado                     │
│    - Se config.ui_language != i18n.language atual            │
│      → i18n.changeLanguage(config.ui_language)               │
└──────────────┬──────────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────────┐
│ 3. Componente Usa Tradução                                   │
│    const { t } = useTranslation('namespace')                 │
│    <button>{t('actions.save')}</button>                      │
└──────────────┬──────────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────────┐
│ 4. Usuário Troca Idioma (Settings)                           │
│    - changeLanguage(newLang) atualiza i18n                   │
│    - Salva em localStorage                                   │
│    - saveConfig() persiste no backend                        │
└─────────────────────────────────────────────────────────────┘
```

### Integração com Zustand e AppConfig

#### settingsStore.ts

```typescript
import i18n from '../i18n';

export const useSettingsStore = create<SettingsStore>((set) => ({
  config: null,

  setConfig: (config) => {
    // Sync i18n language when config is loaded
    if (config?.ui_language && config.ui_language !== i18n.language) {
      i18n.changeLanguage(config.ui_language);
    }
    set({ config });
  },
}));
```

**Sincronização bidirecional:**
1. **Backend → Frontend:** Quando config é carregado, `ui_language` atualiza i18n
2. **Frontend → Backend:** Quando idioma muda, `saveConfig()` persiste escolha

#### AppConfig Interface

```typescript
interface AppConfig {
  schema_version: number;
  ui_language: string;  // 'en' | 'pt-BR' | 'es'
  // ... outros campos
}
```

## Configuração

### Arquivo `src/i18n/index.ts`

Este é o coração do sistema de i18n. Vamos analisar cada parte:

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Imports dos arquivos de tradução
import enCommon from './resources/en/common.json';
import ptBRCommon from './resources/pt-BR/common.json';
// ... outros imports

// Namespace padrão (usado quando não especificado)
export const defaultNS = 'common';

// Objeto de recursos com todas as traduções
export const resources = {
  en: {
    common: enCommon,
    navigation: enNavigation,
    // ... outros namespaces
  },
  'pt-BR': {
    common: ptBRCommon,
    navigation: ptBRNavigation,
    // ... outros namespaces
  },
  es: {
    common: esCommon,
    navigation: esNavigation,
    // ... outros namespaces
  },
} as const;

// Função para carregar idioma salvo (com fallback)
const getStoredLanguage = (): string => {
  if (typeof window === 'undefined') return 'pt-BR';  // SSR safety
  try {
    const stored = window.localStorage.getItem('everydaygit.ui_language');
    if (stored && ['en', 'pt-BR', 'es'].includes(stored)) {
      return stored;
    }
  } catch {
    // Ignore storage errors (privacidade/incógnito)
  }
  return 'pt-BR';
};

// Inicialização do i18next
i18n.use(initReactI18next).init({
  resources,                    // Traduções carregadas
  lng: getStoredLanguage(),     // Idioma inicial
  fallbackLng: 'en',            // Fallback se tradução não existir
  defaultNS,                    // Namespace padrão
  ns: ['common', 'navigation', 'commits', 'branches', 'settings', 'setup'],
  interpolation: {
    escapeValue: false,         // React já faz escape de XSS
  },
  react: {
    useSuspense: false,         // Não usar Suspense (compatibilidade)
  },
});

// Helper para trocar idioma e persistir
export const changeLanguage = (lng: string) => {
  i18n.changeLanguage(lng);
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem('everydaygit.ui_language', lng);
    } catch {
      // Ignore storage errors
    }
  }
};

export default i18n;
```

### Persistência em localStorage

**Chave:** `everydaygit.ui_language`
**Valores possíveis:** `'en'`, `'pt-BR'`, `'es'`

**Localização:**
- **Browser DevTools:** Application → Local Storage → `file://` ou `http://localhost:1420`
- **Tauri App:** O localStorage é gerenciado internamente pelo WebView

**Acesso programático:**
```typescript
// Ler
const lang = window.localStorage.getItem('everydaygit.ui_language');

// Escrever (use changeLanguage() ao invés disso!)
window.localStorage.setItem('everydaygit.ui_language', 'en');
```

### Sincronização com Backend Rust

O idioma escolhido é persistido no arquivo de configuração gerenciado pelo backend:

**Localização do arquivo:**
```
macOS:  ~/Library/Application Support/everydaygit/everydaygit-config.json
Linux:  ~/.config/everydaygit/everydaygit-config.json
```

**Estrutura relevante:**
```json
{
  "schema_version": 1,
  "ui_language": "pt-BR",
  "theme": "dark",
  // ... outros campos
}
```

**Fluxo de sincronização:**
1. Usuário troca idioma no Settings
2. `changeLanguage(newLang)` atualiza i18n e localStorage
3. `saveConfig(newConfig)` chama `save_config_cmd` no Rust
4. Backend persiste em `everydaygit-config.json`
5. No próximo carregamento, `loadConfig()` restaura preferência

## Arquivos de Tradução

### Localização

Todos os arquivos JSON estão em:
```
src/i18n/resources/{idioma}/{namespace}.json
```

### Estrutura e Convenções de Nomenclatura

#### Convenções de Chaves

1. **camelCase:** Usado na maioria das chaves (padrão JavaScript)
2. **Hierarquia:** Use objetos aninhados para organizar por domínio

**Exemplo:**
```json
{
  "actions": {
    "save": "Salvar",
    "cancel": "Cancelar",
    "delete": "Excluir"
  },
  "status": {
    "loading": "Carregando...",
    "error": "Erro"
  }
}
```

#### Interpolação de Variáveis

Use `{{variableName}}` para valores dinâmicos:

```json
{
  "welcome": "Bem-vindo, {{name}}!",
  "filesChanged": "{{count}} arquivo alterado",
  "conflictOfTotal": "Conflito {{current}} de {{total}}"
}
```

**Uso:**
```typescript
t('welcome', { name: 'Gabriel' })
// → "Bem-vindo, Gabriel!"

t('conflictOfTotal', { current: 2, total: 5 })
// → "Conflito 2 de 5"
```

#### Pluralização

Para plurais, use a convenção `_other`:

```json
{
  "filesChanged": "{{count}} arquivo alterado",
  "filesChanged_other": "{{count}} arquivos alterados"
}
```

**Uso:**
```typescript
t('filesChanged', { count: 1 })   // → "1 arquivo alterado"
t('filesChanged', { count: 5 })   // → "5 arquivos alterados"
```

### Exemplos de Cada Namespace

#### 1. common.json

**Propósito:** Strings compartilhadas em toda a aplicação

```json
{
  "actions": {
    "cancel": "Cancelar",
    "save": "Salvar",
    "delete": "Excluir",
    "refresh": "Atualizar"
  },
  "status": {
    "loading": "Carregando...",
    "error": "Erro",
    "success": "Sucesso"
  },
  "toast": {
    "savedSuccess": "Salvo com sucesso!",
    "saveFailed": "Falha ao salvar"
  }
}
```

#### 2. navigation.json

**Propósito:** Navegação da aplicação

```json
{
  "sidebar": {
    "navigation": "Navegação",
    "expandSidebar": "Expandir sidebar"
  },
  "pages": {
    "commits": "Commits",
    "branches": "Branches",
    "settings": "Configurações"
  }
}
```

#### 3. commits.json

**Propósito:** Página de commits

```json
{
  "panel": {
    "title": "Commit",
    "messagePlaceholder": "Mensagem de commit...",
    "generate": "Gerar"
  },
  "changes": {
    "stagedChanges": "Mudanças Staged",
    "unstagedChanges": "Mudanças Não Staged"
  }
}
```

#### 4. branches.json

**Propósito:** Página de branches

```json
{
  "list": {
    "title": "Branches",
    "searchPlaceholder": "Buscar branches...",
    "local": "Local",
    "remote": "Remoto"
  },
  "merge": {
    "title": "Merge",
    "from": "De",
    "to": "Para"
  }
}
```

#### 5. settings.json

**Propósito:** Modal de configurações

```json
{
  "title": "Configurações",
  "ai": {
    "provider": "Provedor",
    "model": "Modelo"
  },
  "uiLanguage": {
    "label": "Idioma da Interface"
  }
}
```

#### 6. setup.json

**Propósito:** Fluxo de setup inicial

```json
{
  "title": "Configuração Inicial",
  "requirements": {
    "git": "Git instalado",
    "gh": "GitHub CLI instalado"
  }
}
```

## Como Usar nos Componentes

### Import do useTranslation

```typescript
import { useTranslation } from 'react-i18next';
```

### Uso Básico do `t()`

#### Sem namespace explícito (usa 'common' por padrão)

```typescript
const { t } = useTranslation();

return (
  <button>{t('actions.save')}</button>
  // → "Salvar" (pt-BR) / "Save" (en)
);
```

#### Com namespace específico

```typescript
const { t } = useTranslation('commits');

return (
  <h2>{t('panel.title')}</h2>
  // → "Commit"
);
```

#### Múltiplos namespaces

```typescript
const { t } = useTranslation(['commits', 'common']);

return (
  <>
    <h2>{t('commits:panel.title')}</h2>
    <button>{t('common:actions.save')}</button>
  </>
);
```

### Interpolação de Variáveis

```typescript
const { t } = useTranslation('commits');

const fileName = 'src/App.tsx';
return (
  <button title={t('changes.stage', { path: fileName })}>
    Stage
  </button>
  // title → "Stage src/App.tsx"
);
```

### Fallbacks Condicionais

```typescript
const { t } = useTranslation('common');

// Para componentes UI que recebem prop opcional
return (
  <button aria-label={closeLabel ?? t('actions.close')}>
    X
  </button>
);
```

### Exemplo Completo

```typescript
import React from 'react';
import { useTranslation } from 'react-i18next';

interface FileListProps {
  files: string[];
}

export const FileList: React.FC<FileListProps> = ({ files }) => {
  const { t } = useTranslation('commits');

  return (
    <div>
      <h2>{t('changes.title')}</h2>
      {files.length === 0 ? (
        <p>{t('changes.noChanges')}</p>
      ) : (
        files.map((file) => (
          <div key={file}>
            <span>{file}</span>
            <button title={t('changes.stage', { path: file })}>
              Stage
            </button>
          </div>
        ))
      )}
    </div>
  );
};
```

## Política de Tradução de Termos Técnicos

### Regra Geral

**Termos Git NÃO devem ser traduzidos.** Eles são parte do vocabulário técnico universal e traduzi-los causa confusão.

### Termos Git que NÃO devem ser traduzidos

| Termo | ✅ Correto | ❌ Incorreto |
|-------|-----------|-------------|
| commit | "commit" | "confirmar", "comprometer" |
| push | "push" | "empurrar", "enviar" |
| pull | "pull" | "puxar", "obter" |
| merge | "merge" | "mesclar", "fundir" |
| stage | "stage" | "preparar", "encenar" |
| staged | "staged" | "preparado" |
| unstaged | "unstaged" | "não preparado" |
| branch | "branch" | "ramo", "ramificação" |
| diff | "diff" | "diferença" |
| hash | "hash" | "código hash" |
| cherry-pick | "cherry-pick" | "escolher commits" |
| rebase | "rebase" | "rebasear" |
| stash | "stash" | "guardar" |
| worktree | "worktree" | "árvore de trabalho" |
| fetch | "fetch" | "buscar" |
| origin | "origin" | "origem" |
| HEAD | "HEAD" | "cabeça" |
| tag | "tag" | "etiqueta" |

### Termos de UI que DEVEM ser traduzidos

| Categoria | Exemplos |
|-----------|----------|
| **Ações genéricas** | Save → Salvar, Cancel → Cancelar, Delete → Excluir |
| **Status** | Loading → Carregando, Error → Erro, Success → Sucesso |
| **Navegação** | Settings → Configurações, History → Histórico |
| **Descrições** | "Select a file to view diff" → "Selecione um arquivo para ver o diff" |

### Exemplos Práticos

#### ✅ CERTO

```json
{
  "commits": {
    "changes": {
      "stagedChanges": "Mudanças Staged",
      "unstagedChanges": "Mudanças Não Staged"
    }
  }
}
```

**Por quê?** "Staged" mantido em inglês (termo Git), "Mudanças" traduzido (UI).

#### ❌ ERRADO

```json
{
  "commits": {
    "changes": {
      "stagedChanges": "Mudanças Preparadas"
    }
  }
}
```

**Por quê?** "Preparadas" perde o significado técnico de "staged".

### Composições Mistas

Quando combinar termos Git com UI:

```json
{
  "noStagedChanges": "Nenhuma alteração staged",
  "pushCurrentBranch": "Push (branch atual)",
  "mergeInProgress": "Merge em andamento"
}
```

## Como Adicionar Novas Traduções

### Passo a Passo: Adicionar uma Nova String

#### 1. Identifique o namespace apropriado

- String usada em múltiplas páginas? → `common`
- Específica da página de commits? → `commits`
- Específica da página de branches? → `branches`
- Do modal de configurações? → `settings`
- Navegação/sidebar/topbar? → `navigation`
- Fluxo de setup? → `setup`

#### 2. Defina a chave hierárquica

```json
// ✅ BOM
{
  "diff": {
    "noFileSelected": "..."
  }
}

// ❌ RUIM
{
  "diffNoFileSelected": "..."
}
```

#### 3. Adicione em TODOS os idiomas

**IMPORTANTE:** Sempre adicione a chave nos 3 idiomas simultaneamente.

**en/{namespace}.json**
```json
{
  "newKey": "English text"
}
```

**pt-BR/{namespace}.json**
```json
{
  "newKey": "Texto em português"
}
```

**es/{namespace}.json**
```json
{
  "newKey": "Texto en español"
}
```

#### 4. Use no componente

```typescript
const { t } = useTranslation('namespace');
return <span>{t('newKey')}</span>;
```

### Passo a Passo: Adicionar um Novo Idioma

1. Crie a pasta: `mkdir -p src/i18n/resources/fr`
2. Copie arquivos de referência: `cp src/i18n/resources/en/*.json src/i18n/resources/fr/`
3. Traduza todos os arquivos JSON
4. Adicione imports em `src/i18n/index.ts`
5. Adicione ao objeto `resources`
6. Atualize validação em `getStoredLanguage()`
7. Adicione opção no seletor de idioma (SettingsModal)

## Seletor de Idioma

### Localização na UI

O seletor de idioma está no **Settings Modal**, seção **Appearance**:

```
Settings
  └─ Appearance
       ├─ Theme (Dark/Light)
       └─ Interface Language  ← Seletor de idioma
```

### Como Funciona a Troca de Idioma

1. Usuário seleciona novo idioma no SelectMenu
2. `handleUiLanguageChange(newLang)` é chamado
3. `changeLanguage(newLang)` atualiza i18n + localStorage
4. React re-renderiza automaticamente
5. Ao clicar "Save Settings", `saveConfig()` persiste no backend

### Persistência

**localStorage (Imediato):** Quando `changeLanguage()` é chamado, persiste imediatamente

**Backend Config (Ao Salvar):** Quando usuário clica "Save Settings", persiste em `everydaygit-config.json`

## Troubleshooting

### Problemas Comuns

#### 1. Tradução Não Aparece (Mostra Chave)

**Causa:** Chave não existe ou namespace incorreto

**Solução:**
- Verifique que a chave existe no arquivo JSON
- Confirme o namespace correto no `useTranslation()`

#### 2. Interpolação Não Funciona

**Causa:** Variáveis não passadas

**Solução:**
```typescript
// ❌ ERRADO
t('conflictOfTotal')

// ✅ CORRETO
t('conflictOfTotal', { current: 2, total: 5 })
```

#### 3. Idioma Não Persiste

**Causa:** localStorage bloqueado ou erro ao salvar

**Solução:**
- Verifique DevTools Console para erros
- Confirme que `changeLanguage()` está sendo chamado

### Como Debugar

#### Enable Debug Mode

```typescript
// src/i18n/index.ts
i18n.use(initReactI18next).init({
  debug: true,  // ← Ativa logs detalhados
  // ...
});
```

#### Verificar Idioma Atual

```typescript
import i18n from './i18n';
console.log('Current language:', i18n.language);
```

## Referências

### Documentação Oficial

- **i18next Docs:** https://www.i18next.com/
- **react-i18next Docs:** https://react.i18next.com/
- **Interpolation:** https://www.i18next.com/translation-function/interpolation
- **Plurals:** https://www.i18next.com/translation-function/plurals

### Arquivos Relevantes do Projeto

| Arquivo | Descrição |
|---------|-----------|
| `src/i18n/index.ts` | Configuração principal do i18next |
| `src/i18n/resources/{lang}/*.json` | Arquivos de tradução |
| `src/stores/settingsStore.ts` | Sincronização com AppConfig |
| `src/components/SettingsModal.tsx` | Seletor de idioma |
| `src/hooks/useConfig.ts` | Persistência de config |

---

**Última Atualização:** 2025-01-06
**Versão:** 1.0.0
