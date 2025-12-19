# 03 - Tauri Backend

> **TL;DR:** Estrutura do backend em Rust, comandos IPC e boas práticas para executar Git com segurança.

## Sumário
- [Objetivo](#objetivo)
- [Estrutura de módulos](#estrutura-de-módulos)
- [Comandos IPC](#comandos-ipc)
- [Execução de Git](#execução-de-git)
- [Erros e logging](#erros-e-logging)

## Objetivo
Documentar como o backend Rust é organizado e como expõe funcionalidades para o frontend.

## Estrutura de módulos
Sugestão de estrutura:
```
src-tauri/src/
├── main.rs
├── commands/        # IPC handlers
├── git/             # funções Git
├── ai/              # providers de IA
└── config/          # persistência e preferências
```

## Comandos IPC
- `git_status`
- `git_diff`
- `git_commit`
- `git_branches`
- `ai_generate_commit`
- `ai_chat`

## Execução de Git
- Use `std::process::Command`.
- Sanitizar entradas do usuário.
- Evitar shell parsing.

## Erros e logging
- Retornar erros claros para o frontend.
- Log estruturado (ex.: `tracing`).

## Referências
- docs/01-architecture.md
