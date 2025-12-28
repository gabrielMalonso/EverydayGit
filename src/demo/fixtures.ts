import type { Branch, CommitInfo, RepoStatus, ConflictFile } from '../types';

export const DEMO_REPO_PATH = '/Users/demo/projects/everydaygit-demo';

export const demoBranches: Branch[] = [
  { name: 'developer', current: true, remote: false },
  { name: 'main', current: false, remote: false },
  { name: 'feature/readme-refresh', current: false, remote: false },
  { name: 'origin/developer', current: false, remote: true },
  { name: 'origin/main', current: false, remote: true },
];

export const demoStatus: RepoStatus = {
  current_branch: 'developer',
  ahead: 1,
  behind: 0,
  files: [
    { path: 'README.md', status: 'Modified', staged: false },
    { path: 'src/components/AiPanel.tsx', status: 'Modified', staged: true },
    { path: 'src/ui/theme.css', status: 'Added', staged: true },
    { path: 'docs/01-architecture.md', status: 'Modified', staged: false },
    { path: 'src-tauri/src/main.rs', status: 'Modified', staged: false },
    { path: 'src/demo/fixtures.ts', status: 'Untracked', staged: false },
  ],
};

export const demoCommits: CommitInfo[] = [
  {
    hash: '0e0bb01d1d6a7c813b6d9b2f1d5f6d2c3a4b5c6d',
    message: 'feat: implement comprehensive design system and UI components',
    author: 'gabrielMalonso',
    date: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
  },
  {
    hash: '2dfb37c9f4e1c2b3a4d5e6f708192a3b4c5d6e7f',
    message: 'fix: enhance Tauri runtime detection and update permissions',
    author: 'gabrielMalonso',
    date: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
  },
  {
    hash: 'c316449b0a1b2c3d4e5f60718293a4b5c6d7e8f9',
    message: 'chore: refresh dependencies and improve build performance',
    author: 'gabrielMalonso',
    date: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
  {
    hash: '2f05a3d77a6b5c4d3e2f1098a7b6c5d4e3f2a1b0',
    message: 'feat: implement auto-restore repository and improve tauri compatibility',
    author: 'gabrielMalonso',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    hash: 'd7ad86ef1234567890abcdef1234567890abcdef',
    message: 'feat: add DiffViewer component and enhance settings',
    author: 'gabrielMalonso',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
];

export const demoDiffByFile: Record<string, { staged: string; unstaged: string }> = {
  'README.md': {
    staged: '',
    unstaged: `diff --git a/README.md b/README.md
index 8fb12aa..b1c2d3e 100644
--- a/README.md
+++ b/README.md
@@ -1,8 +1,14 @@
-# EverydayGit
+# EverydayGit
+
+A minimal desktop Git companion built with Tauri + React.
+
+## Highlights
+- Fast status/branches/commits viewer
+- Built-in AI assistant for commit messages and chat
+- Keyboard-friendly UI
 
 ## Development
-Run \`npm run dev\`
+Run \`npm run dev\` for the web preview (demo mode),
+or \`npm run tauri dev\` to open real repositories.
`,
  },
  'src-tauri/src/main.rs': {
    staged: '',
    unstaged: `diff --git a/src-tauri/src/main.rs b/src-tauri/src/main.rs
index a1b2c3d..e4f5a6b 100644
--- a/src-tauri/src/main.rs
+++ b/src-tauri/src/main.rs
@@ -1,6 +1,10 @@
 fn main() {
-    everydaygit::run();
+    // Improve runtime initialization
+    everydaygit::run();
 }
`,
  },
  'src/components/AiPanel.tsx': {
    staged: `diff --git a/src/components/AiPanel.tsx b/src/components/AiPanel.tsx
index 4b2c1d0..9a8b7c6 100644
--- a/src/components/AiPanel.tsx
+++ b/src/components/AiPanel.tsx
@@ -1,5 +1,5 @@
 import React, { useState } from 'react';
-import { Button } from './Button';
+import { Button } from '../ui';
 
 export const AiPanel: React.FC = () => {
   const [chatInput, setChatInput] = useState('');
`,
    unstaged: '',
  },
  'src/ui/theme.css': {
    staged: `diff --git a/src/ui/theme.css b/src/ui/theme.css
new file mode 100644
index 0000000..1111111
--- /dev/null
+++ b/src/ui/theme.css
@@ -0,0 +1,20 @@
+:root {
+  --color-bg: 15 15 20;
+  --color-surface-1: 26 26 36;
+  --color-text-1: 228 228 231;
+  --color-primary: 99 102 241;
+}
`,
    unstaged: '',
  },
  'docs/01-architecture.md': {
    staged: '',
    unstaged: `diff --git a/docs/01-architecture.md b/docs/01-architecture.md
index 1234567..89abcde 100644
--- a/docs/01-architecture.md
+++ b/docs/01-architecture.md
@@ -10,6 +10,12 @@
 ## Frontend
 - React + Vite
 - Tailwind
+
+## Demo Mode
+When running in the browser, enable demo mode with \`?demo=1\` to load mock data.
`,
  },
  'src/demo/fixtures.ts': {
    staged: '',
    unstaged: `diff --git a/src/demo/fixtures.ts b/src/demo/fixtures.ts
new file mode 100644
index 0000000..2222222
--- /dev/null
+++ b/src/demo/fixtures.ts
@@ -0,0 +1,14 @@
+export const demoRepoPath = '/Users/demo/projects/everydaygit-demo';
+
+export const demoStats = {
+  branches: 5,
+  commits: 42,
+  filesChanged: 6,
+};
+
+export const demoTip = 'Use ?demo=1 to preview without Tauri.';
`,
  },
};

export const demoConflictFiles = [
  'src/components/Header.tsx',
  'src/utils/helpers.ts',
  'package.json',
];

export const demoConflictData: Record<string, ConflictFile> = {
  'src/components/Header.tsx': {
    path: 'src/components/Header.tsx',
    content: `import React from 'react';\n\n<<<<<<< HEAD\nexport const Header = () => {\n  return <header>Old Header</header>;\n};\n=======\nexport const Header = () => {\n  return <header>New Header</header>;\n};\n>>>>>>> feature/new-header\n`,
    is_binary: false,
    conflicts: [
      {
        id: 0,
        ours_content: 'export const Header = () => {\\n  return <header>Old Header</header>;\\n};\\n',
        theirs_content: 'export const Header = () => {\\n  return <header>New Header</header>;\\n};\\n',
        ours_label: 'HEAD',
        theirs_label: 'feature/new-header',
        start_line: 3,
        end_line: 9,
        context_before: ['import React from \\\"react\\\";'],
        context_after: [],
      },
    ],
  },
  'src/utils/helpers.ts': {
    path: 'src/utils/helpers.ts',
    content: `export function formatDate(date: Date) {\n<<<<<<< HEAD\n  return date.toISOString();\n=======\n  return date.toLocaleDateString();\n>>>>>>> feature/date-format\n}\n\n<<<<<<< HEAD\nexport const VERSION = \"1.0.0\";\n=======\nexport const VERSION = \"2.0.0\";\n>>>>>>> feature/date-format\n`,
    is_binary: false,
    conflicts: [
      {
        id: 0,
        ours_content: '  return date.toISOString();\\n',
        theirs_content: '  return date.toLocaleDateString();\\n',
        ours_label: 'HEAD',
        theirs_label: 'feature/date-format',
        start_line: 2,
        end_line: 6,
        context_before: ['export function formatDate(date: Date) {'],
        context_after: ['}'],
      },
      {
        id: 1,
        ours_content: 'export const VERSION = \"1.0.0\";\\n',
        theirs_content: 'export const VERSION = \"2.0.0\";\\n',
        ours_label: 'HEAD',
        theirs_label: 'feature/date-format',
        start_line: 9,
        end_line: 13,
        context_before: [''],
        context_after: [],
      },
    ],
  },
  'package.json': {
    path: 'package.json',
    content: `{\n<<<<<<< HEAD\n  \"version\": \"1.0.0\"\n=======\n  \"version\": \"1.1.0\"\n>>>>>>> release/v1.1\n}\n`,
    is_binary: false,
    conflicts: [
      {
        id: 0,
        ours_content: '  \"version\": \"1.0.0\"\\n',
        theirs_content: '  \"version\": \"1.1.0\"\\n',
        ours_label: 'HEAD',
        theirs_label: 'release/v1.1',
        start_line: 2,
        end_line: 6,
        context_before: ['{'],
        context_after: ['}'],
      },
    ],
  },
};
