# 05 - Git Integration

> **TL;DR:** Estratégia de integração com Git CLI e como interpretar as saídas para alimentar a UI.

## Sumário
- [Objetivo](#objetivo)
- [Comandos principais](#comandos-principais)
- [Parsing de saída](#parsing-de-saída)
- [Monitoramento de mudanças](#monitoramento-de-mudanças)
- [Erros comuns](#erros-comuns)

## Objetivo
Definir como executar Git de forma segura e consistente.

## Comandos principais
- `git status --porcelain=v1`
- `git diff`
- `git diff --staged`
- `git log --oneline --decorate`
- `git branch --list`
- `git branch -r`

## Parsing de saída
- Normalizar staged/unstaged.
- Classificar status (M/A/D/?).

## Monitoramento de mudanças
- Polling periódico do `git status`.
- Recarregar ao trocar de branch.

## Erros comuns
- Repositório sem HEAD.
- Falha de permissão.

## Referências
- docs/03-tauri-backend.md
