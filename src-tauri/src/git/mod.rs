use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::process::Command;
use anyhow::{Result, Context, anyhow};

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

pub fn get_status(repo_path: &PathBuf) -> Result<RepoStatus> {
    let output = Command::new("git")
        .args(&["status", "--porcelain=v1", "--branch"])
        .current_dir(repo_path)
        .output()
        .context("Failed to execute git status")?;

    if !output.status.success() {
        anyhow::bail!("Git command failed: {}", String::from_utf8_lossy(&output.stderr));
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
        anyhow::bail!("Git diff failed: {}", String::from_utf8_lossy(&output.stderr));
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
        anyhow::bail!("Git diff failed: {}", String::from_utf8_lossy(&output.stderr));
    }

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

pub fn stage_file(repo_path: &PathBuf, file_path: &str) -> Result<()> {
  let output = Command::new("git")
    .args(&["add", file_path])
    .current_dir(repo_path)
    .output()
    .context("Failed to execute git add")?;

    if !output.status.success() {
        anyhow::bail!("Git add failed: {}", String::from_utf8_lossy(&output.stderr));
    }

  Ok(())
}

pub fn stage_all(repo_path: &PathBuf) -> Result<()> {
    let output = Command::new("git")
        .args(&["add", "-A"])
        .current_dir(repo_path)
        .output()
        .context("Failed to execute git add -A")?;

    if !output.status.success() {
        anyhow::bail!("Git add -A failed: {}", String::from_utf8_lossy(&output.stderr));
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
        anyhow::bail!("Git reset failed: {}", String::from_utf8_lossy(&output.stderr));
    }

    Ok(())
}

pub fn commit(repo_path: &PathBuf, message: &str) -> Result<()> {
    let output = Command::new("git")
        .args(&["commit", "-m", message])
        .current_dir(repo_path)
        .output()
        .context("Failed to execute git commit")?;

    if !output.status.success() {
        anyhow::bail!("Git commit failed: {}", String::from_utf8_lossy(&output.stderr));
    }

    Ok(())
}

pub fn amend_commit(repo_path: &PathBuf, message: &str) -> Result<()> {
    // Keep it simple: when amending, include all current changes.
    stage_all(repo_path)?;

    let output = Command::new("git")
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

pub fn push(repo_path: &PathBuf) -> Result<String> {
    let output = Command::new("git")
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

            let branch = String::from_utf8_lossy(&branch_output.stdout).trim().to_string();
            if branch.is_empty() || branch == "HEAD" {
                anyhow::bail!("Failed to detect current branch name");
            }

            let push_output = Command::new("git")
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
    let output = Command::new("git")
        .args(&["pull"])
        .current_dir(repo_path)
        .output()
        .context("Failed to execute git pull")?;

    if !output.status.success() {
        anyhow::bail!("Git pull failed: {}", String::from_utf8_lossy(&output.stderr));
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
        anyhow::bail!("Git branch failed: {}", String::from_utf8_lossy(&output.stderr));
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
    let output = Command::new("git")
        .args(&["checkout", branch_name])
        .current_dir(repo_path)
        .output()
        .context("Failed to execute git checkout")?;

    if !output.status.success() {
        anyhow::bail!("Git checkout failed: {}", String::from_utf8_lossy(&output.stderr));
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
        anyhow::bail!("Git log failed: {}", String::from_utf8_lossy(&output.stderr));
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
        anyhow::bail!("Git show failed: {}", String::from_utf8_lossy(&output.stderr));
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
    let output = Command::new("git")
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

pub fn create_branch(repo_path: &Path, name: &str, from: Option<&str>, push_to_remote: bool) -> Result<()> {
    let mut cmd = Command::new("git");
    cmd.current_dir(repo_path).arg("checkout").arg("-b").arg(name);
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

fn abort_merge_if_needed(repo_path: &Path) {
    if is_merge_in_progress(repo_path) {
        let _ = Command::new("git")
            .current_dir(repo_path)
            .args(&["merge", "--abort"])
            .output();
    }
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
        .args(&["diff", "--shortstat", &format!("{}..{}", target_ref, source)])
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
        let merge_base = String::from_utf8_lossy(&merge_base_output.stdout).trim().to_string();

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
            } else if line.starts_with("  base") || line.starts_with("  our") || line.starts_with("  their") {
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

    let mut args = vec!["merge"];
    if let Some(msg) = message {
        args.push("-m");
        args.push(msg);
    }
    args.push(source);

    let output = Command::new("git")
        .current_dir(repo_path)
        .args(&args)
        .output()
        .context("Failed to execute git merge")?;

    let merge_started = is_merge_in_progress(repo_path);

    if !output.status.success() {
        let conflicts = if merge_started {
            let ls_output = Command::new("git")
                .current_dir(repo_path)
                .args(&["ls-files", "-u"])
                .output()
                .context("Failed to list conflicts")?;
            String::from_utf8_lossy(&ls_output.stdout)
                .lines()
                .filter_map(|line| line.split_whitespace().nth(3))
                .map(|s| s.to_string())
                .collect::<Vec<String>>()
        } else {
            Vec::new()
        };

        abort_merge_if_needed(repo_path);

        return Err(anyhow!(
            "Git merge failed: {} | Conflicts: {:?}",
            String::from_utf8_lossy(&output.stderr),
            conflicts
        ));
    }

    let summary = String::from_utf8_lossy(&output.stdout)
        .trim()
        .to_string();

    Ok(MergeResult {
        fast_forward: can_fast_forward,
        summary,
        conflicts: Vec::new(),
    })
}

pub fn compare_branches(repo_path: &Path, base: &str, compare: &str) -> Result<BranchComparison> {
    let rev_list = Command::new("git")
        .current_dir(repo_path)
        .args(&["rev-list", "--left-right", "--count", &format!("{base}...{compare}")])
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
        String::from_utf8_lossy(&diff_output.stdout).trim().to_string()
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
