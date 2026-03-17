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

export interface Worktree {
  path: string;
  branch: string;
  is_main: boolean;
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
  insertions: number;
  deletions: number;
}

export interface RepoSelectionResult {
  is_git: boolean;
  path: string;
}

export interface RequirementStatus {
  name: string;
  installed: boolean;
  version?: string | null;
  error?: string | null;
}

export interface SetupStatus {
  git: RequirementStatus;
  gh: RequirementStatus;
  gh_auth: RequirementStatus;
  all_passed: boolean;
}

export interface AuthResult {
  code: string;
  url: string;
}

export interface MergePreview {
  can_fast_forward: boolean;
  conflicts: string[];
  files_changed: number;
  insertions: number;
  deletions: number;
}

export interface MergeResult {
  fast_forward: boolean;
  summary: string;
  conflicts: string[];
}

export interface BranchComparison {
  ahead: number;
  behind: number;
  commits: CommitInfo[];
  diff_summary?: string;
}

export type AiProvider = "claude" | "openai" | "gemini" | "ollama" | "codex";

export interface CodexStatus {
  installed: boolean;
  version: string | null;
  authenticated: boolean;
  auth_info: string | null;
  error: string | null;
}

export interface AiConfig {
  provider: AiProvider;
  api_key: string | null;
  model: string;
  base_url: string | null;
  save_model_as_default: boolean;
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
  ui_language: string;
}

export interface ChatMessage {
  role: string;
  content: string;
}

export interface ConflictHunk {
  id: number;
  ours_content: string;
  theirs_content: string;
  ours_label: string;
  theirs_label: string;
  start_line: number;
  end_line: number;
  context_before: string[];
  context_after: string[];
}

export interface ConflictFile {
  path: string;
  conflicts: ConflictHunk[];
  content: string;
  is_binary: boolean;
}

export interface InitRepoOptions {
  path: string;
  name: string;
  description?: string | null;
  default_branch: string;
  add_readme: boolean;
  gitignore_template?: string | null;
  license?: string | null;
  initial_commit: boolean;
  commit_message?: string | null;
}

export interface InitRepoResult {
  created_files: string[];
  skipped_files: string[];
}

export interface PublishRepoOptions {
  path: string;
  name: string;
  visibility: 'public' | 'private';
  description?: string | null;
}

export interface PublishRepoResult {
  url: string | null;
}

export type ResolutionChoice = 'ours' | 'theirs' | 'both' | 'custom';

export interface HunkResolution {
  hunkId: number;
  choice: ResolutionChoice;
  content: string;
}

// Pull Request union types
export type PrState = 'OPEN' | 'CLOSED' | 'MERGED';
export type PrMergeable = 'MERGEABLE' | 'CONFLICTING' | 'UNKNOWN';
export type ChecksStatus = 'passing' | 'failing' | 'pending' | 'none';
export type PrReviewState = 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'PENDING' | 'DISMISSED';

// Pull Request types
export interface PullRequestItem {
  number: number;
  title: string;
  author_login: string;
  state: PrState;
  created_at: string;
  updated_at: string;
  head_ref_name: string;
  base_ref_name: string;
  is_draft: boolean;
  url: string;
  additions: number;
  deletions: number;
  changed_files: number;
  mergeable: PrMergeable;
  checks_status: ChecksStatus;
}

export interface PullRequestDetail {
  number: number;
  title: string;
  body: string;
  author_login: string;
  state: PrState;
  created_at: string;
  updated_at: string;
  head_ref_name: string;
  base_ref_name: string;
  is_draft: boolean;
  url: string;
  additions: number;
  deletions: number;
  changed_files: number;
  mergeable: PrMergeable;
  checks_status: ChecksStatus;
  comments: PrComment[];
  reviews: PrReview[];
}

export interface PrComment {
  author_login: string;
  body: string;
  created_at: string;
}

export interface PrReview {
  author_login: string;
  state: PrReviewState;
  body: string;
  submitted_at: string;
  comments: PrReviewComment[];
}

export interface PrReviewComment {
  author_login: string;
  body: string;
  path: string;
  line: number | null;
  diff_hunk: string;
  created_at: string;
}

export type PrStatusFilter = 'open' | 'closed' | 'merged';
