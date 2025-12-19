# 06 - AI Integration

> **TL;DR:** Abstração dos providers de IA, formato de prompts e fluxo de geração de mensagens de commit.

## Sumário
- [Objetivo](#objetivo)
- [Providers suportados](#providers-suportados)
- [Formato do prompt](#formato-do-prompt)
- [Rate limiting e falhas](#rate-limiting-e-falhas)
- [Segurança](#segurança)

## Objetivo
Criar uma camada consistente para diferentes providers de IA.

## Providers suportados
- Claude
- OpenAI
- Ollama (local)

## Formato do prompt
Incluir:
- Lista de arquivos alterados.
- Trechos relevantes do diff.
- Preferências do usuário (idioma, estilo).

## Rate limiting e falhas
- Backoff exponencial.
- Mensagens amigáveis para o usuário.

## Segurança
- Não enviar segredos no diff.
- Permitir redaction básica (filtros de strings).

## Referências
- docs/09-local-storage.md
