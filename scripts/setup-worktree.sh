#!/usr/bin/env bash
# setup-worktree.sh
# Prepara uma nova worktree do EverydayGit, criando symlinks para as
# pastas pesadas do projeto original (node_modules, target, gen).
#
# Uso:
#   ./scripts/setup-worktree.sh
#   ./scripts/setup-worktree.sh /caminho/para/projeto/original

set -e

# ─── Configuração ────────────────────────────────────────────────────────────

WORKTREE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ORIGIN="${1:-/Users/gabrielalonso/Projetos/everydaygit}"

echo "Worktree : $WORKTREE_DIR"
echo "Origem   : $ORIGIN"
echo ""

# ─── Validações ───────────────────────────────────────────────────────────────

if [ ! -d "$ORIGIN" ]; then
  echo "ERRO: projeto original não encontrado em '$ORIGIN'"
  echo "Passe o caminho correto como argumento: ./scripts/setup-worktree.sh /seu/caminho"
  exit 1
fi

# ─── Função auxiliar ──────────────────────────────────────────────────────────

link_dir() {
  local src="$1"
  local dst="$2"

  # Garante que o diretório pai existe
  mkdir -p "$(dirname "$dst")"

  if [ -L "$dst" ]; then
    echo "  [skip]  $dst  →  já é symlink"
  elif [ -d "$dst" ]; then
    echo "  [skip]  $dst  →  diretório real (não mexendo)"
  elif [ ! -d "$src" ]; then
    echo "  [warn]  $src não existe na origem, pulando"
  else
    ln -s "$src" "$dst"
    echo "  [link]  $dst  →  $src"
  fi
}

# ─── Symlinks ─────────────────────────────────────────────────────────────────

echo "Criando symlinks..."

# Frontend
link_dir "$ORIGIN/node_modules"       "$WORKTREE_DIR/node_modules"

# Rust / Tauri (target pode ter vários GBs; gen contém bindings gerados)
link_dir "$ORIGIN/src-tauri/target"   "$WORKTREE_DIR/src-tauri/target"
link_dir "$ORIGIN/src-tauri/gen"      "$WORKTREE_DIR/src-tauri/gen"

# ─── Verificação rápida ───────────────────────────────────────────────────────

echo ""
echo "Verificando..."

if [ -e "$WORKTREE_DIR/node_modules/.bin/vite" ]; then
  echo "  [ok] node_modules  (vite encontrado)"
else
  echo "  [warn] node_modules pode estar incompleto — rode 'npm install' se necessário"
fi

if [ -d "$WORKTREE_DIR/src-tauri/target" ]; then
  echo "  [ok] src-tauri/target"
fi

echo ""
echo "Pronto! Ambiente preparado em:"
echo "  $WORKTREE_DIR"
echo ""
echo "Comandos disponíveis:"
echo "  npm run dev          # frontend no browser (modo demo)"
echo "  npm run tauri dev    # app desktop com backend Rust"
