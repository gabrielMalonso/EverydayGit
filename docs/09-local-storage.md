# 09 - Local Storage

> **TL;DR:** Persistência local de configurações e preferências do usuário.

## Sumário
- [Objetivo](#objetivo)
- [O que salvar](#o-que-salvar)
- [Formato](#formato)
- [Migrations](#migrations)

## Objetivo
Garantir que o usuário não precise reconfigurar o app a cada uso.

## O que salvar
- Provider de IA selecionado.
- API key (com armazenamento seguro quando possível).
- Preferências de commit (estilo/idioma).
- Último repositório aberto.

## Formato
- JSON simples versionado.

## Migrations
- Manter `schema_version`.
- Migrar configs antigas no startup.

## Referências
- docs/06-ai-integration.md
