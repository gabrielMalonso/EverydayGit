# 02 - Setup Environment

> **TL;DR:** Pré-requisitos e passos para configurar o ambiente de desenvolvimento do GitFlow AI.

## Sumário
- [Objetivo](#objetivo)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Rodar em desenvolvimento](#rodar-em-desenvolvimento)
- [Troubleshooting](#troubleshooting)

## Objetivo
Garantir que qualquer pessoa consiga rodar o app localmente com o mínimo de atrito.

## Pré-requisitos
- macOS
- Node.js (LTS)
- Rust (stable) + Cargo
- Tauri CLI 2.x

## Instalação
```bash
# dentro do repositório
npm install
```

## Rodar em desenvolvimento
```bash
npm run tauri dev
```

## Troubleshooting
- **Erro de toolchain Rust:** confira `rustup show`.
- **Falha no build do Tauri:** reinstale o CLI com `cargo install tauri-cli`.

## Referências
- docs/01-architecture.md
