# Development Guide - GitFlow AI

## Prerequisites

### macOS (Recommended Platform)
```bash
# Install Xcode Command Line Tools
xcode-select --install

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Node.js (using Homebrew)
brew install node
```

### Linux (Ubuntu/Debian)
```bash
# Install system dependencies
sudo apt-get update
sudo apt-get install -y \
    libwebkit2gtk-4.0-dev \
    build-essential \
    curl \
    wget \
    file \
    libssl-dev \
    libgtk-3-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev \
    libatk1.0-dev \
    libgdk-pixbuf2.0-dev \
    libsoup2.4-dev \
    libjavascriptcoregtk-4.0-dev

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## Installation

```bash
# Clone the repository
git clone https://github.com/your-username/gitflow-ai.git
cd gitflow-ai

# Install dependencies
npm install

# Build the app
npm run tauri build

# Or run in development mode
npm run tauri dev
```

## Project Structure

```
gitflow-ai/
├── src/                          # React Frontend
│   ├── components/               # UI Components
│   │   ├── TopBar.tsx
│   │   ├── BranchesPanel.tsx
│   │   ├── ChangesPanel.tsx
│   │   ├── AiPanel.tsx
│   │   ├── HistoryPanel.tsx
│   │   ├── SettingsModal.tsx
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Panel.tsx
│   │   ├── Badge.tsx
│   │   ├── ListItem.tsx
│   │   └── Textarea.tsx
│   ├── hooks/                    # Custom React Hooks
│   │   ├── useGit.ts
│   │   ├── useAi.ts
│   │   └── useConfig.ts
│   ├── stores/                   # Zustand State Management
│   │   ├── repoStore.ts
│   │   ├── gitStore.ts
│   │   ├── aiStore.ts
│   │   └── settingsStore.ts
│   ├── types/                    # TypeScript Types
│   │   └── index.ts
│   ├── App.tsx                   # Main App Component
│   ├── main.tsx                  # Entry Point
│   └── styles.css                # Tailwind Styles
├── src-tauri/                    # Rust Backend
│   ├── src/
│   │   ├── commands/             # IPC Command Handlers
│   │   │   └── mod.rs
│   │   ├── git/                  # Git Operations
│   │   │   └── mod.rs
│   │   ├── ai/                   # AI Provider Integration
│   │   │   └── mod.rs
│   │   ├── config/               # Configuration Management
│   │   │   └── mod.rs
│   │   ├── lib.rs                # Library Entry Point
│   │   └── main.rs               # Binary Entry Point
│   ├── Cargo.toml                # Rust Dependencies
│   └── tauri.conf.json           # Tauri Configuration
├── docs/                         # Documentation Runbooks
├── package.json                  # Node.js Dependencies
├── tailwind.config.js            # Tailwind Configuration
├── tsconfig.json                 # TypeScript Configuration
└── vite.config.ts                # Vite Configuration
```

## Features Implemented

### ✅ Core Git Operations
- Repository selection and management
- File staging and unstaging
- View staged/unstaged changes
- Commit with custom messages
- Push and pull operations
- Branch listing and checkout
- Commit history visualization

### ✅ AI Integration
- Support for multiple AI providers:
  - Claude (Anthropic)
  - OpenAI (GPT)
  - Ollama (Local)
- AI-powered commit message generation
- Context-aware chat about repository

### ✅ Configuration
- Persistent settings storage
- AI provider configuration
- Commit message preferences
- Language and style customization

### ✅ User Interface
- Dark mode design system
- Responsive layout with panels:
  - Branches (left)
  - Changes (center)
  - AI Assistant (right)
  - History (bottom)
- Settings modal
- Real-time status updates

## Usage

1. **Open Repository**: Click "Open Repository" in the top bar
2. **View Changes**: See staged and unstaged files in the Changes panel
3. **Stage Files**: Click the "+" button next to files to stage them
4. **Generate Commit**: Use the AI panel to generate a commit message
5. **Commit**: Enter or edit the commit message and click "Commit"
6. **Push/Pull**: Use the buttons in the Changes panel header
7. **Switch Branches**: Click on a branch in the Branches panel
8. **Configure AI**: Click "Settings" to set up your AI provider

## Troubleshooting

### Build Errors on Linux
Make sure all system dependencies are installed (see Linux prerequisites above).

### AI Not Working
1. Open Settings
2. Select your AI provider
3. Enter your API key
4. Select the appropriate model

### Git Commands Failing
Make sure the selected directory is a valid Git repository.

## Development Scripts

```bash
# Run in development mode (hot reload)
npm run tauri dev

# Build for production
npm run tauri build

# Check TypeScript types
npm run type-check

# Lint code
npm run lint
```

## Architecture

The app follows a clean architecture pattern:

1. **Frontend (React + TypeScript)**
   - Components handle UI rendering
   - Hooks manage IPC communication
   - Stores manage application state (Zustand)

2. **Backend (Rust + Tauri)**
   - Commands module exposes IPC handlers
   - Git module wraps Git CLI operations
   - AI module manages provider communication
   - Config module handles persistence

3. **Communication**
   - Tauri IPC bridge connects frontend and backend
   - Type-safe commands using TypeScript and Rust types
   - Async/await pattern for all operations

## Next Steps

See `docs/12-future-features.md` for the roadmap of planned features.
