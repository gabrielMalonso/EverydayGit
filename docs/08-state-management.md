# 08 - State Management

> **TL;DR:** Organização do estado global com Zustand e padrões para sincronizar UI e backend.

## Sumário
- [Objetivo](#objetivo)
- [Stores principais](#stores-principais)
- [Sincronização](#sincronização)
- [Boas práticas](#boas-práticas)

## Objetivo
Manter o estado previsível e simples, evitando acoplamento excessivo.

## Stores principais
- **repoStore:** caminho do repositório, branch atual.
- **gitStore:** staged/unstaged, histórico.
- **aiStore:** provider ativo, sugestão atual.
- **settingsStore:** tema, idioma, preferências.

## Sincronização
- Atualizar stores após ações (checkout, commit, push).
- Polling leve do status.

## Boas práticas
- Separar estado de UI (painel aberto, modais) do estado de domínio.
- Evitar dependências circulares.

## Referências
- docs/05-git-integration.md
