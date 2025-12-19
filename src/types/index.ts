export interface FileStatus {
  path: string;
  status: string;
  staged: boolean;
}

export interface Branch {
  name: string;
  current: boolean;
  remote: boolean;
}

export interface CommitInfo {
  hash: string;
  message: string;
  author: string;
  date: string;
}

export interface RepoStatus {
  files: FileStatus[];
  current_branch: string;
  ahead: number;
  behind: number;
}

export type AiProvider = "claude" | "openai" | "ollama";

export interface AiConfig {
  provider: AiProvider;
  api_key: string | null;
  model: string;
  base_url: string | null;
}

export interface CommitPreferences {
  language: string;
  style: string;
  max_length: number;
}

export interface AppConfig {
  schema_version: number;
  ai: AiConfig;
  commit_preferences: CommitPreferences;
  last_repo_path: string | null;
  theme: string;
}

export interface ChatMessage {
  role: string;
  content: string;
}
