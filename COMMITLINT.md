# Commitlint - Guia Completo

> Padronização de mensagens de commit usando Conventional Commits
> Última atualização: 2026-01-26

---

## O que é Commitlint?

Commitlint é uma ferramenta que valida mensagens de commit contra um conjunto de regras predefinidas. Neste projeto, usamos o padrão **Conventional Commits**, que é amplamente adotado na indústria.

---

## Formato da Mensagem

```
<tipo>(<escopo>): <descrição>

[corpo opcional]

[rodapé opcional]
```

### Estrutura

| Parte | Obrigatório | Descrição |
|-------|-------------|-----------|
| `tipo` | ✅ Sim | Categoria da mudança |
| `escopo` | ❌ Não | Área do código afetada |
| `descrição` | ✅ Sim | Resumo curto da mudança |
| `corpo` | ❌ Não | Explicação detalhada |
| `rodapé` | ❌ Não | Breaking changes, issues relacionadas |

---

## Tipos Permitidos

| Tipo | Quando usar | Exemplo |
|------|-------------|---------|
| `feat` | Nova funcionalidade para o usuário | `feat(auth): adicionar login com Google` |
| `fix` | Correção de bug | `fix(agenda): corrigir conflito de horários` |
| `docs` | Apenas documentação | `docs(readme): atualizar instruções de setup` |
| `style` | Formatação, sem mudança de lógica (espaços, vírgulas, etc.) | `style(button): corrigir indentação` |
| `refactor` | Refatoração de código (nem fix nem feat) | `refactor(hooks): extrair lógica de useAuth` |
| `test` | Adicionar ou corrigir testes | `test(services): adicionar testes para pagamentos` |
| `chore` | Manutenção (deps, configs, CI, build) | `chore(deps): atualizar dependências` |

---

## Regras Ativas

| Regra | Valor | Descrição |
|-------|-------|-----------|
| `type-enum` | Obrigatório | Tipo deve ser um dos listados acima |
| `type-case` | lowercase | Tipo deve ser minúsculo |
| `subject-max-length` | 72 | Descrição máxima de 72 caracteres |
| `subject-full-stop` | Proibido | Não terminar descrição com ponto |
| `subject-empty` | Proibido | Descrição não pode ser vazia |

---

## Exemplos Válidos

### Básico (só tipo e descrição)
```bash
git commit -m "feat: adicionar página de login"
git commit -m "fix: corrigir erro de validação"
git commit -m "docs: atualizar README"
```

### Com escopo
```bash
git commit -m "feat(auth): adicionar autenticação com Firebase"
git commit -m "fix(agenda): corrigir exibição de horários"
git commit -m "refactor(hooks): simplificar useAuth"
git commit -m "test(utils): adicionar testes para formatDate"
git commit -m "chore(deps): atualizar React para v19"
```

### Com corpo explicativo
```bash
git commit -m "fix(notifications): corrigir duplicação de push

O problema ocorria quando o usuário abria o app em segundo plano.
A solução foi adicionar dedupe por messageId no servidor."
```

### Com breaking change
```bash
git commit -m "feat(api): mudar formato de resposta do endpoint /users

BREAKING CHANGE: O campo 'name' foi renomeado para 'fullName'.
Clientes da API precisam atualizar suas integrações."
```

### Com referência a issue
```bash
git commit -m "fix(auth): corrigir logout em dispositivos iOS

Closes #123"
```

---

## Exemplos Inválidos

```bash
# ❌ Sem tipo
git commit -m "corrigir bug de login"

# ❌ Tipo inválido
git commit -m "bugfix: corrigir erro"

# ❌ Tipo em maiúsculo
git commit -m "FIX: corrigir erro"

# ❌ Descrição vazia
git commit -m "fix:"

# ❌ Descrição muito longa (> 72 caracteres)
git commit -m "fix: corrigir um bug muito complexo que estava causando problemas em várias partes do sistema"

# ❌ Terminando com ponto
git commit -m "fix: corrigir erro de validação."
```

---

## Escopos Sugeridos

Escopos são opcionais, mas ajudam a categorizar. Sugestões para este projeto:

| Escopo | Área |
|--------|------|
| `auth` | Autenticação e autorização |
| `agenda` | Sistema de agendamentos |
| `treino` | Planos e sessões de treino |
| `aluno` | Funcionalidades do aluno |
| `personal` | Funcionalidades do personal |
| `ui` | Componentes de interface |
| `hooks` | React hooks |
| `services` | Serviços e lógica de negócio |
| `i18n` | Internacionalização |
| `theme` | Sistema de temas |
| `push` | Push notifications |
| `deps` | Dependências |
| `ci` | CI/CD e GitHub Actions |
| `docs` | Documentação |

---

## Configuração

### Arquivos do projeto

```
├── commitlint.config.js    # Configuração das regras
├── .husky/
│   ├── pre-commit          # Hook de lint e typecheck
│   └── commit-msg          # Hook do commitlint
└── package.json            # Dependências
```

### Dependências

```json
{
  "devDependencies": {
    "@commitlint/cli": "^20.3.1",
    "@commitlint/config-conventional": "^20.3.1"
  }
}
```

### commitlint.config.js

```javascript
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', [
      'feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore'
    ]],
    'subject-case': [0],  // Desabilitado para permitir nomes próprios
    'subject-max-length': [2, 'always', 72],
    'subject-full-stop': [2, 'never', '.'],
    'type-case': [2, 'always', 'lower-case']
  }
};
```

### Hook Husky (.husky/commit-msg)

```bash
npx --no -- commitlint --edit "$1"
```

---

## Instalação em Novo Projeto

### 1. Instalar dependências

```bash
# Com bun
bun add -d @commitlint/cli @commitlint/config-conventional

# Com npm
npm install -D @commitlint/cli @commitlint/config-conventional

# Com yarn
yarn add -D @commitlint/cli @commitlint/config-conventional
```

### 2. Criar arquivo de configuração

Criar `commitlint.config.js` na raiz:

```javascript
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', [
      'feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore'
    ]],
    'subject-case': [0],
    'subject-max-length': [2, 'always', 72],
    'subject-full-stop': [2, 'never', '.'],
    'type-case': [2, 'always', 'lower-case']
  }
};
```

### 3. Configurar Husky (se ainda não tiver)

```bash
# Instalar husky
bun add -d husky

# Inicializar
npx husky init

# Criar hook commit-msg
echo 'npx --no -- commitlint --edit "$1"' > .husky/commit-msg
chmod +x .husky/commit-msg
```

### 4. Testar

```bash
# Deve passar
echo "feat(auth): adicionar login" | npx commitlint

# Deve falhar
echo "arrumei o bug" | npx commitlint
```

---

## Comandos Úteis

```bash
# Validar última mensagem de commit
npx commitlint --from HEAD~1 --to HEAD

# Validar range de commits
npx commitlint --from HEAD~5 --to HEAD

# Testar uma mensagem específica
echo "feat: minha mensagem" | npx commitlint

# Ver configuração ativa
npx commitlint --print-config
```

---

## Dicas

### 1. Use modo imperativo
```bash
# ✅ Bom (imperativo)
git commit -m "feat: adicionar botão de logout"

# ❌ Evitar (particípio)
git commit -m "feat: adicionado botão de logout"
```

### 2. Seja específico no escopo
```bash
# ✅ Bom
git commit -m "fix(auth): corrigir validação de email"

# ❌ Vago
git commit -m "fix: corrigir bug"
```

### 3. Descrição deve explicar O QUE, não COMO
```bash
# ✅ Bom
git commit -m "feat(agenda): permitir agendamentos recorrentes"

# ❌ Detalhes de implementação
git commit -m "feat(agenda): adicionar campo isRecurring no Firestore"
```

### 4. Use corpo para explicações complexas
```bash
git commit -m "refactor(hooks): extrair lógica de autenticação

A lógica de refresh token estava duplicada em 3 hooks.
Criado useTokenRefresh para centralizar."
```

---

## Benefícios

1. **Histórico legível** - `git log` faz sentido para qualquer pessoa
2. **Changelog automático** - Ferramentas podem gerar releases notes
3. **Versionamento semântico** - `feat` = minor, `fix` = patch
4. **Code review facilitado** - Revisores entendem o contexto rapidamente
5. **Busca eficiente** - `git log --grep="feat"` filtra por tipo

---

## Integração com Changelog Automático

Para gerar changelog automaticamente baseado nos commits:

```bash
# Instalar
bun add -d standard-version

# Adicionar script no package.json
{
  "scripts": {
    "release": "standard-version"
  }
}

# Gerar release
bun run release
```

Isso vai:
1. Analisar commits desde a última tag
2. Determinar versão (major/minor/patch) baseado nos tipos
3. Gerar/atualizar CHANGELOG.md
4. Criar commit de release
5. Criar tag de versão

---

## Troubleshooting

### Hook não executa

```bash
# Verificar permissões
chmod +x .husky/commit-msg

# Reinstalar husky
rm -rf .husky
npx husky init
echo 'npx --no -- commitlint --edit "$1"' > .husky/commit-msg
```

### Bypass temporário (emergências)

```bash
# Pular validação (usar com cautela!)
git commit -m "mensagem" --no-verify
```

### Erro "commitlint not found"

```bash
# Reinstalar dependências
rm -rf node_modules
bun install
```

---

## Referências

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Commitlint](https://commitlint.js.org/)
- [Angular Commit Guidelines](https://github.com/angular/angular/blob/main/CONTRIBUTING.md#commit)
- [Semantic Versioning](https://semver.org/)

---

**Autor**: Gabriel Alonso
**Última atualização**: 2026-01-26

testando 123