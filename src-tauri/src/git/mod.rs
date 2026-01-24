use anyhow::{anyhow, Context, Result};
use chrono::{Datelike, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::path::{Path, PathBuf};
use std::process::Command;

/// Creates a git Command with extended PATH for macOS GUI apps.
/// GUI apps on macOS don't inherit the terminal PATH, so we need to add
/// common locations like Homebrew paths where node/npx might be installed.
/// This is necessary for git hooks (like Husky) that call node/npx.
fn git_command() -> Command {
    let mut cmd = Command::new("git");

    // Build extended PATH with common tool locations
    let current_path = std::env::var("PATH").unwrap_or_default();
    let extra_paths = [
        "/opt/homebrew/bin",      // Homebrew on Apple Silicon
        "/opt/homebrew/sbin",
        "/usr/local/bin",         // Homebrew on Intel Mac / common tools
        "/usr/local/sbin",
    ];

    let mut extended_path = current_path.clone();
    for p in extra_paths {
        if !current_path.contains(p) {
            extended_path = format!("{}:{}", p, extended_path);
        }
    }

    cmd.env("PATH", extended_path);
    cmd
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileStatus {
    pub path: String,
    pub status: String,
    pub staged: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Branch {
    pub name: String,
    pub current: bool,
    pub remote: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommitInfo {
    pub hash: String,
    pub message: String,
    pub author: String,
    pub date: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommitShortStat {
    pub files_changed: Option<u32>,
    pub insertions: Option<u32>,
    pub deletions: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RepoStatus {
    pub files: Vec<FileStatus>,
    pub current_branch: String,
    pub ahead: u32,
    pub behind: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InitRepoOptions {
    pub path: String,
    pub name: String,
    pub description: Option<String>,
    pub default_branch: String,
    pub add_readme: bool,
    pub gitignore_template: Option<String>,
    pub license: Option<String>,
    pub initial_commit: bool,
    pub commit_message: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InitRepoResult {
    pub created_files: Vec<String>,
    pub skipped_files: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PublishRepoOptions {
    pub path: String,
    pub name: String,
    pub visibility: String,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PublishRepoResult {
    pub url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MergePreview {
    pub can_fast_forward: bool,
    pub conflicts: Vec<String>,
    pub files_changed: usize,
    pub insertions: usize,
    pub deletions: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MergeResult {
    pub fast_forward: bool,
    pub summary: String,
    pub conflicts: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BranchComparison {
    pub ahead: usize,
    pub behind: usize,
    pub commits: Vec<CommitInfo>,
    pub diff_summary: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConflictHunk {
    pub id: usize,
    pub ours_content: String,
    pub theirs_content: String,
    pub ours_label: String,
    pub theirs_label: String,
    pub start_line: usize,
    pub end_line: usize,
    pub context_before: Vec<String>,
    pub context_after: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConflictFile {
    pub path: String,
    pub conflicts: Vec<ConflictHunk>,
    pub content: String,
    pub is_binary: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Worktree {
    pub path: String,
    pub branch: String,
    pub is_main: bool,
}

pub fn get_status(repo_path: &PathBuf) -> Result<RepoStatus> {
    let output = Command::new("git")
        .args(&["status", "--porcelain=v1", "--branch"])
        .current_dir(repo_path)
        .output()
        .context("Failed to execute git status")?;

    if !output.status.success() {
        anyhow::bail!(
            "Git command failed: {}",
            String::from_utf8_lossy(&output.stderr)
        );
    }

    let status_output = String::from_utf8_lossy(&output.stdout);
    let mut files = Vec::new();
    let mut current_branch = String::from("unknown");
    let mut ahead = 0;
    let mut behind = 0;

    for line in status_output.lines() {
        if line.starts_with("##") {
            // Parse branch info
            let branch_info = line.trim_start_matches("## ");
            if let Some(branch_name) = branch_info.split("...").next() {
                current_branch = branch_name.to_string();
            }

            // Parse ahead/behind
            if branch_info.contains("[ahead") {
                if let Some(ahead_str) = branch_info.split("[ahead ").nth(1) {
                    if let Some(num) = ahead_str.split("]").next() {
                        ahead = num.trim_end_matches(']').parse().unwrap_or(0);
                    }
                }
            }
            if branch_info.contains("behind") {
                if let Some(behind_str) = branch_info.split("behind ").nth(1) {
                    if let Some(num) = behind_str.split("]").next() {
                        behind = num.trim_end_matches(']').parse().unwrap_or(0);
                    }
                }
            }
        } else if line.len() >= 3 {
            let status_code = &line[0..2];
            let file_path = line[3..].to_string();

            let (status, staged) = match status_code {
                "M " => ("Modified", true),
                " M" => ("Modified", false),
                "MM" => ("Modified", true),
                "A " => ("Added", true),
                " A" => ("Added", false),
                "D " => ("Deleted", true),
                " D" => ("Deleted", false),
                "??" => ("Untracked", false),
                "R " => ("Renamed", true),
                "C " => ("Copied", true),
                _ => ("Unknown", false),
            };

            files.push(FileStatus {
                path: file_path,
                status: status.to_string(),
                staged,
            });
        }
    }

    Ok(RepoStatus {
        files,
        current_branch,
        ahead,
        behind,
    })
}

pub fn get_diff(repo_path: &PathBuf, file_path: &str, staged: bool) -> Result<String> {
    let mut args = vec!["diff"];
    if staged {
        args.push("--cached");
    }
    args.push("--");
    args.push(file_path);

    let output = Command::new("git")
        .args(&args)
        .current_dir(repo_path)
        .output()
        .context("Failed to execute git diff")?;

    if !output.status.success() {
        anyhow::bail!(
            "Git diff failed: {}",
            String::from_utf8_lossy(&output.stderr)
        );
    }

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

pub fn get_all_diff(repo_path: &PathBuf, staged: bool) -> Result<String> {
    let mut args = vec!["diff"];
    if staged {
        args.push("--cached");
    }

    let output = Command::new("git")
        .args(&args)
        .current_dir(repo_path)
        .output()
        .context("Failed to execute git diff")?;

    if !output.status.success() {
        anyhow::bail!(
            "Git diff failed: {}",
            String::from_utf8_lossy(&output.stderr)
        );
    }

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

pub fn stage_file(repo_path: &PathBuf, file_path: &str) -> Result<()> {
    if is_merge_in_progress(repo_path) {
        anyhow::bail!("Cannot stage files while a merge is in progress. Resolve conflicts first.");
    }

    let output = Command::new("git")
        .args(&["add", file_path])
        .current_dir(repo_path)
        .output()
        .context("Failed to execute git add")?;

    if !output.status.success() {
        anyhow::bail!(
            "Git add failed: {}",
            String::from_utf8_lossy(&output.stderr)
        );
    }

    Ok(())
}

pub fn stage_all(repo_path: &PathBuf) -> Result<()> {
    if is_merge_in_progress(repo_path) {
        anyhow::bail!(
            "Cannot stage all files while a merge is in progress. Resolve conflicts first."
        );
    }

    let output = Command::new("git")
        .args(&["add", "-A"])
        .current_dir(repo_path)
        .output()
        .context("Failed to execute git add -A")?;

    if !output.status.success() {
        anyhow::bail!(
            "Git add -A failed: {}",
            String::from_utf8_lossy(&output.stderr)
        );
    }

    Ok(())
}

pub fn unstage_file(repo_path: &PathBuf, file_path: &str) -> Result<()> {
    let output = Command::new("git")
        .args(&["reset", "HEAD", file_path])
        .current_dir(repo_path)
        .output()
        .context("Failed to execute git reset")?;

    if !output.status.success() {
        anyhow::bail!(
            "Git reset failed: {}",
            String::from_utf8_lossy(&output.stderr)
        );
    }

    Ok(())
}

pub fn commit(repo_path: &PathBuf, message: &str) -> Result<()> {
    let output = git_command()
        .args(&["commit", "-m", message])
        .current_dir(repo_path)
        .output()
        .context("Failed to execute git commit")?;

    if !output.status.success() {
        anyhow::bail!(
            "Git commit failed: {}",
            String::from_utf8_lossy(&output.stderr)
        );
    }

    Ok(())
}

pub fn amend_commit(repo_path: &PathBuf, message: &str) -> Result<()> {
    if is_merge_in_progress(repo_path) {
        anyhow::bail!("Cannot amend commit while a merge is in progress.");
    }

    // Keep it simple: when amending, include all current changes.
    stage_all(repo_path)?;

    let output = git_command()
        .args(&["commit", "--amend", "-m", message])
        .current_dir(repo_path)
        .output()
        .context("Failed to execute git commit --amend")?;

    if !output.status.success() {
        anyhow::bail!(
            "Git commit --amend failed: {}",
            String::from_utf8_lossy(&output.stderr)
        );
    }

    Ok(())
}

/// Verifica se o ultimo commit (HEAD) ja foi enviado ao remoto.
pub fn is_last_commit_pushed(repo_path: &PathBuf) -> Result<bool> {
    let upstream_output = Command::new("git")
        .args(&["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"])
        .current_dir(repo_path)
        .output();

    let upstream_ref = match upstream_output {
        Ok(output) if output.status.success() => {
            let upstream = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if upstream.is_empty() {
                return Ok(false);
            }
            upstream
        }
        _ => return Ok(false),
    };

    let output = Command::new("git")
        .args(&["rev-list", &format!("{upstream_ref}..HEAD"), "--count"])
        .current_dir(repo_path)
        .output()
        .context("Failed to check pushed status")?;

    if !output.status.success() {
        anyhow::bail!(
            "Failed to check pushed status: {}",
            String::from_utf8_lossy(&output.stderr)
        );
    }

    let count: u32 = String::from_utf8_lossy(&output.stdout)
        .trim()
        .parse()
        .unwrap_or(0);

    Ok(count == 0)
}

pub fn push(repo_path: &PathBuf) -> Result<String> {
    let output = git_command()
        .args(&["push"])
        .current_dir(repo_path)
        .output()
        .context("Failed to execute git push")?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        if stderr.contains("has no upstream branch") {
            let branch_output = Command::new("git")
                .args(&["rev-parse", "--abbrev-ref", "HEAD"])
                .current_dir(repo_path)
                .output()
                .context("Failed to detect current branch for upstream push")?;

            if !branch_output.status.success() {
                anyhow::bail!(
                    "Failed to detect current branch: {}",
                    String::from_utf8_lossy(&branch_output.stderr)
                );
            }

            let branch = String::from_utf8_lossy(&branch_output.stdout)
                .trim()
                .to_string();
            if branch.is_empty() || branch == "HEAD" {
                anyhow::bail!("Failed to detect current branch name");
            }

            let push_output = git_command()
                .current_dir(repo_path)
                .args(&["push", "--set-upstream", "origin", &branch])
                .output()
                .context("Failed to push new upstream branch")?;

            if !push_output.status.success() {
                anyhow::bail!(
                    "Git push failed: {}",
                    String::from_utf8_lossy(&push_output.stderr)
                );
            }

            return Ok(String::from_utf8_lossy(&push_output.stdout).to_string());
        }

        anyhow::bail!("Git push failed: {}", stderr);
    }

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

pub fn pull(repo_path: &PathBuf) -> Result<String> {
    let output = git_command()
        .args(&["pull"])
        .current_dir(repo_path)
        .output()
        .context("Failed to execute git pull")?;

    if !output.status.success() {
        anyhow::bail!(
            "Git pull failed: {}",
            String::from_utf8_lossy(&output.stderr)
        );
    }

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

pub fn get_branches(repo_path: &PathBuf) -> Result<Vec<Branch>> {
    // Get local branches
    let output = Command::new("git")
        .args(&["branch", "--list"])
        .current_dir(repo_path)
        .output()
        .context("Failed to execute git branch")?;

    if !output.status.success() {
        anyhow::bail!(
            "Git branch failed: {}",
            String::from_utf8_lossy(&output.stderr)
        );
    }

    let mut branches = Vec::new();
    let branch_output = String::from_utf8_lossy(&output.stdout);

    for line in branch_output.lines() {
        let is_current = line.starts_with("*");
        let name = line.trim_start_matches("* ").trim().to_string();

        branches.push(Branch {
            name,
            current: is_current,
            remote: false,
        });
    }

    // Get remote branches
    let output = Command::new("git")
        .args(&["branch", "-r"])
        .current_dir(repo_path)
        .output()
        .context("Failed to execute git branch -r")?;

    if output.status.success() {
        let remote_output = String::from_utf8_lossy(&output.stdout);
        for line in remote_output.lines() {
            let name = line.trim().to_string();
            if !name.contains("HEAD") {
                branches.push(Branch {
                    name,
                    current: false,
                    remote: true,
                });
            }
        }
    }

    Ok(branches)
}

pub fn checkout_branch(repo_path: &PathBuf, branch_name: &str) -> Result<()> {
    let output = git_command()
        .args(&["checkout", branch_name])
        .current_dir(repo_path)
        .output()
        .context("Failed to execute git checkout")?;

    if !output.status.success() {
        anyhow::bail!(
            "Git checkout failed: {}",
            String::from_utf8_lossy(&output.stderr)
        );
    }

    Ok(())
}

pub fn get_log(repo_path: &PathBuf, limit: usize) -> Result<Vec<CommitInfo>> {
    let output = Command::new("git")
        .args(&[
            "log",
            &format!("-{}", limit),
            "--pretty=format:%H%x1f%B%x1f%an%x1f%ai%x1e",
        ])
        .current_dir(repo_path)
        .output()
        .context("Failed to execute git log")?;

    if !output.status.success() {
        anyhow::bail!(
            "Git log failed: {}",
            String::from_utf8_lossy(&output.stderr)
        );
    }

    let log_output = String::from_utf8_lossy(&output.stdout);
    let mut commits = Vec::new();

    for record in log_output.split('\u{001e}') {
        if record.trim().is_empty() {
            continue;
        }

        let parts: Vec<&str> = record.split('\u{001f}').collect();
        if parts.len() < 4 {
            continue;
        }

        commits.push(CommitInfo {
            hash: parts[0].trim().to_string(),
            message: parts[1].to_string(),
            author: parts[2].trim().to_string(),
            date: parts[3].trim().to_string(),
        });
    }

    Ok(commits)
}

pub fn get_remote_origin_url(repo_path: &PathBuf) -> Result<Option<String>> {
    let output = Command::new("git")
        .args(&["remote", "get-url", "origin"])
        .current_dir(repo_path)
        .output()
        .context("Failed to execute git remote get-url origin")?;

    if !output.status.success() {
        return Ok(None);
    }

    let url = String::from_utf8_lossy(&output.stdout).trim().to_string();
    if url.is_empty() {
        Ok(None)
    } else {
        Ok(Some(url))
    }
}

pub fn get_commit_shortstat(repo_path: &PathBuf, hash: &str) -> Result<CommitShortStat> {
    let hash = hash.trim();
    let output = Command::new("git")
        .args(&["show", "--shortstat", "--format=", "--no-color", hash])
        .current_dir(repo_path)
        .output()
        .context("Failed to execute git show --shortstat")?;

    if !output.status.success() {
        anyhow::bail!(
            "Git show failed: {}",
            String::from_utf8_lossy(&output.stderr)
        );
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut shortstat = CommitShortStat {
        files_changed: None,
        insertions: None,
        deletions: None,
    };

    for line in stdout.lines() {
        let trimmed = line.trim();
        if !(trimmed.contains("file changed") || trimmed.contains("files changed")) {
            continue;
        }

        for part in trimmed.split(',') {
            let part = part.trim();
            let Some(first_token) = part.split_whitespace().next() else {
                continue;
            };

            let Ok(value) = first_token.parse::<u32>() else {
                continue;
            };

            if part.contains("file changed") || part.contains("files changed") {
                shortstat.files_changed = Some(value);
            } else if part.contains("insertion") {
                shortstat.insertions = Some(value);
            } else if part.contains("deletion") {
                shortstat.deletions = Some(value);
            }
        }

        break;
    }

    Ok(shortstat)
}

/// Cria branch local a partir de remota com tracking e faz checkout
/// remote_ref: "origin/feature/x" → cria "feature/x" com upstream
pub fn checkout_remote_branch(repo_path: &PathBuf, remote_ref: &str) -> Result<()> {
    // Deriva nome local: "origin/feature/x" → "feature/x"
    let local_name = match remote_ref.find('/') {
        Some(pos) => &remote_ref[pos + 1..],
        None => remote_ref,
    };

    // Cria branch local com tracking e faz checkout
    // Nota: UI garante que branch local não existe (filtro no dropdown)
    let output = git_command()
        .args(&["checkout", "-b", local_name, "--track", remote_ref])
        .current_dir(repo_path)
        .output()
        .context("Failed to create and checkout branch")?;

    if !output.status.success() {
        anyhow::bail!(
            "Git checkout -b failed: {}",
            String::from_utf8_lossy(&output.stderr)
        );
    }

    Ok(())
}

pub fn create_branch(
    repo_path: &Path,
    name: &str,
    from: Option<&str>,
    push_to_remote: bool,
    checkout: bool,
) -> Result<()> {
    if checkout {
        // Original behavior: create and checkout
        let mut cmd = Command::new("git");
        cmd.current_dir(repo_path)
            .arg("checkout")
            .arg("-b")
            .arg(name);
        if let Some(base) = from {
            cmd.arg(base);
        }

        let output = cmd
            .output()
            .context("Failed to execute git checkout -b for new branch")?;

        if !output.status.success() {
            anyhow::bail!(
                "Git checkout -b failed: {}",
                String::from_utf8_lossy(&output.stderr)
            );
        }
    } else {
        // New behavior: create branch without switching
        let mut cmd = Command::new("git");
        cmd.current_dir(repo_path).arg("branch").arg(name);
        if let Some(base) = from {
            cmd.arg(base);
        }

        let output = cmd
            .output()
            .context("Failed to execute git branch for new branch")?;

        if !output.status.success() {
            anyhow::bail!(
                "Git branch failed: {}",
                String::from_utf8_lossy(&output.stderr)
            );
        }
    }

    if push_to_remote {
        let push_output = Command::new("git")
            .current_dir(repo_path)
            .args(&["push", "-u", "origin", name])
            .output()
            .context("Failed to push new branch")?;

        if !push_output.status.success() {
            anyhow::bail!(
                "Git push failed: {}",
                String::from_utf8_lossy(&push_output.stderr)
            );
        }
    }

    Ok(())
}

pub fn delete_branch(repo_path: &Path, name: &str, force: bool, is_remote: bool) -> Result<()> {
    let name = name.trim();

    if is_remote {
        let (remote, branch_name) = match name.split_once('/') {
            Some((remote, branch_name)) if !remote.is_empty() && !branch_name.is_empty() => {
                (remote, branch_name)
            }
            _ => ("origin", name),
        };

        let output = Command::new("git")
            .current_dir(repo_path)
            .args(&["push", remote, "--delete", branch_name])
            .output()
            .context("Failed to delete remote branch")?;

        if !output.status.success() {
            anyhow::bail!(
                "Failed to delete remote branch: {}",
                String::from_utf8_lossy(&output.stderr)
            );
        }

        return Ok(());
    }

    let flag = if force { "-D" } else { "-d" };
    let output = Command::new("git")
        .current_dir(repo_path)
        .args(&["branch", flag, name])
        .output()
        .context("Failed to delete local branch")?;

    if !output.status.success() {
        anyhow::bail!(
            "Failed to delete local branch: {}",
            String::from_utf8_lossy(&output.stderr)
        );
    }

    Ok(())
}

// ============================================================================
// Git Worktrees
// ============================================================================

/// List all worktrees for the repository
pub fn get_worktrees(repo_path: &PathBuf) -> Result<Vec<Worktree>> {
    let output = Command::new("git")
        .args(&["worktree", "list", "--porcelain"])
        .current_dir(repo_path)
        .output()
        .context("Failed to execute git worktree list")?;

    if !output.status.success() {
        anyhow::bail!(
            "Git worktree list failed: {}",
            String::from_utf8_lossy(&output.stderr)
        );
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut worktrees = Vec::new();
    let mut current_path: Option<String> = None;
    let mut current_branch: Option<String> = None;
    let mut is_first = true;

    for line in stdout.lines() {
        if line.starts_with("worktree ") {
            // Save previous worktree if exists
            if let (Some(path), Some(branch)) = (current_path.take(), current_branch.take()) {
                worktrees.push(Worktree {
                    path,
                    branch,
                    is_main: is_first,
                });
                is_first = false;
            }
            current_path = Some(line.trim_start_matches("worktree ").to_string());
            current_branch = None;
        } else if line.starts_with("branch ") {
            // Format: "branch refs/heads/branch-name"
            let branch_ref = line.trim_start_matches("branch ");
            let branch_name = branch_ref
                .strip_prefix("refs/heads/")
                .unwrap_or(branch_ref)
                .to_string();
            current_branch = Some(branch_name);
        } else if line.starts_with("HEAD ") {
            // Detached HEAD - use abbreviated hash as branch name
            if current_branch.is_none() {
                let hash = line.trim_start_matches("HEAD ");
                current_branch = Some(format!("(detached {})", &hash[..7.min(hash.len())]));
            }
        } else if line.trim().is_empty() {
            // End of a worktree entry
            if let (Some(path), Some(branch)) = (current_path.take(), current_branch.take()) {
                worktrees.push(Worktree {
                    path,
                    branch,
                    is_main: is_first,
                });
                is_first = false;
            }
        }
    }

    // Handle last worktree if no trailing newline
    if let (Some(path), Some(branch)) = (current_path, current_branch) {
        worktrees.push(Worktree {
            path,
            branch,
            is_main: is_first,
        });
    }

    Ok(worktrees)
}

/// Remove a worktree
pub fn remove_worktree(repo_path: &PathBuf, worktree_path: &str, force: bool) -> Result<()> {
    let mut args = vec!["worktree", "remove"];
    if force {
        args.push("--force");
    }
    args.push(worktree_path);

    let output = Command::new("git")
        .args(&args)
        .current_dir(repo_path)
        .output()
        .context("Failed to execute git worktree remove")?;

    if !output.status.success() {
        anyhow::bail!(
            "Git worktree remove failed: {}",
            String::from_utf8_lossy(&output.stderr)
        );
    }

    Ok(())
}

/// Open a path in Finder (macOS)
pub fn open_path_in_finder(path: &str) -> Result<()> {
    Command::new("open")
        .arg(path)
        .output()
        .context("Failed to open path in Finder")?;

    Ok(())
}

// ============================================================================
// Git Reset
// ============================================================================
pub fn reset(repo_path: &Path, commit: &str, mode: &str) -> Result<()> {
    let mode_flag = match mode.to_lowercase().as_str() {
        "soft" => "--soft",
        "mixed" => "--mixed",
        "hard" => "--hard",
        "keep" => "--keep",
        _ => "--mixed", // default
    };

    let output = Command::new("git")
        .current_dir(repo_path)
        .args(&["reset", mode_flag, commit])
        .output()
        .context("Failed to execute git reset")?;

    if !output.status.success() {
        anyhow::bail!(
            "Git reset failed: {}",
            String::from_utf8_lossy(&output.stderr)
        );
    }

    Ok(())
}

// ============================================================================
// Git Cherry-Pick
// ============================================================================
pub fn cherry_pick(repo_path: &Path, commit: &str) -> Result<String> {
    let output = git_command()
        .current_dir(repo_path)
        .args(&["cherry-pick", commit])
        .output()
        .context("Failed to execute git cherry-pick")?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        anyhow::bail!("Git cherry-pick failed: {}", stderr);
    }

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

// ============================================================================
// Git Revert
// ============================================================================
pub fn revert(repo_path: &Path, commit: &str) -> Result<String> {
    let output = git_command()
        .current_dir(repo_path)
        .args(&["revert", "--no-edit", commit])
        .output()
        .context("Failed to execute git revert")?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        anyhow::bail!("Git revert failed: {}", stderr);
    }

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

// ============================================================================
// Git Checkout Commit (detached HEAD)
// ============================================================================
pub fn checkout_commit(repo_path: &Path, commit: &str) -> Result<()> {
    let output = git_command()
        .current_dir(repo_path)
        .args(&["checkout", commit])
        .output()
        .context("Failed to execute git checkout")?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        anyhow::bail!("Git checkout failed: {}", stderr);
    }

    Ok(())
}

// ============================================================================
// Git Create Tag
// ============================================================================
pub fn create_tag(repo_path: &Path, name: &str, commit: &str, message: Option<&str>) -> Result<()> {
    let output = if let Some(msg) = message {
        // Annotated tag with message
        Command::new("git")
            .current_dir(repo_path)
            .args(&["tag", "-a", name, commit, "-m", msg])
            .output()
            .context("Failed to execute git tag")?
    } else {
        // Lightweight tag
        Command::new("git")
            .current_dir(repo_path)
            .args(&["tag", name, commit])
            .output()
            .context("Failed to execute git tag")?
    };

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        anyhow::bail!("Git tag failed: {}", stderr);
    }

    Ok(())
}

// ============================================================================
// Git Diff for Compare with Local
// ============================================================================
pub fn get_commit_diff(repo_path: &Path, commit: &str) -> Result<String> {
    let output = Command::new("git")
        .current_dir(repo_path)
        .args(&["diff", commit, "HEAD"])
        .output()
        .context("Failed to execute git diff")?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        anyhow::bail!("Git diff failed: {}", stderr);
    }

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

pub fn is_git_repo(repo_path: &Path) -> bool {
    repo_path.join(".git").exists()
}

fn repo_has_commits(repo_path: &Path) -> Result<bool> {
    let output = Command::new("git")
        .args(&["rev-parse", "--verify", "HEAD"])
        .current_dir(repo_path)
        .output()
        .context("Failed to check repository commits")?;

    Ok(output.status.success())
}

pub fn init_repository(options: &InitRepoOptions) -> Result<InitRepoResult> {
    let repo_path = PathBuf::from(&options.path);
    if !repo_path.exists() {
        anyhow::bail!("Repository path does not exist");
    }
    if !repo_path.is_dir() {
        anyhow::bail!("Repository path is not a directory");
    }
    if is_git_repo(&repo_path) {
        anyhow::bail!("Repository already initialized");
    }

    let repo_name = options.name.trim();
    if repo_name.is_empty() {
        anyhow::bail!("Repository name is required");
    }

    let branch = options.default_branch.trim();
    if branch.is_empty() {
        anyhow::bail!("Default branch is required");
    }

    let init_output = Command::new("git")
        .args(&["init", "--initial-branch", branch])
        .current_dir(&repo_path)
        .output()
        .context("Failed to execute git init")?;

    if !init_output.status.success() {
        anyhow::bail!(
            "Git init failed: {}",
            String::from_utf8_lossy(&init_output.stderr)
        );
    }

    let mut created_files = Vec::new();
    let mut skipped_files = Vec::new();

    if options.add_readme {
        let readme_path = repo_path.join("README.md");
        if readme_path.exists() {
            skipped_files.push("README.md".to_string());
        } else {
            let mut content = format!("# {}", repo_name);
            if let Some(description) = options
                .description
                .as_ref()
                .map(|value| value.trim())
                .filter(|value| !value.is_empty())
            {
                content.push_str("\n\n");
                content.push_str(description);
            }
            content.push('\n');
            std::fs::write(&readme_path, content).with_context(|| "Failed to write README.md")?;
            created_files.push("README.md".to_string());
        }
    }

    if let Some(template) = options.gitignore_template.as_ref() {
        if let Some(content) = gitignore_template(template) {
            let gitignore_path = repo_path.join(".gitignore");
            if gitignore_path.exists() {
                skipped_files.push(".gitignore".to_string());
            } else {
                std::fs::write(&gitignore_path, content)
                    .with_context(|| "Failed to write .gitignore")?;
                created_files.push(".gitignore".to_string());
            }
        }
    }

    if let Some(license_id) = options.license.as_ref() {
        if let Some(content) = license_text(license_id) {
            let license_path = repo_path.join("LICENSE");
            if license_path.exists() {
                skipped_files.push("LICENSE".to_string());
            } else {
                std::fs::write(&license_path, content)
                    .with_context(|| "Failed to write LICENSE")?;
                created_files.push("LICENSE".to_string());
            }
        }
    }

    if options.initial_commit {
        let add_output = Command::new("git")
            .args(&["add", "-A"])
            .current_dir(&repo_path)
            .output()
            .context("Failed to stage initial files")?;

        if !add_output.status.success() {
            anyhow::bail!(
                "Git add failed: {}",
                String::from_utf8_lossy(&add_output.stderr)
            );
        }

        let message = options
            .commit_message
            .as_deref()
            .map(|value| value.trim())
            .filter(|value| !value.is_empty())
            .unwrap_or("chore: init repo");

        let commit_output = Command::new("git")
            .args(&["commit", "--allow-empty", "-m", message])
            .current_dir(&repo_path)
            .output()
            .context("Failed to commit initial files")?;

        if !commit_output.status.success() {
            anyhow::bail!(
                "Git commit failed: {}",
                String::from_utf8_lossy(&commit_output.stderr)
            );
        }
    }

    Ok(InitRepoResult {
        created_files,
        skipped_files,
    })
}

pub fn publish_github_repo(options: &PublishRepoOptions) -> Result<PublishRepoResult> {
    let repo_path = PathBuf::from(&options.path);
    if !repo_path.exists() {
        anyhow::bail!("Repository path does not exist");
    }
    if !repo_path.is_dir() {
        anyhow::bail!("Repository path is not a directory");
    }
    if !is_git_repo(&repo_path) {
        anyhow::bail!("Repository is not initialized");
    }

    let repo_name = options.name.trim();
    if repo_name.is_empty() {
        anyhow::bail!("Repository name is required");
    }

    if get_remote_origin_url(&repo_path)?.is_some() {
        anyhow::bail!("Repository already has a remote origin");
    }

    if !repo_has_commits(&repo_path)? {
        anyhow::bail!("Repository has no commits. Create one before publishing.");
    }

    let visibility_flag = match options.visibility.trim().to_lowercase().as_str() {
        "private" => "--private",
        _ => "--public",
    };

    let mut args = vec![
        "repo",
        "create",
        repo_name,
        visibility_flag,
        "--source",
        ".",
        "--push",
        "--confirm",
    ];

    if let Some(description) = options
        .description
        .as_ref()
        .map(|value| value.trim())
        .filter(|value| !value.is_empty())
    {
        args.push("--description");
        args.push(description);
    }

    let output = Command::new("gh")
        .args(&args)
        .current_dir(&repo_path)
        .output()
        .context("Failed to execute gh repo create")?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
        let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
        let message = if stderr.is_empty() { stdout } else { stderr };
        anyhow::bail!("GitHub publish failed: {}", message);
    }

    let origin = get_remote_origin_url(&repo_path)?.unwrap_or_default();
    let url = if origin.trim().is_empty() {
        None
    } else {
        Some(origin)
    };

    Ok(PublishRepoResult { url })
}

fn gitignore_template(template: &str) -> Option<&'static str> {
    match template.trim().to_lowercase().as_str() {
        "none" | "" => None,
        "node" => Some(
            r#"node_modules/
dist/
.env
npm-debug.log*
yarn-debug.log*
yarn-error.log*
"#,
        ),
        "python" => Some(
            r#"__pycache__/
*.py[cod]
.venv/
.env
"#,
        ),
        "rust" => Some(
            r#"target/
"#,
        ),
        "go" => Some(
            r#"bin/
pkg/
"#,
        ),
        "java" => Some(
            r#"target/
*.class
*.jar
"#,
        ),
        _ => None,
    }
}

fn license_text(license_id: &str) -> Option<String> {
    let author = get_git_user_name().unwrap_or_else(|| "Your Name".to_string());
    let year = Utc::now().year();
    match license_id.trim().to_lowercase().as_str() {
        "none" | "" => None,
        "mit" => Some(format!(
            r#"MIT License

Copyright (c) {year} {author}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
"#
        )),
        "apache-2.0" => Some(format!(
            r#"Apache License
Version 2.0, January 2004
http://www.apache.org/licenses/

Copyright {year} {author}

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
"#
        )),
        _ => None,
    }
}

fn get_git_user_name() -> Option<String> {
    let output = Command::new("git")
        .args(&["config", "--global", "user.name"])
        .output()
        .ok()?;
    if !output.status.success() {
        return None;
    }
    let name = String::from_utf8_lossy(&output.stdout).trim().to_string();
    if name.is_empty() {
        None
    } else {
        Some(name)
    }
}

fn parse_shortstat_line(line: &str) -> (usize, usize, usize) {
    let mut files_changed = 0usize;
    let mut insertions = 0usize;
    let mut deletions = 0usize;

    for part in line.split(',') {
        let part = part.trim();
        let Some(first_token) = part.split_whitespace().next() else {
            continue;
        };
        let Ok(value) = first_token.parse::<usize>() else {
            continue;
        };

        if part.contains("file changed") || part.contains("files changed") {
            files_changed = value;
        } else if part.contains("insertion") {
            insertions = value;
        } else if part.contains("deletion") {
            deletions = value;
        }
    }

    (files_changed, insertions, deletions)
}

fn is_merge_in_progress(repo_path: &Path) -> bool {
    repo_path.join(".git").join("MERGE_HEAD").exists()
}

pub fn check_merge_in_progress(repo_path: &Path) -> Result<(bool, Vec<String>)> {
    if !is_merge_in_progress(repo_path) {
        return Ok((false, Vec::new()));
    }

    let conflicts = get_conflict_files(repo_path)?;
    Ok((true, conflicts))
}

pub fn get_conflict_files(repo_path: &Path) -> Result<Vec<String>> {
    if !is_merge_in_progress(repo_path) {
        return Ok(Vec::new());
    }

    let output = Command::new("git")
        .current_dir(repo_path)
        .args(&["ls-files", "-u"])
        .output()
        .context("Failed to list conflicted files")?;

    if !output.status.success() {
        anyhow::bail!(
            "Git ls-files -u failed: {}",
            String::from_utf8_lossy(&output.stderr)
        );
    }

    let mut files = String::from_utf8_lossy(&output.stdout)
        .lines()
        .filter_map(|line| line.split_whitespace().nth(3))
        .map(|path| path.to_string())
        .collect::<HashSet<_>>()
        .into_iter()
        .collect::<Vec<String>>();

    files.sort();

    Ok(files)
}

pub fn parse_conflict_file(repo_path: &Path, file_path: &str) -> Result<ConflictFile> {
    let full_path = repo_path.join(file_path);
    let bytes = std::fs::read(&full_path).with_context(|| format!("Failed to read {file_path}"))?;
    let content = match String::from_utf8(bytes) {
        Ok(text) => text,
        Err(_) => {
            return Ok(ConflictFile {
                path: file_path.to_string(),
                conflicts: Vec::new(),
                content: String::new(),
                is_binary: true,
            });
        }
    };

    let lines: Vec<&str> = content.lines().collect();
    let mut conflicts = Vec::new();
    let mut current_hunk_id = 0;
    let mut in_ours = false;
    let mut in_theirs = false;
    let mut ours_content = String::new();
    let mut theirs_content = String::new();
    let mut ours_label = String::new();
    #[allow(unused_assignments)]
    let mut theirs_label = String::new();
    let mut start_line = 0usize;
    let mut conflict_start_index: Option<usize> = None;

    for (line_num, line) in lines.iter().enumerate() {
        let current_line = line_num + 1;

        if line.starts_with("<<<<<<<") {
            in_ours = true;
            in_theirs = false;
            start_line = current_line;
            conflict_start_index = Some(line_num);
            ours_label = line.trim_start_matches('<').trim().to_string();
            continue;
        }

        if line.starts_with("=======") {
            in_ours = false;
            in_theirs = true;
            continue;
        }

        if line.starts_with(">>>>>>>") {
            theirs_label = line.trim_start_matches('>').trim().to_string();
            let start_index = conflict_start_index.unwrap_or(line_num);
            let context_before_start = start_index.saturating_sub(3);
            let context_before = lines[context_before_start..start_index]
                .iter()
                .map(|value| value.to_string())
                .collect::<Vec<String>>();
            let context_after_start = line_num + 1;
            let context_after_end = (context_after_start + 3).min(lines.len());
            let context_after = lines[context_after_start..context_after_end]
                .iter()
                .map(|value| value.to_string())
                .collect::<Vec<String>>();

            conflicts.push(ConflictHunk {
                id: current_hunk_id,
                ours_content: ours_content.clone(),
                theirs_content: theirs_content.clone(),
                ours_label: ours_label.clone(),
                theirs_label: theirs_label.clone(),
                start_line,
                end_line: current_line,
                context_before,
                context_after,
            });

            current_hunk_id += 1;
            in_ours = false;
            in_theirs = false;
            ours_content.clear();
            theirs_content.clear();
            conflict_start_index = None;
            continue;
        }

        if in_ours {
            ours_content.push_str(line);
            ours_content.push('\n');
        } else if in_theirs {
            theirs_content.push_str(line);
            theirs_content.push('\n');
        }
    }

    Ok(ConflictFile {
        path: file_path.to_string(),
        conflicts,
        content,
        is_binary: false,
    })
}

pub fn resolve_conflict_file(
    repo_path: &Path,
    file_path: &str,
    resolved_content: &str,
) -> Result<()> {
    let full_path = repo_path.join(file_path);

    std::fs::write(&full_path, resolved_content)
        .with_context(|| format!("Failed to write resolved content to {file_path}"))?;

    let output = Command::new("git")
        .current_dir(repo_path)
        .args(&["add", file_path])
        .output()
        .context("Failed to execute git add for resolved file")?;

    if !output.status.success() {
        anyhow::bail!(
            "Git add failed: {}",
            String::from_utf8_lossy(&output.stderr)
        );
    }

    Ok(())
}

pub fn complete_merge(repo_path: &Path, message: Option<&str>) -> Result<String> {
    if !is_merge_in_progress(repo_path) {
        return Err(anyhow!("No merge in progress"));
    }

    let conflicts = get_conflict_files(repo_path)?;
    if !conflicts.is_empty() {
        return Err(anyhow!("Unresolved conflicts: {:?}", conflicts));
    }

    let mut args = vec!["commit"];
    if let Some(msg) = message {
        args.push("-m");
        args.push(msg);
    } else {
        args.push("--no-edit");
    }

    let output = Command::new("git")
        .current_dir(repo_path)
        .args(&args)
        .output()
        .context("Failed to execute git commit for merge")?;

    if !output.status.success() {
        anyhow::bail!(
            "Git commit failed: {}",
            String::from_utf8_lossy(&output.stderr)
        );
    }

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

pub fn merge_preview(repo_path: &Path, source: &str, target: Option<&str>) -> Result<MergePreview> {
    let target_ref = target.unwrap_or("HEAD");

    // 1. Verificar se pode fazer fast-forward
    let ff_status = Command::new("git")
        .current_dir(repo_path)
        .args(&["merge-base", "--is-ancestor", target_ref, source])
        .output()
        .context("Failed to check fast-forward")?;
    let can_fast_forward = ff_status.status.success();

    // 2. Obter estatísticas do diff entre as branches (sem fazer merge real)
    // Isso funciona mesmo com working tree suja
    let shortstat_output = Command::new("git")
        .current_dir(repo_path)
        .args(&[
            "diff",
            "--shortstat",
            &format!("{}..{}", target_ref, source),
        ])
        .output()
        .context("Failed to get diff stats between branches")?;
    let shortstat = String::from_utf8_lossy(&shortstat_output.stdout);
    let (files_changed, insertions, deletions) = parse_shortstat_line(shortstat.trim());

    // 3. Detectar conflitos potenciais usando merge-tree (não modifica working tree)
    // Primeiro, encontrar o merge-base
    let merge_base_output = Command::new("git")
        .current_dir(repo_path)
        .args(&["merge-base", target_ref, source])
        .output()
        .context("Failed to find merge base")?;

    let mut conflicts = Vec::new();

    if merge_base_output.status.success() {
        let merge_base = String::from_utf8_lossy(&merge_base_output.stdout)
            .trim()
            .to_string();

        // Usar merge-tree para simular merge e detectar conflitos
        let merge_tree_output = Command::new("git")
            .current_dir(repo_path)
            .args(&["merge-tree", &merge_base, target_ref, source])
            .output()
            .context("Failed to simulate merge")?;

        let merge_tree_result = String::from_utf8_lossy(&merge_tree_output.stdout);

        // Parsear conflitos do output do merge-tree
        // Formato: linhas com "+" no início após marcadores de conflito
        let mut in_conflict = false;
        let mut current_file = String::new();

        for line in merge_tree_result.lines() {
            if line.starts_with("changed in both") {
                in_conflict = true;
            } else if line.starts_with("  base")
                || line.starts_with("  our")
                || line.starts_with("  their")
            {
                // Extrair nome do arquivo
                if let Some(path) = line.split_whitespace().last() {
                    current_file = path.to_string();
                }
            } else if in_conflict && line.contains("<<<<<<<") {
                if !current_file.is_empty() && !conflicts.contains(&current_file) {
                    conflicts.push(current_file.clone());
                }
            } else if line.is_empty() {
                in_conflict = false;
            }
        }
    }

    Ok(MergePreview {
        can_fast_forward,
        conflicts,
        files_changed,
        insertions,
        deletions,
    })
}

pub fn merge_branch(repo_path: &Path, source: &str, message: Option<&str>) -> Result<MergeResult> {
    let ff_status = Command::new("git")
        .current_dir(repo_path)
        .args(&["merge-base", "--is-ancestor", "HEAD", source])
        .output()
        .context("Failed to check fast-forward")?;
    let can_fast_forward = ff_status.status.success();

    let mut args = vec!["merge", "--no-commit"];
    if let Some(msg) = message {
        args.push("-m");
        args.push(msg);
    }
    args.push(source);

    let output = git_command()
        .current_dir(repo_path)
        .args(&args)
        .output()
        .context("Failed to execute git merge")?;

    let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
    let summary = if !stdout.is_empty() {
        stdout
    } else {
        stderr.clone()
    };

    // Com --no-commit, verificamos se há merge em progresso
    let merge_started = is_merge_in_progress(repo_path);

    if !output.status.success() {
        // Merge falhou - provavelmente há conflitos
        if merge_started {
            let conflicts = get_conflict_files(repo_path)?;
            return Ok(MergeResult {
                fast_forward: can_fast_forward,
                summary,
                conflicts,
            });
        }

        return Err(anyhow!("Git merge failed: {}", stderr));
    }

    // Merge bem-sucedido com --no-commit
    // Verifica se há conflitos pendentes mesmo assim
    let conflicts = if merge_started {
        get_conflict_files(repo_path)?
    } else {
        Vec::new()
    };

    Ok(MergeResult {
        fast_forward: can_fast_forward,
        summary,
        conflicts,
    })
}

pub fn compare_branches(repo_path: &Path, base: &str, compare: &str) -> Result<BranchComparison> {
    let rev_list = Command::new("git")
        .current_dir(repo_path)
        .args(&[
            "rev-list",
            "--left-right",
            "--count",
            &format!("{base}...{compare}"),
        ])
        .output()
        .context("Failed to compare branches")?;

    if !rev_list.status.success() {
        anyhow::bail!(
            "Git rev-list failed: {}",
            String::from_utf8_lossy(&rev_list.stderr)
        );
    }

    let mut ahead = 0usize;
    let mut behind = 0usize;
    let counts = String::from_utf8_lossy(&rev_list.stdout);
    let parts: Vec<&str> = counts.split_whitespace().collect();
    if parts.len() >= 2 {
        behind = parts[0].parse::<usize>().unwrap_or(0);
        ahead = parts[1].parse::<usize>().unwrap_or(0);
    }

    let log_output = Command::new("git")
        .current_dir(repo_path)
        .args(&[
            "log",
            "--pretty=format:%H%x1f%B%x1f%an%x1f%ai%x1e",
            &format!("{base}..{compare}"),
        ])
        .output()
        .context("Failed to collect comparison log")?;

    let mut commits = Vec::new();
    if log_output.status.success() {
        let log_str = String::from_utf8_lossy(&log_output.stdout);
        for record in log_str.split('\u{001e}') {
            if record.trim().is_empty() {
                continue;
            }

            let parts: Vec<&str> = record.split('\u{001f}').collect();
            if parts.len() < 4 {
                continue;
            }

            commits.push(CommitInfo {
                hash: parts[0].trim().to_string(),
                message: parts[1].to_string(),
                author: parts[2].trim().to_string(),
                date: parts[3].trim().to_string(),
            });
        }
    }

    let diff_output = Command::new("git")
        .current_dir(repo_path)
        .args(&["diff", "--stat", &format!("{base}..{compare}")])
        .output()
        .context("Failed to compute diff summary")?;

    let diff_summary = if diff_output.status.success() {
        String::from_utf8_lossy(&diff_output.stdout)
            .trim()
            .to_string()
    } else {
        String::new()
    };

    Ok(BranchComparison {
        ahead,
        behind,
        commits,
        diff_summary,
    })
}

// ============================================================================
// Clone Repository
// ============================================================================

/// Clone a remote repository to a local destination
pub fn clone_repository(url: &str, destination: &str) -> Result<String> {
    let output = Command::new("git")
        .args(&["clone", url, destination])
        .output()
        .context("Failed to execute git clone")?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        anyhow::bail!("Git clone failed: {}", stderr);
    }

    Ok(destination.to_string())
}
