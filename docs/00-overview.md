# 00 - Overview

> **TL;DR:** Visão geral do GitFlow AI, objetivos do produto, público-alvo, princípios de design e escopo do MVP. Este runbook alinha o time sobre o “porquê” do projeto antes de qualquer implementação.

## Sumário
- [Objetivo](#objetivo)
- [Problema que resolve](#problema-que-resolve)
- [Público-alvo](#público-alvo)
- [Proposta de valor](#proposta-de-valor)
- [Princípios de design](#princípios-de-design)
- [Escopo do MVP](#escopo-do-mvp)
- [Fora de escopo (por enquanto)](#fora-de-escopo-por-enquanto)
- [Stack escolhida](#stack-escolhida)
- [Glossário](#glossário)

## Objetivo
Definir claramente o propósito do GitFlow AI e servir como referência rápida para decisões de produto e tecnologia.

## Problema que resolve
Ferramentas visuais de Git em IDEs são pesadas e consomem muitos recursos. Outras ferramentas standalone não têm assistência por IA. O GitFlow AI resolve esse gap com uma UI leve e assistência inteligente para tarefas repetitivas.

## Público-alvo
- Desenvolvedores que preferem uma ferramenta Git dedicada, leve e rápida.
- Times que desejam padronizar mensagens de commit com ajuda de IA.
- Usuários que querem workflows guiados sem “overhead” de IDEs completas.

## Proposta de valor
- **Leveza:** experiência desktop rápida e minimalista.
- **Produtividade:** IA integrada para gerar mensagens de commit e explicar mudanças.
- **Clareza:** painel visual único para branches, mudanças e histórico.

## Princípios de design
1. **Minimalismo funcional** — todo elemento precisa ter propósito claro.
2. **Performance primeiro** — app deve abrir rápido e manter UI responsiva.
3. **Keyboard-friendly** — ações acessíveis por atalhos.
4. **IA como assistente** — sugere, o humano decide.

## Escopo do MVP
- **Core Git:** abrir repo, listar branches, ver staged/unstaged, diff, stage/unstage, commit, push/pull, checkout, histórico.
- **IA:** configurar provider, gerar mensagem de commit baseada no diff, chat contextual.
- **Configurações:** tema (dark), idioma, preferências de commit.

## Fora de escopo (por enquanto)
- Suporte multiplataforma além de macOS.
- Plugins/extensibilidade.
- Fluxos avançados (rebase interativo, bisect, stash UI avançada).

## Stack escolhida
- **Desktop:** Tauri 2.x
- **Backend:** Rust
- **Frontend:** React 18 + TypeScript
- **Styling:** Tailwind CSS
- **Estado:** Zustand
- **Git:** CLI nativo
- **IA:** Claude / OpenAI / Ollama

## Glossário
- **Staged/Unstaged:** arquivos prontos (ou não) para commit.
- **Ahead/Behind:** commits à frente/atrás do remoto.
- **Provider de IA:** serviço que responde a prompts (Claude, OpenAI, Ollama).

## Referências
- README.md (visão geral do projeto)
