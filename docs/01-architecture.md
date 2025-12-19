# 01 - Architecture

> **TL;DR:** Descreve a arquitetura do GitFlow AI, fluxos de dados e como o frontend React conversa com o backend Tauri/Rust.

## Sumário
- [Objetivo](#objetivo)
- [Visão geral](#visão-geral)
- [Componentes principais](#componentes-principais)
- [Fluxos críticos](#fluxos-críticos)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Contratos IPC](#contratos-ipc)
- [Observabilidade](#observabilidade)

## Objetivo
Explicar a arquitetura para que todos entendam onde cada responsabilidade vive e como os módulos se integram.

## Visão geral
O app é dividido em três camadas:
1. **UI (React/TS)** para renderização e interação.
2. **IPC (Tauri)** como ponte segura entre UI e backend.
3. **Backend (Rust)** para executar comandos Git, IA e persistência.

```
React UI <-> Tauri IPC <-> Rust Backend <-> Git CLI
                               \-> AI Providers
```

## Componentes principais
- **Frontend React**
  - Layout principal (branches, changes, history, AI).
  - Gerencia estado local e UX.
- **Backend Rust**
  - Execução segura de comandos Git.
  - Orquestração de providers de IA.
  - Persistência local de configs.

## Fluxos críticos
### 1) Listar mudanças
1. UI solicita `git_status`.
2. Backend chama `git status --porcelain`.
3. Backend retorna lista normalizada.
4. UI renderiza staged/unstaged.

### 2) Gerar mensagem com IA
1. UI envia diff ao backend.
2. Backend cria prompt a partir das preferências.
3. Provider responde.
4. UI exibe sugestão e ações (copiar/editar).

### 3) Commit
1. UI envia mensagem e arquivos staged.
2. Backend valida estado.
3. Backend executa `git commit -m`.

## Estrutura de pastas
```
./
├── src/                # Frontend React
└── src-tauri/          # Backend Rust
```

## Contratos IPC
Definir contratos estáveis (ex.: `git_status`, `git_diff`, `ai_generate_commit`) com payloads tipados.

## Observabilidade
- Logs estruturados no backend.
- Painel de debug opcional no frontend (desativado em produção).

## Referências
- docs/00-overview.md
