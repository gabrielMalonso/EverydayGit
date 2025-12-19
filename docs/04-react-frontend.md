# 04 - React Frontend

> **TL;DR:** Guia do frontend React: organização, layout principal e integração com o backend via IPC.

## Sumário
- [Objetivo](#objetivo)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Layout principal](#layout-principal)
- [Hooks e IPC](#hooks-e-ipc)
- [Padrões de UI](#padrões-de-ui)

## Objetivo
Padronizar a construção da UI e reduzir decisões repetitivas.

## Estrutura de pastas
```
src/
├── components/
├── hooks/
├── stores/
├── lib/
├── types/
├── App.tsx
└── main.tsx
```

## Layout principal
- **Top Bar:** repo path, branch atual, ahead/behind, settings.
- **Branches (esquerda):** local/remotes/tags.
- **Changes (centro):** staged/unstaged, commit message.
- **AI (direita):** sugestão de commit + chat.
- **History (rodapé):** lista com grafo simplificado.

## Hooks e IPC
Criar hooks como:
- `useGitStatus()`
- `useGitDiff(file)`
- `useAiCommitSuggestion(diff)`

## Padrões de UI
- Dark mode como default.
- Componentes focados em legibilidade.

## Referências
- docs/07-ui-components.md
