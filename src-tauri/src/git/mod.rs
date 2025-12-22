use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::process::Command;
use anyhow::{Result, Context};

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

pub fn push(repo_path: &PathBuf) -> Result<String> {
    let output = Command::new("git")
        .args(&["push"])
        .current_dir(repo_path)
        .output()
        .context("Failed to execute git push")?;

    if !output.status.success() {
        anyhow::bail!("Git push failed: {}", String::from_utf8_lossy(&output.stderr));
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
